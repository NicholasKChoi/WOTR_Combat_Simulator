import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { BaseRules, CivData, GameData, Snapshot, buildGameData, loadGameData } from './data'
import { effectiveGatherRate } from './gather'
import type { BuildOrder, BuildStart, BuildStep, SimInputs, SimulationResult } from './model'
import { addBuildingInstance, simulateBuildOrder, stepHandlers, triggerHolds } from './simulate'
import type { EngineState, StepHandler } from './simulate'
import { resolveSimInputs } from './validate'

const data = loadGameData('english')

function gameData(edit: (start: CivData['startingState']) => void): GameData {
    const civData = structuredClone(englishRules) as unknown as CivData
    edit(civData.startingState)
    return buildGameData(
        'english',
        structuredClone(englishSnapshot) as unknown as Snapshot,
        structuredClone(baseRules) as unknown as BaseRules,
        civData,
    )
}

function inputsFor(game: GameData, partial: unknown = {}): SimInputs {
    const result = resolveSimInputs(partial, game)
    if (result.ok === false) {
        throw new Error(JSON.stringify(result.issues))
    }
    return result.inputs
}

const inputs = inputsFor(data)

function run(steps: BuildStep[], options: { game?: GameData; inputs?: SimInputs; start?: BuildStart } = {}): SimulationResult {
    const order: BuildOrder = { civ: 'english', name: 'acceptance', start: options.start ?? { rally: 'sheep' }, steps }
    const game = options.game ?? data
    return simulateBuildOrder(order, game, options.inputs ?? inputsFor(game))
}

function withHandler<A extends BuildStep['action']>(action: A, handler: StepHandler<A>, fn: () => void) {
    const handlers = stepHandlers as Record<string, unknown>
    const saved = handlers[action]
    handlers[action] = handler
    try {
        fn()
    } finally {
        if (saved === undefined) {
            delete handlers[action]
        } else {
            handlers[action] = saved
        }
    }
}

function series(result: SimulationResult, baseId: string): number[] {
    return result.unitsProduced.find((u) => u.baseId === baseId)?.counts ?? result.times.map(() => 0)
}

function countAt(result: SimulationResult, baseId: string, t: number): number {
    const i = result.times.indexOf(t)
    expect(i).toBeGreaterThanOrEqual(0)
    return series(result, baseId)[i]
}

function rate(node: 'sheep' | 'wood', buildings = ['capital-town-center']): number {
    const state = { data, age: 1, buildings: new Map(buildings.map((b) => [b, 1])), researched: new Set<string>(), coverage: inputs.influenceCoverage }
    return effectiveGatherRate(node, state, inputs)
}

const sheepRate = rate('sheep')
const woodRate = rate('wood')
const at = (seconds: number) => ({ kind: 'time' as const, seconds })
const NO_RESERVE = { food: 0, wood: 0, gold: 0, stone: 0 }

describe('hand-computed timeline with a wood-only start', () => {
    const woodStart = gameData((start) => {
        start.villagers.value = { sheep: 0, berry: 0, deer: 0, boar: 0, farm: 0, wood: 6, gold: 0, stone: 0 }
    })
    const result = run([], { game: woodStart, inputs: inputsFor(woodStart, { autoHouses: false }), start: { rally: 'wood' } })
    const t = (s: number) => result.times.indexOf(s)

    it('banks wood from six gatherers and spends food only at payments', () => {
        expect(result.floating.wood[t(10)]).toBeCloseTo(200 + 6 * woodRate * 10, 6)
        expect(result.gatherRates.wood[t(15)]).toBeCloseTo(6 * woodRate * 60, 6)
        expect(result.floating.food[t(15)]).toBe(150)
        expect(result.floating.food[t(20)]).toBe(100)
        expect(result.floating.food[t(40)]).toBe(50)
        expect(result.floating.food[t(100)]).toBe(50)
    })

    it('stops paying villagers when supply is reached', () => {
        expect(countAt(result, 'villager', 20)).toBe(1)
        expect(countAt(result, 'villager', 40)).toBe(2)
        expect(countAt(result, 'villager', 60)).toBe(3)
        expect(countAt(result, 'villager', 200)).toBe(3)
    })
})

describe('villagers trigger', () => {
    it('arms at the spawn of the villager that reaches the count, not before and not after the walk ends', () => {
        const result = run([{ trigger: { kind: 'villagers', count: 8 }, action: 'rally', producer: 'capital-town-center', to: 'wood' }])
        expect(result.steps[0]).toMatchObject({ armedAt: 40, startedAt: 40, status: 'completed' })
    })
})

describe('counted produce', () => {
    it('spawns a villager every 20 s and completes at the last spawn, leaving no further order', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 3 }])
        expect([20, 40, 60].map((t) => countAt(result, 'villager', t))).toEqual([1, 2, 3])
        expect(result.steps[0]).toMatchObject({ status: 'completed', armedAt: 0, startedAt: 0, completedAt: 60, waitSeconds: 0 })
    })

    it('pays every existing targeted instance together', () => {
        const twin = gameData((start) => {
            start.buildings.value = ['capital-town-center', 'capital-town-center']
        })
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 }], { game: twin })
        expect(result.steps[0].status).toBe('completed')
        expect(countAt(result, 'villager', 15)).toBe(0)
        expect(countAt(result, 'villager', 20)).toBe(2)
        expect(result.floating.food[0]).toBeCloseTo(100, 9)
    })

    it('completes an order replaced early at the pause that replaced it and drops its unpaid units', () => {
        const result = run([
            { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 5 },
            { action: 'pause', producer: 'capital-town-center', trigger: at(25) },
        ])
        expect(result.steps[0]).toMatchObject({ status: 'completed', completedAt: 25 })
        expect(countAt(result, 'villager', 20)).toBe(1)
        expect(countAt(result, 'villager', 40)).toBe(2)
        expect(countAt(result, 'villager', 100)).toBe(2)
    })
})

describe('reserve returned by a registered handler', () => {
    const ranges = (result: SimulationResult) => series(result, 'villager')

    it('holds a villager payment until food stays at or above the reserve afterwards', () => {
        withHandler(
            'build',
            () => ({ started: false, reserve: { ...NO_RESERVE, food: 200 } }),
            () => {
                const result = run([{ action: 'build', building: 'house', from: 'sheep' }])
                const payAt = 50 / (6 * sheepRate)
                const first = ranges(result).findIndex((c) => c > 0)
                expect(result.times[first]).toBeGreaterThanOrEqual(payAt + 20)
                expect(result.times[first - 1]).toBeLessThan(payAt + 20)
                result.floating.food.forEach((v) => expect(v).toBeGreaterThanOrEqual(150 - 1e-9))
            },
        )
    })

    it('reserves nothing when the handler reports no reserve', () => {
        withHandler(
            'build',
            () => ({ started: false }),
            () => {
                const result = run([{ action: 'build', building: 'house', from: 'sheep' }])
                expect(countAt(result, 'villager', 20)).toBe(1)
                expect(result.steps[0].status).toBe('waiting')
            },
        )
    })
})

describe('seam functions on a live state', () => {
    function capture(trigger: number, fn: (state: EngineState) => void) {
        withHandler(
            'research',
            (_step, _index, state) => {
                state.schedule(state.time, fn)
                return { started: true }
            },
            () => run([{ action: 'research', tech: 'wheelbarrow', trigger: at(trigger) }]),
        )
    }

    it('evaluates time and villagers triggers, counting a walking villager', () => {
        const seen: boolean[] = []
        capture(20, (state) => {
            expect(state.walking).toBe(1)
            seen.push(
                triggerHolds(undefined, state),
                triggerHolds({ kind: 'villagers', count: 7 }, state),
                triggerHolds({ kind: 'villagers', count: 8 }, state),
                triggerHolds({ kind: 'time', seconds: 20 }, state),
                triggerHolds({ kind: 'time', seconds: 21 }, state),
            )
        })
        expect(seen).toEqual([true, true, false, true, false])
    })

    it('caps supply at the population cap however many providers are added', () => {
        let supply = 0
        capture(1, (state) => {
            for (let i = 0; i < 40; i++) {
                addBuildingInstance(state, 'house')
            }
            supply = state.supply
            expect(state.buildings.get('house')).toBe(40)
        })
        expect(supply).toBe(data.base.maxPopCap.value)
    })
})

describe('sampling and horizon', () => {
    it('ends times at the horizon for short and non-multiple durations', () => {
        const times = (durationSeconds: number) => run([], { inputs: { ...inputs, durationSeconds } }).times
        expect(times(3)).toEqual([0, 3])
        expect(times(5)).toEqual([0, 5])
        expect(times(62).slice(-3)).toEqual([55, 60, 62])
    })

    it('reports in-progress at a horizon inside the production and completed after it', () => {
        const step: BuildStep = { action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1 }
        expect(run([step], { inputs: { ...inputs, durationSeconds: 10 } }).steps[0].status).toBe('in-progress')
        const done = run([step], { inputs: { ...inputs, durationSeconds: 30 } })
        expect(done.steps[0]).toMatchObject({ status: 'completed', completedAt: 23 })
    })
})

describe('invariants over generated build orders', () => {
    function lcg(seed: number) {
        let s = seed
        return (n: number) => {
            s = (s * 1664525 + 1013904223) % 4294967296
            return s % n
        }
    }
    const barracksGame = gameData((start) => {
        start.buildings.value = ['capital-town-center', 'barracks']
    })
    const nodes = ['sheep', 'wood', 'gold'] as const

    function randomSteps(pick: (n: number) => number): BuildStep[] {
        const steps: BuildStep[] = []
        for (let i = 0, n = 2 + pick(5); i < n; i++) {
            const trigger = pick(2) === 0 ? at(pick(120)) : { kind: 'villagers' as const, count: 6 + pick(4) }
            const kind = pick(5)
            if (kind === 0) {
                steps.push({ trigger, action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 + pick(3), rally: nodes[pick(3)] })
            } else if (kind === 1) {
                steps.push({ trigger, action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 + pick(2) })
            } else if (kind === 2) {
                steps.push({ trigger, action: 'pause', producer: pick(2) === 0 ? 'barracks' : 'capital-town-center' })
            } else if (kind === 3) {
                steps.push({ trigger, action: 'rally', producer: 'capital-town-center', to: nodes[pick(3)] })
            } else {
                steps.push({ trigger, action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1 })
            }
        }
        return steps
    }

    it('never goes negative, orders step times, keeps counts cumulative and supply bounded', () => {
        for (let seed = 1; seed <= 60; seed++) {
            const steps = randomSteps(lcg(seed))
            const result = run(steps, { game: barracksGame, inputs: inputsFor(barracksGame, { autoHouses: false }) })
            const again = run(steps, { game: barracksGame, inputs: inputsFor(barracksGame, { autoHouses: false }) })
            expect(again).toEqual(result)
            for (const values of Object.values(result.floating)) {
                expect(values).toHaveLength(result.times.length)
                values.forEach((v) => expect(v).toBeGreaterThanOrEqual(-1e-6))
            }
            let previousArm = -1
            result.steps.forEach((s) => {
                if (s.armedAt === null) {
                    expect(s.status).toBe('not-reached')
                    expect(s.startedAt).toBeNull()
                    return
                }
                expect(s.armedAt).toBeGreaterThanOrEqual(previousArm)
                previousArm = s.armedAt
                if (s.startedAt === null) {
                    expect(s.status).toBe('waiting')
                    return
                }
                expect(s.startedAt).toBeGreaterThanOrEqual(s.armedAt)
                expect(s.waitSeconds).toBeCloseTo(s.startedAt - s.armedAt, 9)
                if (s.completedAt !== null) {
                    expect(s.status).toBe('completed')
                    expect(s.completedAt).toBeGreaterThanOrEqual(s.startedAt)
                } else {
                    expect(s.status).toBe('in-progress')
                }
            })
            let villagersAndScouts = 0
            for (const unit of result.unitsProduced) {
                expect(unit.counts).toHaveLength(result.times.length)
                unit.counts.forEach((c, i) => expect(c).toBeGreaterThanOrEqual(unit.counts[i - 1] ?? 0))
                if (unit.baseId === 'villager' || unit.baseId === 'scout') {
                    villagersAndScouts += unit.counts[unit.counts.length - 1]
                }
            }
            // starting population is six villagers and a scout against supply ten, plus man-at-arms at barracks
            const menAtArms = series(result, 'man-at-arms')
            expect(villagersAndScouts + menAtArms[menAtArms.length - 1]).toBeLessThanOrEqual(3)
        }
    })
})
