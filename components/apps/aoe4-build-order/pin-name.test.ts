import { describe, expect, it } from 'vitest'
import type { PrebuiltBuild } from './build-input'
import { pinName, savedBuildName } from './pin-name'

const builds: PrebuiltBuild[] = [
    { name: 'A', text: 'start -> sheep' },
    { name: 'B', text: 'start -> boar' },
    { name: 'C', text: 'start -> sheep' },
]

describe('pinName', () => {
    it.each([
        ['exact match gives that build', builds, 'start -> boar', 'A', 'B'],
        ['identical texts give the first build', builds, 'start -> sheep', 'C', 'A'],
        ['one changed character is edited', builds, 'start -> sheep ', 'B', 'B (edited)'],
        ['empty text is edited', builds, '', 'B', 'B (edited)'],
        ['no builds is a custom build', [], 'start -> sheep', '', 'Custom build'],
    ])('%s', (_label, list, text, selected, expected) => {
        expect(pinName(list, text, selected)).toBe(expected)
    })
})

describe('savedBuildName', () => {
    const loaded: PrebuiltBuild = { name: 'Fast Castle (Zx3_k9-QaB0)', text: 'start -> loaded', buildName: 'Fast Castle' }
    const prebuilt: PrebuiltBuild[] = [{ name: 'English 1 TC', text: 'start -> sheep' }, { name: 'English 2 TC', text: 'start -> boar' }]
    const withLoaded = [loaded, ...prebuilt]
    const longName = 'n'.repeat(100)
    const editedLoaded: PrebuiltBuild = { name: 'Fast Castle (edited) (Aq1)', text: 'start -> x', buildName: 'Fast Castle (edited)' }
    const longLoaded: PrebuiltBuild = { name: `${longName} (Aq1)`, text: 'start -> y', buildName: longName }

    it.each<[string, readonly PrebuiltBuild[], string, string, string]>([
        ['prebuilt unchanged keeps its name', prebuilt, 'start -> sheep', 'English 1 TC', 'English 1 TC'],
        ['prebuilt edited', prebuilt, 'start -> sheep!', 'English 1 TC', 'English 1 TC (edited)'],
        ['loaded unchanged keeps its stored name, not the select label', withLoaded, 'start -> loaded', loaded.name, 'Fast Castle'],
        ['loaded edited', withLoaded, 'start -> changed', loaded.name, 'Fast Castle (edited)'],
        ['an edited stored name edited again does not stack', [editedLoaded, ...prebuilt], 'start -> z', editedLoaded.name, 'Fast Castle (edited)'],
        ['a 100-character stored name is cut to fit the suffix', [longLoaded], 'start -> z', longLoaded.name, `${'n'.repeat(91)} (edited)`],
        ['no builds is a custom build', [], 'start -> sheep', '', 'Custom build'],
        ['a selection that is no option is edited as typed', prebuilt, 'start -> z', 'Gone', 'Gone (edited)'],
    ])('%s', (_label, list, text, selected, expected) => {
        const name = savedBuildName(list, text, selected)
        expect(name).toBe(expected)
        expect(name.length).toBeLessThanOrEqual(100)
    })
})
