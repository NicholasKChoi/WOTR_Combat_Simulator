import { describe, expect, it } from 'vitest'

import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import { issueLines, lineCount } from './text-lines'

describe('lineCount', () => {
    it.each([
        ['', 1],
        ['a\nb', 2],
        ['a\n', 2],
        ['a\n\nb', 3],
    ])('counts %j as %i', (text, expected) => {
        expect(lineCount(text)).toBe(expected)
    })
})

describe('issueLines', () => {
    const issue = (line?: number): BuildOrderIssue => ({ code: 'syntax', message: 'bad', line })

    it.each([
        ['no issues', [], []],
        ['sorted and unique', [5, 2, 5], [2, 5]],
        ['issues without a line skipped', [3, undefined, 1], [1, 3]],
        ['only issues without a line', [undefined, undefined], []],
    ])('%s', (_name, lines, expected) => {
        expect(issueLines(lines.map(issue))).toEqual(expected)
    })
})
