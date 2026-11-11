import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import { buildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { ENGLISH } from '../../../lib/aoe4-build-order/test-helpers'
import { textToBuildOrder } from '../../../lib/aoe4-build-order/text-to-build'
import type { AutoRunStatus } from './auto-run'
import { templateEntries } from './build-library'
import { SaveBuild } from './save-build'

const entries = templateEntries(listBuilds().slice(0, 1).map((order) => ({ name: order.name, text: 'start' })))
const settled = { text: 'start', duration: '1200', selected: entries[0].key }
const conversion = textToBuildOrder(settled.text, buildOrderCatalog(ENGLISH))

function saveButton(status: AutoRunStatus, busy = false): string {
    const html = renderToStaticMarkup(createElement(SaveBuild, { status, settled, conversion, entries, busy, onSaved: () => {} }))
    return /<button[^>]*data-testid="save-build"[^>]*>/.exec(html)?.[0] ?? ''
}

describe('SaveBuild', () => {
    it.each<AutoRunStatus>(['loading', 'running', 'updating', 'invalid', 'rejected', 'failed'])('is disabled while the status is %s', (status) => {
        expect(saveButton(status)).toContain('disabled=""')
    })

    it('is enabled when the status is current', () => {
        expect(saveButton('current')).not.toContain('disabled')
    })

    it('is disabled and busy while a saved build loads, even when current', () => {
        const button = saveButton('current', true)
        expect(button).toContain('disabled=""')
        expect(button).toContain('aria-busy="true"')
    })

    it('renders no link on first render', () => {
        const html = renderToStaticMarkup(createElement(SaveBuild, { status: 'current', settled, conversion, entries, busy: false, onSaved: () => {} }))
        expect(html).not.toContain('saved-build-link')
    })
})
