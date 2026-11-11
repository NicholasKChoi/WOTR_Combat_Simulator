import { describe, expect, it } from 'vitest'
import { LIBRARY_GROUPS, copyName, entryKey, entryLabel, isEdited, mineEntries, runName, templateEntries, type LibraryEntry } from './build-library'
import type { MyBuildEntry } from './my-builds-storage'

const ID = 'a'.repeat(22)

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
            { id: 'b'.repeat(22), name: 'A', editSecret: 'S'.repeat(43), revision: 1, updatedAt: '2026-11-10T09:00:00Z' },
        ]
        expect(mineEntries(stored)).toEqual([
            { key: `named:${ID}`, kind: 'mine', name: 'B', id: ID, loaded: null },
            { key: `named:${'b'.repeat(22)}`, kind: 'mine', name: 'A', id: 'b'.repeat(22), loaded: null },
        ])
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
