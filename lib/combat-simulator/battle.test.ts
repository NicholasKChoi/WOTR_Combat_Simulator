import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseArmy } from './army'
import {
    Battle,
    BattleResult,
    DiceRoller,
    OUTCOME_KINDS,
    battleOutcome,
    resolveRound,
    rollDice,
    shouldStop,
} from './battle'

// An entry is either the exact faces for one call or a face shown on every die of that call.
type Script = (number[] | number)[]

function scriptedRoller(script: Script) {
    const calls: number[] = []
    const remaining = [...script]
    const roll: DiceRoller = (numDice) => {
        calls.push(numDice)
        const entry = remaining.shift()
        if (entry === undefined) {
            throw new Error(`roller script ran out at call ${calls.length}`)
        }
        if (typeof entry === 'number') {
            return Array(numDice).fill(entry)
        }
        if (entry.length !== numDice) {
            throw new Error(`call ${calls.length} asked for ${numDice} dice, script has ${entry.length}`)
        }
        return entry
    }
    return { roll, calls }
}

const army = (regulars: number, elites: number, leaders = 0) => new BaseArmy(regulars, elites, leaders)
const counts = (a: BaseArmy) => [a.regulars, a.elites]

function playRound(attack: BaseArmy, defend: BaseArmy, script: Script) {
    const battle = new BattleResult(attack, defend)
    const roller = scriptedRoller(script)
    resolveRound(battle, roller.roll)
    return { battle, calls: roller.calls }
}

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('combat dice', () => {
    it('rolls at most 5 combat dice per side', () => {
        const { calls } = playRound(army(10, 0), army(10, 0), [1, 1, 1, 1])
        expect(calls.slice(0, 2)).toEqual([5, 5])
    })

    it('rolls 5 dice for a 5-unit army and one die per unit below that', () => {
        expect(playRound(army(3, 2), army(1, 0), [1, 1, 1, 1]).calls[0]).toBe(5)
        expect(playRound(army(3, 0), army(1, 0), [1, 1, 1, 1]).calls[0]).toBe(3)
    })
})

describe('leader rerolls', () => {
    it.each([
        { misses: 5, leaders: 5, expected: 5 },
        { misses: 5, leaders: 2, expected: 2 },
        { misses: 3, leaders: 5, expected: 3 },
        { misses: 0, leaders: 5, expected: 0 },
    ])('rerolls $expected dice with $misses misses and $leaders leaders', ({ misses, leaders, expected }) => {
        const combatFaces = [...Array(misses).fill(1), ...Array(5 - misses).fill(6)]
        const { calls } = playRound(army(5, 0, leaders), army(1, 0), [combatFaces, 1, 1, 1])
        expect(calls[2]).toBe(expected)
    })
})

describe('hits per round', () => {
    it('scores at most 5 hits per side when every die hits', () => {
        const roller = scriptedRoller(Array(8).fill(6))
        const battle = Battle(army(10, 0, 5), army(10, 0, 5), roller.roll)
        expect(battle.attackHitsPerRound[0]).toBe(5)
        expect(battle.defendHitsPerRound[0]).toBe(5)
        for (const hits of [...battle.attackHitsPerRound, ...battle.defendHitsPerRound]) {
            expect(hits).toBeLessThanOrEqual(5)
        }
    })

    it('scores at most 5 hits per side when every hit comes from leader rerolls', () => {
        const { battle, calls } = playRound(army(10, 0, 5), army(10, 0, 5), [1, 1, 6, 6])
        expect(calls).toEqual([5, 5, 5, 5])
        expect(battle.attackHitsPerRound).toEqual([5])
        expect(battle.defendHitsPerRound).toEqual([5])
    })
})

describe('resolveRound', () => {
    it('plays exactly one round and records it', () => {
        const attack = army(3, 0)
        const defend = army(2, 0)
        const { battle, calls } = playRound(attack, defend, [[6, 6, 1], [6, 1], [], []])
        expect(calls).toEqual([3, 2, 0, 0])
        expect(battle.rounds).toBe(1)
        expect(battle.attackHitsPerRound).toEqual([2])
        expect(battle.defendHitsPerRound).toEqual([1])
        expect(counts(attack)).toEqual([2, 0])
        expect(counts(defend)).toEqual([0, 0])
    })

    it('applies both sides\' casualties after both sides roll', () => {
        const attack = army(1, 0)
        const defend = army(1, 0)
        const { battle } = playRound(attack, defend, [[6], [6], [], []])
        expect(counts(attack)).toEqual([0, 0])
        expect(counts(defend)).toEqual([0, 0])
        expect(battle.attackHitsPerRound).toEqual([1])
        expect(battle.defendHitsPerRound).toEqual([1])
    })
})

describe('shouldStop', () => {
    it.each([
        { attack: [1, 0], defend: [0, 1], expected: false },
        { attack: [0, 0], defend: [1, 0], expected: true },
        { attack: [1, 0], defend: [0, 0], expected: true },
        { attack: [0, 0], defend: [0, 0], expected: true },
    ])('is $expected for attack $attack vs defend $defend', ({ attack, defend, expected }) => {
        const battle = new BattleResult(army(attack[0], attack[1], 2), army(defend[0], defend[1], 2))
        expect(shouldStop(battle, {})).toBe(expected)
    })
})

describe('battleOutcome', () => {
    it.each([
        { attack: [1, 0], defend: [0, 0], expected: 'attacker' },
        { attack: [0, 0], defend: [1, 0], expected: 'defender' },
        { attack: [0, 0], defend: [0, 0], expected: 'tie' },
    ])('is $expected for attack $attack vs defend $defend', ({ attack, defend, expected }) => {
        const outcome = battleOutcome(army(attack[0], attack[1]), army(defend[0], defend[1]))
        expect(outcome).toBe(expected)
        expect(OUTCOME_KINDS).toContain(outcome)
    })

    it('throws while both armies are alive', () => {
        expect(() => battleOutcome(army(1, 0), army(1, 0))).toThrow()
    })
})

describe('Battle', () => {
    it('plays rounds until a side is eliminated', () => {
        const roller = scriptedRoller([[1], [1], [], [], [6], [1], [], []])
        const battle = Battle(army(1, 0), army(1, 0), roller.roll)
        expect(battle.rounds).toBe(2)
        expect(roller.calls).toHaveLength(8)
        expect(battle.getStats().survivor).toBe('attack')
    })

    it('reports a tie when both sides are eliminated in the same round', () => {
        const battle = Battle(army(1, 0), army(1, 0), scriptedRoller([[6], [6], [], []]).roll)
        expect(battle.rounds).toBe(1)
        expect(battle.getStats().survivor).toBe('n/a')
    })

    it('reports a defender win', () => {
        const battle = Battle(army(1, 0), army(1, 0), scriptedRoller([[1], [6], [], []]).roll)
        expect(battle.getStats().survivor).toBe('defend')
    })

    it('rolls with rollDice when no roller is given', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.99)
        const battle = Battle(army(1, 0), army(1, 0))
        expect(battle.rounds).toBe(1)
        expect(battle.getStats().survivor).toBe('n/a')
    })
})

describe('rollDice', () => {
    it('rolls the requested number of six-sided dice', () => {
        vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999).mockReturnValueOnce(0.5)
        expect(rollDice(3)).toEqual([1, 6, 4])
    })
})
