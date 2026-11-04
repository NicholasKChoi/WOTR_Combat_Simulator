import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { CivRules } from './civ-rules'
import { effectiveGatherRate } from './gather'
import { RESOURCE_KINDS } from './model'
import type { BuildStart, BuildStep, GatherNodeId, SimulationResult } from './model'
import { simulateBuildOrder } from './simulate'
import { ENGLISH, INFINITE_NODES, at, buildOrder, editGameData, effectStateOf, inputsFor, run, sampleIndex } from './test-helpers'
import type { Parts } from './test-helpers'

const noHouses = { autoHouses: false }

function totalCostOf(baseId: string): number {
    const { costs } = ENGLISH.byBaseId.get(baseId)![0]
    return RESOURCE_KINDS.reduce((sum, kind) => sum + costs[kind], 0)
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
        expect(result.spent.villagers[last]).toBe(2 * totalCostOf('villager'))
        expect(result.spent.military[last]).toBe(totalCostOf('man-at-arms'))
        expect(result.spent.buildings[last]).toBe(totalCostOf('house'))
        expect(result.spent.research[last]).toBe(totalCostOf('wheelbarrow'))
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
        expect(later.spent.villagers[sampleIndex(later, 30)]).toBe(totalCostOf('villager'))
        expect(later.spent.villagers[sampleIndex(later, 25)]).toBe(0)
    })

    it('includes a payment made at exactly a sample time in that sample', () => {
        const paid = run([{ trigger: at(10), action: 'research', tech: 'wheelbarrow' }], { game, inputs: noHouses })
        expect(paid.spent.research[sampleIndex(paid, 5)]).toBe(0)
        expect(paid.spent.research[sampleIndex(paid, 10)]).toBe(totalCostOf('wheelbarrow'))
    })

    it('counts an auto-house under buildings', () => {
        const auto = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager' }], { game })
        expect(auto.spent.buildings[auto.times.length - 1]).toBeGreaterThan(0)
        expect(auto.spent.buildings[auto.times.length - 1] % totalCostOf('house')).toBe(0)
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

    it('stays set after later spawns', () => {
        const lowSupply = editGameData((parts) => {
            rich(parts)
            parts.snapshot.units.filter((u) => u.baseId === 'scout').forEach((u) => (u.costs.popcap = 4))
            parts.base.maxPopCap.value = 11
        })
        const result = run(produce(3), { game: lowSupply, inputs: noHouses })
        expect(result.populationCapReachedAt).toBeCloseTo(2 + villagerSeconds, 9)
        const last = result.times.length - 1
        expect(result.spawnedPopulation[last]).toBe(result.spawnedPopulation[0] + 3)
        expect(result.spawnedPopulation[last]).toBeGreaterThan(11)
    })

    it('is null when the cap is never reached', () => {
        expect(run(produce(1), { game, inputs: noHouses }).populationCapReachedAt).toBeNull()
    })

    it('is 0 when the start population is at or over the cap', () => {
        expect(run(produce(1), { game: capped(start()), inputs: noHouses }).populationCapReachedAt).toBe(0)
        expect(run(produce(1), { game: capped(1), inputs: noHouses }).populationCapReachedAt).toBe(0)
    })
})

describe('gathered', () => {
    const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

    it('grows at the sampled gather rate from 0 while rates hold and nothing is paid', () => {
        const result = run([pauseTownCenter], { inputs: { autoHouses: false, nodeAmounts: INFINITE_NODES, durationSeconds: 300 } })
        expect(result.depletions.every((d) => d.depletedAt === null)).toBe(true)
        expect(Object.values(result.spent).flat().every((value) => value === 0)).toBe(true)
        for (const kind of RESOURCE_KINDS) {
            const gathered = result.gathered[kind]
            expect(gathered[0]).toBe(0)
            for (let i = 0; i + 1 < result.times.length; i += 1) {
                const expected = (result.gatherRates[kind][i] / 60) * (result.times[i + 1] - result.times[i])
                expect(Math.abs(gathered[i + 1] - gathered[i] - expected)).toBeLessThan(1e-6)
            }
            gathered.forEach((value, i) => {
                expect(Math.abs(value - (result.floating[kind][i] - result.floating[kind][0]))).toBeLessThan(1e-6)
            })
        }
    })

    it.each(listBuilds().map((build) => [build.name, build] as const))('balances floating and spent on the prebuilt build %s', (_, build) => {
        const result = simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 600 }))
        const start = ENGLISH.civData.startingState.resources.value
        for (const kind of RESOURCE_KINDS) {
            const gathered = result.gathered[kind]
            expect(gathered).toHaveLength(result.times.length)
            expect(gathered[0]).toBe(0)
            gathered.forEach((value, i) => {
                expect(value).toBeGreaterThanOrEqual(gathered[i - 1] ?? 0)
                expect(value).toBeGreaterThanOrEqual(result.floating[kind][i] - start[kind] - 1e-6)
            })
        }
        result.times.forEach((_t, i) => {
            const gathered = sum(RESOURCE_KINDS.map((kind) => result.gathered[kind][i]))
            const banked = sum(RESOURCE_KINDS.map((kind) => result.floating[kind][i] - start[kind]))
            const paid = sum(Object.values(result.spent).map((series) => series[i]))
            expect(Math.abs(gathered - (banked + paid))).toBeLessThan(1e-6)
        })
    })
})

describe('gatherers', () => {
    const defaults = inputsFor(ENGLISH)
    const rateOf = (node: GatherNodeId): number => {
        return effectiveGatherRate(node, effectStateOf({ buildings: new Map([['capital-town-center', 1]]), coverage: defaults.influenceCoverage }), defaults)
    }

    it.each([
        ['4 sheep 2 wood', { sheep: 4, wood: 2 }, { food: 4, wood: 2, gold: 0, stone: 0 }, (4 * rateOf('sheep')) / 4],
        ['3 sheep 3 berry', { sheep: 3, berry: 3 }, { food: 6, wood: 0, gold: 0, stone: 0 }, (3 * rateOf('sheep') + 3 * rateOf('berry')) / 6],
    ])('counts the start split %s at t=0, and food rate / food gatherers is the villager-weighted node rate', (_, villagers, expected, foodRate) => {
        const result = run([], { start: { rally: 'sheep', villagers } })
        for (const kind of RESOURCE_KINDS) {
            expect(result.gatherers[kind][0]).toBe(expected[kind])
        }
        expect(result.gatherRates.food[0] / result.gatherers.food[0]).toBeCloseTo(foodRate * 60, 9)
    })

    it('leaves builders out from when they leave the node until they walk back after completion', () => {
        const start: BuildStart = { rally: 'sheep', villagers: { sheep: 2, wood: 4 } }
        const house: BuildStep = { trigger: at(30), action: 'build', building: 'house', builders: 2, from: 'wood', then: 'wood' }
        const result = run([house], { start })
        const [step] = result.steps
        const i = result.times.findIndex((t) => t >= step.startedAt!)
        const r = result.gatherRates.wood[i - 1] / result.gatherers.wood[i - 1] / 60
        expect(result.gatherers.wood[i - 1]).toBe(4)
        expect(result.gatherers.wood[i]).toBe(2)
        expect(result.gatherRates.wood[i - 1] - result.gatherRates.wood[i]).toBeCloseTo(2 * r * 60, 9)

        const back = step.completedAt! + defaults.walkSeconds
        const after = result.times.findIndex((t) => t > step.completedAt!)
        expect(result.times[after]).toBeLessThan(back)
        expect(result.gatherers.wood[after]).toBe(2)
        expect(result.gatherers.wood[result.times.findIndex((t) => t >= back)]).toBe(4)
    })

    it('drops at the same sample as the gather rate when a stocked node runs out', () => {
        const result = run([pauseTownCenter], { start: { rally: 'wood', villagers: { berry: 3, wood: 3 } }, inputs: { ...noHouses, nodeAmounts: { berry: 601 } } })
        const runOut = result.depletions.find((d) => d.node === 'berry')!.depletedAt!
        const after = result.times.findIndex((t) => t > runOut)
        expect(result.gatherers.food[after - 1]).toBe(3)
        expect(result.gatherers.food.slice(after).every((n) => n === 0)).toBe(true)
        expect(result.gatherers.wood.every((n) => n === 3)).toBe(true)
        expect(result.gatherRates.food[after - 1]).toBeGreaterThan(0)
        expect(result.gatherRates.food.slice(after).every((r) => r === 0)).toBe(true)
    })

    it.each(listBuilds().map((build) => [build.name, build] as const))('is a non-negative integer per sample, 0 exactly where the rate is 0, on the prebuilt build %s', (_, build) => {
        const result = simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 1200 }))
        for (const kind of RESOURCE_KINDS) {
            const counts = result.gatherers[kind]
            expect(counts).toHaveLength(result.times.length)
            counts.forEach((n, i) => {
                expect(Number.isInteger(n) && n >= 0).toBe(true)
                expect(n === 0).toBe(result.gatherRates[kind][i] === 0)
            })
        }
    })
})
