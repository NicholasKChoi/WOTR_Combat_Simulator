import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type ChartControls, ChartHeaderRow, chartHandleKey } from './chart-header'

describe('chartHandleKey', () => {
    it.each([
        ['ArrowUp', 'up'],
        ['ArrowDown', 'down'],
        ['Home', null],
        ['End', null],
        ['Enter', null],
        [' ', null],
        ['Tab', null],
        ['a', null],
    ])('%s gives %s', (key, expected) => {
        expect(chartHandleKey(key)).toBe(expected)
    })
})

describe('ChartHeaderRow', () => {
    const layout: ChartControls = { collapsed: false, dragging: false, reorderHelpId: 'help-id', onToggle: () => {}, onMoveKey: () => {}, onHandlePointerDown: () => {} }
    const render = (props: { layout?: Partial<ChartControls> | null } = {}) =>
        renderToStaticMarkup(
            createElement(ChartHeaderRow, {
                title: 'Gather rates',
                bodyId: 'body-id',
                layout: props.layout === null ? undefined : { ...layout, ...props.layout },
                controls: createElement('span', { 'data-testid': 'extra-control' }),
            }),
        )
    const tag = (html: string, testId: string) => html.match(new RegExp(`<[a-z0-9]+[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? ''

    const cells = (html: string) => [...html.matchAll(/<(td|th)([^>]*)>(.*?)<\/\1>/g)].map((m) => ({ tag: m[1], attrs: m[2], inner: m[3] }))

    it('is a header row of four cells holding the handle, title, caret and controls in that order', () => {
        const html = render()
        expect(html).toMatch(/^<tr[^>]*data-testid="chart-header-row"/)
        const [handle, title, caret, controls] = cells(html)
        expect(cells(html).map((c) => c.tag)).toEqual(['td', 'th', 'td', 'td'])
        expect(handle.inner).toContain('chart-drag-handle')
        expect(title.attrs).toContain('scope="rowgroup"')
        expect(title.inner).toMatch(/^<h3 class="h5">Gather rates<\/h3>$/)
        expect(caret.inner).toContain('chart-collapse')
        expect(controls.inner).toContain('extra-control')
    })

    it('labels the handle with the title and points it at the help text', () => {
        const handle = tag(render(), 'chart-drag-handle')
        expect(handle).toContain('aria-label="Reorder Gather rates chart"')
        expect(handle).toContain('aria-keyshortcuts="ArrowUp ArrowDown"')
        expect(handle).toContain('aria-describedby="help-id"')
    })

    it.each([
        [false, 'true', 'Collapse Gather rates chart'],
        [true, 'false', 'Expand Gather rates chart'],
    ])('collapsed %s gives aria-expanded %s on a caret that controls the body', (collapsed, expanded, label) => {
        const caret = tag(render({ layout: { collapsed } }), 'chart-collapse')
        expect(caret).toContain(`aria-expanded="${expanded}"`)
        expect(caret).toContain('aria-controls="body-id"')
        expect(caret).toContain(`aria-label="${label}"`)
    })

    it('keeps the controls slot when collapsed', () => {
        expect(render({ layout: { collapsed: true } })).toContain('extra-control')
    })

    it('renders the title and the controls with empty handle and caret cells without layout', () => {
        const html = render({ layout: null })
        const [handle, title, caret, controls] = cells(html)
        expect([handle.inner, caret.inner]).toEqual(['', ''])
        expect(title.inner).toContain('Gather rates')
        expect(controls.inner).toContain('extra-control')
        expect(html).not.toContain('chart-drag-handle')
        expect(html).not.toContain('chart-collapse')
    })
})
