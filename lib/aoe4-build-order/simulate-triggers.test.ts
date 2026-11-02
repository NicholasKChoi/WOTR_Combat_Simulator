import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { CivData } from './data'
import type { Resources } from './engine-common'
import { RESOURCE_TOLERANCE } from './engine-common'
import type { BuildStart, BuildStep, FiniteNodeRef, NodeRef, SimulationResult, StepTiming, Trigger } from './model'
import { buildOrderCatalog, checkBuildOrder } from './schema'
import { simulateBuildOrder, stepHandlers, triggerWakeAt } from './simulate'
import type { EngineState, StepHandler } from './simulate'
import { ENGLISH, INFINITE_NODES, editGameData, inputsFor, run, series, withHandler } from './test-helpers'

const noHouses = { autoHouses: false }
const berryStart: BuildStart = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }
const berryRun = { ...noHouses, nodeAmounts: { berry: 600 } }
const ranOut = (node: FiniteNodeRef): Trigger => ({ kind: 'depleted', node })
const rally = (to: NodeRef, extra: Partial<BuildStep> = {}): BuildStep => ({ action: 'rally', producer: 'capital-town-center', to, ...extra }) as BuildStep
const move = (count: number | 'all', from: NodeRef, to: NodeRef, extra: Partial<BuildStep> = {}): BuildStep => ({ action: 'move', count, from, to, ...extra }) as BuildStep
const onBerry = { trigger: ranOut('berry'), reaction: true } as const
// Waits on prerequisite for the whole run: there is no second town center.
const blocked: BuildStep = { action: 'produce', producer: 'capital-town-center', instance: 2, unit: 'villager' }

function depletedAt(result: SimulationResult, node: FiniteNodeRef): number | null {
    return result.depletions.find((d) => d.node === node)?.depletedAt ?? null
}

function breakdownSum(timing: StepTiming): number {
    return Object.values(timing.waitBreakdown).reduce((total, seconds) => total + seconds, 0)
}

function startedWith(game: typeof ENGLISH, edit: (start: CivData['startingState']) => void) {
    return editGameData((parts) => edit(parts.civData.startingState), game)
}

// The bank right after the action's handler starts a step and pays for it.
function bankSeen<A extends 'build' | 'rally' | 'research'>(action: A, resource: keyof Resources, fn: () => void): number[] {
    const seen: number[] = []
    const real = stepHandlers[action] as StepHandler<A>
    withHandler(action, (step, index, state) => {
        const outcome = real(step, index, state)
        if (outcome.started) {
            seen.push(state.resources[resource])
        }
        return outcome
    }, fn)
    return seen
}

describe('depleted trigger', () => {
    const result = run([rally('sheep', { trigger: ranOut('berry') })], { start: berryStart, inputs: berryRun })
    const runOut = depletedAt(result, 'berry')

    it('arms and starts at the run-out instant, not on a sample', () => {
        expect(runOut).not.toBeNull()
        expect(runOut! % result.sampleSeconds).not.toBe(0)
        expect(result.steps[0]).toMatchObject({ armedAt: runOut, startedAt: runOut, waitingOn: null })
    })

    it('never holds for a null amount, a ref nobody gathers, or stock left at the horizon', () => {
        const cases: [FiniteNodeRef, unknown][] = [
            ['berry', { ...noHouses, nodeAmounts: { berry: null } }],
            ['deer', noHouses],
            ['berry', { ...noHouses, nodeAmounts: { berry: 100000 } }],
        ]
        for (const [node, inputs] of cases) {
            const steps = [rally('sheep', { trigger: ranOut(node) })]
            const stuck = run(steps, { start: berryStart, inputs })
            expect(depletedAt(stuck, node), node).toBeNull()
            expect(stuck.steps[0], node).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
            expect(checkBuildOrder({ civ: 'english', name: 'x', start: berryStart, steps }, buildOrderCatalog(ENGLISH)).ok).toBe(true)
        }
    })

    it('creates the stock of a deposit only the trigger names, at the gold amount', () => {
        const result = run([rally('sheep', { trigger: ranOut('gold#3') })], { start: berryStart, inputs: noHouses })
        expect(result.depletions.find((d) => d.node === 'gold#3')).toEqual({ node: 'gold#3', amount: inputsFor(ENGLISH).nodeAmounts.gold, depletedAt: null })
        expect(result.depletions.some((d) => d.node === 'gold#2')).toBe(false)
    })
})

describe('bank trigger', () => {
    const woodStart: BuildStart = { villagers: { sheep: 3, wood: 3 }, rally: 'sheep' }
    const bankRally = (resource: Trigger & { kind: 'bank' }) => [rally('wood', { trigger: resource })]

    it('arms at the exact instant the bank reaches atLeast', () => {
        let result!: SimulationResult
        const seen = bankSeen('rally', 'wood', () => {
            result = run(bankRally({ kind: 'bank', resource: 'wood', atLeast: 400 }), { start: woodStart, inputs: noHouses })
        })
        expect(seen).toHaveLength(1)
        expect(Math.abs(seen[0] - 400)).toBeLessThanOrEqual(RESOURCE_TOLERANCE)
        expect(result.steps[0].armedAt).toBe(result.steps[0].startedAt)
        expect(result.steps[0].armedAt! % result.sampleSeconds).not.toBe(0)
    })

    it('never arms without income and holds at once for 0', () => {
        const idle = run(bankRally({ kind: 'bank', resource: 'stone', atLeast: 400 }), { start: woodStart, inputs: noHouses })
        expect(idle.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
        const zero = run(bankRally({ kind: 'bank', resource: 'stone', atLeast: 0 }), { start: woodStart, inputs: noHouses })
        expect(zero.steps[0]).toMatchObject({ armedAt: 0, startedAt: 0 })
    })

    it('is checked before the villager order pays at the same instant', () => {
        const food = ENGLISH.civData.startingState.resources.value.food
        const result = run([rally('wood', { trigger: { kind: 'bank', resource: 'food', atLeast: food } })], { inputs: noHouses })
        expect(result.steps[0].armedAt).toBe(0)
        expect(result.floating.food[0]).toBeLessThan(food)
    })

    it('waits for an unstarted earlier step', () => {
        const result = run([blocked, rally('wood', { trigger: { kind: 'bank', resource: 'wood', atLeast: 0 } })])
        expect(result.steps[1]).toMatchObject({ status: 'not-reached', waitingOn: 'earlier-step', armedAt: null })
    })
})

describe('triggerWakeAt', () => {
    const state = { time: 10, resources: { food: 0, wood: 100, gold: 0, stone: 0 } } as EngineState
    const income: Resources = { food: 0, wood: 3, gold: 0, stone: 0 }

    it('wakes a time trigger at its seconds and a bank trigger at its crossing', () => {
        expect(triggerWakeAt({ kind: 'time', seconds: 42 }, state, income)).toBe(42)
        expect(triggerWakeAt({ kind: 'bank', resource: 'wood', atLeast: 400 }, state, income)).toBe(110)
    })

    it('has no wake for no trigger, depleted, a held bank or a bank without income', () => {
        const none: (Trigger | undefined)[] = [
            undefined,
            { kind: 'depleted', node: 'berry' },
            { kind: 'bank', resource: 'wood', atLeast: 100 },
            { kind: 'bank', resource: 'gold', atLeast: 400 },
        ]
        for (const trigger of none) {
            expect(triggerWakeAt(trigger, state, income), JSON.stringify(trigger)).toBeNull()
        }
    })
})

describe('reaction order', () => {
    it('never delays the next step while its trigger does not hold', () => {
        const result = run([rally('sheep', { trigger: ranOut('stone'), reaction: true }), rally('wood')])
        expect(result.steps[1]).toMatchObject({ armedAt: 0, startedAt: 0 })
        expect(result.steps[0]).toMatchObject({ status: 'not-reached', waitingOn: 'trigger' })
    })

    it('starts at the run-out whatever the non-reaction steps around it do', () => {
        for (const steps of [[blocked, move('all', 'berry', 'wood', onBerry)], [move('all', 'berry', 'wood', onBerry), blocked]]) {
            const result = run(steps, { start: berryStart, inputs: berryRun })
            const reaction = result.steps.find((_, i) => steps[i].reaction)
            expect(reaction).toMatchObject({ armedAt: depletedAt(result, 'berry'), startedAt: depletedAt(result, 'berry'), waitBreakdown: {} })
        }
    })

    it('never delays an earlier cursor step that waits', () => {
        const barracks: BuildStep = { action: 'build', building: 'barracks', builders: 2, from: 'wood' }
        const options = { start: berryStart, inputs: { ...noHouses, nodeAmounts: { berry: 30 } } }
        const plain = run([barracks, barracks], options)
        const reacting = run([barracks, barracks, rally('wood', onBerry)], options)
        expect(reacting.steps[1].startedAt).toBe(plain.steps[1].startedAt)
        expect(reacting.steps[2].startedAt).toBe(depletedAt(reacting, 'berry'))
        expect(reacting.steps[2].startedAt).toBeLessThan(reacting.steps[1].startedAt!)
    })

    it('starts reactions on one ref in step order, each seeing what the earlier left', () => {
        const result = run([move('all', 'berry', 'wood', onBerry), move(2, 'berry', 'wood', onBerry)], { start: berryStart, inputs: berryRun })
        const runOut = depletedAt(result, 'berry')
        expect(result.steps[0]).toMatchObject({ startedAt: runOut, status: 'completed' })
        expect(result.steps[1]).toMatchObject({ armedAt: runOut, startedAt: null, status: 'waiting', waitingOn: 'villagers' })
        expect(breakdownSum(result.steps[1])).toBeCloseTo(result.durationSeconds - runOut!, 9)
        expect(result.warnings.filter((w) => w.code === 'step-stuck')).toEqual([expect.objectContaining({ step: 1, waitingOn: 'villagers', at: runOut })])
    })

    it('starts at most once, leaving later arrivals idle', () => {
        const back = move(1, 'wood', 'berry', { trigger: { kind: 'time', seconds: 600 } })
        const result = run([move('all', 'berry', 'wood', onBerry), back], { start: berryStart, inputs: berryRun })
        const runOut = depletedAt(result, 'berry')
        expect(runOut).toBeLessThan(600)
        expect(result.steps[0].startedAt).toBe(runOut)
        expect(result.warnings.filter((w) => w.code === 'idle-arrival')).toEqual([expect.objectContaining({ node: 'berry', idleVillagers: 1 })])
    })
})

describe('reaction and the cursor step compete', () => {
    const withWood = (wood: number) => startedWith(ENGLISH, (start) => {
        start.resources.value = { food: 0, wood, gold: 0, stone: 0 }
    })

    it('gives the last wood to the reaction first', () => {
        const house = (from: NodeRef, extra: Partial<BuildStep>): BuildStep => ({ action: 'build', building: 'house', from, ...extra }) as BuildStep
        const result = run([house('sheep', { trigger: ranOut('berry') }), house('berry', onBerry)], {
            game: withWood(50),
            start: { villagers: { berry: 3, sheep: 3 }, rally: 'sheep' },
            inputs: berryRun,
        })
        const runOut = depletedAt(result, 'berry')
        expect(result.steps[1]).toMatchObject({ startedAt: runOut })
        expect(result.steps[0]).toMatchObject({ armedAt: runOut, startedAt: null, waitingOn: 'resources' })
    })

    it('starts a reaction short of resources at the exact affordability instant', () => {
        let result!: SimulationResult
        const seen = bankSeen('build', 'wood', () => {
            result = run([{ action: 'build', building: 'house', from: 'berry', ...onBerry }], { game: withWood(0), start: berryStart, inputs: { ...noHouses, nodeAmounts: { berry: 30 } } })
        })
        const reaction = result.steps[0]
        expect(reaction.startedAt).toBeGreaterThan(reaction.armedAt!)
        expect(seen).toHaveLength(1)
        expect(Math.abs(seen[0])).toBeLessThanOrEqual(RESOURCE_TOLERANCE)
        expect(breakdownSum(reaction)).toBeCloseTo(reaction.waitSeconds, 9)
    })

    it('never holds back a producer order while it waits on resources', () => {
        const game = startedWith(ENGLISH, (start) => {
            start.buildings.value = ['capital-town-center', 'barracks', 'mill']
            start.resources.value = { food: 2000, wood: 2000, gold: 0, stone: 0 }
        })
        const menAtArms: BuildStep = { action: 'produce', producer: 'barracks', unit: 'man-at-arms' }
        const inputs = { ...noHouses, nodeAmounts: { ...INFINITE_NODES, berry: 30 } }
        const options = { game, start: { villagers: { berry: 3, gold: 3 }, rally: 'gold' as const }, inputs, rules: { supplyProvider: () => 200 } }
        const plain = run([menAtArms], options)
        let reacting!: SimulationResult
        const seen = bankSeen('research', 'gold', () => {
            reacting = run([menAtArms, { action: 'research', tech: 'wheelbarrow', ...onBerry }], options)
        })
        const reaction = reacting.steps[1]
        expect(reaction.startedAt).toBeGreaterThan(reaction.armedAt! + reacting.sampleSeconds)
        expect(Math.abs(seen[0])).toBeLessThanOrEqual(RESOURCE_TOLERANCE)
        const before = reacting.times.filter((t) => t < reaction.startedAt!).length
        expect(series(reacting, 'man-at-arms').slice(0, before)).toEqual(series(plain, 'man-at-arms').slice(0, before))
        expect(series(plain, 'man-at-arms')[before - 1]).toBeGreaterThan(series(plain, 'man-at-arms')[sampleBefore(reacting, reaction.armedAt!)])
    })
})

function sampleBefore(result: SimulationResult, t: number): number {
    return result.times.filter((time) => time <= t).length - 1
}

describe('node-depleted with a reaction', () => {
    it('leaves nobody idle when a move all reaction leaves at the run-out', () => {
        const reacting = run([move('all', 'berry', 'wood', onBerry)], { start: berryStart, inputs: berryRun })
        const plain = run([], { start: berryStart, inputs: berryRun })
        const warningOf = (result: SimulationResult) => result.warnings.find((w) => w.code === 'node-depleted' && w.node === 'berry')
        expect(warningOf(reacting)).toMatchObject({ severity: 'info', idleVillagers: 0 })
        expect(warningOf(plain)).toMatchObject({ severity: 'warning', idleVillagers: 3 })
    })

    it('is deterministic, warnings and wait breakdowns included', () => {
        const steps = [move('all', 'berry', 'wood', onBerry), move(2, 'berry', 'wood', onBerry), blocked]
        expect(run(steps, { start: berryStart, inputs: berryRun })).toEqual(run(steps, { start: berryStart, inputs: berryRun }))
    })
})

describe('default amounts', () => {
    const eng1tc = listBuilds().find((build) => build.name.includes('1TC'))
    const runEng = (inputs: unknown) => simulateBuildOrder(eng1tc!, ENGLISH, inputsFor(ENGLISH, inputs))

    it('starts every finite node at its shipped amount', () => {
        expect(inputsFor(ENGLISH).nodeAmounts).toMatchObject({ sheep: 3000, berry: 1500, deer: 1750, boar: 2000, gold: 4000, 'gold#2': 4000, stone: 1200 })
    })

    it('starts a deposit only a trigger names at the gold amount, also when gold is infinite', () => {
        const steps = [rally('sheep', { trigger: ranOut('gold#2') })]
        expect(run(steps).depletions.find((d) => d.node === 'gold#2')?.amount).toBe(4000)
        const infiniteGold = run(steps, { inputs: { nodeAmounts: { gold: null } } }).depletions
        expect(infiniteGold.filter((d) => d.node.startsWith('gold'))).toEqual([
            { node: 'gold', amount: null, depletedAt: null },
            { node: 'gold#2', amount: 4000, depletedAt: null },
        ])
    })

    it('runs ENG 1TC dry on sheep and gold within the hour, leaving the other nodes and gold#2', () => {
        const result = runEng({ durationSeconds: 3600 })
        const ranDry = result.depletions.filter((d) => d.depletedAt !== null).map((d) => d.node)
        expect(ranDry).toEqual(['sheep', 'gold'])
        expect(result.depletions.find((d) => d.node === 'gold#2')).toEqual({ node: 'gold#2', amount: 4000, depletedAt: null })
        const times = result.warnings.map((w) => w.at)
        expect(times).toEqual([...times].sort((a, b) => a - b))
    })

    it('keeps every ENG 1TC start time', () => {
        const starts = (inputs: unknown) => runEng({ durationSeconds: 3600, ...(inputs as object) }).steps.map((s) => s.startedAt)
        const shipped = starts({})
        expect(shipped).toHaveLength(25)
        expect(shipped.every((t) => t !== null)).toBe(true)
        const infinite = starts({ nodeAmounts: INFINITE_NODES })
        expect(infinite.slice(0, -1)).toEqual(shipped.slice(0, -1))
        expect(infinite.at(-1)).toBeNull()
    })
})
