import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { toChartRows } from './chart-rows'
import { buildingSeries, gatherRatesSeries, resourceSeries, unitSeries, unitsProducedSeries } from './result-series'

function result(): SimulationResult {
    return {
        civ: 'english',
        durationSeconds: 10,
        sampleSeconds: 5,
        times: [0, 5, 10],
        unitsProduced: [
            { unitId: 'spearman-2', baseId: 'spearman', name: 'Spearman', tier: 2, counts: [0, 1, 2] },
            { unitId: 'spearman-3', baseId: 'spearman', name: 'Spearman', tier: 3, counts: [0, 0, 4] },
        ],
        productionBuildings: [{ baseId: 'barracks', name: 'Barracks', counts: [0, 1, 1] }],
        gatherRates: { food: [1, 2, 3], wood: [4, 5, 6], gold: [7, 8, 9], stone: [10, 11, 12] },
        gatherers: { food: [1, 1, 1], wood: [2, 2, 2], gold: [0, 1, 0], stone: [0, 0, 0] },
        floating: { stone: [0, 0, 1], gold: [0, 2, 0], wood: [3, 0, 0], food: [5, 6, 7] },
        gathered: { food: [0, 1, 2], wood: [0, 1, 2], gold: [0, 1, 2], stone: [0, 1, 2] },
        spent: { villagers: [0, 0, 0], military: [0, 0, 0], buildings: [0, 0, 0], research: [0, 0, 0] },
        spawnedPopulation: [0, 0, 0],
        populationCapReachedAt: null,
        steps: [],
        ages: [{ age: 1, reachedAt: 0 }],
        notes: [],
        depletions: [],
        warnings: [],
        markers: [],
    }
}

describe('unitSeries', () => {
    it('keys each unit entry by unitId and names it with its tier, in unitsProduced order', () => {
        const series = unitSeries(result())
        expect(series.map((s) => s.key)).toEqual(['spearman-2', 'spearman-3'])
        expect(series.map((s) => s.name)).toEqual(['Spearman (tier 2)', 'Spearman (tier 3)'])
    })

    it('uses the counts as values, aligned with times', () => {
        const input = result()
        const rows = toChartRows(input.times, unitSeries(input))
        expect(rows).toEqual([
            { t: 0, 'spearman-2': 0, 'spearman-3': 0 },
            { t: 5, 'spearman-2': 1, 'spearman-3': 0 },
            { t: 10, 'spearman-2': 2, 'spearman-3': 4 },
        ])
    })

    it('returns no series when no unit was produced', () => {
        expect(unitSeries({ ...result(), unitsProduced: [] })).toEqual([])
    })

    it('does not mutate the result', () => {
        const input = result()
        const before = structuredClone(input)
        unitSeries(input)
        expect(input).toEqual(before)
    })
})

describe('resourceSeries', () => {
    it('gives food, wood, gold, stone in that order whatever the key order of the input', () => {
        const series = resourceSeries(result().floating)
        expect(series.map((s) => s.key)).toEqual(['food', 'wood', 'gold', 'stone'])
        expect(series.map((s) => s.name)).toEqual(['Food', 'Wood', 'Gold', 'Stone'])
    })

    it('uses each resource array as its values', () => {
        const input = result()
        expect(resourceSeries(input.gatherRates).map((s) => s.values)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]])
        expect(resourceSeries(input.floating).map((s) => s.values)).toEqual([[5, 6, 7], [3, 0, 0], [0, 2, 0], [0, 0, 1]])
    })

    it('does not mutate the input', () => {
        const input = result().gatherRates
        const before = structuredClone(input)
        resourceSeries(input)
        expect(input).toEqual(before)
    })
})

describe('buildingSeries', () => {
    it('maps baseId to key, name and counts to values, in the result order', () => {
        const input = {
            ...result(),
            productionBuildings: [
                { baseId: 'town-center', name: 'Town Center', counts: [1, 1, 2] },
                { baseId: 'barracks', name: 'Barracks', counts: [0, 1, 1] },
            ],
        }
        expect(buildingSeries(input)).toEqual([
            { key: 'town-center', name: 'Town Center', values: [1, 1, 2] },
            { key: 'barracks', name: 'Barracks', values: [0, 1, 1] },
        ])
    })

    it('returns no series for a run without production buildings', () => {
        expect(buildingSeries({ ...result(), productionBuildings: [] })).toEqual([])
    })
})

describe('gatherRatesSeries', () => {
    const input = result()

    it('plots gatherRates in the rate view and gatherers in the villagers view, per resource', () => {
        expect(input.gatherers).not.toEqual(input.gatherRates)
        expect(gatherRatesSeries('rate', input)).toEqual(resourceSeries(input.gatherRates))
        expect(gatherRatesSeries('villagers', input)).toEqual(resourceSeries(input.gatherers))
        expect(gatherRatesSeries('villagers', input).map((s) => s.values)).toEqual([[1, 1, 1], [2, 2, 2], [0, 1, 0], [0, 0, 0]])
    })

    it('reads only the run it is given, so a pinned run keeps its own gatherers', () => {
        const pinned: SimulationResult = { ...result(), gatherers: { ...input.gatherers, food: [4, 0, 3] } }
        const rows = toChartRows(input.times, gatherRatesSeries('villagers', input), {
            times: pinned.times,
            series: gatherRatesSeries('villagers', pinned),
        })
        expect(rows.map((r) => r.food)).toEqual([1, 1, 1])
        expect(rows.map((r) => r['pinned:food'])).toEqual([4, 0, 3])
    })
})

describe('unitsProducedSeries', () => {
    const input = result()

    it('plots unitSeries in the units view and buildingSeries in the buildings view', () => {
        expect(input.productionBuildings.length).toBeGreaterThan(0)
        expect(unitsProducedSeries('units', input)).toEqual(unitSeries(input))
        expect(unitsProducedSeries('buildings', input)).toEqual(buildingSeries(input))
        expect(unitsProducedSeries('buildings', input).map((s) => s.key)).toEqual(['barracks'])
    })

    it('reads only the run it is given', () => {
        const other: SimulationResult = { ...result(), productionBuildings: [{ baseId: 'stable', name: 'Stable', counts: [0, 0, 1] }] }
        expect(unitsProducedSeries('buildings', other).map((s) => s.key)).toEqual(['stable'])
    })
})
