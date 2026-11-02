import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ChartMarker } from '../../../lib/aoe4-build-order/model'
import { type PlacedMarker, SeriesChart, placeMarkers } from './line-chart'
import { legendItems, markerLabel, seriesColor } from './chart-rows'

const render = (series: Parameters<typeof SeriesChart>[0]['series'], markers?: ChartMarker[]) =>
    renderToString(
        createElement(SeriesChart, { testId: 'chart-x', title: 'Units produced', yLabel: 'Units', times: [0, 5], series, markers }),
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

describe('legendItems', () => {
    const s = (key: string) => ({ key, name: key.toUpperCase(), values: [] })
    const pinned = { times: [], series: [s('c'), s('b'), s('z')] }

    it('follows each current series with its pinned item, then lists pinned-only keys in pinned order', () => {
        expect(legendItems([s('a'), s('b'), s('c')], pinned).map((i) => i.key)).toEqual(['a', 'b', 'pinned:b', 'c', 'pinned:c', 'pinned:z'])
    })

    it('colours a pinned item by its current series, else after the current series by pinned index', () => {
        const items = legendItems([s('a'), s('b'), s('c')], pinned)
        expect(items.find((i) => i.key === 'pinned:c')?.color).toBe(seriesColor(2))
        expect(items.find((i) => i.key === 'pinned:z')?.color).toBe(seriesColor(3 + 2))
    })

    it('names pinned items and marks only them pinned', () => {
        const items = legendItems([s('b')], pinned)
        expect(items.map((i) => [i.name, i.pinned])).toEqual([['B', false], ['B (pinned)', true], ['C (pinned)', true], ['Z (pinned)', true]])
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
