import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { namedBuildUrl, postNamedBuild, putNamedBuild, saveBody, uniqueClient, WARM_UP_TIMEOUT_MS } from './helpers'

test.describe.configure({ timeout: 60_000 })

test.beforeAll(async ({ request }) => {
  await postNamedBuild(request, saveBody(`warm-up ${randomUUID()}`), uniqueClient('version-save-warm-up'), WARM_UP_TIMEOUT_MS)
})

async function createNamed(request: Parameters<typeof postNamedBuild>[0], client: string) {
  const response = await postNamedBuild(request, saveBody(`Version ${randomUUID()}`), client)
  expect(response.status(), await response.text()).toBe(201)
  const { id, editSecret } = await response.json()
  return { id, owner: (ifMatch: string) => ({ Authorization: `Bearer ${editSecret}`, 'If-Match': ifMatch }) }
}

test('successive version saves each succeed and a reload shows the latest content at its revision', async ({ request }) => {
  const client = uniqueClient('version-chain')
  const { id, owner } = await createNamed(request, client)

  for (const revision of [2, 3, 4]) {
    const name = `Edit ${revision} ${randomUUID()}`
    const response = await putNamedBuild(request, id, saveBody(name), client, owner(`"${revision - 1}"`))
    expect(response.status(), await response.text()).toBe(200)
    expect(response.headers().etag).toBe(`"${revision}"`)

    const read = await request.get(namedBuildUrl(id), { timeout: 10_000 })
    expect(read.headers().etag).toBe(`"${revision}"`)
    const named = await read.json()
    expect(named.revision).toBe(revision)
    expect(named.buildOrder.name).toBe(name)
  }
})

test('two saves from the same revision: one wins with 200 and the other gets 412, and the winner is kept', async ({ request }) => {
  const client = uniqueClient('version-race')
  const { id, owner } = await createNamed(request, client)
  const names = [`Racer A ${randomUUID()}`, `Racer B ${randomUUID()}`]

  const responses = await Promise.all(names.map((name) => putNamedBuild(request, id, saveBody(name), client, owner('"1"'))))
  const statuses = responses.map((response) => response.status()).sort()
  expect(statuses).toStrictEqual([200, 412])

  const winner = names[responses.findIndex((response) => response.status() === 200)]
  const read = await request.get(namedBuildUrl(id), { timeout: 10_000 })
  const named = await read.json()
  expect(named.revision).toBe(2)
  expect(named.buildOrder.name).toBe(winner)
})
