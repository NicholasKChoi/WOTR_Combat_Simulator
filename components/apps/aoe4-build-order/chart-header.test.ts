import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { type ChartControls, ChartHeader, chartHandleKey } from './chart-header'

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

describe('ChartHeader', () => {
    const layout: ChartControls = { collapsed: false, dragging: false, reorderHelpId: 'help-id', onToggle: () => {}, onMoveKey: () => {}, onHandlePointerDown: () => {} }
    const render = (props: { layout?: Partial<ChartControls> | null } = {}) =>
        renderToStaticMarkup(
            createElement(ChartHeader, {
                title: 'Gather rates',
                bodyId: 'body-id',
                layout: props.layout === null ? undefined : { ...layout, ...props.layout },
                controls: createElement('span', { 'data-testid': 'extra-control' }),
            }),
        )
    const tag = (html: string, testId: string) => html.match(new RegExp(`<[a-z0-9]+[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? ''

    it('puts the handle, title, caret and controls in that order', () => {
        const html = render()
        const positions = ['chart-drag-handle', '<h3', 'chart-collapse', 'extra-control'].map((marker) => html.indexOf(marker))
        expect(positions.every((position) => position >= 0)).toBe(true)
        expect([...positions].sort((a, b) => a - b)).toEqual(positions)
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

    it('renders the title and the controls with no handle and no caret without layout', () => {
        const html = render({ layout: null })
        expect(html).toContain('Gather rates')
        expect(html).toContain('extra-control')
        expect(html).not.toContain('chart-drag-handle')
        expect(html).not.toContain('chart-collapse')
    })
})
