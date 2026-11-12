import { describe, expect, it } from 'vitest'
import type { PinnedSeries } from './chart-rows'
import { pinnedLegendShown } from './chart-legend'

const pinnedOf = (...keys: string[]): PinnedSeries => ({ times: [0, 5], series: keys.map((key) => ({ key, name: key, values: [1, 2] })) })

describe('pinnedLegendShown', () => {
    it.each([
        ['no pinned run and no age-ups', undefined, [], 0, false],
        ['one pinned series not hidden', pinnedOf('a'), [], 0, true],
        ['the only pinned series hidden and no age-ups', pinnedOf('a'), ['a'], 0, false],
        ['the only pinned series hidden with a pinned age-up', pinnedOf('a'), ['a'], 1, true],
        ['two pinned series with one hidden', pinnedOf('a', 'b'), ['a'], 0, true],
        ['a pinned age-up and no pinned run', undefined, [], 1, true],
        ['a hidden key the pinned run does not have', pinnedOf('a'), ['b'], 0, true],
    ])('%s', (_, pinned, hidden, ageUps, expected) => {
        expect(pinnedLegendShown(pinned, new Set(hidden), ageUps)).toBe(expected)
    })
})
