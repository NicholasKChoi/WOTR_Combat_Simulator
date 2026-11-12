import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ChartMarker } from '../../../lib/aoe4-build-order/model'
import { type PlacedMarker, SeriesChart, ageUpMarkers, placeMarkers } from './line-chart'
import { markerLabel } from './chart-rows'

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

    it('lists one marker legend item per kind present, in kind order', () => {
        const html = render([], [
            { kind: 'blacksmith', label: 'steeled-arrow', at: 4 },
            { kind: 'age-up', label: 'Feudal', at: 2 },
            { kind: 'blacksmith', label: 'iron-undermesh', at: 5 },
        ])
        const items = [...html.matchAll(/data-testid="chart-marker-legend-item"[^>]*data-kind="([^"]+)"[^>]*>(?:<span[^>]*><\/span>)?([^<]*)/g)]
        expect(items.map((m) => [m[1], m[2]])).toEqual([['age-up', 'Age-up'], ['blacksmith', 'Blacksmith']])
    })

    it('has no marker legend when markers are empty or omitted', () => {
        expect(render([], [])).not.toContain('chart-marker-legend')
        expect(render([])).not.toContain('chart-marker-legend')
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

    it('has no handle and no caret without layout', () => {
        const html = renderWith()
        for (const id of ['chart-drag-handle', 'chart-collapse']) expect(html).not.toContain(id)
    })

    it('keeps an empty hidden body whose id is the aria-controls target when collapsed, and the header controls visible', () => {
        const html = renderWith({ collapsed: true })
        const controlsId = button(html, 'chart-collapse').match(/aria-controls="([^"]+)"/)?.[1]
        expect(button(html, 'chart-collapse')).toContain('aria-expanded="false"')
        expect(html).toContain('data-collapsed="true"')
        expect(html).toMatch(new RegExp(`<div(?=[^>]*data-testid="chart-body")(?=[^>]*id="${controlsId}")(?=[^>]*hidden)[^>]*></div>`))
        expect(html).not.toContain('chart-series-legend')
        expect(html).toContain('extra-control')
    })

    it('shows the legend in a visible body when expanded', () => {
        const html = renderWith({})
        const controlsId = button(html, 'chart-collapse').match(/aria-controls="([^"]+)"/)?.[1]
        expect(button(html, 'chart-collapse')).toContain('aria-expanded="true"')
        expect(html).toContain('data-collapsed="false"')
        expect(html).toMatch(new RegExp(`<div(?=[^>]*data-testid="chart-body")(?=[^>]*id="${controlsId}")(?![^>]*hidden)[^>]*>`))
        expect(html).toContain('chart-series-legend')
        expect(html).toContain('extra-control')
    })

    it('marks the section dragging only while dragged', () => {
        expect(renderWith({ dragging: true })).toContain('data-dragging="true"')
        expect(renderWith({})).not.toContain('data-dragging')
    })
})

describe('age-up markers', () => {
    const pinnedMarkers: ChartMarker[] = [
        { kind: 'age-up', label: 'Feudal', at: 2 },
        { kind: 'economy', label: 'Wheelbarrow', at: 3 },
        { kind: 'age-up', label: 'Castle', at: 4 },
        { kind: 'other', label: 'x', at: 5 },
    ]

    it('keeps only age-up markers, in order', () => {
        expect(ageUpMarkers(pinnedMarkers).map((m) => m.label)).toEqual(['Feudal', 'Castle'])
    })

    it('puts the pinned age-up legend item last, with only that item when the current run has no markers', () => {
        const kinds = (html: string) => [...html.matchAll(/data-testid="chart-marker-legend-item" data-kind="([^"]+)"/g)].map((m) => m[1])
        expect(kinds(render([], [{ kind: 'age-up', label: 'Feudal', at: 2 }], pinnedMarkers))).toEqual(['age-up', 'pinned-age-up'])
        const html = render([], [], pinnedMarkers)
        expect(kinds(html)).toEqual(['pinned-age-up'])
        expect(html).toContain('Age-up (pinned)')
    })

    it('has no pinned legend item without pinned age-up markers', () => {
        expect(render([], [{ kind: 'age-up', label: 'Feudal', at: 2 }], [pinnedMarkers[1]])).not.toContain('pinned-age-up')
        expect(render([])).not.toContain('pinned-age-up')
    })
})

describe('pinned line key', () => {
    const renderPinned = (pinned?: Parameters<typeof SeriesChart>[0]['pinned']) =>
        renderToString(
            createElement(SeriesChart, {
                testId: 'chart-x',
                title: 'Units produced',
                yLabel: 'Units',
                times: [0, 5],
                series: [{ key: 'a', name: 'A', values: [1, 2] }],
                pinned,
            }),
        )
    const pinned = { times: [0, 5], series: [{ key: 'a', name: 'A', values: [3, 4] }] }

    it('renders one key labelled current run and pinned run inside the series legend only with a pinned run', () => {
        const html = renderPinned(pinned)
        expect(html.match(/data-testid="chart-pinned-key"/g)).toHaveLength(1)
        const key = html.slice(html.indexOf('data-testid="chart-pinned-key"'))
        expect(key).toContain('current run')
        expect(key).toContain('pinned run')
        expect(html.indexOf('data-testid="chart-series-legend"')).toBeLessThan(html.indexOf('data-testid="chart-pinned-key"'))
        expect(renderPinned()).not.toContain('chart-pinned-key')
    })

    it('lists a shared series once', () => {
        expect(renderPinned(pinned).match(/data-testid="chart-series-legend-item"/g)).toHaveLength(1)
    })
})

describe('series and marker legends', () => {
    it('titles the series legend and the marker legend, each in its own element', () => {
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }], [{ kind: 'age-up', label: 'Feudal', at: 2 }])
        expect(html).toMatch(/data-testid="chart-series-legend"[^>]*><h4[^>]*>Series<\/h4>/)
        expect(html).toMatch(/data-testid="chart-marker-legend"[^>]*><h4[^>]*>Markers<\/h4>/)
        expect(html).toMatch(/data-testid="chart-series-legend".*?<\/button><\/div><\/div><div[^>]*data-testid="chart-marker-legend"/)
    })

    it('renders one pressed-state button per series with its key', () => {
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }, { key: 'b', name: 'B', values: [1, 2] }])
        expect([...html.matchAll(/data-series="([^"]+)" aria-pressed="false"/g)].map((m) => m[1])).toEqual(['a', 'b'])
    })

    it('renders the label-row count, 0 without markers and 0 on the server with markers', () => {
        expect(render([])).toContain('data-label-rows="0"')
        const html = render([{ key: 'a', name: 'A', values: [1, 2] }], [{ kind: 'age-up', label: 'Feudal', at: 2 }, { kind: 'other', label: 'x', at: 3 }])
        expect(html).toContain('data-label-rows="0"')
    })
})

describe('placeMarkers', () => {
    const marker = (at: number, label = 'A very long marker label'): ChartMarker => ({ kind: 'other', label, at })
    const range = (p: PlacedMarker, end: number, plotWidth: number, px = 8) => {
        const width = (markerLabel(p.marker).length * px * end) / plotWidth
        return p.side === 'left' ? [p.marker.at, p.marker.at + width] : [p.marker.at - width, p.marker.at]
    }

    it('never puts intersecting labels in the same row', () => {
        const markers = [0, 100, 200, 300, 400, 500].map((at) => marker(at))
        const placed = placeMarkers(markers, 1000, 600)
        expect(Math.max(...placed.map((p) => p.row))).toBeGreaterThan(0)
        for (const [i, p] of placed.entries()) {
            for (const q of placed.slice(i + 1).filter((o) => o.row === p.row)) {
                const [a, b] = [range(p, 1000, 600), range(q, 1000, 600)]
                expect(a[1] <= b[0] || b[1] <= a[0]).toBe(true)
            }
        }
    })

    it('keeps a label that fits in row 0 and reuses row 0 once an earlier label has ended', () => {
        const placed = placeMarkers([marker(0, 'x'), marker(500, 'y'), marker(900, 'z')], 1000, 1000)
        expect(placed.map((p) => p.row)).toEqual([0, 0, 0])
    })

    it('uses more rows when labels are estimated wider', () => {
        const markers = [0, 100, 200].map((at) => marker(at, 'abc'))
        const rows = (width: (l: string) => number) => Math.max(...placeMarkers(markers, 1000, 1000, width).map((p) => p.row))
        expect(rows(() => 10)).toBe(0)
        expect(rows(() => 250)).toBe(2)
    })

    it('pins a label that fits on neither side to the left edge', () => {
        const [p] = placeMarkers([marker(100, 'x')], 200, 200, () => 150)
        expect(p).toMatchObject({ side: 'left', dx: -100 })
    })
})
