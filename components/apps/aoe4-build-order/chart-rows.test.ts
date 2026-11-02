import { describe, expect, it } from 'vitest'
import { PALETTE, seriesColor, toChartRows, toggleHidden } from './chart-rows'

describe('toChartRows', () => {
    it('makes one row per time with a value per series', () => {
        const rows = toChartRows([0, 5, 10], [
            { key: 'a', name: 'A', values: [1, 2, 3] },
            { key: 'b', name: 'B', values: [4, 5, 6] },
        ])
        expect(rows).toEqual([{ t: 0, a: 1, b: 4 }, { t: 5, a: 2, b: 5 }, { t: 10, a: 3, b: 6 }])
    })

    it('returns rows with only t when there are no series', () => {
        expect(toChartRows([0, 5], [])).toEqual([{ t: 0 }, { t: 5 }])
    })

    it('returns no rows for empty times', () => {
        expect(toChartRows([], [{ key: 'a', name: 'A', values: [] }])).toEqual([])
    })
})

describe('seriesColor', () => {
    it('has at least 15 distinct palette colors', () => {
        expect(PALETTE.length).toBeGreaterThanOrEqual(15)
        expect(new Set(PALETTE).size).toBe(PALETTE.length)
    })

    it('gives distinct colors within one palette cycle and wraps after it', () => {
        const colors = PALETTE.map((_, i) => seriesColor(i))
        expect(new Set(colors).size).toBe(PALETTE.length)
        expect(seriesColor(PALETTE.length)).toBe(seriesColor(0))
        expect(seriesColor(PALETTE.length + 1)).toBe(seriesColor(1))
    })
})

describe('toggleHidden', () => {
    it.each([
        [['a'], 'b', ['a', 'b']],
        [['a', 'b'], 'a', ['b']],
        [[], 'a', ['a']],
    ])('toggles %j with %s to %j without mutating the input', (start, key, expected) => {
        const input = new Set<string>(start)
        expect(toggleHidden(input, key)).toEqual(new Set(expected))
        expect(input).toEqual(new Set(start))
    })
})
