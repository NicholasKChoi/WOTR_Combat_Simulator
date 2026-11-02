import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ChartMarker } from '../../../lib/aoe4-build-order/model'
import { SeriesChart } from './line-chart'

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
