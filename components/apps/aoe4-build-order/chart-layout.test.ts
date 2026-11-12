import { describe, expect, it } from 'vitest'
import {
    CHART_LAYOUT_STORAGE_KEY,
    type ChartLayout,
    DEFAULT_CHART_LAYOUT,
    RESULT_CHART_IDS,
    moveChart,
    normalizeChartLayout,
    readChartLayout,
    toggleChartCollapsed,
    writeChartLayout,
} from './chart-layout'
import { fakeStorage, throwingStorage } from './storage-test-helpers'

const [units, rates, gathered, floating] = RESULT_CHART_IDS

const custom: ChartLayout = { version: 1, order: [floating, units, rates, gathered], collapsed: [rates, floating] }

describe('normalizeChartLayout', () => {
    it('round-trips a valid layout unchanged', () => {
        expect(normalizeChartLayout(custom)).toEqual(custom)
    })

    it.each([
        ['a non-object', 5],
        ['null', null],
        ['a wrong version', { ...custom, version: 2 }],
        ['a non-array order', { ...custom, order: 'x' }],
        ['a non-array collapsed', { ...custom, collapsed: 'x' }],
    ])('gives the default for %s', (_label, value) => {
        expect(normalizeChartLayout(value)).toEqual(DEFAULT_CHART_LAYOUT)
    })

    it('drops unknown and duplicate ids from order and appends missing ids in default order', () => {
        const layout = normalizeChartLayout({ version: 1, order: [floating, 'bogus', floating, rates], collapsed: [] })
        expect(layout.order).toEqual([floating, rates, units, gathered])
    })

    it('keeps each valid collapsed id once', () => {
        const layout = normalizeChartLayout({ ...custom, collapsed: [rates, 'bogus', rates, units] })
        expect(layout.collapsed).toEqual([rates, units])
    })

    it('does not hand out the default layout arrays', () => {
        normalizeChartLayout(null).order.reverse()
        expect(DEFAULT_CHART_LAYOUT.order).toEqual(RESULT_CHART_IDS)
    })
})

describe('moveChart', () => {
    it.each([
        ['up', rates, [rates, units, gathered, floating]],
        ['down', units, [rates, units, gathered, floating]],
        ['down', gathered, [units, rates, floating, gathered]],
        ['up', floating, [units, rates, floating, gathered]],
    ] as const)('swaps %s with the neighbour', (direction, id, order) => {
        expect(moveChart(DEFAULT_CHART_LAYOUT, id, direction).order).toEqual(order)
    })

    it.each([
        ['up', units],
        ['down', floating],
    ] as const)('returns an equal layout for %s at the end', (direction, id) => {
        expect(moveChart(DEFAULT_CHART_LAYOUT, id, direction)).toEqual(DEFAULT_CHART_LAYOUT)
    })

    it('keeps collapsed and does not mutate its input', () => {
        const input = structuredClone(custom)
        const moved = moveChart(input, units, 'up')
        expect(moved.collapsed).toEqual(custom.collapsed)
        expect(input).toEqual(custom)
    })
})

describe('toggleChartCollapsed', () => {
    it('adds an absent id and removes a present one', () => {
        const once = toggleChartCollapsed(DEFAULT_CHART_LAYOUT, rates)
        expect(once.collapsed).toEqual([rates])
        expect(toggleChartCollapsed(once, rates).collapsed).toEqual([])
    })

    it('never holds an id twice after repeated toggles', () => {
        let layout: ChartLayout = DEFAULT_CHART_LAYOUT
        for (const id of [rates, units, rates, rates]) layout = toggleChartCollapsed(layout, id)
        expect(layout.collapsed).toEqual([units, rates])
    })

    it('does not mutate its input', () => {
        const input = structuredClone(custom)
        toggleChartCollapsed(input, units)
        expect(input).toEqual(custom)
    })
})

describe('chart layout storage', () => {
    it('round-trips a non-default layout and stores exactly version, order and collapsed', () => {
        const storage = fakeStorage()
        writeChartLayout(storage, custom)
        expect(Object.keys(JSON.parse(storage.getItem(CHART_LAYOUT_STORAGE_KEY)!)).sort()).toEqual(['collapsed', 'order', 'version'])
        expect(readChartLayout(storage)).toEqual(custom)
    })

    it('reads the default when the key is absent', () => {
        expect(readChartLayout(fakeStorage())).toEqual(DEFAULT_CHART_LAYOUT)
    })

    it('normalises a stored layout that misses an id', () => {
        const raw = JSON.stringify({ version: 1, order: [rates, units, gathered], collapsed: [] })
        expect(readChartLayout(fakeStorage({ [CHART_LAYOUT_STORAGE_KEY]: raw })).order).toEqual([rates, units, gathered, floating])
    })

    it.each([
        ['a null storage', null],
        ['a getItem that throws', throwingStorage],
        ['a non-JSON value', fakeStorage({ [CHART_LAYOUT_STORAGE_KEY]: '{nope' })],
    ])('reads the default for %s', (_label, storage) => {
        expect(readChartLayout(storage)).toEqual(DEFAULT_CHART_LAYOUT)
    })

    it.each([
        ['a null storage', null],
        ['a setItem that throws', throwingStorage],
    ])('does not throw on write to %s', (_label, storage) => {
        expect(() => writeChartLayout(storage, custom)).not.toThrow()
    })
})
