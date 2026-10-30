import { test, expect, type APIRequestContext } from '@playwright/test'
import { armies, fillArmies, postFight } from './helpers'

const MAX_HITS_PER_SIDE_PER_ROUND = 5

type Squad = [regulars: number, elites: number, leaders: number]
type ArmyState = { regulars: number; elites: number; leaders: number }
type Stats = {
  attack: ArmyState
  defend: ArmyState
  rounds: number
  averageAttackHitsPerRound: number
  averageDefendHitsPerRound: number
  survivor: string
}

async function fight(request: APIRequestContext, attack: Squad, defend: Squad): Promise<Stats> {
  const response = await postFight(request, armies(attack, defend))
  expect(response.status()).toBe(200)
  return response.json()
}

async function fightMany(request: APIRequestContext, attack: Squad, defend: Squad, count: number) {
  const results: Stats[] = []
  for (let done = 0; done < count; done += 25) {
    const batch = Math.min(25, count - done)
    results.push(...(await Promise.all(Array.from({ length: batch }, () => fight(request, attack, defend)))))
  }
  return results
}

test.describe('casualties never drive unit counts negative', () => {
  const matchups: [string, Squad, Squad][] = [
    ['elite-only 7 vs strong regulars', [0, 7, 2], [10, 0, 5]],
    ['elite-only 10 vs elite-only 10', [0, 10, 5], [0, 10, 5]],
    ['elite-only 10 vs one regular', [0, 10, 0], [1, 0, 0]],
  ]
  for (const [name, attack, defend] of matchups) {
    test(name, async ({ request }) => {
      for (const stats of await fightMany(request, attack, defend, 100)) {
        for (const side of [stats.attack, stats.defend]) {
          expect(side.regulars).toBeGreaterThanOrEqual(0)
          expect(side.elites).toBeGreaterThanOrEqual(0)
        }
      }
    })
  }
})

test('leaders are never lost to casualties', async ({ request }) => {
  for (const stats of await fightMany(request, [3, 4, 5], [2, 6, 3], 50)) {
    expect(stats.attack.leaders).toBe(5)
    expect(stats.defend.leaders).toBe(3)
  }
})

test.describe('a side scores at most 5 hits per round', () => {
  test('averages stay within 5 and totals are whole hits for maximum armies', async ({ request }) => {
    for (const stats of await fightMany(request, [10, 0, 5], [10, 0, 5], 100)) {
      expect(stats.averageAttackHitsPerRound).toBeLessThanOrEqual(MAX_HITS_PER_SIDE_PER_ROUND)
      expect(stats.averageDefendHitsPerRound).toBeLessThanOrEqual(MAX_HITS_PER_SIDE_PER_ROUND)
      for (const average of [stats.averageAttackHitsPerRound, stats.averageDefendHitsPerRound]) {
        const total = average * stats.rounds
        expect(Math.abs(total - Math.round(total))).toBeLessThan(1e-9)
      }
    }
  })

  // A one-round fight exposes the raw round-1 hit count. Without the cap, 10 dice plus 5 rerolls can
  // exceed 5 hits, so this detects a missing cap only probabilistically; it never fails on a correct one.
  test('one-round kills of a lone defender never record more than 5 attacker hits', async ({ request }) => {
    const results = await fightMany(request, [10, 0, 5], [1, 0, 0], 400)
    const oneRound = results.filter((s) => s.rounds === 1)
    expect(oneRound.length).toBeGreaterThan(0)
    for (const stats of oneRound) {
      expect(stats.averageAttackHitsPerRound).toBeLessThanOrEqual(MAX_HITS_PER_SIDE_PER_ROUND)
    }
  })
})

test.describe('large armies finish with a consistent outcome', () => {
  test('survivor matches which army is left standing', async ({ request }) => {
    for (const stats of await fightMany(request, [0, 10, 5], [10, 0, 5], 50)) {
      expect(stats.rounds).toBeGreaterThanOrEqual(1)
      const attackAlive = stats.attack.regulars + stats.attack.elites > 0
      const defendAlive = stats.defend.regulars + stats.defend.elites > 0
      expect(attackAlive && defendAlive).toBe(false)
      expect(stats.survivor).toBe(attackAlive ? 'attack' : defendAlive ? 'defend' : 'n/a')
    }
  })

  test('one-versus-one fights report n/a exactly when both armies are wiped out', async ({ request }) => {
    for (const stats of await fightMany(request, [1, 0, 0], [1, 0, 0], 100)) {
      const attackAlive = stats.attack.regulars + stats.attack.elites > 0
      const defendAlive = stats.defend.regulars + stats.defend.elites > 0
      expect(stats.survivor === 'n/a').toBe(!attackAlive && !defendAlive)
    }
  })
})

test('repeating a fight starts from fresh armies each time', async ({ request }) => {
  for (let i = 0; i < 3; i++) {
    const stats = await fight(request, [10, 0, 5], [0, 10, 5])
    expect(stats.attack.leaders).toBe(5)
    expect(stats.defend.leaders).toBe(5)
    expect(stats.rounds).toBeGreaterThanOrEqual(1)
    expect(stats.attack.regulars + stats.attack.elites + stats.defend.regulars + stats.defend.elites).toBeLessThanOrEqual(10)
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
