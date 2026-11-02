import { describe, expect, it } from 'vitest'
import type { CivRules } from './civ-rules'
import type { BuildStep, ResourceKind, SimulationResult } from './model'
import { simulateBuildOrder } from './simulate'
import { ENGLISH, at, buildOrder, editGameData, inputsFor, run, sampleIndex } from './test-helpers'
import type { Parts } from './test-helpers'

const noHouses = { autoHouses: false }
const KINDS: ResourceKind[] = ['food', 'wood', 'gold', 'stone']

function costOf(baseId: string): number {
    const { costs } = ENGLISH.byBaseId.get(baseId)![0]
    return KINDS.reduce((sum, kind) => sum + costs[kind], 0)
}

function popcapOf(baseId: string): number {
    return ENGLISH.byBaseId.get(baseId)![0].costs.popcap
}

function rich(parts: Parts): void {
    const start = parts.civData.startingState
    start.buildings.value = ['capital-town-center', 'barracks', 'mill']
    start.resources.value = { food: 5000, wood: 5000, gold: 5000, stone: 5000 }
}

const game = editGameData(rich)
const pauseTownCenter: BuildStep = { action: 'pause', producer: 'capital-town-center' }

describe('spent', () => {
    const steps: BuildStep[] = [
        { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2 },
        { action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 },
        { action: 'build', building: 'house', from: 'sheep' },
        { action: 'research', tech: 'wheelbarrow' },
    ]
    const result = run(steps, { game, inputs: noHouses })
    const last = result.times.length - 1

    it('ends at the snapshot cost of exactly the payments in each category', () => {
        expect(result.spent.villagers[last]).toBe(2 * costOf('villager'))
        expect(result.spent.military[last]).toBe(costOf('man-at-arms'))
        expect(result.spent.buildings[last]).toBe(costOf('house'))
        expect(result.spent.research[last]).toBe(costOf('wheelbarrow'))
    })

    it('has one non-decreasing value per sample and starts at 0 when nothing is paid at t=0', () => {
        const later = run([pauseTownCenter, { trigger: at(30), action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 }], { game, inputs: noHouses })
        for (const series of Object.values(later.spent)) {
            expect(series).toHaveLength(later.times.length)
            expect(series[0]).toBe(0)
            series.forEach((value, i) => {
                expect(value).toBeGreaterThanOrEqual(series[i - 1] ?? 0)
            })
        }
        expect(later.spent.villagers[sampleIndex(later, 30)]).toBe(costOf('villager'))
        expect(later.spent.villagers[sampleIndex(later, 25)]).toBe(0)
    })

    it('includes a payment made at exactly a sample time in that sample', () => {
        const paid = run([{ trigger: at(10), action: 'research', tech: 'wheelbarrow' }], { game, inputs: noHouses })
        expect(paid.spent.research[sampleIndex(paid, 5)]).toBe(0)
        expect(paid.spent.research[sampleIndex(paid, 10)]).toBe(costOf('wheelbarrow'))
    })

    it('counts an auto-house under buildings', () => {
        const auto = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager' }], { game })
        expect(auto.spent.buildings[auto.times.length - 1]).toBeGreaterThan(0)
        expect(auto.spent.buildings[auto.times.length - 1] % costOf('house')).toBe(0)
    })
})

describe('spawnedPopulation', () => {
    const villagerSeconds = ENGLISH.byBaseId.get('villager')![0].costs.time
    const maaSeconds = ENGLISH.byBaseId.get('man-at-arms')![0].costs.time
    const startPopulation = (): number => {
        const start = ENGLISH.civData.startingState
        const villagers = Object.values(start.villagers.value).reduce((sum, n) => sum + n, 0)
        const units = Object.entries(start.units.value).reduce((sum, [baseId, n]) => sum + n * popcapOf(baseId), 0)
        return villagers + units
    }

    it('starts at the start villagers plus the start units popcap and never decreases', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 3 }], { game, inputs: noHouses })
        expect(result.spawnedPopulation[0]).toBe(startPopulation())
        expect(result.spawnedPopulation).toHaveLength(result.times.length)
        result.spawnedPopulation.forEach((value, i) => {
            expect(value).toBeGreaterThanOrEqual(result.spawnedPopulation[i - 1] ?? 0)
        })
    })

    it('counts a start unit by its snapshot popcap', () => {
        const heavy = editGameData((parts) => {
            rich(parts)
            const [baseId] = Object.keys(parts.civData.startingState.units.value)
            parts.snapshot.units.filter((u) => u.baseId === baseId).forEach((u) => (u.costs.popcap = 4))
        })
        const start = heavy.civData.startingState
        const [baseId, n] = Object.entries(start.units.value)[0]
        const villagers = Object.values(start.villagers.value).reduce((sum, v) => sum + v, 0)
        expect(run([], { game: heavy }).spawnedPopulation[0]).toBe(villagers + n * heavy.byBaseId.get(baseId)![0].costs.popcap)
    })

    it('throws naming a start-unit baseId the snapshot lacks', () => {
        const rules: CivRules = {
            startingState: (start) => ({ ...start, units: { ...start.units, value: { ...start.units.value, 'no-such-unit': 1 } } }),
        }
        expect(() => simulateBuildOrder(buildOrder([]), ENGLISH, inputsFor(ENGLISH), rules)).toThrow('"no-such-unit" is not a unit baseId in the snapshot')
    })

    it('leaves a paid villager out until it spawns', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 }], { game, inputs: noHouses })
        const base = startPopulation()
        const spawn = Math.ceil(villagerSeconds / 5) * 5
        expect(result.spawnedPopulation[sampleIndex(result, spawn - 5)]).toBe(base)
        expect(result.spawnedPopulation[sampleIndex(result, spawn)]).toBe(base + 1)
    })

    it('leaves a paid non-villager unit out until it spawns', () => {
        const result = run([{ action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 }], { game, inputs: noHouses })
        const base = startPopulation()
        const spawn = Math.ceil(maaSeconds / 5) * 5
        expect(result.spawnedPopulation[sampleIndex(result, spawn - 5)]).toBe(base)
        expect(result.spawnedPopulation[sampleIndex(result, spawn)]).toBe(base + popcapOf('man-at-arms'))
    })

    it('raises by the entry popcap for a multi-popcap unit', () => {
        const heavy = editGameData((parts) => {
            rich(parts)
            parts.snapshot.units.filter((u) => u.baseId === 'man-at-arms').forEach((u) => (u.costs.popcap = 3))
        })
        const result = run([{ action: 'produce', producer: 'barracks', unit: 'man-at-arms', count: 1 }], { game: heavy, inputs: noHouses })
        expect(result.spawnedPopulation[result.times.length - 1] - result.spawnedPopulation[0]).toBe(3)
    })
})

describe('populationCapReachedAt', () => {
    const villagerSeconds = ENGLISH.byBaseId.get('villager')![0].costs.time
    const capped = (cap: number) =>
        editGameData((parts) => {
            rich(parts)
            parts.base.maxPopCap.value = cap
        })
    const produce = (count: number): BuildStep[] => [pauseTownCenter, { trigger: at(2), action: 'produce', producer: 'capital-town-center', unit: 'villager', count }]

    function start(): number {
        return run([], { game }).spawnedPopulation[0]
    }

    it('is the instant of the spawn that reached the cap, not a sample time', () => {
        const cap = start() + 1
        const result: SimulationResult = run(produce(3), { game: capped(cap), inputs: noHouses })
        expect(result.populationCapReachedAt).toBeCloseTo(2 + villagerSeconds, 9)
        expect(result.populationCapReachedAt! % 5).not.toBe(0)
        expect(result.spawnedPopulation[sampleIndex(result, 20)]).toBeLessThan(cap)
        expect(result.spawnedPopulation[sampleIndex(result, 25)]).toBe(cap)
    })

    it('is null when the cap is never reached', () => {
        expect(run(produce(1), { game, inputs: noHouses }).populationCapReachedAt).toBeNull()
    })

    it('is 0 when the start population is at or over the cap', () => {
        expect(run(produce(1), { game: capped(start()), inputs: noHouses }).populationCapReachedAt).toBe(0)
        expect(run(produce(1), { game: capped(1), inputs: noHouses }).populationCapReachedAt).toBe(0)
    })
})
