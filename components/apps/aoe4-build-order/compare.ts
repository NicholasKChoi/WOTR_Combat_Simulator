import { AGE_NAMES, type SimulationResult } from '../../../lib/aoe4-build-order/model'

export const KEY_TIMES = [600, 900, 1200] as const
const AGES = [2, 3, 4] as const

type KeyTime = (typeof KEY_TIMES)[number]
type KeyAge = (typeof AGES)[number]

export type KeyValue = { value: number } | { value: null; reason: 'run-ended' | 'not-reached' }

export interface KeyNumbers {
    militarySpent: Record<KeyTime, KeyValue>
    ageReachedAt: Record<KeyAge, KeyValue>
    populationCapReachedAt: KeyValue
}

export interface CompareRow {
    key: string
    label: string
    current: KeyValue
    pinned: KeyValue
    delta: number | null
    direction: 'better' | 'worse' | 'same' | null
}

const reachedValue = (value: number | null | undefined): KeyValue => (value == null ? { value: null, reason: 'not-reached' } : { value })

function militaryAt(result: SimulationResult, t: number): KeyValue {
    const i = result.times.indexOf(t)
    const spent = i < 0 ? undefined : result.spent.military[i]
    return spent === undefined ? { value: null, reason: 'run-ended' } : { value: spent }
}

export function keyNumbers(result: SimulationResult): KeyNumbers {
    const age = (a: KeyAge) => reachedValue(result.ages.find((entry) => entry.age === a)?.reachedAt)
    return {
        militarySpent: { 600: militaryAt(result, 600), 900: militaryAt(result, 900), 1200: militaryAt(result, 1200) },
        ageReachedAt: { 2: age(2), 3: age(3), 4: age(4) },
        populationCapReachedAt: reachedValue(result.populationCapReachedAt),
    }
}

export function compareRows(current: KeyNumbers, pinned: KeyNumbers): CompareRow[] {
    const row = (key: string, label: string, c: KeyValue, p: KeyValue, higherIsBetter: boolean): CompareRow => {
        const delta = c.value !== null && p.value !== null ? c.value - p.value : null
        return {
            key,
            label,
            current: c,
            pinned: p,
            delta,
            direction: delta === null ? null : delta === 0 ? 'same' : delta > 0 === higherIsBetter ? 'better' : 'worse',
        }
    }
    return [
        ...KEY_TIMES.map((t) =>
            row(`military-${t}`, `Military spent at ${t / 60} min`, current.militarySpent[t], pinned.militarySpent[t], true),
        ),
        ...AGES.map((a) => row(`age-${a}`, `${AGE_NAMES[a]} age reached`, current.ageReachedAt[a], pinned.ageReachedAt[a], false)),
        row('pop-cap', 'Population cap reached', current.populationCapReachedAt, pinned.populationCapReachedAt, false),
    ].filter((r) => r.current.value !== null || r.pinned.value !== null)
}
