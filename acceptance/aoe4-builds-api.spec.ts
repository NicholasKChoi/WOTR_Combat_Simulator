import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { BUILDS_PATH, buildPath, postBuild, postBuildRaw, uniqueClient } from './helpers'
import { expectValid } from './openapi-schemas'
import { SAVED_BUILD_VERSION, SAVED_BUILD_MAX_BYTES } from '../lib/aoe4-build-order/saved-builds'
import { SAVE_RATE_LIMIT } from '../lib/aoe4-build-order/save-rate-limit'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const STEPS = [{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2 }]
const order = (name: string, extra: Record<string, unknown> = {}) => ({ civ: 'english', name, start: START, steps: STEPS, ...extra })
const saveBody = (name: string, durationSeconds = 300) => ({ buildOrder: order(name), durationSeconds })

test.beforeAll(async ({ request }) => {
  await postBuild(request, saveBody(`warm-up ${randomUUID()}`), uniqueClient('builds-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(buildPath('warmupwarm'), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe.serial('save, read back and delete', () => {
  const client = uniqueClient('builds-flow')
  const body = saveBody(`Flow ${randomUUID()}`)
  let id = ''

  test('a new build gives 201 and the same body again gives 200 with the same id', async ({ request }) => {
    const first = await postBuild(request, body, client)
    expect(first.status(), await first.text()).toBe(201)
    const created = await first.json()
    expectValid('SaveBuildResponse', created)
    id = created.id

    const second = await postBuild(request, body, client)
    expect(second.status()).toBe(200)
    expect(await second.json()).toEqual(created)
  })

  test('GET returns the saved order and duration with the version and id', async ({ request }) => {
    const response = await request.get(buildPath(id), { timeout: 10_000 })
    expect(response.status(), await response.text()).toBe(200)
    expect(response.headers()['cache-control']).toBe('public, max-age=31536000, immutable')
    const saved = await response.json()
    expectValid('SavedBuildWithId', saved)
    expect(saved.buildOrder).toEqual(body.buildOrder)
    expect(saved).toEqual({ version: SAVED_BUILD_VERSION, buildOrder: body.buildOrder, durationSeconds: body.durationSeconds, id })
  })

  test('DELETE answers 204 and a following GET answers 404', async ({ request }) => {
    const deleted = await request.delete(buildPath(id), { timeout: 10_000 })
    expect(deleted.status()).toBe(204)
    const response = await request.get(buildPath(id), { timeout: 10_000 })
    expect(response.status()).toBe(404)
    expectValid('BuildsError', await response.json())
  })
})

test.describe('400 and 413 rows', () => {
  const client = uniqueClient('builds-invalid')
  const bodies: Record<string, unknown> = {
    'a body that is not an object': [],
    'an unknown unit id': { buildOrder: order('Unknown', { steps: [{ ...STEPS[0], unit: 'knigt' }] }), durationSeconds: 300 },
    'durationSeconds 59': saveBody('Short', 59),
    'a name of 101 characters': saveBody('n'.repeat(101)),
  }

  for (const [label, body] of Object.entries(bodies)) {
    test(`${label} gives 400 and a SimulateError`, async ({ request }) => {
      const response = await postBuildRaw(request, JSON.stringify(body), client)
      expect(response.status(), await response.text()).toBe(400)
      expectValid('SimulateError', await response.json())
    })
  }

  test('a record over the byte cap but under the body limit gives 413 and a BuildsError', async ({ request }) => {
    const raw = JSON.stringify({ buildOrder: order('Big', { source: '€'.repeat(30_000) }), durationSeconds: 300 })
    expect(Buffer.byteLength(raw)).toBeGreaterThan(SAVED_BUILD_MAX_BYTES)
    expect(Buffer.byteLength(raw)).toBeLessThan(128 * 1024)
    const response = await postBuildRaw(request, raw, client)
    expect(response.status(), await response.text()).toBe(413)
    expectValid('BuildsError', await response.json())
  })

  test('a raw body over the 128 kb limit gives 413 and a plain-text body', async ({ request }) => {
    const response = await postBuildRaw(request, JSON.stringify({ filler: 'x'.repeat(200 * 1024) }), client)
    expect(response.status()).toBe(413)
    const text = await response.text()
    expect(() => JSON.parse(text)).toThrow()
  })
})

test.describe('404 and 405 rows', () => {
  test('GET of an id that is not an id gives 404 and a BuildsError', async ({ request }) => {
    const response = await request.get(buildPath('abc'), { timeout: 10_000 })
    expect(response.status()).toBe(404)
    expectValid('BuildsError', await response.json())
  })

  for (const method of ['get', 'put'] as const) {
    test(`${method.toUpperCase()} on the save route gives 405 with Allow: POST`, async ({ request }) => {
      const response = await request[method](BUILDS_PATH, { timeout: 10_000 })
      expect(response.status()).toBe(405)
      expect(response.headers()['allow']).toBe('POST')
      expectValid('BuildsError', await response.json())
    })
  }

  test('PUT on the id route gives 405 with Allow: GET, DELETE', async ({ request }) => {
    const response = await request.put(buildPath('abcdefghijk'), { timeout: 10_000 })
    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('GET, DELETE')
    expectValid('BuildsError', await response.json())
  })
})

test.describe('save rate limit', () => {
  const body = saveBody(`Limited ${randomUUID()}`)

  test('one client gets 30 saves and a 429 for the 31st, and another client still saves', async ({ request }) => {
    const client = uniqueClient('builds-limit')
    const statuses: number[] = []
    for (let save = 0; save < SAVE_RATE_LIMIT.maxSaves; save += 1) {
      statuses.push((await postBuild(request, body, client)).status())
    }
    expect(statuses.every((status) => status === 201 || status === 200)).toBe(true)

    const refused = await postBuild(request, body, client)
    expect(refused.status()).toBe(429)
    expectValid('BuildsError', await refused.json())
    const retryAfter = refused.headers()['retry-after']
    expect(retryAfter).toMatch(/^\d+$/)
    expect(Number(retryAfter)).toBeGreaterThanOrEqual(1)
    expect(Number(retryAfter)).toBeLessThanOrEqual(SAVE_RATE_LIMIT.windowSeconds)

    const other = await postBuild(request, body, uniqueClient('builds-limit-other'))
    expect([200, 201]).toContain(other.status())
  })
})
