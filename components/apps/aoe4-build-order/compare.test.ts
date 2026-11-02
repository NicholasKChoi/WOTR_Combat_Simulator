import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { compareRows, keyNumbers, type KeyNumbers } from './compare'

function result(durationSeconds: number, over: Partial<SimulationResult> = {}): SimulationResult {
    const times: number[] = []
    for (let t = 0; t <= durationSeconds; t += 100) times.push(t)
    return {
        durationSeconds,
        times,
        spent: { villagers: [], military: times.map((t) => t * 2), buildings: [], research: [] },
        ages: [{ age: 2, reachedAt: 300.5 }, { age: 3, reachedAt: 700 }],
        populationCapReachedAt: null,
        ...over,
    } as SimulationResult
}

const numbers = (over: Partial<KeyNumbers> = {}): KeyNumbers => ({
    militarySpent: { 600: 1, 900: 2, 1200: 3 },
    ageReachedAt: { 2: 10, 3: 20, 4: 30 },
    populationCapReachedAt: 40,
    ...over,
})

describe('keyNumbers', () => {
    it('reads military spent at the key sample and null past the duration', () => {
        expect(keyNumbers(result(700)).militarySpent).toEqual({ 600: 1200, 900: null, 1200: null })
    })

    it('reads each age from its ages entry and null for an age not reached', () => {
        expect(keyNumbers(result(700)).ageReachedAt).toEqual({ 2: 300.5, 3: 700, 4: null })
    })

    it.each([null, 0, 512.5])('copies populationCapReachedAt %s', (value) => {
        expect(keyNumbers(result(700, { populationCapReachedAt: value })).populationCapReachedAt).toBe(value)
    })
})

describe('compareRows', () => {
    it('returns seven rows in key order', () => {
        expect(compareRows(numbers(), numbers()).map((r) => r.key)).toEqual([
            'military-600', 'military-900', 'military-1200', 'age-2', 'age-3', 'age-4', 'pop-cap',
        ])
    })

    it('maps each row to its own value', () => {
        const rows = compareRows(numbers(), numbers({ ageReachedAt: { 2: 1, 3: 2, 4: 3 } }))
        expect(rows.map((r) => [r.current, r.pinned])).toEqual([
            [1, 1], [2, 2], [3, 3], [10, 1], [20, 2], [30, 3], [40, 40],
        ])
    })

    it.each([
        [10, 4, 6],
        [10, null, null],
        [null, 4, null],
        [null, null, null],
        [0, 5, -5],
    ])('delta of current %s and pinned %s is %s', (current, pinned, delta) => {
        const row = compareRows(numbers({ populationCapReachedAt: current }), numbers({ populationCapReachedAt: pinned }))[6]
        expect(row).toMatchObject({ current, pinned, delta })
    })
})
