import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { namedBuildUrl, postBuild, postNamedBuild, putNamedBuild, saveBody, uniqueClient } from './helpers'
import { expectValid } from './openapi-schemas'
import { SAVE_RATE_LIMIT } from '../lib/aoe4-build-order/save-rate-limit'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const UNUSED_ID = 'AAAAAAAAAAAAAAAAAAAAAA'
const WRONG_SECRET = 'w'.repeat(43)

test.beforeAll(async ({ request }) => {
  await postNamedBuild(request, saveBody(`warm-up ${randomUUID()}`), uniqueClient('named-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(namedBuildUrl(UNUSED_ID), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe.serial('create, read, update and delete', () => {
  const client = uniqueClient('named-flow')
  let id = ''
  let editSecret = ''
  const owner = (ifMatch: string) => ({ Authorization: `Bearer ${editSecret}`, 'If-Match': ifMatch })

  test('a create gives 201, ETag "1" and a CreateNamedBuildResponse', async ({ request }) => {
    const response = await postNamedBuild(request, saveBody(`Named ${randomUUID()}`), client)
    expect(response.status(), await response.text()).toBe(201)
    expect(response.headers().etag).toBe('"1"')
    const created = await response.json()
    expectValid('CreateNamedBuildResponse', created)
    id = created.id
    editSecret = created.editSecret
  })

  test('GET gives 200, no-store, ETag "1" and a NamedBuild with no secretHash', async ({ request }) => {
    const response = await request.get(namedBuildUrl(id), { timeout: 10_000 })
    expect(response.status(), await response.text()).toBe(200)
    expect(response.headers()['cache-control']).toBe('no-store')
    expect(response.headers().etag).toBe('"1"')
    const named = await response.json()
    expectValid('NamedBuild', named)
    expect(Object.keys(named)).not.toContain('secretHash')
  })

  test('a PUT with no Authorization gives 401', async ({ request }) => {
    const response = await putNamedBuild(request, id, saveBody('Renamed'), client, { 'If-Match': '"1"' })
    expect(response.status(), await response.text()).toBe(401)
    expect(response.headers()['www-authenticate']).toBe('Bearer')
  })

  test('a PUT with a wrong 43-character secret gives 403', async ({ request }) => {
    const response = await putNamedBuild(request, id, saveBody('Renamed'), client, { Authorization: `Bearer ${WRONG_SECRET}`, 'If-Match': '"1"' })
    expect(response.status(), await response.text()).toBe(403)
    expectValid('BuildsError', await response.json())
  })

  test('a PUT with no If-Match gives 428', async ({ request }) => {
    const response = await putNamedBuild(request, id, saveBody('Renamed'), client, { Authorization: `Bearer ${editSecret}` })
    expect(response.status(), await response.text()).toBe(428)
  })

  test('a PUT with the secret and If-Match "1" gives 200 and ETag "2", and GET shows the new name at revision 2', async ({ request }) => {
    const name = `Renamed ${randomUUID()}`
    const response = await putNamedBuild(request, id, saveBody(name), client, owner('"1"'))
    expect(response.status(), await response.text()).toBe(200)
    expect(response.headers().etag).toBe('"2"')
    expectValid('UpdateNamedBuildResponse', await response.json())

    const read = await request.get(namedBuildUrl(id), { timeout: 10_000 })
    expect(read.headers().etag).toBe('"2"')
    const named = await read.json()
    expect(named.buildOrder.name).toBe(name)
    expect(named.revision).toBe(2)
  })

  test('a PUT with the stale If-Match "1" gives 412', async ({ request }) => {
    const response = await putNamedBuild(request, id, saveBody('Stale'), client, owner('"1"'))
    expect(response.status(), await response.text()).toBe(412)
  })

  test('a PUT body over the 128 kb limit gives 413 and a plain-text body', async ({ request }) => {
    const raw = Buffer.from(JSON.stringify({ filler: 'x'.repeat(200 * 1024) }))
    const response = await putNamedBuild(request, id, raw, client, owner('"2"'))
    expect(response.status()).toBe(413)
    const text = await response.text()
    expect(() => JSON.parse(text)).toThrow()
  })

  test('PATCH gives 405 with Allow: GET, PUT, DELETE', async ({ request }) => {
    const response = await request.patch(namedBuildUrl(id), { data: saveBody('Patch'), timeout: 10_000 })
    expect(response.status()).toBe(405)
    expect(response.headers().allow).toBe('GET, PUT, DELETE')
  })

  test('DELETE gives 204 and a following GET gives 404', async ({ request }) => {
    const deleted = await request.delete(namedBuildUrl(id), { timeout: 10_000 })
    expect(deleted.status()).toBe(204)
    const response = await request.get(namedBuildUrl(id), { timeout: 10_000 })
    expect(response.status()).toBe(404)
    expectValid('BuildsError', await response.json())
  })
})

test.describe('404 for an id with no build', () => {
  const client = uniqueClient('named-absent')
  const headers = { Authorization: `Bearer ${WRONG_SECRET}`, 'If-Match': '"1"' }

  for (const [label, id] of [['an unused well-formed id', UNUSED_ID], ['a malformed id', 'not-an-id']]) {
    test(`GET and PUT of ${label} give 404`, async ({ request }) => {
      const read = await request.get(namedBuildUrl(id), { timeout: 10_000 })
      expect(read.status(), await read.text()).toBe(404)
      const write = await putNamedBuild(request, id, saveBody('Absent'), client, headers)
      expect(write.status(), await write.text()).toBe(404)
      expectValid('BuildsError', await write.json())
    })
  }
})

test.describe('one write budget for saves, creates and updates', () => {
  test(`after ${SAVE_RATE_LIMIT.maxSaves} writes across the three routes, each route gives 429 with Retry-After`, async ({ request }) => {
    const client = uniqueClient('named-budget')
    const first = await postNamedBuild(request, saveBody(`Budget ${randomUUID()}`), client)
    const created = await first.json()
    const statuses = [first.status()]
    let revision = 1
    for (let write = 1; write < SAVE_RATE_LIMIT.maxSaves; write += 1) {
      const route = write % 3
      if (route === 0) statuses.push((await postBuild(request, saveBody(`Budget ${write}`), client)).status())
      if (route === 1) statuses.push((await postNamedBuild(request, saveBody(`Budget ${write}`), client)).status())
      if (route === 2) {
        const headers = { Authorization: `Bearer ${created.editSecret}`, 'If-Match': `"${revision}"` }
        statuses.push((await putNamedBuild(request, created.id, saveBody(`Budget ${write}`), client, headers)).status())
        revision += 1
      }
    }
    expect(statuses.every((status) => status === 200 || status === 201), statuses.join(',')).toBe(true)

    const refused = [
      await postBuild(request, saveBody('Over'), client),
      await postNamedBuild(request, saveBody('Over'), client),
      await putNamedBuild(request, created.id, saveBody('Over'), client, { Authorization: `Bearer ${created.editSecret}`, 'If-Match': `"${revision}"` }),
    ]
    for (const response of refused) {
      expect(response.status(), response.url()).toBe(429)
      expectValid('BuildsError', await response.json())
      expect(response.headers()['retry-after']).toMatch(/^\d+$/)
    }
  })
})
