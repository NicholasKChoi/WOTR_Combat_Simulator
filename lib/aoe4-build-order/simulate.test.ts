import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { NO_CIV_RULES, civRules } from './civ-rules'
import type { CivRules } from './civ-rules'
import { BaseRules, CivData, GameData, Snapshot, buildGameData, loadGameData } from './data'
import { effectiveGatherRate } from './gather'
import type { BuildOrder, BuildStart, BuildStep, GatherNodeId, SimInputs, SimulationResult } from './model'
import { SAMPLE_SECONDS, addBuildingInstance, simulateBuildOrder, stepHandlers } from './simulate'
import type { BuildingInstance, EngineState, RallySource, StepHandler } from './simulate'
import { resolveSimInputs } from './validate'

const data = loadGameData('english')

interface Parts {
    snapshot: Snapshot
    base: BaseRules
    civData: CivData
}

function gameData(edit: (parts: Parts) => void): GameData {
    const parts: Parts = {
        snapshot: structuredClone(englishSnapshot) as unknown as Snapshot,
        base: structuredClone(baseRules) as unknown as BaseRules,
        civData: structuredClone(englishRules) as unknown as CivData,
    }
    edit(parts)
    return buildGameData('english', parts.snapshot, parts.base, parts.civData)
}

function inputsFor(game: GameData, partial: unknown = {}): SimInputs {
    const result = resolveSimInputs(partial, game)
    if (result.ok === false) {
        throw new Error(JSON.stringify(result.issues))
    }
    return result.inputs
}

const inputs = inputsFor(data)

function buildOrder(steps: BuildStep[], start: BuildStart = { rally: 'sheep' }): BuildOrder {
    return { civ: 'english', name: 'test', start, steps }
}

function run(steps: BuildStep[], options: { game?: GameData; inputs?: SimInputs; rules?: CivRules; start?: BuildStart } = {}) {
    const game = options.game ?? data
    return simulateBuildOrder(buildOrder(steps, options.start), game, options.inputs ?? inputsFor(game), options.rules)
}

function sampleAt(result: SimulationResult, t: number): number {
    const i = result.times.indexOf(t)
    if (i < 0) {
        throw new Error(`no sample at ${t}`)
    }
    return i
}

function series(result: SimulationResult, baseId: string): number[] {
    return result.unitsProduced.find((u) => u.baseId === baseId)?.counts ?? result.times.map(() => 0)
}

function countAt(result: SimulationResult, baseId: string, t: number): number {
    return series(result, baseId)[sampleAt(result, t)]
}

function rateOf(node: GatherNodeId, game: GameData, simInputs: SimInputs, buildings = ['capital-town-center']): number {
    const state = { data: game, age: 1, buildings: new Map(buildings.map((b) => [b, 1])), researched: new Set<string>(), coverage: simInputs.influenceCoverage }
    return effectiveGatherRate(node, state, simInputs)
}

function withStart(parts: Parts, edit: (start: CivData['startingState']) => void) {
    edit(parts.civData.startingState)
}

// Installs a handler for action for the duration of fn, then puts back whatever was registered before.
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

const r = rateOf('sheep', data, inputs)
const woodRate = rateOf('wood', data, inputs)
const vils = (count: number) => ({ kind: 'villagers' as const, count })
const at = (seconds: number) => ({ kind: 'time' as const, seconds })

describe('resources never go negative and waits are reported', () => {
    const barracks = gameData((parts) =>
        withStart(parts, (start) => {
            start.buildings.value = ['capital-town-center', 'barracks']
            start.resources.value = { food: 0, wood: 200, gold: 100, stone: 0 }
        }),
    )
    const result = run(
        [
            { action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 },
            { action: 'rally', producer: 'capital-town-center', to: 'sheep', trigger: vils(7) },
        ],
        { game: barracks },
    )
    const [step] = result.steps

    it('keeps every floating value at or above zero', () => {
        for (const values of Object.values(result.floating)) {
            values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
        }
    })

    it('starts the step once 90 food has been gathered by six villagers', () => {
        expect(step.armedAt).toBe(0)
        expect(step.startedAt).toBeGreaterThan(step.armedAt)
        expect(step.waitSeconds).toBeGreaterThan(0)
        expect(step.startedAt).toBeCloseTo(90 / (6 * r), 6)
        expect(step.waitSeconds).toBeCloseTo(step.startedAt - step.armedAt, 9)
    })

    it('pays no villager before the step starts and the first one 50 food after it', () => {
        expect(result.steps[1].armedAt).toBeCloseTo(step.startedAt + 50 / (6 * r) + 20, 6)
        expect(step.completedAt).toBeCloseTo(step.startedAt + 14.65, 6)
    })

    it('lets the villager order keep paying while food stays above the step reserve', () => {
        const goldless = gameData((parts) =>
            withStart(parts, (start) => {
                start.buildings.value = ['capital-town-center', 'barracks']
                start.resources.value = { food: 200, wood: 200, gold: 0, stone: 0 }
            }),
        )
        const blocked = run([{ action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 }], { game: goldless })
        expect(blocked.steps[0].status).toBe('waiting')
        expect(countAt(blocked, 'villager', 20)).toBe(1)
        expect(countAt(blocked, 'villager', 40)).toBe(2)
        expect(blocked.floating.food[0]).toBeCloseTo(150, 9)
    })

    it('skips an order payment that would drop food below the reserve', () => {
        const lean = gameData((parts) =>
            withStart(parts, (start) => {
                start.buildings.value = ['capital-town-center', 'barracks']
                start.resources.value = { food: 120, wood: 200, gold: 0, stone: 0 }
            }),
        )
        const blocked = run([{ action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 }], { game: lean })
        expect(blocked.floating.food[0]).toBeCloseTo(120, 9)
        expect(countAt(blocked, 'villager', 20)).toBe(0)
    })
})

describe('payment', () => {
    const starved = (food: number) =>
        gameData((parts) =>
            withStart(parts, (start) => {
                start.resources.value = { food, wood: 0, gold: 0, stone: 0 }
            }),
        )

    it('never pays a unit short of its cost', () => {
        const result = run([], { game: starved(49.5), start: { rally: 'sheep', villagers: {} } })
        expect(result.unitsProduced).toEqual([])
        expect(result.floating.food.every((food) => food === 49.5)).toBe(true)
    })

    it('starts a step before an order payment at the same instant', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1 }], { game: starved(65), start: { rally: 'sheep', villagers: {} } })
        expect(result.unitsProduced.map((u) => u.baseId)).toEqual(['scout'])
        expect(result.floating.food[0]).toBe(0)
    })
})

describe('determinism', () => {
    it('gives deeply equal results for the same input, with a mid-game rally and a start split', () => {
        const steps: BuildStep[] = [{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: at(65) }]
        const start: BuildStart = { rally: 'sheep', villagers: { sheep: 4, wood: 2 } }
        expect(run(steps, { start })).toEqual(run(steps, { start }))
        expect(run(steps)).toEqual(run(steps))
    })

    it('places a start split at t=0 with no walk', () => {
        const result = run([], { start: { rally: 'sheep', villagers: { sheep: 4, wood: 2 } } })
        expect(result.gatherRates.food[0]).toBeCloseTo(4 * r * 60, 9)
        expect(result.gatherRates.wood[0]).toBeCloseTo(2 * woodRate * 60, 9)
    })

    it('does not mutate the order, the inputs or the game data', () => {
        const order = buildOrder([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2, rally: 'wood' }], {
            rally: 'sheep',
            villagers: { sheep: 6 },
        })
        const simInputs = inputsFor(data)
        const before = structuredClone({ order, simInputs, civData: data.civData, base: data.base })
        simulateBuildOrder(order, data, simInputs)
        expect({ order, simInputs, civData: data.civData, base: data.base }).toEqual(before)
    })

    it('reads no clock or random source', () => {
        for (const file of ['simulate.ts', 'civ-rules.ts']) {
            expect(readFileSync(join(__dirname, file), 'utf8')).not.toMatch(/Math\.random|Date\.now|new Date|performance\.now/)
        }
    })
})

describe('default English start', () => {
    const result = run([], { inputs: inputsFor(data, { autoHouses: false }) })
    const villagers = series(result, 'villager')

    it('pays villagers at 0, 20 and 40 until supply 10 blocks the fourth', () => {
        expect(countAt(result, 'villager', 15)).toBe(0)
        expect(countAt(result, 'villager', 20)).toBe(1)
        expect(countAt(result, 'villager', 40)).toBe(2)
        expect(countAt(result, 'villager', 60)).toBe(3)
        expect(countAt(result, 'villager', 120)).toBe(3)
        expect(villagers[villagers.length - 1]).toBe(3)
    })

    it('excludes walking villagers from the gather rate', () => {
        expect(result.gatherRates.food[sampleAt(result, 20)]).toBeCloseTo(6 * r * 60, 9)
        expect(result.gatherRates.food[sampleAt(result, 25)]).toBeCloseTo(7 * r * 60, 9)
    })

    it('reads t=0 after the villager payment at 0', () => {
        expect(result.floating.food[0]).toBeCloseTo(150, 9)
        expect(result.floating.wood[0]).toBe(200)
    })

    it('counts the starting scout in population but not in unitsProduced', () => {
        expect(result.unitsProduced.map((u) => u.baseId)).toEqual(['villager'])
        const scoutless = gameData((parts) =>
            withStart(parts, (start) => {
                start.units.value = {}
            }),
        )
        expect(countAt(run([], { game: scoutless }), 'villager', 80)).toBe(4)
    })
})

describe('triggers', () => {
    it('arms a time trigger at its time', () => {
        const result = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: at(30) }])
        expect(result.steps[0].armedAt).toBe(30)
    })

    it('arms a villagers trigger at the spawn that makes that many alive', () => {
        const result = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: vils(8) }])
        expect(result.steps[0].armedAt).toBe(40)
    })

    it('leaves a step behind an unstarted step not reached and the blocker waiting', () => {
        const starved = gameData((parts) =>
            withStart(parts, (start) => {
                start.resources.value = { food: 0, wood: 0, gold: 0, stone: 0 }
            }),
        )
        const result = run(
            [
                { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 },
                { action: 'rally', producer: 'capital-town-center', to: 'wood' },
            ],
            { game: starved, start: { rally: 'sheep', villagers: {} } },
        )
        expect(result.steps[0]).toMatchObject({ status: 'waiting', armedAt: 0, startedAt: null })
        expect(result.steps[1]).toMatchObject({ status: 'not-reached', armedAt: null })
    })
})

describe('same instant', () => {
    it('routes the villager spawning at the rally time', () => {
        const result = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: at(20) }])
        expect(result.gatherRates.wood[sampleAt(result, 20)]).toBe(0)
        expect(result.gatherRates.wood[sampleAt(result, 25)]).toBeCloseTo(woodRate * 60, 9)
        expect(result.gatherRates.food[sampleAt(result, 25)]).toBeCloseTo(6 * r * 60, 9)
    })

    it('routes the villager after the one that met a villagers trigger', () => {
        const result = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: vils(7) }], { inputs: inputsFor(data, { autoHouses: false }) })
        expect(result.gatherRates.food[sampleAt(result, 25)]).toBeCloseTo(7 * r * 60, 9)
        expect(result.gatherRates.wood[sampleAt(result, 25)]).toBe(0)
        expect(result.gatherRates.wood[sampleAt(result, 45)]).toBeCloseTo(woodRate * 60, 9)
        expect(result.gatherRates.food[sampleAt(result, 45)]).toBeCloseTo(7 * r * 60, 9)
    })
})

describe('rally scope', () => {
    const towns = gameData((parts) =>
        withStart(parts, (start) => {
            start.buildings.value = ['capital-town-center', 'town-center', 'town-center']
        }),
    )

    function probe(steps: BuildStep[], game = towns): { state: EngineState; result: SimulationResult; seen: unknown[] } {
        let state: EngineState | undefined
        let result: SimulationResult | undefined
        const seen: unknown[] = []
        withHandler(
            'move',
            (_step, _index, s) => {
                state = s
                seen.push(structuredClone({ held: s.heldRallies, defaults: s.rallyDefaults, towns: (s.instances.get('town-center') ?? []).map((i) => i.rally) }))
                return { started: true }
            },
            () => {
                withHandler(
                    'build',
                    (step, _index, s) => {
                        addBuildingInstance(s, step.building)
                        return { started: true }
                    },
                    () => {
                        result = run(steps, { game })
                    },
                )
            },
        )
        return { state, result, seen }
    }

    const look: BuildStep = { action: 'move', count: 0, from: 'sheep', to: 'sheep' }
    const rallies = (state: EngineState, baseId: string) => state.instances.get(baseId).map((i: BuildingInstance) => i.rally?.node)

    it('changes only the named instance', () => {
        const { state, result } = probe([{ action: 'rally', producer: 'town-center', instance: 1, to: 'wood' }, look])
        expect(rallies(state, 'town-center')).toEqual(['wood', 'sheep'])
        expect(rallies(state, 'capital-town-center')).toEqual(['sheep'])
        expect(state.rallyDefaults.size).toBe(0)
        expect(result.gatherRates.wood[sampleAt(result, 25)]).toBeCloseTo(woodRate * 60, 9)
    })

    it('changes every instance and the default when no instance is named', () => {
        const { state } = probe([{ action: 'rally', producer: 'town-center', to: 'gold' }, look])
        expect(rallies(state, 'town-center')).toEqual(['gold', 'gold'])
        expect(rallies(state, 'capital-town-center')).toEqual(['sheep'])
        expect(state.rallyDefaults.get('town-center')).toEqual({ node: 'gold', walkSeconds: undefined })
    })

    it('holds a rally for an unbuilt instance, then new instances take held, then default, then start.rally', () => {
        const { state, seen } = probe(
            [
                { action: 'rally', producer: 'town-center', instance: 2, to: 'wood' },
                look,
                { action: 'build', building: 'town-center', from: 'sheep' },
                { action: 'build', building: 'town-center', from: 'sheep' },
                look,
                { action: 'rally', producer: 'town-center', to: 'gold' },
                { action: 'build', building: 'town-center', from: 'sheep' },
            ],
            data,
        )
        expect(seen[0]).toEqual({ held: new Map([['town-center', new Map([[2, { node: 'wood', walkSeconds: undefined }]])]]), defaults: new Map(), towns: [] })
        const second = seen[1] as { held: Map<string, Map<number, RallySource>>; towns: RallySource[] }
        expect(second.towns.map((s) => s.node)).toEqual(['sheep', 'wood'])
        expect(second.held.get('town-center').size).toBe(0)
        expect(rallies(state, 'town-center')).toEqual(['gold', 'gold', 'gold'])
        expect(state.instances.get('town-center').map((i) => i.order)).toEqual([0, 0, 0].map(() => ({ step: null, unit: 'villager', remaining: null })))
    })

    it('prefers a held rally over the baseId default', () => {
        const { state } = probe(
            [
                { action: 'rally', producer: 'town-center', to: 'gold' },
                { action: 'rally', producer: 'town-center', instance: 2, to: 'wood' },
                { action: 'build', building: 'town-center', from: 'sheep' },
                { action: 'build', building: 'town-center', from: 'sheep' },
                look,
            ],
            data,
        )
        expect(rallies(state, 'town-center')).toEqual(['gold', 'wood'])
    })

    it('lets a later baseId-wide rally override one held for an unbuilt instance', () => {
        const { state } = probe(
            [
                { action: 'rally', producer: 'town-center', instance: 2, to: 'wood' },
                { action: 'rally', producer: 'town-center', to: 'gold' },
                { action: 'build', building: 'town-center', from: 'sheep' },
                { action: 'build', building: 'town-center', from: 'sheep' },
                look,
            ],
            data,
        )
        expect(rallies(state, 'town-center')).toEqual(['gold', 'gold'])
    })

    it('sets the standing rally from a villager produce with rally', () => {
        const { state, result } = probe([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', rally: 'wood', trigger: at(10) }, look], data)
        expect(rallies(state, 'capital-town-center')).toEqual(['wood'])
        expect(state.rallyDefaults.get('capital-town-center')?.node).toBe('wood')
        expect(result.gatherRates.wood[sampleAt(result, 25)]).toBeCloseTo(woodRate * 60, 9)
    })

    it('completes a rally step the instant it arms', () => {
        const result = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: at(30) }])
        expect(result.steps[0]).toEqual({ step: 0, status: 'completed', armedAt: 30, startedAt: 30, completedAt: 30, waitSeconds: 0 })
    })

    it('walks (walkSeconds ?? inputs.walkSeconds) / moveSpeedMultiplier', () => {
        const fast = gameData((parts) => {
            parts.civData.effects.push({ property: 'moveSpeed', select: { id: ['villager'] }, effect: 'multiply', value: 2, type: 'passive', grantedBy: 'civ', source: 'test', unverified: true })
        })
        const fastWood = rateOf('wood', fast, inputsFor(fast))
        const routed = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', walkSeconds: 20 }], { game: fast, inputs: inputsFor(fast, { autoHouses: false }) })
        expect(routed.gatherRates.wood[sampleAt(routed, 25)]).toBe(0)
        expect(routed.gatherRates.wood[sampleAt(routed, 30)]).toBeCloseTo(fastWood * 60, 9)
        const slow = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', walkSeconds: 20 }], { inputs: inputsFor(data, { autoHouses: false }) })
        expect(slow.gatherRates.wood[sampleAt(slow, 35)]).toBe(0)
        expect(slow.gatherRates.wood[sampleAt(slow, 40)]).toBeCloseTo(woodRate * 60, 9)
        const base = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood' }], { game: fast, inputs: inputsFor(fast, { walkSeconds: 10, autoHouses: false }) })
        expect(base.gatherRates.wood[sampleAt(base, 20)]).toBe(0)
        expect(base.gatherRates.wood[sampleAt(base, 25)]).toBeCloseTo(fastWood * 60, 9)
    })
})

describe('switch and pause', () => {
    it('lets the villager in production finish and keeps the scout cost when switching', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(10) }])
        expect(result.floating.food[sampleAt(result, 10)]).toBeCloseTo(150 + 6 * r * 10 - 65, 9)
        expect(countAt(result, 'villager', 20)).toBe(1)
        expect(countAt(result, 'scout', 40)).toBe(0)
        expect(countAt(result, 'scout', 45)).toBe(1)
        expect(result.unitsProduced.map((u) => u.baseId)).toEqual(['villager', 'scout'])
        expect(result.steps[0]).toMatchObject({ status: 'completed', startedAt: 10, completedAt: 43 })
        expect(countAt(result, 'villager', 120)).toBe(1)
    })

    it('pauses at once, lets the paid villager spawn and pays no more', () => {
        const result = run([{ action: 'pause', producer: 'capital-town-center', trigger: at(10) }])
        expect(result.steps[0]).toEqual({ step: 0, status: 'completed', armedAt: 10, startedAt: 10, completedAt: 10, waitSeconds: 0 })
        expect(countAt(result, 'villager', 20)).toBe(1)
        expect(countAt(result, 'villager', 120)).toBe(1)
    })

    it('treats a pause of a missing instance as a completed no-op that is not held', () => {
        let order: unknown
        withHandler(
            'build',
            (step, _index, s) => {
                order = addBuildingInstance(s, step.building).order
                return { started: true }
            },
            () => {
                const result = run([
                    { action: 'pause', producer: 'capital-town-center', instance: 2 },
                    { action: 'pause', producer: 'town-center' },
                    { action: 'build', building: 'town-center', from: 'sheep' },
                ])
                expect(result.steps[0].status).toBe('completed')
                expect(result.steps[1].status).toBe('completed')
                expect(countAt(result, 'villager', 60)).toBeGreaterThan(3)
            },
        )
        expect(order).toEqual({ step: null, unit: 'villager', remaining: null })
    })
})

describe('completion', () => {
    it('completes a counted produce at its last spawn', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2 }])
        expect(result.steps[0]).toMatchObject({ status: 'completed', startedAt: 0, completedAt: 40 })
        expect(countAt(result, 'villager', 40)).toBe(2)
        expect(countAt(result, 'villager', 120)).toBe(2)
    })

    it('leaves a continuous produce in progress, and completes it when a later pause replaces it', () => {
        const continuous: BuildStep = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
        expect(run([continuous]).steps[0].status).toBe('in-progress')
        const paused = run([continuous, { action: 'pause', producer: 'capital-town-center', trigger: at(30) }])
        expect(paused.steps[0]).toMatchObject({ status: 'completed', completedAt: 30 })
        expect(countAt(paused, 'villager', 40)).toBe(2)
        expect(countAt(paused, 'villager', 120)).toBe(2)
    })

    it('completes a continuous produce when a later produce on the same producer starts', () => {
        const result = run([
            { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
            { action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(30) },
        ])
        expect(result.steps[0]).toMatchObject({ status: 'completed', completedAt: 30 })
        expect(result.steps[1]).toMatchObject({ status: 'completed', completedAt: 63 })
    })
})

describe('produce waits', () => {
    it('waits for a targeted instance that does not exist and blocks later steps', () => {
        const result = run([
            { action: 'produce', producer: 'capital-town-center', instance: 2, unit: 'villager' },
            { action: 'rally', producer: 'capital-town-center', to: 'wood' },
        ])
        expect(result.steps.map((s) => s.status)).toEqual(['waiting', 'not-reached'])
        expect(countAt(result, 'villager', 60)).toBe(3)
    })

    it('waits for an entry above the current age without holding back the villager order', () => {
        const barracks = gameData((parts) =>
            withStart(parts, (start) => {
                start.buildings.value = ['capital-town-center', 'barracks']
            }),
        )
        const result = run([{ action: 'produce', producer: 'barracks', unit: 'spearman' }], { game: barracks })
        expect(result.steps[0].status).toBe('waiting')
        expect(countAt(result, 'villager', 60)).toBe(3)
    })

    it('waits while the population would pass supply, without a reserve', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(45) }], { inputs: inputsFor(data, { autoHouses: false }) })
        expect(result.steps[0].status).toBe('waiting')
        expect(result.floating.food[sampleAt(result, 50)]).toBeGreaterThan(65)
    })
})

describe('handler seam', () => {
    it('leaves an action with no registered handler waiting and blocking', () => {
        const withMill = gameData((parts) =>
            withStart(parts, (start) => {
                start.buildings.value = ['capital-town-center', 'mill']
                start.resources.value = { food: 200, wood: 200, gold: 200, stone: 0 }
            }),
        )
        const steps: BuildStep[] = [
            { action: 'research', tech: 'wheelbarrow' },
            { action: 'rally', producer: 'capital-town-center', to: 'wood' },
        ]
        const handlers = stepHandlers as Record<string, unknown>
        const saved = handlers.research
        delete handlers.research
        try {
            expect(run(steps, { game: withMill }).steps.map((s) => s.status)).toEqual(['waiting', 'not-reached'])
        } finally {
            handlers.research = saved
        }
        expect(stepHandlers.research).toBe(saved)
        expect(run(steps, { game: withMill }).steps[1].status).toBe('completed')
    })

    it('starts a step through a registered handler with no loop change', () => {
        const registered = stepHandlers.build
        withHandler(
            'build',
            () => ({ started: true }),
            () => {
                const result = run([
                    { action: 'build', building: 'house', from: 'sheep', trigger: at(15) },
                    { action: 'rally', producer: 'capital-town-center', to: 'wood' },
                ])
                expect(result.steps[0]).toMatchObject({ status: 'in-progress', armedAt: 15, startedAt: 15 })
                expect(result.steps[1]).toMatchObject({ status: 'completed', startedAt: 15 })
            },
        )
        expect(registered).toBeTypeOf('function')
        expect(stepHandlers.build).toBe(registered)
    })

    it('runs a handler event through schedule in time order', () => {
        const fired: string[] = []
        withHandler(
            'research',
            (_step, _index, s) => {
                s.schedule(s.time + 7, (later) => fired.push(`a@${later.time}`))
                s.schedule(s.time + 3, (later) => fired.push(`b@${later.time}`))
                s.schedule(s.time + 3, (later) => fired.push(`c@${later.time}`))
                return { started: true }
            },
            () => {
                run([{ action: 'research', tech: 'wheelbarrow', trigger: at(1) }])
            },
        )
        expect(fired).toEqual(['b@4', 'c@4', 'a@8'])
    })
})

describe('sampling', () => {
    it('samples every SAMPLE_SECONDS and at the horizon', () => {
        const result = run([], { inputs: inputsFor(data, { durationSeconds: 62 }) })
        expect(result.sampleSeconds).toBe(SAMPLE_SECONDS)
        expect(SAMPLE_SECONDS).toBe(5)
        expect(result.times.slice(0, 3)).toEqual([0, 5, 10])
        expect(result.times.slice(-2)).toEqual([60, 62])
        expect(result.times).toHaveLength(14)
        const arrays = [...Object.values(result.gatherRates), ...Object.values(result.floating), ...result.unitsProduced.map((u) => u.counts)]
        arrays.forEach((values) => expect(values).toHaveLength(result.times.length))
        expect(run([], { inputs: inputsFor(data, { durationSeconds: 60 }) }).times.slice(-2)).toEqual([55, 60])
    })

    it('applies a rally at 0 before the first sample', () => {
        const result = run([{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: at(0) }])
        expect(result.steps[0].startedAt).toBe(0)
        expect(result.gatherRates.wood[sampleAt(result, 25)]).toBeCloseTo(woodRate * 60, 9)
    })

    it('reports the run shape', () => {
        const result = run([])
        expect(result.civ).toBe('english')
        expect(result.durationSeconds).toBe(inputs.durationSeconds)
        expect(result.ages).toEqual([{ age: 1, reachedAt: 0 }])
        expect(result.notes).toEqual([])
    })
})

describe('civ rules', () => {
    const def = run([])

    it('defaults to the english rules, which are the empty frozen set', () => {
        expect(civRules('english')).toBe(NO_CIV_RULES)
        expect(Object.isFrozen(NO_CIV_RULES)).toBe(true)
        expect(run([], { rules: NO_CIV_RULES })).toEqual(def)
    })

    it('gatherRateModifier scales the income', () => {
        const result = run([], { rules: { gatherRateModifier: (rate, ctx) => (ctx.node === 'sheep' ? rate * 2 : rate) } })
        expect(result.gatherRates.food[0]).toBeCloseTo(6 * 2 * r * 60, 9)
    })

    it('productionModifier changes the production time', () => {
        const result = run([], { rules: { productionModifier: (seconds, ctx) => (ctx.producer === 'capital-town-center' ? seconds / 2 : seconds) } })
        expect(countAt(result, 'villager', 10)).toBe(1)
        expect(countAt(def, 'villager', 10)).toBe(0)
    })

    it('supplyProvider changes the supply a building gives', () => {
        const result = run([], { inputs: inputsFor(data, { autoHouses: false }), rules: { supplyProvider: (supply) => supply + 10 } })
        expect(countAt(result, 'villager', 80)).toBe(4)
        expect(countAt(run([], { inputs: inputsFor(data, { autoHouses: false }) }), 'villager', 80)).toBe(3)
        let supply: number
        withHandler(
            'move',
            (_step, _index, s) => {
                supply = s.supply
                return { started: true }
            },
            () => {
                run([{ action: 'move', count: 0, from: 'sheep', to: 'sheep' }], { rules: { supplyProvider: () => 500 } })
            },
        )
        expect(supply).toBe(data.base.maxPopCap.value)
    })

    it('villagerProducer decides which buildings carry the villager order', () => {
        const result = run([], { rules: { villagerProducer: (isProducer, ctx) => isProducer && ctx.baseId !== 'capital-town-center' } })
        expect(result.unitsProduced).toEqual([])
        expect(result.floating.food[0]).toBe(200)
    })

    it('dropOffRule picks the walk the gather rate uses', () => {
        const farWalk = inputsFor(data, { trips: { sheep: { walkSecondsTownCenter: 20 } } })
        const result = run([], { inputs: farWalk, rules: { dropOffRule: (has, ctx) => has || ctx.node === 'sheep' } })
        expect(result.gatherRates.food[0]).toBeCloseTo(6 * (10 / (10 / 0.75 + 2.86)) * 60, 9)
        expect(run([], { inputs: farWalk }).gatherRates.food[0]).toBeCloseTo(6 * (10 / (10 / 0.75 + 20)) * 60, 9)
    })

    it('startingState replaces the start', () => {
        const result = run([], { rules: { startingState: (start) => ({ ...start, resources: { ...start.resources, value: { food: 40, wood: 0, gold: 0, stone: 0 } } }) } })
        expect(result.floating.food[0]).toBeCloseTo(40, 9)
        expect(result.floating.wood[0]).toBe(0)
    })
})

describe('game data drives the run', () => {
    it('follows the villager production time', () => {
        const quick = gameData((parts) => {
            const villager = (parts.snapshot.units as unknown as { id: string; costs: { time: number } }[]).find((u) => u.id === 'villager-1')
            villager.costs.time = 10
        })
        expect(countAt(run([], { game: quick }), 'villager', 10)).toBe(1)
    })

    it('follows a productionSpeed effect', () => {
        const quick = gameData((parts) => {
            parts.civData.effects.push({ property: 'productionSpeed', select: { id: ['villager'] }, effect: 'multiply', value: 2, type: 'passive', grantedBy: 'civ', source: 'test', unverified: true })
        })
        expect(countAt(run([], { game: quick }), 'villager', 10)).toBe(1)
    })

    it('follows the sheep gather rate', () => {
        const slow = gameData((parts) => {
            parts.base.gatherNodes.sheep.rate.value = 0.5
        })
        expect(run([], { game: slow }).gatherRates.food[0]).toBeCloseTo(6 * (10 / (10 / 0.5 + 2.86)) * 60, 9)
    })
})

describe('performance', () => {
    it('runs an hour with twenty steps in well under a second', () => {
        const steps: BuildStep[] = []
        for (let i = 0; i < 5; i += 1) {
            steps.push(
                { action: 'rally', producer: 'capital-town-center', to: i % 2 ? 'wood' : 'sheep', trigger: at(i * 60) },
                { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 },
                { action: 'pause', producer: 'capital-town-center' },
                { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
            )
        }
        const started = performance.now()
        const result = run(steps, { inputs: inputsFor(data, { durationSeconds: 3600 }), rules: { supplyProvider: () => 200 } })
        expect(performance.now() - started).toBeLessThan(1000)
        expect(result.steps.every((s) => s.status !== 'waiting')).toBe(true)
        expect(countAt(result, 'villager', 3600)).toBe(3600 / 20)
    })
})

describe('source shape', () => {
    const source = (file: string) => readFileSync(join(__dirname, file), 'utf8')

    it('exports exactly the seam names', () => {
        const names = (file: string) => [...source(file).matchAll(/^export (?:const|function|interface|type) (\w+)/gm)].map((m) => m[1]).sort()
        expect(names('simulate.ts')).toEqual(
            ['BuildingInstance', 'EngineState', 'PaidItem', 'ProductionOrder', 'RallySource', 'SAMPLE_SECONDS', 'StepHandler', 'StepStart', 'addBuildingInstance', 'simulateBuildOrder', 'stepHandlers', 'triggerHolds'].sort(),
        )
        expect(names('civ-rules.ts')).toEqual(['CivRuleContext', 'CivRules', 'NO_CIV_RULES', 'civRules'].sort())
        expect(source('simulate.ts').match(/^export /gm)).toHaveLength(12)
        expect(source('civ-rules.ts').match(/^export /gm)).toHaveLength(4)
    })

    it('has no numeric literal beyond 0, 1, 60, the sample step and one tolerance', () => {
        for (const file of ['simulate.ts', 'civ-rules.ts']) {
            const code = source(file)
                .replace(/\/\/.*$/gm, '')
                .replace(/'[^']*'|`[^`]*`/g, "''")
            const literals = [...code.matchAll(/(?<![\w.])\d[\d.]*(?:e-?\d+)?/g)].map((m) => m[0])
            const odd = literals.filter((n) => !['0', '1', '60', '5'].includes(n))
            expect(odd.length, `${file}: ${odd.join(', ')}`).toBeLessThanOrEqual(file === 'simulate.ts' ? 1 : 0)
            expect(literals.filter((n) => n === '5'), file).toHaveLength(file === 'simulate.ts' ? 1 : 0)
        }
    })
})
