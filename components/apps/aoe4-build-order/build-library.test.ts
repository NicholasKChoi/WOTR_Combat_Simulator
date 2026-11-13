import { describe, expect, it } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import type { NamedBuild } from '../../../lib/aoe4-build-order/named-builds'
import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import type { SavedBuild } from '../../../lib/aoe4-build-order/saved-builds'
import { buildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { ENGLISH } from '../../../lib/aoe4-build-order/test-helpers'
import { textToBuildOrder } from '../../../lib/aoe4-build-order/text-to-build'
import {
    LIBRARY_GROUPS,
    copyName,
    entryKey,
    entryLabel,
    isEdited,
    linkEntry,
    mineEntries,
    namedEntry,
    runName,
    savedMineEntry,
    templateEntries,
    withCreatedEntry,
    withLoadedEntry,
    withMyBuilds,
    type LibraryEntry,
} from './build-library'
import { MY_BUILDS_MAX, type MyBuildEntry } from './my-builds-storage'

const ID = 'a'.repeat(22)
const B_ID = 'b'.repeat(22)
const LINK_ID = 'Zx3_k9-QaB0'
const [firstOrder, secondOrder] = listBuilds()

function namedBuild(id: string, name: string, revision: number): NamedBuild {
    return {
        version: 1,
        id,
        buildOrder: { ...secondOrder, name },
        durationSeconds: 840,
        revision,
        createdAt: '2026-11-10T08:00:00.000Z',
        updatedAt: '2026-11-10T09:00:00.000Z',
    }
}

function stored(id: string, name: string, updatedAt: string): MyBuildEntry {
    return { id, name, editSecret: 'S'.repeat(43), revision: 1, updatedAt }
}

function libraryEntry(over: Partial<LibraryEntry> & Pick<LibraryEntry, 'key'>): LibraryEntry {
    return { kind: 'template', name: over.key, id: null, loaded: null, ...over }
}

const withText = (text: string): LibraryEntry['loaded'] => ({ text, duration: null, revision: null })

describe('entryKey', () => {
    it('prefixes by kind', () => {
        expect(entryKey.template('ENG 1TC')).toBe('template:ENG 1TC')
        expect(entryKey.named(ID)).toBe(`named:${ID}`)
        expect(entryKey.link(ID)).toBe(`link:${ID}`)
    })
})

describe('LIBRARY_GROUPS', () => {
    it('lists My builds, Opened links, Templates in order', () => {
        expect(LIBRARY_GROUPS).toEqual([
            { kind: ['mine'], label: 'My builds' },
            { kind: ['shared', 'link'], label: 'Opened links' },
            { kind: ['template'], label: 'Templates' },
        ])
    })
})

describe('builders', () => {
    it('templateEntries fills every field', () => {
        expect(templateEntries([{ name: 'ENG 1TC', text: 'start -> sheep' }])).toEqual([
            { key: 'template:ENG 1TC', kind: 'template', name: 'ENG 1TC', id: null, loaded: { text: 'start -> sheep', duration: null, revision: null } },
        ])
    })

    it('mineEntries fills every field in input order', () => {
        const stored: MyBuildEntry[] = [
            { id: ID, name: 'B', editSecret: 'S'.repeat(43), revision: 3, updatedAt: '2026-11-10T10:00:00Z' },
            { id: B_ID, name: 'A', editSecret: 'S'.repeat(43), revision: 1, updatedAt: '2026-11-10T09:00:00Z' },
        ]
        expect(mineEntries(stored)).toEqual([
            { key: `named:${ID}`, kind: 'mine', name: 'B', id: ID, loaded: null },
            { key: `named:${B_ID}`, kind: 'mine', name: 'A', id: B_ID, loaded: null },
        ])
    })

    it('linkEntry keys by the link id and keeps the stored name and duration', () => {
        const saved: SavedBuild = { version: 1, buildOrder: { ...firstOrder, name: 'Fast Castle' }, durationSeconds: 900 }
        expect(linkEntry(LINK_ID, saved)).toEqual({
            key: `link:${LINK_ID}`,
            kind: 'link',
            name: 'Fast Castle',
            id: LINK_ID,
            loaded: { text: formatBuildOrderText(saved.buildOrder), duration: '900', revision: null },
        })
    })

    it('linkEntry text converts back to the saved steps', () => {
        const saved: SavedBuild = { version: 1, buildOrder: firstOrder, durationSeconds: 900 }
        const reopened = textToBuildOrder(linkEntry(LINK_ID, saved).loaded?.text ?? '', buildOrderCatalog(ENGLISH))
        expect(reopened.ok && reopened.order.steps).toStrictEqual(saved.buildOrder.steps)
    })

    it.each(['mine', 'shared'] as const)('namedEntry(%s) keys by the build id and carries its revision', (kind) => {
        const build = namedBuild(ID, 'Shared Castle', 4)
        expect(namedEntry(kind, build)).toEqual({
            key: `named:${ID}`,
            kind,
            name: 'Shared Castle',
            id: ID,
            loaded: { text: formatBuildOrderText(build.buildOrder), duration: '840', revision: 4 },
        })
    })

    it('savedMineEntry keys by the id and keeps the saved input as loaded', () => {
        expect(savedMineEntry(ID, 'My Castle', { text: 'start -> sheep', duration: '900' }, 2)).toEqual({
            key: `named:${ID}`,
            kind: 'mine',
            name: 'My Castle',
            id: ID,
            loaded: { text: 'start -> sheep', duration: '900', revision: 2 },
        })
    })

    describe('savedMineEntry text is kept as typed', () => {
        const typed = ['start -> sheep', '', '', '# scout early', 'produce   knight from stable', ''].join('\n')
        const input = { text: typed, duration: '1200' }

        it('uses a text the formatter would reflow', () => {
            const parsed = textToBuildOrder(typed, buildOrderCatalog(ENGLISH))
            if (!parsed.ok) throw new Error('the typed text must convert')
            expect(formatBuildOrderText(parsed.order)).not.toBe(typed)
        })

        it.each([
            { label: 'the saved input', live: input, expected: false },
            { label: 'the saved input plus one character', live: { ...input, text: `${typed}x` }, expected: true },
        ])('isEdited against $label is $expected', ({ live, expected }) => {
            expect(isEdited(savedMineEntry(ID, 'Typed', input, 1), live)).toBe(expected)
        })
    })
})

describe('list merges', () => {
    const templates = templateEntries([
        { name: 'T1', text: 'start -> sheep' },
        { name: 'T2', text: 'start -> boar' },
    ])
    const mine = mineEntries([stored(ID, 'A stored', '2026-11-10T10:00:00Z'), stored(B_ID, 'B stored', '2026-11-10T09:00:00Z')])
    const loadedB = namedEntry('mine', namedBuild(B_ID, 'B on the server', 3))

    it('gives the same list whichever of the My builds read and a load result lands first', () => {
        expect(loadedB.name).not.toBe('B stored')
        const readFirst = withLoadedEntry(withMyBuilds(templates, mine), loadedB)
        const loadFirst = withMyBuilds(withLoadedEntry(templates, loadedB), mine)
        expect(readFirst).toEqual(loadFirst)
        const b = readFirst.find((entry) => entry.key === loadedB.key)
        expect(b).toEqual({ key: `named:${B_ID}`, kind: 'mine', name: 'B stored', id: B_ID, loaded: loadedB.loaded })
    })

    it.each([
        ['read first', () => withLoadedEntry(withMyBuilds(templates, mine), loadedB)],
        ['load first', () => withMyBuilds(withLoadedEntry(templates, loadedB), mine)],
    ])('keeps My builds in stored order (%s)', (_label, merge) => {
        expect(merge().filter((entry) => entry.kind === 'mine').map((entry) => entry.name)).toEqual(['A stored', 'B stored'])
    })

    it('replaces a listed shared entry whole', () => {
        const before = namedEntry('shared', namedBuild(ID, 'Old', 1))
        const after = namedEntry('shared', namedBuild(ID, 'New', 2))
        expect(withLoadedEntry([...templates, before], after)).toEqual([...templates, after])
    })

    it('appends an entry whose key is not listed', () => {
        const link = linkEntry(LINK_ID, { version: 1, buildOrder: firstOrder, durationSeconds: 600 })
        const shared = namedEntry('shared', namedBuild(B_ID, 'Shared', 1))
        expect(withLoadedEntry([...templates, link], shared)).toEqual([...templates, link, shared])
    })

    it('keeps link and shared entries the My builds read does not name', () => {
        const link = linkEntry(LINK_ID, { version: 1, buildOrder: firstOrder, durationSeconds: 600 })
        const shared = namedEntry('shared', namedBuild('c'.repeat(22), 'Shared', 1))
        expect(withMyBuilds([...templates, link, shared], mine)).toEqual([...templates, link, shared, ...mine])
    })
})

describe('entryLabel', () => {
    it.each([
        ['template', 'Name', false, 'Name'],
        ['template', 'Name', true, 'Name (edited)'],
        ['mine', 'Name', false, 'Name'],
        ['mine', 'Name', true, 'Name (edited)'],
        ['shared', 'Name', false, 'Name (shared)'],
        ['shared', 'Name', true, 'Name (shared) (edited)'],
        ['link', 'Name', false, `Name (${ID})`],
        ['link', 'Name', true, `Name (${ID}) (edited)`],
    ] as const)('%s %s edited=%s reads %s', (kind, name, edited, expected) => {
        expect(entryLabel(libraryEntry({ key: 'k', kind, name, id: ID }), edited)).toBe(expected)
    })
})

describe('isEdited', () => {
    const live = { text: 'live', duration: '20:00' }
    const template = libraryEntry({ key: 't', loaded: { text: 'live', duration: null, revision: null } })
    const link = libraryEntry({ key: 'l', kind: 'link', id: ID, loaded: { text: 'live', duration: '20:00', revision: null } })

    it.each([
        ['an undefined entry', undefined, live, false],
        ['a null loaded', libraryEntry({ key: 'n' }), live, false],
        ['the same text', template, live, false],
        ['changed text', template, { ...live, text: 'other' }, true],
        ['a template with a changed duration', template, { ...live, duration: '5:00' }, false],
        ['a link with a changed duration', link, { ...live, duration: '5:00' }, true],
        ['a link with the same duration', link, live, false],
    ])('%s is %s', (_label, entry, liveInput, expected) => {
        expect(isEdited(entry, liveInput)).toBe(expected)
    })
})

describe('copyName', () => {
    it.each([
        ['ENG 1TC', 'ENG 1TC (copy)'],
        ['ENG 1TC (edited)', 'ENG 1TC (copy)'],
        ['x'.repeat(100), `${'x'.repeat(93)} (copy)`],
        ['ENG (copy)', 'ENG (copy) (copy)'],
    ])('%s gives %s', (name, expected) => {
        expect(copyName(name)).toBe(expected)
    })

    it('keeps a long name within 100 chars', () => {
        expect(copyName('x'.repeat(100))).toHaveLength(100)
    })
})

describe('runName', () => {
    const first = libraryEntry({ key: 'a', name: 'First', loaded: withText('same') })
    const second = libraryEntry({ key: 'b', name: 'Second', loaded: withText('same') })
    const third = libraryEntry({ key: 'c', name: 'Third', loaded: withText('other') })
    const unloaded = libraryEntry({ key: 'u', name: 'Unloaded' })
    const entries = [first, second, third, unloaded]

    it.each([
        ['the selected entry when it matches and an earlier one does too', entries, 'same', 'b', 'Second'],
        ['the only matching entry when it is not selected', entries, 'other', 'a', 'Third'],
        ['the selected name plus (edited) with no match', entries, 'none', 'a', 'First (edited)'],
        ['Custom build when the selection is not among the entries', entries, 'none', 'missing', 'Custom build'],
        ['no match for a null-loaded entry on empty text', entries, '', 'u', 'Unloaded (edited)'],
        ['Custom build for empty entries', [], 'x', 'a', 'Custom build'],
        ['a second (edited) with no strip', [libraryEntry({ key: 'e', name: 'N (edited)', loaded: withText('t') })], 'x', 'e', 'N (edited) (edited)'],
    ])('gives %s', (_label, list, text, selectedKey, expected) => {
        expect(runName(list, text, selectedKey)).toBe(expected)
    })
})

describe('withCreatedEntry', () => {
    const template = templateEntries([{ name: 'T1', text: 'start -> sheep' }])[0]
    const link = linkEntry(LINK_ID, { version: 1, buildOrder: firstOrder, durationSeconds: 600 })
    const mineAt = (n: number): LibraryEntry => savedMineEntry(`id${n}`.padEnd(22, 'x'), `Mine ${n}`, { text: 't', duration: '600' }, 1)
    const created = savedMineEntry(ID, 'Created', { text: 't', duration: '600' }, 1)
    const names = (list: readonly LibraryEntry[]) => list.map((entry) => entry.name)

    it('puts the entry first among My builds without moving it ahead of earlier entries', () => {
        const list = [template, link, mineAt(1), template2(), mineAt(2)]
        expect(list.findIndex((entry) => entry.kind === 'mine')).toBeGreaterThan(0)
        expect(names(withCreatedEntry(list, created, ''))).toEqual(['T1', link.name, 'Created', 'Mine 1', 'T2', 'Mine 2'])
    })

    it('appends after every entry when the list holds no My builds', () => {
        expect(names(withCreatedEntry([template, link], created, ''))).toEqual(['T1', link.name, 'Created'])
    })

    it('replaces an entry with the same key instead of adding a second', () => {
        const stale = { ...created, name: 'Stale' }
        const result = withCreatedEntry([template, mineAt(1), stale, mineAt(2)], created, '')
        expect(names(result)).toEqual(['T1', 'Created', 'Mine 1', 'Mine 2'])
    })

    describe('at the cap', () => {
        const full = Array.from({ length: MY_BUILDS_MAX }, (_, n) => mineAt(n))
        const mineNames = (list: readonly LibraryEntry[]) => names(list.filter((entry) => entry.kind === 'mine'))

        it('drops the oldest My build, the last in list order', () => {
            const result = withCreatedEntry([template, ...full], created, '')
            expect(mineNames(result)).toHaveLength(MY_BUILDS_MAX)
            expect(mineNames(result)[0]).toBe('Created')
            expect(mineNames(result)).not.toContain(`Mine ${MY_BUILDS_MAX - 1}`)
            expect(names(result)[0]).toBe('T1')
        })

        it('keeps the selected entry when it is the oldest and drops the next oldest', () => {
            const oldest = full[MY_BUILDS_MAX - 1]
            const result = withCreatedEntry(full, created, oldest.key)
            expect(mineNames(result)).toHaveLength(MY_BUILDS_MAX)
            expect(mineNames(result)).toContain(oldest.name)
            expect(mineNames(result)).toContain('Created')
            expect(mineNames(result)).not.toContain(`Mine ${MY_BUILDS_MAX - 2}`)
        })

        it('does not trim a list below the cap', () => {
            expect(mineNames(withCreatedEntry(full.slice(1), created, ''))).toHaveLength(MY_BUILDS_MAX)
            expect(mineNames(withCreatedEntry(full.slice(1), created, ''))).toContain('Mine 1')
        })
    })

    function template2(): LibraryEntry {
        return templateEntries([{ name: 'T2', text: 'start -> boar' }])[0]
    }
})
