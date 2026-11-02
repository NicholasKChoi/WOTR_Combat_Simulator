import { describe, expect, it } from 'vitest'

import { lineCount } from './text-lines'

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
