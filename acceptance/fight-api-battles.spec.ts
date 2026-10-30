import { test, expect, type APIResponse } from '@playwright/test'
import { armies, postFight, type FightBody } from './helpers'

const VALID = armies([5, 2, 1], [3, 3, 0])
const TIME_BUDGET_MS = 10_000

const OUTCOME_KEYS = ['attacker', 'defender', 'tie']
const SURVIVOR_KEYS = ['count', 'elites', 'frequency', 'regulars']

type Survivor = { regulars: number; elites: number; count: number; frequency: number }

function sorted(value: object) {
  return Object.keys(value).sort()
}

function sumOf(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

function allNumbers(value: unknown): number[] {
  if (typeof value === 'number') return [value]
  if (value && typeof value === 'object') return Object.values(value).flatMap(allNumbers)
  return []
}

async function ok(response: APIResponse) {
  expect(response.status()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  // next dev compiles the route on first hit.
  await postFight(request, { ...VALID, battles: 1 })
})

test.describe('battles field', () => {
  test('absent battles runs 1000 battles whose outcomes sum to 1000', async ({ request }) => {
    const body = await ok(await postFight(request, VALID))
    expect(body.battles).toBe(1000)
    const { attacker, defender, tie } = body.outcomes
    expect(attacker.count + defender.count + tie.count).toBe(1000)
  })

  const accepted: [string, unknown, number][] = [
    ['1', 1, 1],
    ['"1"', '1', 1],
    ['100000', 100000, 100000],
    ['"100000"', '100000', 100000],
    ['JSON 1e3', 1e3, 1000],
    ['"0010"', '0010', 10],
  ]
  for (const [label, value, expected] of accepted) {
    test(`battles = ${label} runs ${expected} battles`, async ({ request }) => {
      const body = await ok(await postFight(request, { ...VALID, battles: value }, TIME_BUDGET_MS * 2))
      expect(body.battles).toBe(expected)
      const { attacker, defender, tie } = body.outcomes
      expect(attacker.count + defender.count + tie.count).toBe(expected)
    })
  }

  const rejected: [string, unknown][] = [
    ['0', 0],
    ['-1', -1],
    ['100001', 100001],
    ['1.5', 1.5],
    ['"1.5"', '1.5'],
    ['"abc"', 'abc'],
    ['""', ''],
    ['"1e3"', '1e3'],
    ['" 5"', ' 5'],
    ['"+5"', '+5'],
    ['null', null],
    ['true', true],
    ['"0"', '0'],
    ['"100001"', '100001'],
    ['an array', [5]],
    ['an object', { n: 5 }],
  ]
  for (const [label, value] of rejected) {
    test(`battles = ${label} is rejected naming battles`, async ({ request }) => {
      const response = await postFight(request, { ...VALID, battles: value })
      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(typeof body.error).toBe('string')
      expect(body.error).toContain('battles')
      expect(body).not.toHaveProperty('outcomes')
      expect(body).not.toHaveProperty('rounds')
    })
  }

  test('an invalid army field wins over invalid battles', async ({ request }) => {
    const response = await postFight(request, { ...VALID, 'attack-elts': 'abc', battles: 0 })
    expect(response.status()).toBe(400)
    const { error } = await response.json()
    expect(error).toContain('attack-elts')
    expect(error).not.toContain('battles')
  })

  test('a side-rule violation wins over invalid battles', async ({ request }) => {
    const response = await postFight(request, { ...armies([0, 0, 0], [3, 0, 0]), battles: 0 })
    expect(response.status()).toBe(400)
    const { error } = await response.json()
    expect(error).toContain('attack')
    expect(error).not.toContain('battles')
  })

  test('PUT with battles 0 is 405', async ({ request }) => {
    const response = await request.put('/api/fight', { data: { ...VALID, battles: 0 } })
    expect(response.status()).toBe(405)
  })
})

test.describe('response shape', () => {
  test('key sets match the contract at every level', async ({ request }) => {
    const body = await ok(await postFight(request, { ...armies([3, 1, 1], [3, 1, 1]), battles: 500 }))
    expect(sorted(body)).toEqual(['battles', 'hitsPerRound', 'outcomes', 'rounds', 'survivors'])
    expect(Object.keys(body.outcomes)).toEqual(OUTCOME_KEYS)
    for (const kind of OUTCOME_KEYS) {
      expect(sorted(body.outcomes[kind])).toEqual(['count', 'frequency'])
    }
    expect(sorted(body.rounds)).toEqual(['mean', 'median', 'p10', 'p90'])
    expect(sorted(body.survivors)).toEqual(['attacker', 'defender'])
    expect(sorted(body.hitsPerRound)).toEqual(['attacker', 'defender'])
    for (const side of ['attacker', 'defender']) {
      expect(body.survivors[side].length).toBeGreaterThan(0)
      for (const element of body.survivors[side]) {
        expect(sorted(element)).toEqual(SURVIVOR_KEYS)
      }
      expect(body.hitsPerRound[side]).toHaveLength(6)
    }
    for (const n of allNumbers(body)) {
      expect(Number.isFinite(n)).toBe(true)
    }
  })

  test('the response carries no army objects', async ({ request }) => {
    const body = await ok(await postFight(request, VALID))
    expect(body).not.toHaveProperty('attack')
    expect(body).not.toHaveProperty('defend')
  })

  test('a side that never wins has an empty survivors list and a zero-count outcome', async ({ request }) => {
    const body = await ok(await postFight(request, { ...armies([0, 10, 5], [1, 0, 0]), battles: 300 }))
    expect(body.outcomes.defender.count).toBe(0)
    expect(body.outcomes.defender.frequency).toBe(0)
    expect(body.survivors.defender).toEqual([])
  })

  const matchups: [string, FightBody][] = [
    ['5/2/1 vs 3/3/0', VALID],
    ['1/0/0 vs 1/0/0', armies([1, 0, 0], [1, 0, 0])],
    ['0/10/5 vs 10/0/5', armies([0, 10, 5], [10, 0, 5])],
    ['10/0/0 vs 0/1/0', armies([10, 0, 0], [0, 1, 0])],
  ]
  for (const [label, armyBody] of matchups) {
    test(`statistics are internally consistent for ${label}`, async ({ request }) => {
      const body = await ok(await postFight(request, { ...armyBody, battles: 1000 }))
      const counts = Object.values<{ count: number; frequency: number }>(body.outcomes)
      expect(sumOf(counts.map((o) => o.count))).toBe(body.battles)
      expect(Math.abs(sumOf(counts.map((o) => o.frequency)) - 1)).toBeLessThan(1e-9)
      for (const o of counts) {
        expect(o.frequency).toBeCloseTo(o.count / body.battles, 12)
      }
      for (const side of ['attacker', 'defender'] as const) {
        const survivors: Survivor[] = body.survivors[side]
        const wins = body.outcomes[side].count
        expect(sumOf(survivors.map((s) => s.count))).toBe(wins)
        if (wins > 0) {
          expect(Math.abs(sumOf(survivors.map((s) => s.frequency)) - 1)).toBeLessThan(1e-9)
        }
        for (let i = 1; i < survivors.length; i++) {
          const [a, b] = [survivors[i - 1], survivors[i]]
          const inOrder =
            a.count > b.count ||
            (a.count === b.count && (a.regulars > b.regulars || (a.regulars === b.regulars && a.elites > b.elites)))
          expect(inOrder).toBe(true)
        }
        expect(Math.abs(sumOf(body.hitsPerRound[side]) - 1)).toBeLessThan(1e-9)
      }
      expect(body.rounds.p10).toBeLessThanOrEqual(body.rounds.median)
      expect(body.rounds.median).toBeLessThanOrEqual(body.rounds.p90)
      expect(body.rounds.p10).toBeGreaterThanOrEqual(1)
      for (const key of ['median', 'p10', 'p90']) {
        expect(Number.isInteger(body.rounds[key])).toBe(true)
      }
    })
  }

  test('a single battle reports identical rounds statistics and whole-battle frequencies', async ({ request }) => {
    const body = await ok(await postFight(request, { ...VALID, battles: 1 }))
    expect(body.battles).toBe(1)
    expect(body.rounds.median).toBe(body.rounds.p10)
    expect(body.rounds.median).toBe(body.rounds.p90)
    expect(body.rounds.mean).toBe(body.rounds.median)
    expect(Object.values<{ frequency: number }>(body.outcomes).map((o) => o.frequency).sort()).toEqual([0, 0, 1])
  })
})

test.describe('simulation behavior', () => {
  test('a strong attacker wins almost every battle', async ({ request }) => {
    const body = await ok(await postFight(request, { ...armies([0, 10, 5], [1, 0, 0]), battles: 1000 }))
    expect(body.outcomes.attacker.frequency).toBeGreaterThan(0.99)
  })

  test('a strong defender wins almost every battle', async ({ request }) => {
    const body = await ok(await postFight(request, { ...armies([1, 0, 0], [0, 10, 5]), battles: 1000 }))
    expect(body.outcomes.defender.frequency).toBeGreaterThan(0.99)
  })

  test('equal armies do not carry casualties between battles', async ({ request }) => {
    const body = await ok(await postFight(request, { ...armies([5, 0, 0], [5, 0, 0]), battles: 1000 }))
    expect(body.outcomes.attacker.frequency).toBeGreaterThan(0.3)
    expect(body.outcomes.attacker.frequency).toBeLessThan(0.7)
    expect(body.outcomes.defender.frequency).toBeGreaterThan(0.3)
    expect(body.outcomes.defender.frequency).toBeLessThan(0.7)
    expect(body.rounds.p10).toBeGreaterThanOrEqual(1)
  })
})

test.describe('time budget', () => {
  const worstCases: [string, FightBody][] = [
    ['0/10/0 vs 0/10/0 (most rounds)', armies([0, 10, 0], [0, 10, 0])],
    ['0/10/5 vs 0/10/5 (most dice)', armies([0, 10, 5], [0, 10, 5])],
  ]
  for (const [label, armyBody] of worstCases) {
    test(`100000 battles of ${label} finish within 10 seconds`, async ({ request }) => {
      await postFight(request, { ...armyBody, battles: 1 })
      const body = await ok(await postFight(request, { ...armyBody, battles: 100000 }, TIME_BUDGET_MS))
      expect(body.battles).toBe(100000)
    })
  }
})
