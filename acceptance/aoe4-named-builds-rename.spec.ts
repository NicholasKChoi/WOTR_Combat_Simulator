import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { namedBuildUrl, patchNamedBuild, postNamedBuild, saveBody, uniqueClient } from './helpers'
import { expectValid } from './openapi-schemas'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const UNUSED_ID = 'AAAAAAAAAAAAAAAAAAAAAA'
const WRONG_SECRET = 'w'.repeat(43)

test.beforeAll(async ({ request }) => {
  await postNamedBuild(request, saveBody(`warm-up ${randomUUID()}`), uniqueClient('rename-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(namedBuildUrl(UNUSED_ID), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe.serial('rename a named build', () => {
  const client = uniqueClient('named-rename')
  let id = ''
  let editSecret = ''
  const owner = (ifMatch: string) => ({ Authorization: `Bearer ${editSecret}`, 'If-Match': ifMatch })

  test('create gives revision 1', async ({ request }) => {
    const response = await postNamedBuild(request, saveBody(`Before ${randomUUID()}`), client)
    expect(response.status(), await response.text()).toBe(201)
    const created = await response.json()
    id = created.id
    editSecret = created.editSecret
  })

  test('a wrong secret gives 403', async ({ request }) => {
    const response = await patchNamedBuild(request, id, { name: 'Nope' }, client, { Authorization: `Bearer ${WRONG_SECRET}`, 'If-Match': '"1"' })
    expect(response.status(), await response.text()).toBe(403)
  })

  test('a rename gives 200 and ETag "2", and GET shows the new name at revision 2', async ({ request }) => {
    const name = `Renamed ${randomUUID()}`
    const response = await patchNamedBuild(request, id, { name: `  ${name}  ` }, client, owner('"1"'))
    expect([response.status(), response.headers().etag], await response.text()).toEqual([200, '"2"'])
    expectValid('UpdateNamedBuildResponse', await response.json())

    const read = await request.get(namedBuildUrl(id), { timeout: 10_000 })
    const named = await read.json()
    expect([read.headers().etag, named.revision, named.buildOrder.name]).toEqual(['"2"', 2, name])
  })

  test('a stale If-Match gives 412', async ({ request }) => {
    const response = await patchNamedBuild(request, id, { name: 'Stale' }, client, owner('"1"'))
    expect(response.status(), await response.text()).toBe(412)
  })
})
