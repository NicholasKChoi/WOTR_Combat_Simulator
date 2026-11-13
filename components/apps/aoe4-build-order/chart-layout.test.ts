import { describe, expect, it } from 'vitest'
import {
    CHART_LAYOUT_STORAGE_KEY,
    type ChartLayout,
    DEFAULT_CHART_LAYOUT,
    KEY_RESULTS_PANEL_ID,
    RESULT_CHART_IDS,
    moveChart,
    moveChartByKey,
    moveChartTo,
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

    it('keeps key-results in collapsed once and drops other unknown ids there', () => {
        const layout = normalizeChartLayout({ ...custom, collapsed: [KEY_RESULTS_PANEL_ID, 'bogus', rates, KEY_RESULTS_PANEL_ID] })
        expect(layout.collapsed).toEqual([KEY_RESULTS_PANEL_ID, rates])
    })

    it('drops key-results and unknown ids from order', () => {
        const layout = normalizeChartLayout({ version: 1, order: [KEY_RESULTS_PANEL_ID, floating, 'bogus'], collapsed: [] })
        expect(layout.order).toEqual([floating, units, rates, gathered])
    })

    it('reads an M8-shaped value unchanged', () => {
        const m8 = { version: 1, order: [rates, units, gathered, floating], collapsed: [gathered] }
        expect(normalizeChartLayout(m8)).toEqual(m8)
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

describe('moveChartByKey', () => {
    it('applies a second move to the layout the first one produced and reports its position', () => {
        const first = moveChartByKey(DEFAULT_CHART_LAYOUT, units, 'down')
        const second = moveChartByKey(first!.layout, units, 'down')
        expect(first!.toIndex).toBe(1)
        expect(second).toEqual({ layout: expect.objectContaining({ order: [rates, gathered, units, floating] }), toIndex: 2 })
    })

    it('returns null when the second of two moves would pass the end', () => {
        const first = moveChartByKey(DEFAULT_CHART_LAYOUT, rates, 'up')
        expect(first!.toIndex).toBe(0)
        expect(moveChartByKey(first!.layout, rates, 'up')).toBeNull()
    })

    it.each([
        ['up', units],
        ['down', floating],
    ] as const)('returns null for %s at the end', (direction, id) => {
        expect(moveChartByKey(DEFAULT_CHART_LAYOUT, id, direction)).toBeNull()
    })
})

describe('moveChartTo', () => {
    it.each([
        ['the first index', gathered, 0, [gathered, units, rates, floating]],
        ['the last index', units, 3, [rates, gathered, floating, units]],
        ['a middle index', units, 2, [rates, gathered, units, floating]],
        ['its current index', rates, 1, [units, rates, gathered, floating]],
        ['an index below 0', floating, -1, [floating, units, rates, gathered]],
        ['an index above the last', units, 9, [rates, gathered, floating, units]],
    ] as const)('moves to %s', (_label, id, toIndex, order) => {
        expect(moveChartTo(DEFAULT_CHART_LAYOUT, id, toIndex).order).toEqual(order)
    })

    it('returns an equal copy for an id not in order', () => {
        const partial: ChartLayout = { ...custom, order: [units, rates] }
        const moved = moveChartTo(partial, floating, 0)
        expect(moved).toEqual(partial)
        expect(moved.order).not.toBe(partial.order)
    })

    it('keeps collapsed, and mutates neither its input nor the default layout', () => {
        const input = structuredClone(custom)
        const moved = moveChartTo(input, units, 3)
        expect(moved.collapsed).toEqual(custom.collapsed)
        expect(moved.collapsed).not.toBe(input.collapsed)
        expect(input).toEqual(custom)
        moveChartTo(DEFAULT_CHART_LAYOUT, units, 3).order.reverse()
        expect(DEFAULT_CHART_LAYOUT.order).toEqual(RESULT_CHART_IDS)
    })
})

describe('toggleChartCollapsed', () => {
    it('toggles key-results: adds it when absent, removes it when present', () => {
        const once = toggleChartCollapsed(custom, KEY_RESULTS_PANEL_ID)
        expect(once.collapsed).toEqual([rates, floating, KEY_RESULTS_PANEL_ID])
        expect(toggleChartCollapsed(once, KEY_RESULTS_PANEL_ID)).toEqual(custom)
    })

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

    it('round-trips a layout with key-results collapsed', () => {
        const layout: ChartLayout = { ...custom, collapsed: [KEY_RESULTS_PANEL_ID, rates] }
        const storage = fakeStorage()
        writeChartLayout(storage, layout)
        expect(readChartLayout(storage)).toEqual(layout)
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
