import { randomUUID } from 'crypto'
import { test, expect, type APIRequestContext } from '@playwright/test'
import { BUILDS_PATH, buildPath, postBuild, uniqueClient } from './helpers'
import { expectInvalid, expectValid, routeFilePaths, schemas, spec } from './openapi-schemas'
import { SAVE_RATE_LIMIT } from '../lib/aoe4-build-order/save-rate-limit'
import { SAVED_BUILD_ID_PATTERN } from '../lib/aoe4-build-order/saved-builds'
import { SIM_INPUT_BOUNDS } from '../lib/aoe4-build-order/schema'

const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const BY_ID = '/api/aoe4-build-order/builds/{id}'
const save = spec.paths[BUILDS_PATH].post
const getOperation = spec.paths[BY_ID].get
const deleteOperation = spec.paths[BY_ID].delete
const NEW_SCHEMAS = ['SaveBuildRequest', 'SaveBuildResponse', 'SavedBuild', 'SavedBuildWithId', 'BuildsError']

type Examples = Record<string, { value: any }>
const requestExample = save.requestBody.content['application/json'].examples.buildOrder.value
const examples = (operation: any, status: string): Examples => operation.responses[status].content['application/json'].examples
const keys = (value: object) => Object.keys(value).sort()

async function expectBody(response: Awaited<ReturnType<APIRequestContext['get']>>, status: number, example: { value: unknown }) {
  expect(response.status(), await response.text()).toBe(status)
  expect(await response.json()).toEqual(example.value)
}

test.beforeAll(async ({ request }) => {
  await postBuild(request, requestExample, uniqueClient('builds-contract-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(buildPath('warmupwarm'), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe('spec structure', () => {
  test('is version 2.5.0 and documents exactly the route files', () => {
    expect(spec.info.version).toBe('2.5.0')
    expect(keys(spec.paths)).toEqual(routeFilePaths())
    expect([save.operationId, getOperation.operationId, deleteOperation.operationId]).toEqual(['saveBuild', 'getSavedBuild', 'deleteSavedBuild'])
  })

  test('declares every documented status of each operation', () => {
    expect(keys(save.responses)).toEqual(['200', '201', '400', '405', '413', '429', '500', '503'])
    expect(keys(getOperation.responses)).toEqual(['200', '404', '405', '500', '503'])
    expect(keys(deleteOperation.responses)).toEqual(['204', '404', '405', '503'])
    expect(save.responses['429'].headers['Retry-After']).toBeDefined()
    expect(getOperation.responses['200'].headers['Cache-Control'].schema.const).toBe('public, max-age=31536000, immutable')
    expect(spec.paths[BY_ID].parameters[0].schema.pattern).toBe(SAVED_BUILD_ID_PATTERN.source)
  })

  test('the save operation prose states the repeat save, the framework responses and the rate limit', () => {
    expect(save.description).toMatch(/200.*changes nothing stored/)
    expect(save.description).toMatch(/still counts against the rate limit/)
    expect(save.description).toContain('Invalid JSON')
    expect(save.description).toContain('128 kb')
    expect(deleteOperation.description).toMatch(/405 in production/)
  })

  test('the five new schemas exist and each is referenced from a path or another schema', () => {
    const referenced = new Set<string>()
    const walk = (node: unknown, owner: string | null) => {
      if (!node || typeof node !== 'object') return
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        const target = key === '$ref' && typeof value === 'string' ? value.replace('#/components/schemas/', '') : null
        if (target !== null && target !== owner) referenced.add(target)
        walk(value, owner)
      }
    }
    walk(spec.paths, null)
    for (const [name, schema] of Object.entries(schemas)) walk(schema, name)
    for (const name of NEW_SCHEMAS) {
      expect(schemas, name).toHaveProperty(name)
      expect(referenced.has(name), name).toBe(true)
    }
  })

  test('SavedBuild is open and requires every property; SavedBuildWithId composes it with a required id and is closed', () => {
    expect(schemas.SavedBuild).not.toHaveProperty('additionalProperties')
    expect([...schemas.SavedBuild.required].sort()).toEqual(keys(schemas.SavedBuild.properties))
    expect(schemas.SavedBuildWithId.allOf).toEqual([
      { $ref: '#/components/schemas/SavedBuild' },
      { properties: { id: expect.objectContaining({ type: 'string', pattern: SAVED_BUILD_ID_PATTERN.source }) }, required: ['id'] },
    ])
    expect(schemas.SavedBuildWithId.unevaluatedProperties).toBe(false)
  })

  test('the closed schemas are exactly SaveBuildResponse, BuildsError and SavedBuildWithId, and require every property', () => {
    const closed = NEW_SCHEMAS.filter((name) => schemas[name].additionalProperties === false || schemas[name].unevaluatedProperties === false)
    expect(closed.sort()).toEqual(['BuildsError', 'SaveBuildResponse', 'SavedBuildWithId'])
    for (const name of ['SaveBuildResponse', 'BuildsError']) {
      expect([...schemas[name].required].sort(), name).toEqual(keys(schemas[name].properties))
    }
    expect(schemas.SaveBuildRequest.additionalProperties).not.toBe(false)
  })

  test('every property of the new schemas has a description', () => {
    const properties = [
      ...['SaveBuildRequest', 'SaveBuildResponse', 'SavedBuild', 'BuildsError'].flatMap((name) => Object.entries<any>(schemas[name].properties).map(([key, value]) => [`${name}.${key}`, value] as const)),
      ['SavedBuildWithId.id', schemas.SavedBuildWithId.allOf[1].properties.id] as const,
    ]
    for (const [label, value] of properties) expect(value.description, label).toBeTruthy()
  })

  test('SaveBuildRequest.durationSeconds has the simulate bounds and SavedBuild.durationSeconds has none', () => {
    const { min, max } = SIM_INPUT_BOUNDS.durationSeconds
    expect(schemas.SaveBuildRequest.properties.durationSeconds).toMatchObject({ type: 'integer', minimum: min, maximum: max })
    expect(schemas.SaveBuildRequest.required).toEqual(['buildOrder', 'durationSeconds'])
    expect(schemas.SavedBuild.properties.durationSeconds).not.toHaveProperty('minimum')
    expect(schemas.SavedBuild.properties.durationSeconds).not.toHaveProperty('maximum')
  })
})

test.describe('every example validates against its schema', () => {
  test('the request and response examples of the three operations', () => {
    expectValid('SaveBuildRequest', requestExample)
    let checked = 0
    for (const operation of [save, getOperation, deleteOperation]) {
      for (const response of Object.values<any>(operation.responses)) {
        const content = response.content?.['application/json']
        if (!content?.examples) continue
        const name = content.schema.$ref.split('/').pop()
        for (const example of Object.values<any>(content.examples)) {
          expectValid(name, example.value)
          checked += 1
        }
      }
    }
    expect(checked).toBeGreaterThan(10)
  })
})

test.describe('the examples equal the real responses', () => {
  const client = uniqueClient('builds-contract')
  const order = requestExample.buildOrder
  const requests: Record<string, unknown> = {
    notAnObject: [],
    unknownUnit: { buildOrder: { ...order, steps: [{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }] }, durationSeconds: 300 },
    durationOutOfRange: { ...requestExample, durationSeconds: 59 },
    nameTooLong: { buildOrder: { ...order, name: 'n'.repeat(101) }, durationSeconds: 300 },
  }

  test('the save request example gives the 201 or 200 example body, and GET gives the GET example', async ({ request }) => {
    const response = await postBuild(request, requestExample, client)
    expect([200, 201]).toContain(response.status())
    const body = await response.json()
    expect(body).toEqual(examples(save, '201').created.value)
    expect(body).toEqual(examples(save, '200').exists.value)

    await expectBody(await request.get(buildPath(body.id), { timeout: 10_000 }), 200, examples(getOperation, '200').saved)
  })

  test('every 400 example has a request that reproduces it', () => {
    expect(keys(requests)).toEqual(keys(examples(save, '400')))
  })

  for (const [name, body] of Object.entries(requests)) {
    test(`the ${name} 400 example equals the real response`, async ({ request }) => {
      await expectBody(await postBuild(request, body, client), 400, examples(save, '400')[name])
    })
  }

  test('the 413 example equals the real response', async ({ request }) => {
    const body = { buildOrder: { ...order, source: '€'.repeat(30_000) }, durationSeconds: 300 }
    await expectBody(await postBuild(request, body, client), 413, examples(save, '413').recordTooLarge)
  })

  test('the 404 examples equal the real responses', async ({ request }) => {
    await expectBody(await request.get(buildPath('abc'), { timeout: 10_000 }), 404, examples(getOperation, '404').notFound)
    await expectBody(await request.delete(buildPath('abc'), { timeout: 10_000 }), 404, examples(deleteOperation, '404').notFound)
  })

  test('the 405 examples equal the real responses', async ({ request }) => {
    await expectBody(await request.get(BUILDS_PATH, { timeout: 10_000 }), 405, examples(save, '405').getOnSave)
    await expectBody(await request.put(buildPath('abcdefghijk'), { timeout: 10_000 }), 405, examples(getOperation, '405').putOnId)
  })

  test('the 429 example equals the real response to the 31st save', async ({ request }) => {
    const limited = uniqueClient('builds-contract-limit')
    for (let count = 0; count < SAVE_RATE_LIMIT.maxSaves; count += 1) await postBuild(request, requestExample, limited)
    await expectBody(await postBuild(request, requestExample, limited), 429, examples(save, '429').tooManySaves)
  })

  test('the 503 and 500 examples have no live reproduction and validate as BuildsError only', () => {
    for (const example of [examples(save, '503').storageUnavailable, examples(save, '500').idFailure, examples(getOperation, '500').unreadableBuild]) expectValid('BuildsError', example.value)
  })
})

test.describe('real responses against the schemas', () => {
  const client = uniqueClient('builds-contract-shapes')

  test('a real 201 and a real GET validate; an added property does not, and a GET without id does not', async ({ request }) => {
    const unique = { ...requestExample, buildOrder: { ...requestExample.buildOrder, name: `Shapes ${randomUUID()}` } }
    const created = await postBuild(request, unique, client)
    expect(created.status()).toBe(201)
    const createdBody = await created.json()
    expectValid('SaveBuildResponse', createdBody)
    expectInvalid('SaveBuildResponse', { ...createdBody, extra: 1 })

    const read = await request.get(buildPath(createdBody.id), { timeout: 10_000 })
    const readBody = await read.json()
    expectValid('SavedBuildWithId', readBody)
    expectInvalid('SavedBuildWithId', { ...readBody, extra: 1 })
    const { id, ...withoutId } = readBody
    expect(id).toBe(createdBody.id)
    expectInvalid('SavedBuildWithId', withoutId)
  })

  test('a real 400 validates', async ({ request }) => {
    const response = await postBuild(request, [], client)
    expect(response.status()).toBe(400)
    expectValid('SimulateError', await response.json())
  })
})
