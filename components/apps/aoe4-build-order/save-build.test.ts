import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { buildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { ENGLISH } from '../../../lib/aoe4-build-order/test-helpers'
import { textToBuildOrder } from '../../../lib/aoe4-build-order/text-to-build'
import type { AutoRunStatus } from './auto-run'
import { entryKey, type LibraryEntry, savedMineEntry, templateEntries } from './build-library'
import { type SavedStatus, SaveBuild, saveStatusText } from './save-build'

const shipped = listBuilds()[0]
const input = { text: formatBuildOrderText(shipped), duration: '1200' }
const conversion = textToBuildOrder(input.text, buildOrderCatalog(ENGLISH))
const template = templateEntries([{ name: shipped.name, text: input.text }])[0]
const mine = savedMineEntry('mine-id', 'My build', input, 2)
const shared: LibraryEntry = { ...savedMineEntry('shared-id', 'Shared build', input, 3), kind: 'shared' }
const link: LibraryEntry = { key: entryKey.link('link-id'), kind: 'link', name: 'Linked build', id: 'link-id', loaded: { ...input, revision: null } }
const SECRET = 'secret'

interface Panel {
    entry?: LibraryEntry
    editSecret?: string | null
    status?: AutoRunStatus
    busy?: boolean
    edited?: boolean
}

function render(panel: Panel): string {
    const { editSecret = SECRET, status = 'current', busy = false, edited = true } = panel
    const entry = 'entry' in panel ? panel.entry : mine
    const settled = { ...input, selected: entry?.key ?? '' }
    return renderToStaticMarkup(
        createElement(SaveBuild, { status, settled, conversion, busy, entry, editSecret, edited, onCreated: () => {}, onUpdated: () => {} }),
    )
}

function button(html: string, testId: string): string | undefined {
    return new RegExp(`<button[^>]*data-testid="${testId}"[^>]*>`).exec(html)?.[0]
}

describe('SaveBuild', () => {
    it('converts its input, so a disabled button below comes from the panel state', () => {
        expect(conversion.ok).toBe(true)
    })

    it.each<[string, LibraryEntry | undefined, string | null, boolean]>([
        ['a build this browser made, with its secret', mine, SECRET, true],
        ['a build this browser made, without its secret', mine, null, false],
        ['a shared build', shared, SECRET, false],
        ['an old link', link, SECRET, false],
        ['a template', template, SECRET, false],
        ['no entry', undefined, SECRET, false],
    ])('for %s renders Save as copy, and Save a new version only for its own build', (_, entry, editSecret, version) => {
        const html = render({ entry, editSecret })
        expect(button(html, 'save-build-copy')).toBeDefined()
        expect(button(html, 'save-build') !== undefined).toBe(version)
    })

    it.each<{ when: string; panel: Panel; version: boolean; copy: boolean }>([
        { when: 'current and edited', panel: {}, version: true, copy: true },
        { when: 'current and unedited', panel: { edited: false }, version: false, copy: true },
        { when: 'loading', panel: { status: 'loading' }, version: false, copy: false },
        { when: 'running', panel: { status: 'running' }, version: false, copy: false },
        { when: 'updating', panel: { status: 'updating' }, version: false, copy: false },
        { when: 'invalid', panel: { status: 'invalid' }, version: false, copy: false },
        { when: 'rejected', panel: { status: 'rejected' }, version: false, copy: false },
        { when: 'failed', panel: { status: 'failed' }, version: false, copy: false },
        { when: 'current while a saved build loads', panel: { busy: true }, version: false, copy: false },
    ])('when $when, Save a new version enabled is $version and Save as copy enabled is $copy', ({ panel, version, copy }) => {
        const html = render(panel)
        expect(button(html, 'save-build')?.includes('disabled=""')).toBe(!version)
        expect(button(html, 'save-build-copy')?.includes('disabled=""')).toBe(!copy)
    })

    it('marks both buttons busy while a saved build loads', () => {
        const html = render({ busy: true })
        expect(button(html, 'save-build')).toContain('aria-busy="true"')
        expect(button(html, 'save-build-copy')).toContain('aria-busy="true"')
    })

    it('puts the save row first in the panel, holding the shown buttons in order and then an empty status', () => {
        const html = render({})
        const row = /^<div data-testid="save-panel"[^>]*><div data-testid="save-row"[^>]*>(.*?)<\/div>/.exec(html)?.[1]
        const ids = [...(row ?? '').matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1])
        expect(ids).toEqual(['save-build', 'save-build-copy', 'save-status'])
        const status = /<p [^>]*data-testid="save-status"[^>]*>(.*?)<\/p>/.exec(html)
        expect(status?.[1]).toBe('')
        expect(status?.[0]).toContain('role="status"')
        expect(status?.[0]).toContain('aria-live="polite"')
        expect(status?.[0]).toContain('aria-atomic="true"')
    })
})

describe('saveStatusText', () => {
    const settled = { ...input, selected: mine.key }
    const saved = (by: SavedStatus['by'], revision: number, changed: Partial<typeof settled> = {}): SavedStatus => ({
        input: { ...settled, ...changed },
        by,
        revision,
    })

    it.each<[string, SavedStatus | null, boolean, string]>([
        ['a create', saved('copy', 1), false, 'Saved'],
        ['an update at revision 4', saved('version', 4), false, 'Saved version 4'],
        ['an update at revision 11', saved('version', 11), false, 'Saved version 11'],
        ['a save in flight after a create', saved('copy', 1), true, ''],
        ['a save in flight after an update', saved('version', 4), true, ''],
        ['no save, as after a failed one', null, false, ''],
        ['a text edit since the save', saved('copy', 1, { text: `${input.text}\nextra` }), false, ''],
        ['a duration edit since the save', saved('version', 2, { duration: '900' }), false, ''],
        ['another build selected since the save', saved('copy', 1, { selected: 'template:other' }), false, ''],
    ])('for %s reads the saved text only when idle and unchanged', (_, state, saving, expected) => {
        expect(saveStatusText(state, settled, saving)).toBe(expected)
    })
})
