import { test, expect, type APIRequestContext } from '@playwright/test'
import { armies, fillArmies, postFight } from './helpers'

const MAX_HITS_PER_SIDE_PER_ROUND = 5
const BATTLES = 1000

type Squad = [regulars: number, elites: number, leaders: number]
type Survivor = { regulars: number; elites: number; count: number; frequency: number }
type Summary = {
  battles: number
  outcomes: Record<'attacker' | 'defender' | 'tie', { count: number; frequency: number }>
  rounds: { mean: number; median: number; p10: number; p90: number }
  survivors: Record<'attacker' | 'defender', Survivor[]>
  hitsPerRound: Record<'attacker' | 'defender', number[]>
}

async function fight(request: APIRequestContext, attack: Squad, defend: Squad, battles = BATTLES): Promise<Summary> {
  const response = await postFight(request, { ...armies(attack, defend), battles })
  expect(response.status()).toBe(200)
  return response.json()
}

test.describe('casualties never drive unit counts negative', () => {
  const matchups: [string, Squad, Squad][] = [
    ['elite-only 7 vs strong regulars', [0, 7, 2], [10, 0, 5]],
    ['elite-only 10 vs elite-only 10', [0, 10, 5], [0, 10, 5]],
    ['elite-only 10 vs one regular', [0, 10, 0], [1, 0, 0]],
  ]
  for (const [name, attack, defend] of matchups) {
    test(name, async ({ request }) => {
      const summary = await fight(request, attack, defend)
      const survivors = [...summary.survivors.attacker, ...summary.survivors.defender]
      for (const { regulars, elites, count } of survivors) {
        expect(Number.isInteger(regulars) && regulars >= 0).toBe(true)
        expect(Number.isInteger(elites) && elites >= 0).toBe(true)
        expect(regulars + elites).toBeGreaterThanOrEqual(1)
        expect(count).toBeGreaterThanOrEqual(1)
      }
      for (const kind of Object.values(summary.outcomes)) {
        expect(Number.isInteger(kind.count) && kind.count >= 0).toBe(true)
      }
    })
  }
})

test('surviving units never exceed the units a side started with', async ({ request }) => {
  const attack: Squad = [3, 4, 5]
  const defend: Squad = [2, 6, 3]
  const summary = await fight(request, attack, defend)
  for (const [side, start] of [['attacker', attack], ['defender', defend]] as const) {
    expect(summary.survivors[side].length).toBeGreaterThan(0)
    for (const { regulars, elites } of summary.survivors[side]) {
      expect(regulars + elites).toBeLessThanOrEqual(start[0] + start[1])
      expect(elites).toBeLessThanOrEqual(start[1])
    }
  }
})

test.describe('a side scores at most 5 hits per round', () => {
  test('hit shares cover exactly 0-5 hits for maximum armies', async ({ request }) => {
    const { hitsPerRound } = await fight(request, [10, 0, 5], [10, 0, 5])
    for (const shares of [hitsPerRound.attacker, hitsPerRound.defender]) {
      expect(shares).toHaveLength(MAX_HITS_PER_SIDE_PER_ROUND + 1)
      for (const share of shares) {
        expect(share).toBeGreaterThanOrEqual(0)
        expect(share).toBeLessThanOrEqual(1)
      }
      expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9)
    }
  })

  // A lone defender dies in round 1, so the pooled hit shares are raw round-1 rolls of 10 dice plus 5 rerolls.
  test('one-round kills of a lone defender record hits only in the 0-5 slots', async ({ request }) => {
    const { hitsPerRound, rounds } = await fight(request, [10, 0, 5], [1, 0, 0], 5000)
    expect(rounds.p90).toBeLessThanOrEqual(2)
    expect(hitsPerRound.attacker).toHaveLength(MAX_HITS_PER_SIDE_PER_ROUND + 1)
    expect(hitsPerRound.attacker[MAX_HITS_PER_SIDE_PER_ROUND]).toBeGreaterThan(0)
  })
})

test.describe('large armies finish with a consistent outcome', () => {
  test('outcomes cover every battle and each battle has a winner or a tie', async ({ request }) => {
    const summary = await fight(request, [0, 10, 5], [10, 0, 5])
    const { attacker, defender, tie } = summary.outcomes
    expect(attacker.count + defender.count + tie.count).toBe(BATTLES)
    expect(summary.rounds.p10).toBeGreaterThanOrEqual(1)
    const wins = (side: 'attacker' | 'defender') => summary.survivors[side].reduce((n, s) => n + s.count, 0)
    expect(wins('attacker')).toBe(attacker.count)
    expect(wins('defender')).toBe(defender.count)
  })

  test('one-versus-one fights tie in some battles and otherwise have exactly one winner', async ({ request }) => {
    const summary = await fight(request, [1, 0, 0], [1, 0, 0], 5000)
    const { attacker, defender, tie } = summary.outcomes
    expect(tie.count).toBeGreaterThan(0)
    expect(attacker.count).toBeGreaterThan(0)
    expect(defender.count).toBeGreaterThan(0)
    expect(attacker.count + defender.count + tie.count).toBe(5000)
    for (const side of ['attacker', 'defender'] as const) {
      expect(summary.survivors[side]).toEqual([
        { regulars: 1, elites: 0, count: summary.outcomes[side].count, frequency: 1 },
      ])
    }
  })
})

test('repeated fights start from fresh armies each time', async ({ request }) => {
  for (let i = 0; i < 3; i++) {
    const summary = await fight(request, [10, 0, 5], [0, 10, 5])
    expect(summary.rounds.p10).toBeGreaterThanOrEqual(1)
    expect(summary.battles).toBe(BATTLES)
    for (const { regulars, elites } of [...summary.survivors.attacker, ...summary.survivors.defender]) {
      expect(regulars + elites).toBeLessThanOrEqual(10)
    }
  }
})

test('Fight! with 10/0/5 vs 0/10/5 renders the Army Results table', async ({ page }) => {
  await page.goto('/apps/combat-simulator')
  await page.waitForLoadState('networkidle')
  await fillArmies(page, armies([10, 0, 5], [0, 10, 5]))
  const fightResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/fight') && r.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fightResponse).status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Army Results', exact: true })).toBeVisible()
  await expect(page.locator('table').first()).toBeVisible()
})

test('the army model route keeps the status it had before the logic moved', async ({ request }) => {
  const response = await request.get('/api/models/army')
  expect(response.status()).toBe(500)
})
