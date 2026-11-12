import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type ChartView, ChartViewToggle, type GatherRatesView } from './chart-view-toggle'

const VIEWS: readonly ChartView<GatherRatesView>[] = [
    { value: 'rate', label: 'Rate' },
    { value: 'villagers', label: 'Villagers' },
]

function render(value: GatherRatesView): string {
    return renderToStaticMarkup(createElement(ChartViewToggle<GatherRatesView>, { name: 'Gather rates', views: VIEWS, value, onChange: () => {} }))
}

const options = (html: string) => [...html.matchAll(/<button[^>]*data-testid="chart-view-option"[^>]*>(.*?)<\/button>/g)]

describe('ChartViewToggle', () => {
    it('renders one labelled group holding one option per view, keyed by value and showing the label', () => {
        const html = render('rate')
        expect(html).toMatch(/^<div role="group" data-testid="chart-view-toggle" aria-label="Gather rates view" class="btn-group btn-group-sm">/)
        const found = options(html)
        expect(found.map((m) => /data-view="([^"]*)"/.exec(m[0])?.[1])).toEqual(['rate', 'villagers'])
        expect(found.map((m) => m[1])).toEqual(['Rate', 'Villagers'])
        expect(found.every((m) => m[0].includes('type="button"'))).toBe(true)
    })

    it.each<GatherRatesView>(['rate', 'villagers'])('presses only the option equal to %s', (value) => {
        const pressed = options(render(value)).map((m) => /aria-pressed="(true|false)"/.exec(m[0])?.[1])
        expect(pressed).toEqual(VIEWS.map((v) => String(v.value === value)))
    })
})
