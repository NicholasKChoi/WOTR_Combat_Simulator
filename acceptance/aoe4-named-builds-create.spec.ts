import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { NAMED_BUILDS_PATH, namedBuildUrl, postNamedBuild, putNamedBuild, uniqueClient } from './helpers'
import { expectValid } from './openapi-schemas'
import { SAVE_RATE_LIMIT } from '../lib/aoe4-build-order/save-rate-limit'

const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const STEPS = [{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2 }]
const saveBody = (name: string) => ({ buildOrder: { civ: 'english', name, start: START, steps: STEPS }, durationSeconds: 300 })

test.beforeAll(async ({ request }) => {
  await postNamedBuild(request, saveBody(`warm-up ${randomUUID()}`), uniqueClient('named-create-warm-up'), WARM_UP_TIMEOUT_MS)
})

test.describe('create', () => {
  const client = uniqueClient('named-create')

  test('the same body posted twice gives two different ids and two different secrets', async ({ request }) => {
    const body = saveBody(`Twice ${randomUUID()}`)
    const first = await (await postNamedBuild(request, body, client)).json()
    const second = await (await postNamedBuild(request, body, client)).json()
    expectValid('CreateNamedBuildResponse', first)
    expectValid('CreateNamedBuildResponse', second)
    expect(second.id).not.toBe(first.id)
    expect(second.editSecret).not.toBe(first.editSecret)
    expect(first.path).toBe(`/apps/aoe4-build-order?n=${first.id}`)
  })

  test('a body that is not a save request gives 400 with a SimulateError', async ({ request }) => {
    const response = await postNamedBuild(request, { buildOrder: { civ: 'english' } }, client)
    expect(response.status(), await response.text()).toBe(400)
    expectValid('SimulateError', await response.json())
  })

  test('a body over the 128 kb limit gives 413', async ({ request }) => {
    const raw = Buffer.from(JSON.stringify({ filler: 'x'.repeat(200 * 1024) }))
    const response = await request.post(NAMED_BUILDS_PATH, { data: raw, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': client }, timeout: 10_000 })
    expect(response.status()).toBe(413)
  })

  test('GET on the collection gives 405 with Allow: POST', async ({ request }) => {
    const response = await request.get(NAMED_BUILDS_PATH, { timeout: 10_000 })
    expect(response.status()).toBe(405)
    expect(response.headers().allow).toBe('POST')
  })
})

test.describe('reads and deletes cost no write slot', () => {
  test(`${SAVE_RATE_LIMIT.maxSaves} GETs and DELETEs do not stop a following create`, async ({ request }) => {
    const client = uniqueClient('named-free-reads')
    const created = await (await postNamedBuild(request, saveBody(`Free ${randomUUID()}`), client)).json()
    const headers = { 'x-forwarded-for': client }
    for (let i = 0; i < SAVE_RATE_LIMIT.maxSaves; i += 1) {
      const response = i % 2 === 0
        ? await request.get(namedBuildUrl(created.id), { headers, timeout: 10_000 })
        : await request.delete(namedBuildUrl('AAAAAAAAAAAAAAAAAAAAAA'), { headers, timeout: 10_000 })
      expect([200, 204]).toContain(response.status())
    }
    const next = await postNamedBuild(request, saveBody(`After ${randomUUID()}`), client)
    expect(next.status(), await next.text()).toBe(201)
    const put = await putNamedBuild(request, created.id, saveBody('Still'), client, { Authorization: `Bearer ${created.editSecret}`, 'If-Match': '"1"' })
    expect(put.status(), await put.text()).toBe(200)
  })
})
