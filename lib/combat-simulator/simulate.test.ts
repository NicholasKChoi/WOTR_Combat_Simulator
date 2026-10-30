import { describe, expect, it } from 'vitest'
import { Army, BaseArmy } from './army'
import { Battle, DiceRoller, OUTCOME_KINDS, battleOutcome } from './battle'
import { BattleRecord, MAX_BATTLES, OutcomeAccumulator, simulateBattles } from './simulate'

function record(outcome: string, overrides: Partial<BattleRecord> = {}): BattleRecord {
    const rounds = overrides.rounds ?? 1
    return {
        outcome,
        rounds,
        winner: outcome === 'attacker' || outcome === 'defender' ? { regulars: 1, elites: 0 } : undefined,
        attackHitsPerRound: Array(rounds).fill(0),
        defendHitsPerRound: Array(rounds).fill(0),
        ...overrides,
    }
}

function summarize(records: BattleRecord[], kinds?: readonly string[]) {
    const accumulator = new OutcomeAccumulator(kinds)
    records.forEach((r) => accumulator.record(r))
    return accumulator.summary()
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0)

// Call i of every battle's run gets faces[i % faces.length] on every die. With no leaders the
// leader calls roll 0 dice, so a 4-entry cycle lines up with one round.
function cyclingRoller(faces: number[]): DiceRoller {
    let call = 0
    return (numDice) => Array(numDice).fill(faces[call++ % faces.length])
}

// Every combat roll scores exactly one hit, independent of call history.
const oneHitPerRoll: DiceRoller = (numDice) => (numDice === 0 ? [] : [6, ...Array(numDice - 1).fill(1)])

describe('outcomes', () => {
    it('counts each kind in OUTCOME_KINDS order, including kinds with no battles', () => {
        const summary = summarize([record('defender'), record('attacker'), record('attacker'), record('defender'), record('attacker')])
        expect(Object.keys(summary.outcomes)).toEqual([...OUTCOME_KINDS])
        expect(summary.outcomes.attacker).toEqual({ count: 3, frequency: 0.6 })
        expect(summary.outcomes.defender).toEqual({ count: 2, frequency: 0.4 })
        expect(summary.outcomes.tie).toEqual({ count: 0, frequency: 0 })
        expect(summary.battles).toBe(5)
    })

    it('has counts summing to N and frequencies summing to 1', () => {
        const kinds = ['attacker', 'tie', 'defender', 'tie', 'attacker', 'tie', 'attacker']
        const summary = summarize(kinds.map((k) => record(k)))
        const tallies = Object.values(summary.outcomes)
        expect(sum(tallies.map((t) => t.count))).toBe(kinds.length)
        expect(sum(tallies.map((t) => t.frequency))).toBeCloseTo(1, 9)
    })

    it('adds one entry per kind in an extended kind list', () => {
        const kinds = [...OUTCOME_KINDS, 'extra']
        const summary = summarize(
            [record('extra'), record('tie'), record('attacker'), record('extra'), record('defender')],
            kinds,
        )
        expect(Object.keys(summary.outcomes)).toEqual(kinds)
        expect(summary.outcomes['extra']).toEqual({ count: 2, frequency: 0.4 })
        expect(summary.outcomes.attacker.count).toBe(1)
        expect(summary.outcomes.defender.count).toBe(1)
        expect(summary.outcomes.tie.count).toBe(1)
    })

    it('throws on a kind not in the list', () => {
        expect(() => new OutcomeAccumulator().record(record('extra'))).toThrow(/extra/)
    })

    it('throws when a side wins without its surviving units', () => {
        expect(() => new OutcomeAccumulator().record(record('attacker', { winner: undefined }))).toThrow()
    })

    it('refuses to summarize zero battles', () => {
        expect(() => new OutcomeAccumulator().summary()).toThrow()
    })
})

describe('rounds', () => {
    const roundsOf = (counts: number[]) => summarize(counts.map((rounds) => record('tie', { rounds }))).rounds

    it('uses nearest-rank percentiles over unsorted input', () => {
        expect(roundsOf([7, 3, 10, 1, 5, 9, 2, 8, 6, 4])).toEqual({ mean: 5.5, median: 5, p10: 1, p90: 9 })
    })

    it('gives the single value for N = 1', () => {
        expect(roundsOf([4])).toEqual({ mean: 4, median: 4, p10: 4, p90: 4 })
    })

    it('gives p10 3, median 15 and p90 27 for N = 30', () => {
        const rounds = roundsOf(Array.from({ length: 30 }, (_, i) => 30 - i))
        expect([rounds.p10, rounds.median, rounds.p90]).toEqual([3, 15, 27])
    })

    it('includes every outcome', () => {
        const summary = summarize([record('attacker', { rounds: 2 }), record('defender', { rounds: 4 }), record('tie', { rounds: 6 })])
        expect(summary.rounds.mean).toBe(4)
        expect(summary.rounds.median).toBe(4)
    })
})

describe('survivors', () => {
    const win = (side: string, regulars: number, elites: number) => record(side, { winner: { regulars, elites } })

    it('tallies each (regulars, elites) combination per winning side in the pinned order', () => {
        const summary = summarize([
            win('attacker', 1, 1),
            win('attacker', 2, 0),
            win('attacker', 0, 2),
            win('attacker', 2, 0),
            win('attacker', 1, 1),
            win('attacker', 3, 0),
            win('attacker', 0, 3),
            record('tie'),
            win('defender', 4, 0),
        ])
        expect(summary.survivors.attacker.map(({ regulars, elites, count }) => [regulars, elites, count])).toEqual([
            [2, 0, 2],
            [1, 1, 2],
            [3, 0, 1],
            [0, 3, 1],
            [0, 2, 1],
        ])
        expect(sum(summary.survivors.attacker.map((s) => s.count))).toBe(summary.outcomes.attacker.count)
        expect(sum(summary.survivors.attacker.map((s) => s.frequency))).toBeCloseTo(1, 9)
        expect(summary.survivors.attacker[0].frequency).toBeCloseTo(2 / 7, 12)
        expect(summary.survivors.defender).toEqual([{ regulars: 4, elites: 0, count: 1, frequency: 1 }])
    })

    it('gives [] for a side with no wins and ignores ties', () => {
        const summary = summarize([win('defender', 1, 0), record('tie', { winner: { regulars: 9, elites: 9 } })])
        expect(summary.survivors.attacker).toEqual([])
        expect(summary.survivors.defender).toEqual([{ regulars: 1, elites: 0, count: 1, frequency: 1 }])
    })
})

describe('hits per round', () => {
    it('pools per-round hit counts over all rounds of all battles', () => {
        const summary = summarize([
            record('attacker', { rounds: 2, attackHitsPerRound: [0, 5], defendHitsPerRound: [1, 1] }),
            record('defender', { rounds: 1, attackHitsPerRound: [5], defendHitsPerRound: [2] }),
        ])
        expect(summary.hitsPerRound.attacker).toEqual([1 / 3, 0, 0, 0, 0, 2 / 3])
        expect(summary.hitsPerRound.defender).toEqual([0, 2 / 3, 1 / 3, 0, 0, 0])
        for (const shares of Object.values(summary.hitsPerRound)) {
            expect(sum(shares)).toBeCloseTo(1, 9)
        }
    })

    it('throws on a hit count above 5 without recording the battle', () => {
        const accumulator = new OutcomeAccumulator()
        expect(() => accumulator.record(record('tie', { attackHitsPerRound: [6] }))).toThrow(/6/)
        expect(() => accumulator.summary()).toThrow()
    })

    it('throws when the hit arrays do not match the round count', () => {
        expect(() => new OutcomeAccumulator().record(record('tie', { rounds: 2, defendHitsPerRound: [1] }))).toThrow()
    })
})

describe('simulateBattles', () => {
    const attack: Army = { regulars: 3, elites: 0, leaders: 0 }
    const defend: Army = { regulars: 2, elites: 0, leaders: 0 }

    it('starts every battle from the input counts', () => {
        const first = new BaseArmy(3, 0, 0)
        const second = new BaseArmy(2, 0, 0)
        const expected = Battle(first, second, oneHitPerRoll)
        expect([battleOutcome(first, second), expected.rounds, first.regulars]).toEqual(['attacker', 2, 1])

        const one = simulateBattles(attack, defend, 1, oneHitPerRoll)
        const two = simulateBattles(attack, defend, 2, oneHitPerRoll)
        expect(two.battles).toBe(2)
        expect(two.outcomes).toEqual({
            attacker: { count: 2, frequency: 1 },
            defender: { count: 0, frequency: 0 },
            tie: { count: 0, frequency: 0 },
        })
        expect(two.rounds).toEqual(one.rounds)
        expect(two.rounds).toEqual({ mean: 2, median: 2, p10: 2, p90: 2 })
        expect(two.survivors.attacker).toEqual([{ regulars: 1, elites: 0, count: 2, frequency: 1 }])
        expect(two.hitsPerRound).toEqual(one.hitsPerRound)
    })

    it('does not mutate the input counts', () => {
        simulateBattles(attack, defend, 3, oneHitPerRoll)
        expect(attack).toEqual({ regulars: 3, elites: 0, leaders: 0 })
    })

    it.each([
        { faces: [6, 1, 1, 1], kind: 'attacker' },
        { faces: [1, 6, 1, 1], kind: 'defender' },
        { faces: [6, 6, 1, 1], kind: 'tie' },
    ])('classifies every battle with rolls $faces as $kind', ({ faces, kind }) => {
        const summary = simulateBattles({ regulars: 2, elites: 0, leaders: 0 }, { regulars: 2, elites: 0, leaders: 0 }, 4, cyclingRoller(faces))
        expect(summary.battles).toBe(4)
        expect(summary.outcomes[kind].count).toBe(4)
        expect(sum(Object.values(summary.outcomes).map((t) => t.count))).toBe(4)
        expect(summary.rounds).toEqual({ mean: 1, median: 1, p10: 1, p90: 1 })
    })

    it.each([0, -1, 1.5, MAX_BATTLES + 1])('rejects %s battles', (battles) => {
        expect(() => simulateBattles(attack, defend, battles, oneHitPerRoll)).toThrow(RangeError)
    })
})
