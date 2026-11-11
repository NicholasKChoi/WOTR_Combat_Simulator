import { describe, expect, it } from 'vitest'
import { entryKey, templateEntries, type LibraryEntry } from './build-library'
import { savedBuildName } from './pin-name'

const LINK_ID = 'Zx3_k9-QaB0'

function linkWith(name: string, text: string): LibraryEntry {
    return { key: entryKey.link(LINK_ID), kind: 'link', name, id: LINK_ID, loaded: { text, duration: '900', revision: null } }
}

describe('savedBuildName', () => {
    const templates = templateEntries([
        { name: 'English 1 TC', text: 'start -> sheep' },
        { name: 'English 2 TC', text: 'start -> boar' },
    ])
    const first = templates[0].key
    const opened = linkWith('Fast Castle', 'start -> loaded')
    const editedName = linkWith('Fast Castle (edited)', 'start -> x')
    const longName = linkWith('n'.repeat(100), 'start -> y')
    const unloaded: LibraryEntry = { key: entryKey.named('A'.repeat(22)), kind: 'mine', name: 'Mine', id: 'A'.repeat(22), loaded: null }

    it.each<[string, readonly LibraryEntry[], string, string, string]>([
        ['a template unchanged keeps its name', templates, 'start -> sheep', first, 'English 1 TC'],
        ['a template edited', templates, 'start -> sheep!', first, 'English 1 TC (edited)'],
        ['the same text as an opened link gives its stored name, not the select label', [opened, ...templates], 'start -> loaded', first, 'Fast Castle'],
        ['an opened link with a template\'s text keeps its own name while selected', [...templates, linkWith('Fast Castle', 'start -> sheep')], 'start -> sheep', opened.key, 'Fast Castle'],
        ['an opened link edited', [opened, ...templates], 'start -> changed', opened.key, 'Fast Castle (edited)'],
        ['an edited stored name edited again does not stack', [editedName, ...templates], 'start -> z', editedName.key, 'Fast Castle (edited)'],
        ['a 100-character name is cut to fit the suffix', [longName], 'start -> z', longName.key, `${'n'.repeat(91)} (edited)`],
        ['a selected key that is no entry is a custom build', templates, 'start -> z', 'template:Gone', 'Custom build'],
        ['no entries is a custom build', [], 'start -> sheep', first, 'Custom build'],
        ['an unloaded entry never matches empty text', [unloaded], '', unloaded.key, 'Mine (edited)'],
    ])('%s', (_label, entries, text, selectedKey, expected) => {
        const name = savedBuildName(entries, text, selectedKey)
        expect(name).toBe(expected)
        expect(name.length).toBeLessThanOrEqual(100)
    })
})
