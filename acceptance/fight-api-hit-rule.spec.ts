import { test, expect, type APIRequestContext } from '@playwright/test'
import { armies, fillArmies, openCombatSimulator, postFight } from './helpers'

const BATTLES = 100_000
const TIME_BUDGET_MS = 20_000
// With 100000 battles the standard error of a frequency is about 0.002, so this is well over 4 sigma.
const TOLERANCE = 0.01

type Fight = {
  battles: number
  outcomes: Record<'attacker' | 'defender' | 'tie', { frequency: number }>
  rounds: { mean: number }
  hitsPerRound: Record<'attacker' | 'defender', number[]>
}

async function fight(request: APIRequestContext, attack: [number, number, number], defend: [number, number, number]) {
  await postFight(request, { ...armies(attack, defend), battles: 1 })
  const response = await postFight(request, { ...armies(attack, defend), battles: BATTLES }, TIME_BUDGET_MS)
  expect(response.status()).toBe(200)
  return (await response.json()) as Fight
}

// A die hits with probability 1/3 (a 5 or a 6). In a lone-die fight the battle ends in round k with
// probability (4/9)^(k-1) * (5/9): mean 1.8 rounds, a tie in 1/5 of battles, and 2/3 of all recorded
// rounds with no hits. A 6-only rule gives 5/6 of rounds with no hits, a tie in 1/11, and a mean of 3.3.
test.describe('a combat die hits on a 5 or a 6', () => {
  test('a lone die against a lone die hits about one time in three', async ({ request }) => {
    const body = await fight(request, [1, 0, 0], [1, 0, 0])
    for (const side of ['attacker', 'defender'] as const) {
      expect(body.hitsPerRound[side][0]).toBeGreaterThan(2 / 3 - TOLERANCE)
      expect(body.hitsPerRound[side][0]).toBeLessThan(2 / 3 + TOLERANCE)
      expect(body.hitsPerRound[side][1]).toBeGreaterThan(1 / 3 - TOLERANCE)
      expect(body.hitsPerRound[side][1]).toBeLessThan(1 / 3 + TOLERANCE)
    }
    expect(body.outcomes.tie.frequency).toBeGreaterThan(0.2 - TOLERANCE)
    expect(body.outcomes.tie.frequency).toBeLessThan(0.2 + TOLERANCE)
    expect(body.rounds.mean).toBeGreaterThan(1.8 - 0.05)
    expect(body.rounds.mean).toBeLessThan(1.8 + 0.05)
  })

  // One regular and one leader against one regular. The attacker re-rolls a missed die, so it scores with
  // probability 1/3 + 2/3 * 1/3 = 5/9 per round if a re-rolled 5 hits, and 4/9 if only a re-rolled 6 does.
  // The defender scores 1/3, so the attacker wins 10/19 of battles (0.526) against 0.47 for a 6-only re-roll.
  test('a leader re-roll hits on a 5 as well as a 6', async ({ request }) => {
    const body = await fight(request, [1, 0, 1], [1, 0, 0])
    expect(body.outcomes.attacker.frequency).toBeGreaterThan(10 / 19 - TOLERANCE)
    expect(body.outcomes.attacker.frequency).toBeLessThan(10 / 19 + TOLERANCE)
    expect(body.outcomes.defender.frequency).toBeGreaterThan(4 / 19 - TOLERANCE)
    expect(body.outcomes.defender.frequency).toBeLessThan(4 / 19 + TOLERANCE)
    expect(body.outcomes.tie.frequency).toBeGreaterThan(5 / 19 - TOLERANCE)
    expect(body.outcomes.tie.frequency).toBeLessThan(5 / 19 + TOLERANCE)
  })

  test('the combat simulator page shows results from the 5-or-6 rule', async ({ page }) => {
    await openCombatSimulator(page)
    await fillArmies(page, armies([1, 0, 0], [1, 0, 0]))
    await page.locator('input[name="battles"]').fill('20000')
    const fightResponse = page.waitForResponse((r) => r.url().endsWith('/api/fight') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Fight!' }).click()
    const response = await fightResponse
    expect(response.status()).toBe(200)
    const body = (await response.json()) as Fight
    expect(body.battles).toBe(20_000)
    expect(body.outcomes.tie.frequency).toBeGreaterThan(0.2 - 0.03)
    expect(body.outcomes.tie.frequency).toBeLessThan(0.2 + 0.03)
  })
})
