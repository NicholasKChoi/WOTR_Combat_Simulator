import { describe, expect, it } from 'vitest'
import { MARKER_COLORS, MARKER_KIND_LABELS, PALETTE, formatChartValue, isLineHidden, legendItems, markerLabel, pinnedKey, seriesColor, toChartRows, toggleHidden } from './chart-rows'

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

const luminance = (hex: string): number => {
    const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
}

describe('marker styling', () => {
    it('pins the color and legend name of every kind', () => {
        expect(MARKER_COLORS).toEqual({
            'age-up': '#b8860b',
            economy: '#008080',
            'unit-tier': '#c43bb0',
            blacksmith: '#5f7d8c',
            other: '#6b6bd6',
        })
        expect(MARKER_KIND_LABELS).toEqual({
            'age-up': 'Age-up',
            economy: 'Economy',
            'unit-tier': 'Unit tier',
            blacksmith: 'Blacksmith',
            other: 'Other',
        })
    })

    it('keeps every marker color readable on white and on dark text and apart from the series palette', () => {
        for (const color of Object.values(MARKER_COLORS)) {
            expect(contrast(color, '#ffffff')).toBeGreaterThanOrEqual(3)
            expect(contrast(color, '#212529')).toBeGreaterThanOrEqual(3)
            expect(PALETTE).not.toContain(color)
        }
    })

    it('labels a marker with its name and m:ss time', () => {
        expect(markerLabel({ kind: 'age-up', label: 'Castle', at: 804 })).toBe('Castle 13:24')
        expect(markerLabel({ kind: 'unit-tier', label: 'veteran-longbowmen', at: 870 })).toBe('veteran-longbowmen 14:30')
    })
})

describe('legendItems', () => {
    const s = (key: string) => ({ key, name: key.toUpperCase(), values: [] })
    const pinned = { times: [], series: [s('c'), s('b'), s('z')] }

    it('lists each key once: current keys in order, then pinned-only keys in pinned order', () => {
        const items = legendItems([s('a'), s('b'), s('c')], pinned)
        expect(items.map((i) => [i.key, i.name, i.lines])).toEqual([
            ['a', 'A', 'current'],
            ['b', 'B', 'both'],
            ['c', 'C', 'both'],
            ['z', 'Z', 'pinned'],
        ])
    })

    it('lists every series as current without a pinned run', () => {
        expect(legendItems([s('a'), s('b')]).map((i) => i.lines)).toEqual(['current', 'current'])
    })

    it('colours current and both items by index and a pinned-only item after the current series by pinned index', () => {
        const items = legendItems([s('a'), s('b'), s('c')], pinned)
        expect(items.map((i) => i.color)).toEqual([seriesColor(0), seriesColor(1), seriesColor(2), seriesColor(3 + 2)])
        expect(items[3].color).not.toBe(seriesColor(0))
    })
})

describe('isLineHidden', () => {
    it('hides a series line and its pinned line together', () => {
        const hidden = new Set(['a'])
        expect([isLineHidden(hidden, 'a'), isLineHidden(hidden, pinnedKey('a'))]).toEqual([true, true])
        expect([isLineHidden(hidden, 'b'), isLineHidden(hidden, pinnedKey('b'))]).toEqual([false, false])
    })

    it('hides the pinned line of a pinned-only series by its series key', () => {
        expect(isLineHidden(new Set(['z']), pinnedKey('z'))).toBe(true)
    })

    it('does not treat a pinned key in the hidden set as hiding anything', () => {
        expect(isLineHidden(new Set([pinnedKey('a')]), pinnedKey('a'))).toBe(false)
    })
})

describe('formatChartValue', () => {
    it.each([
        [92.630712227254, '92.6'],
        [40, '40'],
        [0.04, '0'],
        [-0.04, '0'],
        [1234.56, '1234.6'],
        [null, null],
        [undefined, undefined],
        ['n/a', 'n/a'],
    ])('formats %s as %s', (value, expected) => {
        expect(formatChartValue(value)).toBe(expected)
    })
})
