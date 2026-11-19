import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { namedBuildUrl, patchNamedBuild, postNamedBuild, saveBody, uniqueClient } from './helpers'
import { expectValid } from './openapi-schemas'
import { SAVE_RATE_LIMIT } from '../lib/aoe4-build-order/save-rate-limit'
import { SAVED_NAME_MAX_CHARS } from '../lib/aoe4-build-order/saved-builds'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const UNUSED_ID = 'AAAAAAAAAAAAAAAAAAAAAA'
const WRONG_SECRET = 'w'.repeat(43)

test.beforeAll(async ({ request }) => {
  await postNamedBuild(request, saveBody(`warm-up ${randomUUID()}`), uniqueClient('rename-rules-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(namedBuildUrl(UNUSED_ID), { timeout: WARM_UP_TIMEOUT_MS })
})

async function createBuild(request: Parameters<typeof postNamedBuild>[0], client: string) {
  const response = await postNamedBuild(request, saveBody(`Original ${randomUUID()}`), client)
  expect(response.status(), await response.text()).toBe(201)
  const created = await response.json()
  const read = await (await request.get(namedBuildUrl(created.id), { timeout: 10_000 })).json()
  return { id: created.id as string, editSecret: created.editSecret as string, before: read }
}

test.describe('what a rename changes', () => {
  const client = uniqueClient('rename-rules-write')

  test('changes only the name, revision and updatedAt, and ignores an extra body key', async ({ request }) => {
    const { id, editSecret, before } = await createBuild(request, client)
    const headers = { Authorization: `Bearer ${editSecret}`, 'If-Match': '"1"' }
    const response = await patchNamedBuild(request, id, { name: 'Fresh', steps: [], buildOrder: { start: 'x' }, revision: 99 }, client, headers)
    expect(response.status(), await response.text()).toBe(200)

    const after = await (await request.get(namedBuildUrl(id), { timeout: 10_000 })).json()
    expect(after.buildOrder.name).toBe('Fresh')
    expect(after.buildOrder.steps.length).toBeGreaterThan(0)
    expect({ ...after, buildOrder: { ...after.buildOrder, name: '' }, revision: 0, updatedAt: '' }).toEqual({
      ...before,
      buildOrder: { ...before.buildOrder, name: '' },
      revision: 0,
      updatedAt: '',
    })
    expect(after.revision).toBe(2)
    expect(after.updatedAt).not.toBe(before.updatedAt)
  })

  test('a rename to the same name writes the next revision', async ({ request }) => {
    const { id, editSecret, before } = await createBuild(request, client)
    const headers = { Authorization: `Bearer ${editSecret}`, 'If-Match': '"1"' }
    const response = await patchNamedBuild(request, id, { name: before.buildOrder.name }, client, headers)
    expect([response.status(), response.headers().etag], await response.text()).toEqual([200, '"2"'])
    const after = await (await request.get(namedBuildUrl(id), { timeout: 10_000 })).json()
    expect(after.revision).toBe(2)
  })

  test('a name of exactly the cap succeeds and one over the cap gives 400', async ({ request }) => {
    const { id, editSecret } = await createBuild(request, client)
    const headers = { Authorization: `Bearer ${editSecret}`, 'If-Match': '"1"' }
    const over = await patchNamedBuild(request, id, { name: 'n'.repeat(SAVED_NAME_MAX_CHARS + 1) }, client, headers)
    expect(over.status(), await over.text()).toBe(400)
    expectValid('SimulateError', await over.json())

    const exact = await patchNamedBuild(request, id, { name: 'n'.repeat(SAVED_NAME_MAX_CHARS) }, client, headers)
    expect(exact.status(), await exact.text()).toBe(200)
    const after = await (await request.get(namedBuildUrl(id), { timeout: 10_000 })).json()
    expect(after.buildOrder.name).toBe('n'.repeat(SAVED_NAME_MAX_CHARS))
  })

  test('a name that is missing, not a string, or empty once trimmed, gives 400 and writes nothing', async ({ request }) => {
    const { id, editSecret } = await createBuild(request, client)
    const headers = { Authorization: `Bearer ${editSecret}`, 'If-Match': '"1"' }
    for (const body of [{ name: 5 }, { name: '   ' }, {}]) {
      const response = await patchNamedBuild(request, id, body, client, headers)
      expect(response.status(), JSON.stringify(body)).toBe(400)
    }
    const after = await (await request.get(namedBuildUrl(id), { timeout: 10_000 })).json()
    expect(after.revision).toBe(1)
  })
})

test.describe('check order', () => {
  const client = uniqueClient('rename-rules-order')

  test('an earlier failing check wins over a later one', async ({ request }) => {
    const { id, editSecret } = await createBuild(request, client)
    const good = { Authorization: `Bearer ${editSecret}`, 'If-Match': '"1"' }
    const wrong = { Authorization: `Bearer ${WRONG_SECRET}`, 'If-Match': '"9"' }
    const badBody = { name: 5 }

    const post = await request.post(namedBuildUrl('not-an-id'), { timeout: 10_000 })
    expect(post.status(), 'method before id form').toBe(405)
    expect(post.headers().allow).toBe('GET, PUT, PATCH, DELETE')

    expect((await patchNamedBuild(request, 'not-an-id', badBody, client, { 'If-Match': '"1"' })).status(), 'id form before secret form').toBe(404)
    expect((await patchNamedBuild(request, id, badBody, client, {})).status(), 'secret form before If-Match and body').toBe(401)
    expect((await patchNamedBuild(request, id, badBody, client, { Authorization: good.Authorization })).status(), 'If-Match before body').toBe(428)
    expect((await patchNamedBuild(request, UNUSED_ID, badBody, client, wrong)).status(), 'body before exists').toBe(400)
    expect((await patchNamedBuild(request, UNUSED_ID, { name: 'x' }, client, wrong)).status(), 'exists before secret').toBe(404)
    expect((await patchNamedBuild(request, id, { name: 'x' }, client, wrong)).status(), 'secret before revision').toBe(403)
    expect((await patchNamedBuild(request, id, { name: 'x' }, client, { Authorization: good.Authorization, 'If-Match': '"9"' })).status(), 'stale revision').toBe(412)

    const after = await (await request.get(namedBuildUrl(id), { timeout: 10_000 })).json()
    expect(after.revision).toBe(1)
  })
})

test.describe('the shared write budget', () => {
  test(`a rename spends a slot: after ${SAVE_RATE_LIMIT.maxSaves} writes it gives 429 with Retry-After and changes nothing`, async ({ request }) => {
    const client = uniqueClient('rename-rules-budget')
    const { id, editSecret } = await createBuild(request, client)
    let revision = 1
    const statuses: number[] = []
    for (let write = 1; write < SAVE_RATE_LIMIT.maxSaves; write += 1) {
      const response = await patchNamedBuild(request, id, { name: `Budget ${write}` }, client, { Authorization: `Bearer ${editSecret}`, 'If-Match': `"${revision}"` })
      statuses.push(response.status())
      revision += 1
    }
    expect(statuses.every((status) => status === 200), statuses.join(',')).toBe(true)

    const refused = await patchNamedBuild(request, id, { name: 'Over' }, client, { Authorization: `Bearer ${editSecret}`, 'If-Match': `"${revision}"` })
    expect(refused.status(), await refused.text()).toBe(429)
    expect(refused.headers()['retry-after']).toMatch(/^\d+$/)

    const after = await (await request.get(namedBuildUrl(id), { timeout: 10_000 })).json()
    expect([after.revision, after.buildOrder.name]).toEqual([revision, `Budget ${SAVE_RATE_LIMIT.maxSaves - 1}`])
  })
})
