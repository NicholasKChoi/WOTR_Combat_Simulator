import { describe, expect, it } from 'vitest'
import type { ChartMarkerKind } from '../../../lib/aoe4-build-order/model'
import { type ChartRow, PALETTE, formatChartValue, isLineHidden, legendItems, lineOffsets, pinnedKey, seriesColor, toChartRows, toOffsetChartRows, toggleHidden, trueCount, valueAt, wholeNumberAxis } from './chart-rows'

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

    it.each<[ChartMarkerKind[], ChartMarkerKind, ChartMarkerKind[]]>([
        [['economy'], 'age-up', ['economy', 'age-up']],
        [['economy', 'age-up'], 'economy', ['age-up']],
    ])('toggles the marker kind set %j with %s to %j without mutating the input', (start, key, expected) => {
        const input = new Set<ChartMarkerKind>(start)
        expect(toggleHidden(input, key)).toEqual(new Set(expected))
        expect(input).toEqual(new Set(start))
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
    it('hides a series by its plain key, which covers both its current and pinned lines', () => {
        const hidden = new Set(['a'])
        expect(isLineHidden(hidden, 'a')).toBe(true)
        expect(isLineHidden(hidden, 'b')).toBe(false)
    })

    it('hides the pinned line of a pinned-only series by its series key', () => {
        expect(isLineHidden(new Set(['z']), 'z')).toBe(true)
    })

    it('hides a series whose own key starts with the pinned prefix only when that exact key is hidden', () => {
        expect(isLineHidden(new Set(['pinned:x']), 'pinned:x')).toBe(true)
        expect(isLineHidden(new Set(['x']), 'pinned:x')).toBe(false)
    })

    it('does not treat a pinned key in the hidden set as hiding anything', () => {
        expect(isLineHidden(new Set([pinnedKey('a')]), 'a')).toBe(false)
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

describe('lineOffsets', () => {
    it.each([2, 3, 17])('gives %i slots distinct offsets in slot order, never negative and below half a building', (n) => {
        const keys = Array.from({ length: n }, (_, i) => `k${i}`)
        const offsets = keys.map((k) => lineOffsets(keys)[k])
        expect(new Set(offsets).size).toBe(n)
        for (const [i, offset] of offsets.entries()) {
            expect(offset).toBeGreaterThanOrEqual(0)
            expect(offset).toBeLessThan(0.5)
            if (i > 0) expect(offset).toBeGreaterThan(offsets[i - 1])
        }
    })
})

describe('toOffsetChartRows', () => {
    const series = [
        { key: 'a', name: 'A', values: [1, 0, 2] },
        { key: 'b', name: 'B', values: [1, 0, 1] },
        { key: 'c', name: 'C', values: [1, 0, 1] },
    ]
    const times = [0, 5, 10]
    const none = new Set<string>()

    it('draws equal counts at distinct values, each within half a building above its true count', () => {
        const rows = toOffsetChartRows(times, series, undefined, none)
        const raw = toChartRows(times, series)
        expect(raw[0].a).toBe(raw[0].b)
        expect(new Set([rows[0].a, rows[0].b, rows[0].c]).size).toBe(3)
        rows.forEach((row, i) => {
            for (const s of series) {
                expect(row[s.key]).toBeGreaterThanOrEqual(s.values[i])
                expect(row[s.key]).toBeLessThan(s.values[i] + 0.5)
            }
        })
    })

    it('keeps a building at the same offset at every time and a count of 0 at or above 0', () => {
        const rows = toOffsetChartRows(times, series, undefined, none)
        expect(rows[1].c).toBeGreaterThan(0)
        for (const s of series) {
            const offsets = rows.map((row, i) => row[s.key] - s.values[i])
            for (const offset of offsets) expect(offset).toBeCloseTo(offsets[0])
        }
    })

    it('gives a hidden building no slot, so the others sit where a chart without it draws them', () => {
        const without = toOffsetChartRows(times, series.slice(1), undefined, none)
        const hiddenRows = toOffsetChartRows(times, series, undefined, new Set(['a']))
        expect(hiddenRows.map((r) => [r.b, r.c])).toEqual(without.map((r) => [r.b, r.c]))
    })

    it('draws a pinned line at the offset of the current line with its key and gives a pinned-only key its own slot', () => {
        const pinned = { times, series: [{ key: 'b', name: 'B', values: [1, 0, 1] }, { key: 'z', name: 'Z', values: [1, 0, 1] }] }
        const rows = toOffsetChartRows(times, series, pinned, none)
        expect(rows[0]['pinned:b']).toBe(rows[0].b)
        const all = [rows[0].a, rows[0].b, rows[0].c, rows[0]['pinned:z']]
        expect(new Set(all).size).toBe(4)
        expect(rows[0]['pinned:z']).toBeGreaterThan(rows[0].c)
    })

    it.each([
        ['the current run ends before a longer pinned run', times],
        ['the current series have fewer values than times', [...times, 15]],
    ])('keeps a missing current value undefined, not NaN, when %s', (_case, currentTimes) => {
        const pinned = { times: [...times, 15], series: [{ key: 'a', name: 'A', values: [1, 0, 2, 3] }] }
        const rows = toOffsetChartRows(currentTimes, series, pinned, none)
        expect(rows[3].t).toBe(15)
        expect(rows[3]['pinned:a']).toBe(3)
        expect(rows[3].b).toBeUndefined()
    })
})

describe('wholeNumberAxis', () => {
    const none = new Set<string>()
    const rowsWith = (a: number, b: number): ChartRow[] => [{ t: 0, a: 0, b: 0 }, { t: 10, a, b }]

    it.each([
        [1.225, 0.5, [0, 2], [0, 1, 2]],
        [0.3, 0, [0, 1], [0, 1]],
        [0, 0, [0, 1], [0, 1]],
        [3, 2.4, [0, 3], [0, 1, 2, 3]],
        [13.2, 1, [0, 14], [0, 3, 6, 9, 12]],
    ])('tops the axis at the smallest whole number at or above %s with whole ticks from 0', (a, b, domain, ticks) => {
        expect(wholeNumberAxis(rowsWith(a, b), none)).toEqual({ domain, ticks })
    })

    it('ignores hidden buildings and their pinned lines', () => {
        const rows: ChartRow[] = [{ t: 0, a: 7.2, b: 1.1, 'pinned:a': 9.2 }]
        expect(wholeNumberAxis(rows, none).domain).toEqual([0, 10])
        expect(wholeNumberAxis(rows, new Set(['a'])).domain).toEqual([0, 2])
    })
})

describe('trueCount', () => {
    it('returns the integer count for a row drawn with an offset, not the drawn value', () => {
        const row = toOffsetChartRows([0], [{ key: 'a', name: 'A', values: [0] }, { key: 'b', name: 'B', values: [2] }], undefined, new Set())[0]
        expect(row.b).not.toBe(2)
        expect(trueCount(row, 'b')).toBe(2)
        expect(trueCount(row, 'a')).toBe(0)
    })
})

describe('valueAt', () => {
    const times = [0, 10, 20]
    const values = [0, 5, 8]

    it.each([
        [0, 0],
        [10, 5],
        [4, 2],
        [12.5, 5.75],
        [20, 8],
        [25, 8],
    ])('at %s gives %s', (at, expected) => {
        expect(valueAt(times, values, at)).toBeCloseTo(expected, 10)
    })
})
