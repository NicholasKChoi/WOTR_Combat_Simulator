import { describe, expect, it } from 'vitest'
import { formatMinSec } from './format-time'

describe('formatMinSec', () => {
    it.each([[0, '0:00'], [5, '0:05'], [65, '1:05'], [3600, '60:00']])('formats %d as %s', (s, expected) => {
        expect(formatMinSec(s)).toBe(expected)
    })
})
