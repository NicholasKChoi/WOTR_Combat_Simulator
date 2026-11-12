import { describe, expect, it } from 'vitest'
import { dropIndexAt } from './chart-drag'

describe('dropIndexAt', () => {
    it.each([
        ['above every midpoint', [10, 20, 30], 5, 0],
        ['below every midpoint', [10, 20, 30], 40, 3],
        ['between two midpoints', [10, 20, 30], 25, 2],
        ['exactly on a midpoint', [10, 20], 10, 0],
        ['exactly on a later midpoint', [10, 20, 30], 20, 1],
        ['an empty list', [], 15, 0],
    ])('%s', (_label, midpoints, pointerY, expected) => {
        expect(dropIndexAt(midpoints, pointerY)).toBe(expected)
    })
})
