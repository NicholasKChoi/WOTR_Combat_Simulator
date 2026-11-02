import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { toChartRows } from './chart-rows'
import { resourceSeries, unitSeries } from './result-series'

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
        gatherRates: { food: [1, 2, 3], wood: [4, 5, 6], gold: [7, 8, 9], stone: [10, 11, 12] },
        floating: { stone: [0, 0, 1], gold: [0, 2, 0], wood: [3, 0, 0], food: [5, 6, 7] },
        spent: { villagers: [0, 0, 0], military: [0, 0, 0], buildings: [0, 0, 0], research: [0, 0, 0] },
        spawnedPopulation: [0, 0, 0],
        populationCapReachedAt: null,
        steps: [],
        ages: [{ age: 1, reachedAt: 0 }],
        notes: [],
        depletions: [],
        warnings: [],
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
