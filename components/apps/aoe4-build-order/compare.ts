import { AGE_NAMES, type SimulationResult } from '../../../lib/aoe4-build-order/model'

export const KEY_TIMES = [600, 900, 1200] as const
const AGES = [2, 3, 4] as const

type KeyTime = (typeof KEY_TIMES)[number]
type KeyAge = (typeof AGES)[number]

export interface KeyNumbers {
    militarySpent: Record<KeyTime, number | null>
    ageReachedAt: Record<KeyAge, number | null>
    populationCapReachedAt: number | null
}

export interface CompareRow {
    key: string
    label: string
    current: number | null
    pinned: number | null
    delta: number | null
}

function militaryAt(result: SimulationResult, t: number): number | null {
    const i = result.times.indexOf(t)
    return i < 0 ? null : result.spent.military[i]
}

export function keyNumbers(result: SimulationResult): KeyNumbers {
    const age = (a: KeyAge) => result.ages.find((entry) => entry.age === a)?.reachedAt ?? null
    return {
        militarySpent: { 600: militaryAt(result, 600), 900: militaryAt(result, 900), 1200: militaryAt(result, 1200) },
        ageReachedAt: { 2: age(2), 3: age(3), 4: age(4) },
        populationCapReachedAt: result.populationCapReachedAt,
    }
}

export function compareRows(current: KeyNumbers, pinned: KeyNumbers): CompareRow[] {
    const row = (key: string, label: string, c: number | null, p: number | null): CompareRow => ({
        key,
        label,
        current: c,
        pinned: p,
        delta: c !== null && p !== null ? c - p : null,
    })
    return [
        ...KEY_TIMES.map((t) =>
            row(`military-${t}`, `Military spent at ${t / 60} min`, current.militarySpent[t], pinned.militarySpent[t]),
        ),
        ...AGES.map((a) => row(`age-${a}`, `${AGE_NAMES[a]} age reached`, current.ageReachedAt[a], pinned.ageReachedAt[a])),
        row('pop-cap', 'Population cap reached', current.populationCapReachedAt, pinned.populationCapReachedAt),
    ]
}
