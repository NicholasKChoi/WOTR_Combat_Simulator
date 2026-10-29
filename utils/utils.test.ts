import { describe, expect, it } from 'vitest'
import { shuffle } from './utils'

const byValue = (a: number, b: number) => a - b

describe('shuffle', () => {
    it('keeps the same elements, including duplicates', () => {
        const input = [3, 1, 4, 1, 5, 9, 2, 6]
        const result = shuffle(input)
        expect(result).toHaveLength(input.length)
        expect([...result].sort(byValue)).toEqual([...input].sort(byValue))
    })

    it('does not mutate the input', () => {
        const input = [3, 1, 4, 1, 5, 9, 2, 6]
        shuffle(input)
        expect(input).toEqual([3, 1, 4, 1, 5, 9, 2, 6])
    })

    it('returns a new array', () => {
        const input = [1, 2, 3]
        expect(shuffle(input)).not.toBe(input)
    })

    it('returns an empty array for an empty input', () => {
        expect(shuffle([])).toEqual([])
    })
})
