import { test, expect } from '@playwright/test'
import { DEFAULT_ARMIES, postFight } from './helpers'

test('POST /api/fight returns JSON with a battle count and outcome frequencies', async ({ request }) => {
  const response = await postFight(request, DEFAULT_ARMIES)
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(typeof body).toBe('object')
  expect(Number.isInteger(body.battles)).toBe(true)
  expect(Number.isFinite(body.outcomes.attacker.frequency)).toBe(true)
  expect(Number.isFinite(body.rounds.mean)).toBe(true)
})
