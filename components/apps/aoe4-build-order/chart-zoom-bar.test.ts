import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ChartZoomBar } from './chart-zoom-bar'

const render = (shown: { from: number; to: number }, end = 600) =>
    renderToStaticMarkup(createElement(ChartZoomBar, { title: 'Gather rates', shown, end, onPan: () => {}, onReset: () => {} }))
const tag = (html: string, testId: string) => html.match(new RegExp(`<[a-z0-9]+[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? ''
const IDS = ['chart-zoom-bar', 'chart-zoom-range', 'chart-zoom-pan-earlier', 'chart-zoom-pan-later', 'chart-zoom-reset']

describe('ChartZoomBar', () => {
    it('puts the range, earlier, later and reset in that order', () => {
        const html = render({ from: 65, to: 125 })
        const positions = IDS.map((id) => html.indexOf(`data-testid="${id}"`))
        expect(positions.every((position) => position >= 0)).toBe(true)
        expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    })

    it('shows both times and the names for the title', () => {
        const html = render({ from: 65, to: 125 })
        expect(html).toContain('1:05')
        expect(html).toContain('2:05')
        expect(tag(html, 'chart-zoom-pan-earlier')).toContain('aria-label="Show earlier in Gather rates chart"')
        expect(tag(html, 'chart-zoom-pan-later')).toContain('aria-label="Show later in Gather rates chart"')
        expect(tag(html, 'chart-zoom-reset')).toContain('aria-label="Reset Gather rates chart zoom"')
        expect(html).toMatch(/data-testid="chart-zoom-reset"[^>]*>Reset zoom</)
    })

    it.each([
        ['at the start', { from: 0, to: 60 }, true, false],
        ['at the end', { from: 540, to: 600 }, false, true],
        ['between', { from: 100, to: 160 }, false, false],
    ])('%s marks the edge pan button aria-disabled and never disabled', (_, shown, earlier, later) => {
        const html = render(shown)
        expect(tag(html, 'chart-zoom-pan-earlier').includes('aria-disabled="true"')).toBe(earlier)
        expect(tag(html, 'chart-zoom-pan-later').includes('aria-disabled="true"')).toBe(later)
        for (const id of IDS.slice(2)) expect(tag(html, id)).not.toMatch(/\sdisabled(=|\s|>)/)
    })
})
