import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ChartMarker } from '../../../lib/aoe4-build-order/model'
import { SeriesChart, bandIn } from './line-chart'

const render = (series: Parameters<typeof SeriesChart>[0]['series'], markers?: ChartMarker[], pinnedMarkers?: ChartMarker[]) =>
    renderToString(
        createElement(SeriesChart, { testId: 'chart-x', title: 'Units produced', yLabel: 'Units', times: [0, 5], series, markers, pinnedMarkers }),
    )

describe('SeriesChart server render', () => {
    it('renders the wrapper and title with series', () => {
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }])
        expect(html).toContain('data-testid="chart-x"')
        expect(html).toContain('Units produced')
    })

    it('renders the wrapper and title without series', () => {
        const html = render([])
        expect(html).toContain('data-testid="chart-x"')
        expect(html).toContain('Units produced')
    })
})

describe('chart controls', () => {
    const controls = { collapsed: false, dragging: false, reorderHelpId: 'help', onToggle: () => {}, onMoveKey: () => {}, onHandlePointerDown: () => {} }
    const series = [{ key: 'a', name: 'A', values: [1, 2] }]
    const renderWith = (layout?: Partial<typeof controls>) =>
        renderToString(
            createElement(SeriesChart, {
                testId: 'chart-x',
                title: 'Gather rates',
                yLabel: 'Units',
                times: [0, 5],
                series,
                headerControls: createElement('span', { 'data-testid': 'extra-control' }),
                layout: layout && { ...controls, ...layout },
            }),
        )
    const button = (html: string, id: string) => html.match(new RegExp(`<button[^>]*data-testid="${id}"[^>]*>`))?.[0] ?? ''

    it('renders a tbody root with a header row, then one body row whose single cell spans four columns', () => {
        const html = renderWith({})
        expect(html).toMatch(/^<tbody[^>]*data-testid="chart-x"/)
        expect(html).toMatch(/<\/tbody>$/)
        const rows = [...html.matchAll(/<tr[^>]*data-testid="([^"]+)"[^>]*>/g)].map((m) => m[1])
        expect(rows).toEqual(['chart-header-row', 'chart-body-row'])
        const bodyRow = html.slice(html.indexOf('data-testid="chart-body-row"'))
        expect([...bodyRow.matchAll(/<td[^>]*>/g)].map((m) => m[0])).toEqual([expect.stringContaining('colSpan="4"')])
        expect(html).toMatch(/<th scope="rowgroup"[^>]*><h3[^>]*>Gather rates<\/h3><\/th>/)
    })

    it('has no handle and no caret without layout', () => {
        const html = renderWith()
        for (const id of ['chart-drag-handle', 'chart-collapse']) expect(html).not.toContain(id)
    })

    it('keeps an empty hidden body whose id is the aria-controls target when collapsed, and the header controls visible', () => {
        const html = renderWith({ collapsed: true })
        const controlsId = button(html, 'chart-collapse').match(/aria-controls="([^"]+)"/)?.[1]
        expect(button(html, 'chart-collapse')).toContain('aria-expanded="false"')
        expect(html).toContain('data-collapsed="true"')
        expect(html).toMatch(/<tr[^>]*data-testid="chart-body-row"[^>]*hidden/)
        expect(html).toMatch(new RegExp(`<div(?=[^>]*data-testid="chart-body")(?=[^>]*id="${controlsId}")(?=[^>]*hidden)[^>]*></div>`))
        expect(html).not.toContain('chart-series-legend')
        expect(html).toContain('extra-control')
    })

    it('shows the legend in a visible body when expanded', () => {
        const html = renderWith({})
        const controlsId = button(html, 'chart-collapse').match(/aria-controls="([^"]+)"/)?.[1]
        expect(button(html, 'chart-collapse')).toContain('aria-expanded="true"')
        expect(html).toContain('data-collapsed="false"')
        expect(html).toMatch(/<tr(?![^>]*hidden)[^>]*data-testid="chart-body-row"/)
        expect(html).toMatch(new RegExp(`<div(?=[^>]*data-testid="chart-body")(?=[^>]*id="${controlsId}")(?![^>]*hidden)[^>]*>`))
        expect(html).toContain('chart-series-legend')
        expect(html).toContain('extra-control')
    })

    it('marks the section dragging only while dragged', () => {
        expect(renderWith({ dragging: true })).toContain('data-dragging="true"')
        expect(renderWith({})).not.toContain('data-dragging')
    })
})

describe('pinned legend with hidden marker kinds', () => {
    const feudal: ChartMarker = { kind: 'age-up', label: 'Feudal', at: 2 }
    const wheelbarrow: ChartMarker = { kind: 'economy', label: 'Wheelbarrow', at: 3 }
    const renderView = (markers: ChartMarker[], hidden: ChartMarker['kind'][]) =>
        renderToString(
            createElement(SeriesChart, {
                testId: 'chart-x',
                title: 'Units produced',
                yLabel: 'Units',
                times: [0, 5],
                series: [],
                markers,
                pinnedMarkers: [feudal],
                markerView: { hidden: new Set(hidden), labelKind: null },
            }),
        )

    it.each([
        ['nothing hidden', [feudal], [], true],
        ['another kind hidden', [feudal], ['economy'], true],
        ['age-up hidden with a current age-up marker', [feudal], ['age-up'], false],
        ['age-up hidden with no current age-up marker', [wheelbarrow], ['age-up'], true],
    ] as const)('%s', (_name, markers, hidden, shown) => {
        expect(renderView([...markers], [...hidden]).includes('data-testid="chart-pinned-legend"')).toBe(shown)
    })

    it('draws no marker legend inside the chart', () => {
        expect(render([], [feudal], [feudal])).not.toContain('chart-marker-legend')
    })
})

describe('pinned legend', () => {
    const renderPinned = (props: Partial<Parameters<typeof SeriesChart>[0]> = {}) =>
        renderToString(
            createElement(SeriesChart, {
                testId: 'chart-x',
                title: 'Units produced',
                yLabel: 'Units',
                times: [0, 5],
                series: [{ key: 'a', name: 'A', values: [1, 2] }],
                ...props,
            }),
        )
    const pinned = { times: [0, 5], series: [{ key: 'a', name: 'A', values: [3, 4] }] }
    const pinnedMarkers: ChartMarker[] = [{ kind: 'age-up', label: 'Feudal', at: 2 }]
    const legendCount = (html: string) => html.match(/data-testid="chart-pinned-legend"/g)?.length ?? 0

    it('renders one dashed entry after the series legend, and not the old pinned key', () => {
        const html = renderPinned({ pinned, markers: [{ kind: 'age-up', label: 'Feudal', at: 1 }] })
        expect(legendCount(html)).toBe(1)
        const entry = html.slice(html.indexOf('data-testid="chart-pinned-legend"'))
        expect(entry).toMatch(/^[^>]*><span[^>]*data-testid="chart-pinned-legend-swatch"[^>]*data-line-style="dashed"[^>]*><\/span>dashed = pinned build<\/p>/)
        expect(html.indexOf('data-testid="chart-series-legend"')).toBeLessThan(html.indexOf('data-testid="chart-pinned-legend"'))
        expect(html).not.toContain('chart-pinned-key')
        expect(html).not.toMatch(/<button[^>]*chart-pinned-legend/)
    })

    it('renders when only a pinned age-up marker is drawn', () => {
        expect(legendCount(renderPinned({ pinnedMarkers }))).toBe(1)
    })

    it('renders when only a pinned series is given, not when the pinned run has no series and no age-up', () => {
        expect(legendCount(renderPinned({ pinned }))).toBe(1)
        expect(legendCount(renderPinned({ pinned: { times: [0], series: [] }, pinnedMarkers: [{ kind: 'economy', label: 'x', at: 1 }] }))).toBe(0)
    })

    it('renders none without a pinned run, and none when the chart is collapsed', () => {
        expect(legendCount(renderPinned())).toBe(0)
        const layout = { collapsed: true, dragging: false, reorderHelpId: 'help', onToggle: () => {}, onMoveKey: () => {}, onHandlePointerDown: () => {} }
        expect(legendCount(renderPinned({ pinned, pinnedMarkers, layout }))).toBe(0)
    })

    it('lists a shared series once', () => {
        expect(renderPinned({ pinned }).match(/data-testid="chart-series-legend-item"/g)).toHaveLength(1)
    })
})

describe('series legend and label rows', () => {
    it('titles the series legend', () => {
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }], [{ kind: 'age-up', label: 'Feudal', at: 2 }])
        expect(html).toMatch(/data-testid="chart-series-legend"[^>]*><h4[^>]*>Series<\/h4>/)
    })

    it('renders one pressed-state button per series with its key', () => {
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }, { key: 'b', name: 'B', values: [1, 2] }])
        expect([...html.matchAll(/data-series="([^"]+)" aria-pressed="true"/g)].map((m) => m[1])).toEqual(['a', 'b'])
    })

    it('renders the label-row count, 0 without markers and 0 on the server with markers', () => {
        expect(render([])).toContain('data-label-rows="0"')
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }], [{ kind: 'age-up', label: 'Feudal', at: 2 }, { kind: 'other', label: 'x', at: 3 }])
        expect(html).toContain('data-label-rows="0"')
    })
})

describe('bandIn', () => {
    const shown = { from: 100, to: 200 }
    it.each([
        ['a span inside the window is kept', { from: 120, to: 150 }, { from: 120, to: 150 }],
        ['a span crossing the start is clipped to it', { from: 50, to: 150 }, { from: 100, to: 150 }],
        ['a span crossing the end is clipped to it', { from: 150, to: 300 }, { from: 150, to: 200 }],
        ['a span around the window becomes the window', { from: 0, to: 300 }, { from: 100, to: 200 }],
        ['a span wholly before the window is absent', { from: 10, to: 90 }, null],
        ['a span ending at the window start has no width inside it', { from: 50, to: 100 }, null],
        ['a span starting at the window end has no width inside it', { from: 200, to: 250 }, null],
        ['a point inside is kept', { from: 150, to: 150 }, { from: 150, to: 150 }],
        ['a point on the start edge is kept', { from: 100, to: 100 }, { from: 100, to: 100 }],
        ['a point on the end edge is kept', { from: 200, to: 200 }, { from: 200, to: 200 }],
        ['a point outside is absent', { from: 201, to: 201 }, null],
    ])('%s', (_name, band, expected) => {
        expect(bandIn(band, shown)).toEqual(expected)
    })
})
