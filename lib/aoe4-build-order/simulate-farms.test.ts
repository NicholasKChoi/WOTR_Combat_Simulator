import { describe, expect, it } from 'vitest'
import { civRules } from './civ-rules'
import type { CivData, GameData } from './data'
import { NODE_REFS } from './model'
import type { BuildStart, BuildStep, NodeRef, SimulationResult, SimWarning } from './model'
import { stepHandlers } from './simulate'
import type { CivRules } from './civ-rules'
import { ENGLISH, at, editGameData, run, sampleIndex, withHandler, withStartFarms } from './test-helpers'

const PAUSE: BuildStep = { action: 'pause', producer: 'capital-town-center' }
const noHouses = { autoHouses: false }

const move = (count: number, from: NodeRef, to: NodeRef, seconds: number): BuildStep => ({ action: 'move', count, from, to, walkSeconds: 5, trigger: at(seconds) })
const buildFarm = (from: NodeRef, then: NodeRef, extra: Partial<Extract<BuildStep, { action: 'build' }>> = {}): BuildStep => ({ action: 'build', building: 'farm', from, then, ...extra })

type Seen = { gatherers: Record<NodeRef, number>; idle: Record<NodeRef, number> }

interface Probed {
    result: SimulationResult
    at(t: number): Seen
}

// A leading rally to the start rally (a no-op) schedules one read per time, just after every event at that time.
function probed(steps: BuildStep[], times: number[], options: { game?: GameData; inputs?: unknown; start?: BuildStart; rules?: CivRules } = {}): Probed {
    const seen = new Map<number, Seen>()
    const real = stepHandlers.rally!
    const probe: BuildStep = { action: 'rally', producer: 'capital-town-center', to: options.start?.rally ?? 'sheep' }
    let result!: SimulationResult
    withHandler('rally', (step, index, state) => {
        if (index === 0) {
            times.forEach((t) => state.schedule(t + 1e-6, (s) => void seen.set(t, { gatherers: { ...s.gatherers }, idle: { ...s.idle } })))
        }
        return real(step, index, state)
    }, () => {
        result = run([probe, ...steps], options)
    })
    return { result: { ...result, steps: result.steps.slice(1) }, at: (t) => seen.get(t)! }
}

const farmIdle = (result: SimulationResult) => result.warnings.filter((w): w is Extract<SimWarning, { code: 'farm-idle' }> => w.code === 'farm-idle')
const foodAt = (result: SimulationResult, t: number) => result.gatherRates.food[sampleIndex(result, t)]
const atFarm = (seen: Seen) => [seen.gatherers.farm, seen.idle.farm]

const farmRate = run([PAUSE], { game: withStartFarms(1), start: { villagers: { farm: 1 }, rally: 'wood' }, inputs: noHouses }).gatherRates.food[0] / 60

describe('a farm holds one villager per built farm', () => {
    it.each([
        [3, '3 villagers arrived at farm from 0:50 on with no free farm and wait idle until one is built.'],
        [1, '1 villager arrived at farm from 0:50 on with no free farm and waits idle until one is built.'],
    ])('leaves %i villagers idle with no farm built, gathering no food', (count, message) => {
        const steps = [PAUSE, move(count, 'wood', 'farm', 45)]
        const options = { start: { villagers: { wood: 3 }, rally: 'wood' as const }, inputs: { ...noHouses, durationSeconds: 120 } }
        const result = run(steps, options)
        expect(result.gatherRates.food.every((rate) => rate === 0)).toBe(true)
        expect(farmIdle(result)).toEqual([{ code: 'farm-idle', severity: 'warning', message, at: 50, idleVillagers: count }])
        expect(run(steps, options).warnings).toEqual(result.warnings)
    })

    describe('with farms completing one by one', () => {
        const steps = [PAUSE, move(1, 'wood', 'farm', 0), move(2, 'wood', 'farm', 10), buildFarm('wood', 'wood', { trigger: at(20) }), buildFarm('wood', 'wood', { trigger: at(60) })]
        const first = 31
        const second = 71
        const { result, at: seen } = probed(steps, [30, first, 50, second], { start: { villagers: { wood: 4 }, rally: 'wood' }, inputs: { ...noHouses, durationSeconds: 100 } })

        it('completes the farms at the probed instants', () => {
            expect([result.steps[3].completedAt, result.steps[4].completedAt]).toEqual([first, second])
        })

        it('gathers with one villager per farm and promotes a waiting villager the instant a farm completes', () => {
            expect([atFarm(seen(30)), atFarm(seen(first)), atFarm(seen(50)), atFarm(seen(second))]).toEqual([[0, 3], [1, 2], [1, 2], [2, 1]])
            expect(foodAt(result, 30)).toBe(0)
            expect(foodAt(result, 35)).toBeCloseTo(farmRate * 60, 9)
            expect(foodAt(result, 70)).toBeCloseTo(farmRate * 60, 9)
            expect(foodAt(result, 75)).toBeCloseTo(2 * farmRate * 60, 9)
        })

        it('warns once, at the first arrival, counting every arrival including the villagers promoted later', () => {
            expect(farmIdle(result).map(({ at, idleVillagers }) => ({ at, idleVillagers }))).toEqual([{ at: 5, idleVillagers: 3 }])
        })
    })

    it('moves a waiting villager off a farm before a gathering one', () => {
        const { result, at: seen } = probed([PAUSE, move(1, 'farm', 'wood', 10)], [5, 20], { game: withStartFarms(1), start: { villagers: { farm: 2 }, rally: 'wood' }, inputs: noHouses })
        expect([atFarm(seen(5)), atFarm(seen(20)), seen(20).gatherers.wood]).toEqual([[1, 1], [1, 0], 1])
        for (const t of [0, 5, 10, 15, 20]) expect(foodAt(result, t)).toBeCloseTo(farmRate * 60, 9)
    })

    it.each([
        [1, [1, 0], []],
        [3, [1, 2], [2]],
    ])('puts %i builders of a farm on it at completion as far as its one slot goes', (builders, farm, warned) => {
        const steps = [PAUSE, buildFarm('wood', 'farm', { builders })]
        const done = run(steps, { start: { villagers: { wood: 3 }, rally: 'wood' }, inputs: noHouses }).steps[1].completedAt!
        const { result, at: seen } = probed(steps, [done], { start: { villagers: { wood: 3 }, rally: 'wood' }, inputs: noHouses })
        expect(atFarm(seen(done))).toEqual(farm)
        expect(farmIdle(result).map((w) => w.idleVillagers)).toEqual(warned)
        expect(farmIdle(result).map((w) => w.at)).toEqual(warned.map(() => done))
    })
})

describe('the starting farms', () => {
    const civStart = (farms: number) =>
        editGameData((parts) => {
            const start: CivData['startingState'] = parts.civData.startingState
            start.villagers.value = { ...start.villagers.value, farm: 4 }
            start.buildings.value.push(...Array<string>(farms).fill('farm'))
        })
    const overridden: CivRules = {
        ...civRules('english'),
        startingState: (start) => ({ ...start, buildings: { ...start.buildings, value: [...start.buildings.value, 'farm', 'farm'] } }),
    }

    it.each([
        ['the civ data', civStart(2), undefined],
        ['a startingState override', civStart(0), overridden],
    ])('cap the starting farmers when the 2 farms come from %s', (_, game, rules) => {
        const { result, at: seen } = probed([], [0], { game, rules, inputs: noHouses })
        const uncapped = run([], { game: civStart(4), inputs: noHouses })
        expect(atFarm(seen(0))).toEqual([2, 2])
        expect(result.spawnedPopulation).toEqual(uncapped.spawnedPopulation)
        expect(farmIdle(result).map(({ at, idleVillagers }) => ({ at, idleVillagers }))).toEqual([{ at: 0, idleVillagers: 2 }])
        expect(farmIdle(uncapped)).toEqual([])
    })
})

describe('auto-house builders at a farm', () => {
    const inputs = { houseBuilderSource: 'farm', houseBuilders: 2, durationSeconds: 140 }

    it('take the waiting farmer first and leave one waiting again when they return', () => {
        const times = Array.from({ length: 28 }, (_, i) => i * 5)
        const { result, at: seen } = probed([], times, { game: withStartFarms(3), start: { villagers: { farm: 4 }, rally: 'wood' }, inputs })
        const farm = times.map((t) => atFarm(seen(t)))
        const changes = farm.filter((pair, i) => i === 0 || pair.join() !== farm[i - 1].join())
        expect(changes).toEqual([[3, 1], [2, 0], [3, 1]])
        expect(farmIdle(result).map(({ at, idleVillagers }) => ({ at, idleVillagers }))).toEqual([{ at: 0, idleVillagers: 2 }])
    })

    it('never start from waiting farmers alone', () => {
        const rich = editGameData((parts) => void (parts.civData.startingState.resources.value.food = 2000))
        const result = run([], { game: rich, start: { villagers: { farm: 2 }, rally: 'farm' }, inputs: { ...inputs, durationSeconds: 600 } })
        expect(result.spawnedPopulation.at(-1)).toBeGreaterThanOrEqual(10)
        expect(result.spent.buildings.at(-1)).toBe(0)
    })
})

describe('idle farmers are alive', () => {
    it('count toward a villagers trigger and the spawned population as farmers at wood do', () => {
        const steps: BuildStep[] = [{ action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: { kind: 'villagers', count: 8 } }]
        const atFarmRun = run(steps, { start: { villagers: { farm: 6 }, rally: 'farm' }, inputs: noHouses })
        const atWoodRun = run(steps, { start: { villagers: { wood: 6 }, rally: 'wood' }, inputs: noHouses })
        expect(atFarmRun.steps[0].armedAt).toBeGreaterThan(0)
        expect(atFarmRun.steps[0].armedAt).toBe(atWoodRun.steps[0].armedAt)
        const until = sampleIndex(atFarmRun, 60) + 1
        expect(atFarmRun.spawnedPopulation.slice(0, until)).toEqual(atWoodRun.spawnedPopulation.slice(0, until))
    })

    it('leave villagers at every node no building creates unchanged', () => {
        const others = NODE_REFS.filter((ref) => ENGLISH.base.gatherNodes[ref.split('#')[0] as 'wood'].createdBy === undefined)
        expect(others).not.toContain('farm')
        const { at: seen } = probed([PAUSE], [0], { start: { villagers: { wood: 3, gold: 2, sheep: 4 }, rally: 'wood' }, inputs: noHouses })
        expect([seen(0).gatherers.wood, seen(0).gatherers.gold, seen(0).gatherers.sheep]).toEqual([3, 2, 4])
        expect(others.every((ref) => seen(0).idle[ref] === 0)).toBe(true)
    })
})
