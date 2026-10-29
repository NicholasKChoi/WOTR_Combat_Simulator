import { test, expect } from '@playwright/test'
import { DEFAULT_ARMIES, postFight } from './helpers'

test('POST /api/fight returns JSON with a survivor and round count', async ({ request }) => {
  const response = await postFight(request, DEFAULT_ARMIES)
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(typeof body).toBe('object')
  expect(typeof body.survivor).toBe('string')
  expect(typeof body.rounds).toBe('number')
})
