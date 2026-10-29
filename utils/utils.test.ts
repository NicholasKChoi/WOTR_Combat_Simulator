import { describe, expect, it } from 'vitest'
import { shuffle } from './utils'

describe('shuffle', () => {
    it('keeps the same elements, including duplicates', () => {
        const input = [1, 2, 2, 3, 4, 5]
        const result = shuffle(input)
        expect(result).toHaveLength(input.length)
        expect([...result].sort()).toEqual([...input].sort())
    })

    it('does not mutate the input', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8]
        const snapshot = [...input]
        shuffle(input)
        expect(input).toEqual(snapshot)
    })

    it('returns a new array', () => {
        const input = [1, 2, 3]
        expect(shuffle(input)).not.toBe(input)
    })

    it('returns an empty array for an empty input', () => {
        expect(shuffle([])).toEqual([])
    })
})
