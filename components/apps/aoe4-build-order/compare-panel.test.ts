import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { CollapseCaret } from './collapse-caret'
import { ComparePanel } from './compare-panel'

const run = {
    durationSeconds: 300,
    times: [0, 100, 200, 300],
    spent: { villagers: [], military: [0, 100, 200, 300], buildings: [], research: [] },
    ages: [{ age: 2, reachedAt: 150 }],
    populationCapReachedAt: null,
} as unknown as SimulationResult

function panel(collapsed: boolean): string {
    return renderToStaticMarkup(
        createElement(ComparePanel, {
            current: run,
            pinned: run,
            pinnedName: 'Pinned build',
            alreadyPinned: false,
            onPin: () => {},
            onUnpin: () => {},
            collapsed,
            onToggleCollapsed: () => {},
        }),
    )
}

const body = (markup: string): string => markup.slice(markup.indexOf('data-testid="compare-body"'))
const tag = (markup: string, testId: string): string => markup.match(new RegExp(`<[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? ''

describe('ComparePanel', () => {
    it('renders the heading, expanded caret, pin buttons and a body holding the pinned label and table', () => {
        const markup = panel(false)
        expect(markup).toContain('data-testid="compare-panel"')
        expect(markup).toMatch(/data-testid="compare-heading"[^>]*>Key results</)
        expect(tag(markup, 'compare-collapse')).toContain('aria-expanded="true"')
        expect(tag(markup, 'compare-collapse')).toContain('aria-controls="compare-body"')
        expect(tag(markup, 'compare-body')).toContain('data-collapsed="false"')
        expect(markup).toContain('data-testid="pin-run"')
        expect(markup).toContain('data-testid="unpin-run"')
        expect(body(markup)).toContain('data-testid="pinned-label"')
        expect(body(markup)).toMatch(/data-testid="compare-(key-numbers|empty)"/)
    })

    it('collapsed, keeps the pin buttons and renders nothing inside the body', () => {
        const markup = panel(true)
        expect(tag(markup, 'compare-collapse')).toContain('aria-expanded="false"')
        expect(tag(markup, 'compare-body')).toContain('data-collapsed="true"')
        expect(markup).toContain('data-testid="pin-run"')
        expect(markup).toContain('data-testid="unpin-run"')
        expect(body(markup)).not.toContain('data-testid="pinned-label"')
        expect(body(markup)).not.toMatch(/data-testid="compare-(key-numbers|empty|scroll)"/)
    })
})

describe('CollapseCaret', () => {
    it.each([
        [true, 'Collapse key results'],
        [false, 'Expand key results'],
    ])('labels expanded=%s as %s and controls its target', (expanded, label) => {
        const markup = renderToStaticMarkup(createElement(CollapseCaret, { expanded, name: 'key results', controlsId: 'target-id', onToggle: () => {}, testId: 'caret' }))
        expect(markup).toContain(`aria-label="${label}"`)
        expect(markup).toContain('aria-controls="target-id"')
        expect(markup).toContain(`aria-expanded="${expanded}"`)
    })
})
