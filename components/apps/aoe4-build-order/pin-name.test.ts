import { describe, expect, it } from 'vitest'
import type { PrebuiltBuild } from './build-input'
import { pinName } from './pin-name'

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
