import { describe, expect, it } from 'vitest'
import type { CivRules } from './civ-rules'
import { constructionSeconds } from './construction'
import { RESOURCE_TOLERANCE } from './engine-common'
import { FINITE_GATHER_NODES, NODE_REFS } from './model'
import type { BuildStart, BuildStep, NodeRef, SimulationResult, SimWarning } from './model'
import { stepHandlers } from './simulate'
import type { EngineState } from './simulate'
import { ENGLISH, at, countAt, editGameData, run, sampleIndex, withHandler } from './test-helpers'

const PAUSE: BuildStep = { action: 'pause', producer: 'capital-town-center' }
const noHouses = { autoHouses: false }

const move = (count: number | 'all', from: NodeRef, to: NodeRef, extra: Partial<Extract<BuildStep, { action: 'move' }>> = {}): BuildStep => ({
    action: 'move',
    count,
    from,
    to,
    ...extra,
})

// Per-villager rate of one node, read off the first sample of a run where only that node is gathered.
function rateAt(node: NodeRef): number {
    return run([PAUSE], { start: { villagers: { [node]: 1 }, rally: 'wood' }, inputs: noHouses }).gatherRates[node === 'wood' ? 'wood' : 'food'][0] / 60
}

const rb = rateAt('berry')

function depletion(result: SimulationResult, node: NodeRef) {
    return result.depletions.find((d) => d.node === node)
}

function warningsFor(result: SimulationResult, code: SimWarning['code'], node: NodeRef) {
    return result.warnings.filter((w) => w.code === code && 'node' in w && w.node === node)
}

function snapshots(): { seen: { gatherers: Record<NodeRef, number>; idle: Record<NodeRef, number>; time: number }[]; probe: (state: EngineState) => void } {
    const seen: { gatherers: Record<NodeRef, number>; idle: Record<NodeRef, number>; time: number }[] = []
    return { seen, probe: (state) => void seen.push({ gatherers: { ...state.gatherers }, idle: { ...state.idle }, time: state.time }) }
}

// Probes the engine every time a move step is offered, then runs the real handler.
function probingMoves(probe: (state: EngineState) => void, fn: () => void): void {
    const real = stepHandlers.move
    withHandler('move', (step, index, state) => {
        probe(state)
        return real(step, index, state)
    }, fn)
}

describe('stock and run-out', () => {
    const start: BuildStart = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }
    const amount = 601
    const result = run([PAUSE], { start, inputs: { ...noHouses, nodeAmounts: { berry: amount } } })
    const expected = amount / (3 * rb)
    const runOut = depletion(result, 'berry').depletedAt

    it('runs a stocked ref out at its exact time, not on a sample', () => {
        expect(depletion(result, 'berry')).toEqual({ node: 'berry', amount, depletedAt: runOut })
        expect(Math.abs(runOut - expected)).toBeLessThanOrEqual(RESOURCE_TOLERANCE)
        expect(result.times).not.toContain(runOut)
        expect(runOut % result.sampleSeconds).not.toBe(0)
    })

    it('leaves the gatherers idle from then on and credits exactly the stock', () => {
        const after = result.times.findIndex((t) => t > runOut)
        expect(result.gatherRates.food[after - 1]).toBeCloseTo(3 * rb * 60, 9)
        expect(result.gatherRates.food.slice(after).every((v) => v === 0)).toBe(true)
        const food = result.floating.food
        expect(food[food.length - 1] - food[0]).toBeCloseTo(amount, 6)
        expect(food.slice(after).every((v) => v === food[after])).toBe(true)
        expect(countAt(result, 'villager', 0)).toBe(0)
    })

    it('records one node-depleted warning with the idle count and no idle-arrival', () => {
        expect(result.warnings).toEqual([
            { code: 'node-depleted', severity: 'warning', message: expect.any(String), node: 'berry', at: runOut, idleVillagers: 3 },
        ])
        const long = run([PAUSE], { start, inputs: { ...noHouses, durationSeconds: 3600, nodeAmounts: { berry: amount } } })
        expect(warningsFor(long, 'node-depleted', 'berry')).toHaveLength(1)
        expect(warningsFor(long, 'idle-arrival', 'berry')).toHaveLength(0)
    })

    it('is deterministic', () => {
        expect(run([PAUSE], { start, inputs: { ...noHouses, nodeAmounts: { berry: amount } } })).toEqual(result)
    })

    it('runs out at t=0 when the stock starts at 0, idling the villagers there', () => {
        const empty = run([PAUSE], { start, inputs: { ...noHouses, nodeAmounts: { berry: 0 } } })
        expect(depletion(empty, 'berry')).toEqual({ node: 'berry', amount: 0, depletedAt: 0 })
        expect(empty.warnings).toEqual([expect.objectContaining({ code: 'node-depleted', at: 0, idleVillagers: 3, severity: 'warning' })])
        expect(empty.gatherRates.food.every((v) => v === 0)).toBe(true)
        const nobody = run([PAUSE], { start: { villagers: { wood: 3 }, rally: 'wood' }, inputs: { ...noHouses, nodeAmounts: { berry: 0 } } })
        expect(nobody.warnings).toEqual([expect.objectContaining({ code: 'node-depleted', at: 0, idleVillagers: 0, severity: 'info' })])
    })

    it('counts idle villagers as alive for a villagers trigger', () => {
        const result = run([PAUSE, move(1, 'sheep', 'wood', { trigger: { kind: 'villagers', count: 6 } })], {
            start: { villagers: { berry: 3, sheep: 3 }, rally: 'wood' },
            inputs: { ...noHouses, nodeAmounts: { berry: 0 } },
        })
        expect(result.steps[1].startedAt).toBe(0)
    })

    it('keeps every ref infinite without nodeAmounts', () => {
        const plain = run([])
        expect(plain.depletions).toEqual(FINITE_GATHER_NODES.map((node) => ({ node, amount: null, depletedAt: null })))
        expect(plain.warnings).toEqual([])
    })
})

describe('gold deposits', () => {
    const start: BuildStart = { villagers: { gold: 1, 'gold#2': 3 }, rally: 'wood' }

    it('default each deposit to gold amount and let an override reach one deposit', () => {
        const stocked = editGameData((parts) => {
            parts.base.gatherNodes.gold.amount = { value: 3000, source: 'test', unverified: true }
        })
        const result = run([PAUSE], { game: stocked, start, inputs: { ...noHouses, nodeAmounts: { gold: null } } })
        expect(depletion(result, 'gold').amount).toBeNull()
        expect(depletion(result, 'gold#2').amount).toBe(3000)
        const two = run([PAUSE], { start, inputs: { ...noHouses, nodeAmounts: { 'gold#2': 2500 } } })
        expect(depletion(two, 'gold#2').amount).toBe(2500)
        expect(depletion(two, 'gold').amount).toBeNull()
    })

    it('draws each deposit down independently', () => {
        const rg = run([PAUSE], { start: { villagers: { gold: 1 }, rally: 'wood' }, inputs: noHouses }).gatherRates.gold[0] / 60
        const result = run([PAUSE], { start, inputs: { ...noHouses, nodeAmounts: { gold: 50, 'gold#2': 600 } } })
        expect(depletion(result, 'gold').depletedAt).toBeCloseTo(50 / rg, 6)
        expect(depletion(result, 'gold#2').depletedAt).toBeCloseTo(600 / (3 * rg), 6)
        const alone = run([PAUSE], { start, inputs: { ...noHouses, nodeAmounts: { 'gold#2': 600 } } })
        expect(depletion(alone, 'gold#2').depletedAt).toBeCloseTo(depletion(result, 'gold#2').depletedAt, 9)
        const mid = sampleIndex(result, 100)
        expect(result.gatherRates.gold[mid]).toBeCloseTo(3 * rg * 60, 9)
    })

    it('lists a deposit only when the order names it', () => {
        const unnamed = run([PAUSE], { inputs: { ...noHouses, nodeAmounts: { 'gold#2': 100 } } })
        expect(unnamed.depletions.map((d) => d.node)).toEqual(FINITE_GATHER_NODES)
        const named = run([PAUSE, move(1, 'sheep', 'gold#5')], { inputs: noHouses })
        expect(named.depletions.map((d) => d.node)).toEqual(['sheep', 'berry', 'deer', 'boar', 'gold', 'gold#5', 'stone'])
    })
})

describe('node-depleted idle count', () => {
    const start: BuildStart = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }
    const inputs = { ...noHouses, nodeAmounts: { berry: 601 } }
    const runOut = depletion(run([PAUSE], { start, inputs }), 'berry').depletedAt

    it('is read at the end of the run-out instant', () => {
        const away = run([PAUSE, move('all', 'berry', 'wood', { trigger: at(runOut) })], { start, inputs })
        expect(away.steps[1].startedAt).toBe(runOut)
        expect(warningsFor(away, 'node-depleted', 'berry')).toEqual([expect.objectContaining({ at: runOut, idleVillagers: 0, severity: 'info' })])
        const some = run([PAUSE, move(2, 'berry', 'wood', { trigger: at(runOut) })], { start, inputs })
        expect(warningsFor(some, 'node-depleted', 'berry')).toEqual([expect.objectContaining({ at: runOut, idleVillagers: 1, severity: 'warning' })])
    })
})

describe('idle arrivals', () => {
    const empty = { ...noHouses, nodeAmounts: { berry: 0 } }

    it('record one idle-arrival that adds up every arrival', () => {
        const result = run([PAUSE, move(3, 'sheep', 'berry', { trigger: at(10) }), move(2, 'sheep', 'berry', { trigger: at(30) })], { inputs: empty })
        expect(warningsFor(result, 'idle-arrival', 'berry')).toEqual([
            { code: 'idle-arrival', severity: 'warning', message: expect.any(String), node: 'berry', at: result.steps[1].completedAt, idleVillagers: 5 },
        ])
        expect(result.steps[1].completedAt).toBe(15)
        expect(result.gatherRates.food[sampleIndex(result, 40)]).toBeCloseTo(result.gatherRates.food[0] / 6, 9)
    })

    it('count an arrival at the run-out instant in both warnings, run-out first', () => {
        const result = run([move(2, 'sheep', 'berry', { walkSeconds: 0 }), PAUSE], { start: { villagers: { sheep: 2 }, rally: 'wood' }, inputs: empty })
        expect(result.warnings).toEqual([
            expect.objectContaining({ code: 'node-depleted', node: 'berry', at: 0, idleVillagers: 2, severity: 'warning' }),
            expect.objectContaining({ code: 'idle-arrival', node: 'berry', at: 0, idleVillagers: 2, severity: 'warning' }),
        ])
    })

    it('leave spawned villagers idle at a depleted rally, alive and counted', () => {
        const result = run([], { start: { villagers: { sheep: 6 }, rally: 'berry' }, inputs: empty })
        const [arrival] = warningsFor(result, 'idle-arrival', 'berry')
        expect(arrival.at).toBeGreaterThan(0)
        const spawned = countAt(result, 'villager', 120)
        expect(spawned).toBeGreaterThan(1)
        expect(result.gatherRates.food[sampleIndex(result, 120)]).toBeCloseTo(result.gatherRates.food[0], 9)
        const fed = run([], { start: { villagers: { sheep: 6 }, rally: 'berry' }, inputs: noHouses })
        expect(countAt(fed, 'villager', 120)).toBe(spawned)
    })

    it('leave builders idle at a depleted then', () => {
        const result = run([PAUSE, { action: 'build', building: 'house', from: 'sheep', then: 'berry' }], { inputs: empty })
        expect(warningsFor(result, 'idle-arrival', 'berry')).toEqual([expect.objectContaining({ at: result.steps[1].completedAt + 5, idleVillagers: 1 })])
    })

    it('leave an auto-house builder idle when its node ran out meanwhile', () => {
        const done: number[] = []
        const rules: CivRules = { onBuildingComplete: (_state, ctx) => void (ctx.baseId === 'house' && done.push(ctx.time)) }
        const start: BuildStart = { villagers: { berry: 2, sheep: 4 }, rally: 'sheep' }
        const houseInputs = { houseBuilders: 1, houseBuilderSource: 'berry' }
        run([], { start, inputs: houseInputs, rules })
        const house = ENGLISH.byBaseId.get('house')[0]
        const left = done[0] - 5 - constructionSeconds(house.costs.time, 1, ENGLISH)
        done.length = 0
        const result = run([], { start, inputs: { ...houseInputs, nodeAmounts: { berry: Math.round(rb * (2 * left + 5)) } }, rules })
        const runOut = depletion(result, 'berry').depletedAt
        expect(runOut).toBeGreaterThan(left)
        expect(runOut).toBeLessThan(done[0] + 5)
        expect(warningsFor(result, 'idle-arrival', 'berry')).toEqual([expect.objectContaining({ at: done[0] + 5, idleVillagers: 1 })])
    })
})

describe('taking villagers from a ref', () => {
    const start: BuildStart = { villagers: { berry: 6, wood: 2 }, rally: 'wood' }
    const inputs = { ...noHouses, nodeAmounts: { berry: 300 } }

    it('takes idle villagers once the ref ran out, and never has gatherers and idle at once', () => {
        const { seen, probe } = snapshots()
        let result: SimulationResult
        probingMoves(probe, () => {
            result = run([PAUSE, move(6, 'berry', 'farm', { trigger: at(100) }), move(2, 'farm', 'berry'), move(50, 'wood', 'sheep')], { start, inputs })
        })
        expect(depletion(result, 'berry').depletedAt).toBeLessThan(100)
        expect(result.steps[1]).toMatchObject({ startedAt: 100, completedAt: 105 })
        expect(warningsFor(result, 'idle-arrival', 'berry')).toEqual([expect.objectContaining({ at: 110, idleVillagers: 2 })])
        expect(seen.length).toBeGreaterThan(10)
        for (const { gatherers, idle } of seen) {
            for (const ref of NODE_REFS) {
                expect(gatherers[ref] > 0 && idle[ref] > 0).toBe(false)
            }
        }
        expect(seen.some((s) => s.idle.berry > 0)).toBe(true)
    })

    it('lets a build take idle villagers', () => {
        const result = run([PAUSE, { action: 'build', building: 'house', from: 'berry', then: 'wood', trigger: at(100) }], { start, inputs })
        expect(result.steps[1].startedAt).toBe(100)
    })
})

describe('move all', () => {
    it('takes everyone at its start and never waits', () => {
        const { seen, probe } = snapshots()
        let result: SimulationResult
        probingMoves(probe, () => {
            result = run([PAUSE, move('all', 'gold', 'gold#2', { trigger: at(10) })], { start: { villagers: { gold: 4, sheep: 2 }, rally: 'wood' }, inputs: noHouses })
        })
        expect(result.steps[1]).toMatchObject({ startedAt: 10, completedAt: 15 })
        expect(seen[0]).toMatchObject({ time: 10 })
        expect(result.gatherRates.gold[sampleIndex(result, 10)]).toBe(0)
        expect(result.gatherRates.gold[sampleIndex(result, 15)]).toBeCloseTo(result.gatherRates.gold[0], 9)
    })

    it('takes idle villagers too', () => {
        const result = run([PAUSE, move('all', 'berry', 'wood')], { start: { villagers: { berry: 3 }, rally: 'wood' }, inputs: { ...noHouses, nodeAmounts: { berry: 0 } } })
        expect(result.steps[1]).toMatchObject({ startedAt: 0, completedAt: 5 })
        expect(result.gatherRates.wood[sampleIndex(result, 5)]).toBeCloseTo(3 * rateAt('wood') * 60, 9)
    })

    it('completes at once and moves nobody with none there, so a second one is a no-op', () => {
        const start: BuildStart = { villagers: { gold: 4 }, rally: 'wood' }
        const result = run([PAUSE, move('all', 'gold', 'wood'), move('all', 'gold', 'wood')], { start, inputs: noHouses })
        expect(result.steps[2]).toMatchObject({ startedAt: 0, completedAt: 0, status: 'completed' })
        const once = run([PAUSE, move('all', 'gold', 'wood')], { start, inputs: noHouses })
        expect(result.gatherRates).toEqual(once.gatherRates)
        expect(result.floating).toEqual(once.floating)
    })
})

describe('auto-house builders', () => {
    function firstHouse(start: BuildStart, inputs: Record<string, unknown>): EngineState {
        let seen: EngineState
        const rules: CivRules = {
            onBuildingComplete: (state, ctx) => {
                if (ctx.baseId === 'house' && !seen) {
                    seen = structuredClone({ gatherers: state.gatherers, idle: state.idle }) as EngineState
                }
            },
        }
        run([], { start, inputs: { houseBuilders: 1, ...inputs }, rules })
        return seen
    }

    it('never come from idle villagers', () => {
        const state = firstHouse({ villagers: { gold: 3, sheep: 2, wood: 1 }, rally: 'wood' }, { houseBuilderSource: 'gold', nodeAmounts: { gold: 0 } })
        expect(state.idle.gold).toBe(3)
        expect(state.gatherers.sheep).toBe(1)
    })

    it('fall back to farm when it is the fullest', () => {
        const state = firstHouse({ villagers: { farm: 5, sheep: 2 }, rally: 'stone' }, { houseBuilderSource: 'gold' })
        expect(state.gatherers.farm).toBe(4)
        expect(state.gatherers.sheep).toBe(2)
    })

    it('break a sheep and farm tie toward sheep', () => {
        const state = firstHouse({ villagers: { farm: 3, sheep: 3 }, rally: 'stone' }, { houseBuilderSource: 'gold' })
        expect(state.gatherers.sheep).toBe(2)
        expect(state.gatherers.farm).toBe(3)
    })
})

describe('build walk', () => {
    // Villagers at then and walking, read once the completion instant has run.
    function atCompletion(step: BuildStep): { then: number; walking: number } {
        let seen: { then: number; walking: number }
        const then = (step as Extract<BuildStep, { action: 'build' }>).then
        const rules: CivRules = {
            onBuildingComplete: (state, ctx) => {
                if (ctx.baseId !== 'house') {
                    state.schedule(ctx.time, (s) => void (seen = { then: s.gatherers[then], walking: s.walking }))
                }
            },
        }
        run([PAUSE, step], { start: { villagers: { berry: 4, sheep: 4 }, rally: 'wood' }, inputs: noHouses, rules })
        return seen
    }

    it('joins the node the building creates with no second walk', () => {
        expect(atCompletion({ action: 'build', building: 'farm', from: 'berry', then: 'farm' })).toEqual({ then: 1, walking: 0 })
    })

    it('keeps both legs for any other then', () => {
        expect(atCompletion({ action: 'build', building: 'mill', from: 'sheep', then: 'berry' })).toEqual({ then: 4, walking: 1 })
        expect(atCompletion({ action: 'build', building: 'mill', from: 'berry', then: 'berry' })).toEqual({ then: 3, walking: 1 })
        expect(atCompletion({ action: 'build', building: 'farm', from: 'berry', then: 'sheep' })).toEqual({ then: 4, walking: 1 })
    })
})
