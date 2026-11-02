import { describe, expect, it } from 'vitest'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { compareRows, keyNumbers, type KeyNumbers, type KeyValue } from './compare'

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

const v = (value: number): KeyValue => ({ value })
const NOT_REACHED: KeyValue = { value: null, reason: 'not-reached' }
const RUN_ENDED: KeyValue = { value: null, reason: 'run-ended' }

const numbers = (over: Partial<KeyNumbers> = {}): KeyNumbers => ({
    militarySpent: { 600: v(1), 900: v(2), 1200: v(3) },
    ageReachedAt: { 2: v(10), 3: v(20), 4: v(30) },
    populationCapReachedAt: v(40),
    ...over,
})

describe('keyNumbers', () => {
    it('reads military spent at the key sample and run-ended past the duration', () => {
        expect(keyNumbers(result(700)).militarySpent).toEqual({ 600: v(1200), 900: RUN_ENDED, 1200: RUN_ENDED })
    })

    it('reads each age from its ages entry and not-reached for an age not reached', () => {
        expect(keyNumbers(result(700)).ageReachedAt).toEqual({ 2: v(300.5), 3: v(700), 4: NOT_REACHED })
    })

    it.each([
        [null, NOT_REACHED],
        [0, v(0)],
        [512.5, v(512.5)],
    ])('maps populationCapReachedAt %s', (value, expected) => {
        expect(keyNumbers(result(700, { populationCapReachedAt: value })).populationCapReachedAt).toEqual(expected)
    })
})

describe('compareRows', () => {
    it('returns seven rows in key order', () => {
        expect(compareRows(numbers(), numbers()).map((r) => r.key)).toEqual([
            'military-600', 'military-900', 'military-1200', 'age-2', 'age-3', 'age-4', 'pop-cap',
        ])
    })

    it('maps each row to its own value', () => {
        const rows = compareRows(numbers(), numbers({ ageReachedAt: { 2: v(1), 3: v(2), 4: v(3) } }))
        expect(rows.map((r) => [r.current, r.pinned])).toEqual([
            [v(1), v(1)], [v(2), v(2)], [v(3), v(3)], [v(10), v(1)], [v(20), v(2)], [v(30), v(3)], [v(40), v(40)],
        ])
    })

    it.each([
        [v(10), v(4), 6],
        [v(10), NOT_REACHED, null],
        [RUN_ENDED, v(4), null],
        [v(0), v(5), -5],
    ])('delta of current %j and pinned %j is %s', (current, pinned, delta) => {
        const row = compareRows(numbers({ populationCapReachedAt: current }), numbers({ populationCapReachedAt: pinned }))[6]
        expect(row).toMatchObject({ current, pinned, delta })
    })

    it('omits only the rows where both sides are blank and keeps the order', () => {
        const blank = numbers({
            militarySpent: { 600: v(1), 900: RUN_ENDED, 1200: RUN_ENDED },
            ageReachedAt: { 2: v(10), 3: NOT_REACHED, 4: NOT_REACHED },
            populationCapReachedAt: NOT_REACHED,
        })
        const other = numbers({ ageReachedAt: { 2: v(10), 3: v(20), 4: NOT_REACHED }, populationCapReachedAt: NOT_REACHED })
        expect(compareRows(blank, blank).map((r) => r.key)).toEqual(['military-600', 'age-2'])
        expect(compareRows(blank, other).map((r) => r.key)).toEqual(['military-600', 'military-900', 'military-1200', 'age-2', 'age-3'])
    })

    it('returns no rows when every row is blank on both sides', () => {
        const blank = numbers({
            militarySpent: { 600: RUN_ENDED, 900: RUN_ENDED, 1200: RUN_ENDED },
            ageReachedAt: { 2: NOT_REACHED, 3: NOT_REACHED, 4: NOT_REACHED },
            populationCapReachedAt: NOT_REACHED,
        })
        expect(compareRows(blank, blank)).toEqual([])
    })

    it.each([
        ['military-600', 5, 3, 'better'],
        ['military-600', 3, 5, 'worse'],
        ['age-2', 5, 3, 'worse'],
        ['age-2', 3, 5, 'better'],
        ['pop-cap', 3, 5, 'better'],
        ['pop-cap', 5, 3, 'worse'],
        ['pop-cap', 5, 5, 'same'],
        ['military-600', 5, 5, 'same'],
    ])('direction of %s with current %s and pinned %s is %s', (key, current, pinned, direction) => {
        const side = (n: number): KeyNumbers =>
            numbers({
                militarySpent: { 600: v(n), 900: v(n), 1200: v(n) },
                ageReachedAt: { 2: v(n), 3: v(n), 4: v(n) },
                populationCapReachedAt: v(n),
            })
        expect(compareRows(side(current), side(pinned)).find((r) => r.key === key)?.direction).toBe(direction)
    })

    it('has a null direction when either value is missing', () => {
        const row = compareRows(numbers({ populationCapReachedAt: NOT_REACHED }), numbers())[6]
        expect(row.direction).toBeNull()
    })
})
