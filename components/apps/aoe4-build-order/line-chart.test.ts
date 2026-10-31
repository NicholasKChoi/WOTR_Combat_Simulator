import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SeriesChart } from './line-chart'

const render = (series: Parameters<typeof SeriesChart>[0]['series']) =>
    renderToString(
        createElement(SeriesChart, { testId: 'chart-x', title: 'Units produced', yLabel: 'Units', times: [0, 5], series }),
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
