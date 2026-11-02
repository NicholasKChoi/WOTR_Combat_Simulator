import { describe, expect, it } from 'vitest'
import { PALETTE, pinnedKey, seriesColor, toChartRows, toggleHidden } from './chart-rows'

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

describe('toChartRows with a pinned run', () => {
    const current = [{ key: 'a', name: 'A', values: [1, 2, 3] }]

    it('uses the union of times and leaves absent keys out of rows outside a series own times', () => {
        const rows = toChartRows([0, 5, 10], current, { times: [0, 5, 10, 15], series: [{ key: 'a', name: 'A', values: [7, 8, 9, 10] }] })
        expect(rows).toEqual([
            { t: 0, a: 1, 'pinned:a': 7 },
            { t: 5, a: 2, 'pinned:a': 8 },
            { t: 10, a: 3, 'pinned:a': 9 },
            { t: 15, 'pinned:a': 10 },
        ])
        expect('a' in rows[3]).toBe(false)
    })

    it('leaves pinned keys out of times the pinned run lacks', () => {
        const rows = toChartRows([0, 5, 10], current, { times: [0, 10], series: [{ key: 'a', name: 'A', values: [7, 9] }] })
        expect(rows.map((r) => r.t)).toEqual([0, 5, 10])
        expect('pinned:a' in rows[1]).toBe(false)
        expect(rows[2]['pinned:a']).toBe(9)
    })

    it('sorts a union whose pinned times start earlier and drops duplicates', () => {
        const rows = toChartRows([5, 10], current.map((s) => ({ ...s, values: [1, 2] })), { times: [0, 5], series: [] })
        expect(rows.map((r) => r.t)).toEqual([0, 5, 10])
    })

    it('prefixes the pinned key', () => {
        expect(pinnedKey('food')).toBe('pinned:food')
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
