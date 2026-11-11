import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect } from '@playwright/test'
import { postBuild, postBuildRaw, uniqueClient } from './helpers'
import { expectValid } from './openapi-schemas'
import { MAX_REPORTED_ISSUES } from '../lib/aoe4-build-order/api'
import { base64UrlSha256, rateCounterKey } from '../lib/aoe4-build-order/saved-builds'
import { SAVE_RATE_LIMIT } from '../lib/aoe4-build-order/save-rate-limit'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000
const LOCAL_BUILDS_DIR = join(__dirname, '..', 'test-results', 'builds-local')
const CLIENT_KEY_LENGTH = 16

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const PRODUCE = { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2 }
const order = (steps: unknown[], name = 'Refusals') => ({ civ: 'english', name, start: START, steps })

test.beforeAll(async ({ request }) => {
  await postBuild(request, { buildOrder: order([PRODUCE], `warm-up ${randomUUID()}`), durationSeconds: 300 }, uniqueClient('refusals-warm-up'), WARM_UP_TIMEOUT_MS)
})

test.describe('a refused save writes nothing', () => {
  test('the stored count stays at the limit however many saves are refused', async ({ request }) => {
    const client = uniqueClient('refusals-counter')
    const body = { buildOrder: order([PRODUCE], `Counter ${randomUUID()}`), durationSeconds: 300 }
    const counterFile = join(LOCAL_BUILDS_DIR, rateCounterKey('development', (await base64UrlSha256(client)).slice(0, CLIENT_KEY_LENGTH)))
    const storedCount = () => JSON.parse(readFileSync(counterFile, 'utf8')).count

    for (let save = 0; save < SAVE_RATE_LIMIT.maxSaves; save += 1) {
      const response = await postBuild(request, body, client)
      expect([200, 201], await response.text()).toContain(response.status())
    }
    expect(storedCount()).toBe(SAVE_RATE_LIMIT.maxSaves)

    for (let refusal = 0; refusal < 3; refusal += 1) {
      const refused = await postBuild(request, body, client)
      expect(refused.status()).toBe(429)
      expectValid('BuildsError', await refused.json())
    }
    expect(storedCount()).toBe(SAVE_RATE_LIMIT.maxSaves)
  })
})

test.describe('the save route caps reported issues', () => {
  const client = uniqueClient('refusals-issues')
  const unknownUnits = (count: number) => Array.from({ length: count }, (_, i) => ({ ...PRODUCE, unit: `no-such-unit-${i}` }))

  const rows = [
    { label: 'one issue', count: 1, reported: 1, omitted: undefined },
    { label: 'exactly the cap', count: MAX_REPORTED_ISSUES, reported: MAX_REPORTED_ISSUES, omitted: undefined },
    { label: 'one over the cap', count: MAX_REPORTED_ISSUES + 1, reported: MAX_REPORTED_ISSUES, omitted: 1 },
    { label: 'ten over the cap', count: MAX_REPORTED_ISSUES + 10, reported: MAX_REPORTED_ISSUES, omitted: 10 },
  ]

  for (const { label, count, reported, omitted } of rows) {
    test(`${label} gives 400 with ${reported} issues and omittedIssues ${omitted}`, async ({ request }) => {
      const raw = JSON.stringify({ buildOrder: order(unknownUnits(count), label), durationSeconds: 300 })
      const response = await postBuildRaw(request, raw, client)
      expect(response.status(), await response.text()).toBe(400)
      const json = await response.json()
      expectValid('SimulateError', json)
      expect(json.issues).toHaveLength(reported)
      expect(json.omittedIssues).toBe(omitted)
      expect(json.error).toBe(json.issues[0].message)
    })
  }
})
