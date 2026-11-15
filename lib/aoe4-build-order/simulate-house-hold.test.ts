import { describe, expect, it } from 'vitest'
import type { BuildStart, BuildStep, SimulationResult } from './model'
import { buildOrderCatalog } from './schema'
import { SAMPLE_SECONDS, simulateBuildOrder } from './simulate'
import { ENGLISH, at, editGameData, housesDone, inputsFor, run, sampleIndex, series } from './test-helpers'
import type { Parts } from './test-helpers'
import { textToBuildOrder } from './text-to-build'

const HOUSE_WOOD = 50

interface HoldGame {
    wood: number
    food?: number
    houseSeconds?: number
    houseFood?: number
    houseStone?: number
}

function setHouse(parts: Parts, edit: (costs: Record<string, number>) => void): void {
    const house = parts.snapshot.buildings.find((entry) => entry.baseId === 'house')!
    edit(house.costs as unknown as Record<string, number>)
}

// Age 2 with a barracks, a mill and one house; a long house build keeps a house due from the start.
function holdGame({ wood, food = 5000, houseSeconds = 600, houseFood = 0, houseStone = 0 }: HoldGame) {
    return editGameData((parts) => {
        const start = parts.civData.startingState
        start.age.value = 2
        start.buildings.value = ['capital-town-center', 'barracks', 'mill', 'house']
        start.resources.value = { food, wood, gold: 1000, stone: 0 }
        setHouse(parts, (costs) => {
            costs.time = houseSeconds
            costs.food = houseFood
            costs.stone = houseStone
        })
    })
}

// Six villagers, at most three per node, so four house builders never gather at one node before the stone rally
// brings a fourth there.
const spread: BuildStart = { villagers: { sheep: 3, gold: 3, wood: 1, berry: 1 }, rally: 'stone' }
const fourBuilders = { houseBuilders: 4, durationSeconds: 60, nodeAmounts: { berry: 1 } }

function holdRun(steps: BuildStep[], game: HoldGame, inputs: object = {}, start: BuildStart = spread): SimulationResult {
    return run(steps, { game: holdGame(game), start, inputs: { ...fourBuilders, ...inputs } })
}

const woodRate = (result: SimulationResult) => result.gatherRates.wood[0] / 60
const barracks = (extra: Partial<BuildStep> = {}): BuildStep => ({ action: 'build', building: 'barracks', from: 'sheep', ...extra }) as BuildStep
const spearmen: BuildStep = { action: 'produce', producer: 'barracks', unit: 'spearman' }
const onBerry = { trigger: { kind: 'depleted', node: 'berry' }, reaction: true } as const

function noneNegative(result: SimulationResult): void {
    Object.values(result.floating).forEach((values) => values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0)))
}

describe('a due house holds its cost back from steps', () => {
    // Each step leaves the bank 10 wood short of its cost plus one house; one wood villager closes the gap.
    it.each([
        ['build', [barracks()], 0, 150],
        ['produce', [spearmen], 0, 20],
        ['research', [{ action: 'research', tech: 'wheelbarrow', at: 'mill' } as BuildStep], 0, 50],
        ['reaction', [barracks(onBerry)], 0, 150],
    ])('starts the %s step the instant the bank covers its cost plus one house', (_, steps, index, cost) => {
        const result = holdRun(steps, { wood: cost + HOUSE_WOOD - 10 })
        const rate = woodRate(result)
        expect(rate).toBeGreaterThan(0)
        expect((10 / rate) % SAMPLE_SECONDS).toBeGreaterThan(0)
        expect(10 / rate).toBeLessThan(20)
        expect(result.steps[index].startedAt).toBeCloseTo(10 / rate, 6)
        expect(result.steps[index].waitBreakdown.resources).toBeGreaterThan(0)
        noneNegative(result)
    })

    it('holds one house cost when several houses are due and none can start', () => {
        const slow = { houseSeconds: 1200 }
        const withBuilders = holdRun([], { ...slow, wood: 1000 }, {}, { villagers: { sheep: 8 }, rally: 'stone' })
        expect(withBuilders.spent.buildings[0]).toBeGreaterThanOrEqual(2 * HOUSE_WOOD)
        expect(holdRun([barracks()], { ...slow, wood: 150 + HOUSE_WOOD }).steps[0].startedAt).toBe(0)
    })

    it('pays a step that spends none of the house resources', () => {
        const result = holdRun([{ action: 'research', tech: 'textiles' }], { wood: 0 })
        expect(result.steps[0].startedAt).toBe(0)
    })

    it('holds one house cost back from a non-villager order', () => {
        const result = holdRun([spearmen], { wood: 2 * 20 + HOUSE_WOOD - 10 }, { durationSeconds: 120 })
        const rate = woodRate(result)
        expect(result.steps[0].startedAt).toBe(0)
        const secondPaid = result.spent.military.findIndex((spent) => spent >= 2 * 80)
        expect(result.times[secondPaid]).toBe(Math.ceil(Math.max(15, 10 / rate) / SAMPLE_SECONDS) * SAMPLE_SECONDS)
        expect(10 / rate).toBeGreaterThan(15)
    })

    it('lets a villager order pay through a hold of food', () => {
        const result = holdRun([], { wood: 0, food: 50, houseFood: 50 })
        expect(result.spent.villagers[0]).toBe(50)
    })

    it('does not hold an explicit build house step', () => {
        const result = holdRun([{ action: 'build', building: 'house', from: 'sheep' }], { wood: HOUSE_WOOD - 10 })
        expect(result.steps[0].startedAt).toBeCloseTo(10 / woodRate(result), 6)
    })

    it('repeats a held run exactly and never banks below zero', () => {
        const steps = [barracks(onBerry), spearmen]
        const result = holdRun(steps, { wood: 190 }, { durationSeconds: 300 })
        expect(holdRun(steps, { wood: 190 }, { durationSeconds: 300 })).toEqual(result)
        noneNegative(result)
    })
})

describe('when the hold is set', () => {
    const plain: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }

    it('starts a due affordable house before the steps of the same instant', () => {
        const { done, rules } = housesDone()
        const result = run([barracks()], { game: holdGame({ wood: 199, houseSeconds: 300 }), start: plain, rules, inputs: { durationSeconds: 400 } })
        expect(done[0]).toBe(5 + 300)
        expect(result.steps[0].startedAt).not.toBe(0)
    })

    it.each([
        [200, 5],
        [199, null],
    ])('applies a house made due by an arrival from the second step offer of that instant (wood %i)', (wood, startedAt) => {
        const steps: BuildStep[] = [{ action: 'move', count: 1, from: 'sheep', to: 'stone', trigger: at(0) }, barracks({ from: 'stone' })]
        const game = holdGame({ wood, houseSeconds: 300, houseStone: 10 })
        const result = run(steps, { game, start: plain, inputs: { durationSeconds: 60 } })
        expect(result.steps[1].armedAt).toBe(0)
        expect(result.steps[1].startedAt).toBe(startedAt)
    })

    it('releases the hold at the instant the house stops being due', () => {
        const steps: BuildStep[] = [{ action: 'pause', producer: 'capital-town-center', ...onBerry }, barracks()]
        const start: BuildStart = { villagers: { sheep: 3, gold: 3, berry: 1 }, rally: 'stone' }
        const result = holdRun(steps, { wood: 199 }, {}, start)
        const ranOut = result.depletions.find((d) => d.node === 'berry')!.depletedAt
        expect(ranOut).toBeGreaterThan(0)
        expect(result.steps[1].startedAt).toBe(ranOut)
    })
})

describe('house builders and the hold', () => {
    const noWood: BuildStart = { villagers: { sheep: 3, gold: 3 }, rally: 'stone' }

    it('keeps the hold while builders are busy and starts the house the instant four gather at one node', () => {
        const { done, rules } = housesDone()
        const steps: BuildStep[] = [{ action: 'move', count: 1, from: 'sheep', to: 'gold', trigger: at(30) }, barracks()]
        const start: BuildStart = { villagers: { sheep: 3, gold: 3, wood: 1 }, rally: 'stone' }
        const result = run(steps, { game: holdGame({ wood: 160 }), start, rules, inputs: { houseBuilders: 4, durationSeconds: 400 } })
        const rate = woodRate(result)
        expect(40 / rate).toBeGreaterThan(35)
        expect(result.steps[1].startedAt).toBeCloseTo(40 / rate, 6)
        expect(done[0]).toBe(35 + 5 + 300)
    })

    it.each([
        ['fewer villagers than houseBuilders release it', 7, 0],
        ['enough villagers, all busy, keep it', 4, null],
    ])('%s', (_, houseBuilders, startedAt) => {
        const result = holdRun([spearmen], { wood: 60, houseSeconds: 1200 }, { houseBuilders }, noWood)
        expect(result.steps[0].startedAt).toBe(startedAt)
    })

    it('holds nothing while a short resource of the house has no income', () => {
        const result = holdRun([spearmen], { wood: 40 }, {}, noWood)
        expect(result.steps[0].startedAt).toBe(0)
        expect(result.spent.military[sampleIndex(result, 15)]).toBe(2 * 80)
        noneNegative(result)
    })
})

describe('the Town Center with thin wood and a council hall', () => {
    const text = [
        'start -> sheep',
        'produce villager from capital-town-center',
        'at 7 vils rally capital-town-center -> gold',
        'at 8 vils build mining-camp from gold then gold',
        'at 10 vils rally capital-town-center -> wood',
        'at 15 vils rally capital-town-center -> sheep',
        '@2:30 build council-hall with 3 from sheep then sheep',
        'build mill from sheep then sheep',
        '@4:30 produce longbowman from council-hall',
        '@5:00 build farm from sheep then farm',
        ...Array<string>(5).fill('build farm from sheep then farm'),
    ].join('\n')
    const parsed = textToBuildOrder(text, buildOrderCatalog(ENGLISH))
    if (!parsed.ok) {
        throw new Error(JSON.stringify(parsed.issues))
    }
    const result = simulateBuildOrder(parsed.order, ENGLISH, inputsFor(ENGLISH, {}))
    const window = result.times.flatMap((t, i) => (t >= 570 && t <= 900 ? [i] : []))

    it('keeps producing villagers from 9:30 to 15:00', () => {
        const villager = ENGLISH.byBaseId.get('villager')![0]
        const villagers = series(result, 'villager')
        for (const i of window) {
            expect(result.floating.food[i]).toBeGreaterThan(villager.costs.food)
            expect(villagers[i]).toBeLessThan(ENGLISH.base.villagerTarget.value)
        }
        let longest = 0
        let since = result.times[window[0]]
        for (const i of window.slice(1)) {
            if (villagers[i] !== villagers[i - 1]) {
                since = result.times[i]
            }
            longest = Math.max(longest, result.times[i] - since)
        }
        expect(longest).toBeLessThanOrEqual(villager.costs.time + SAMPLE_SECONDS)
    })

    it('repeats the run exactly and never banks below zero', () => {
        expect(simulateBuildOrder(parsed.order, ENGLISH, inputsFor(ENGLISH, {}))).toEqual(result)
        noneNegative(result)
    })
})
