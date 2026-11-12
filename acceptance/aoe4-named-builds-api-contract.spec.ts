import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { NAMED_BUILDS_PATH, namedBuildUrl, postNamedBuild, putNamedBuild, uniqueClient } from './helpers'
import { examples, expectBody, expectInvalid, expectValid, keys, referencedSchemaNames, schemas, spec } from './openapi-schemas'
import { NAMED_BUILD_ID_PATTERN } from '../lib/aoe4-build-order/named-builds'

const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const BY_ID = `${NAMED_BUILDS_PATH}/{id}`
const create = spec.paths[NAMED_BUILDS_PATH]?.post
const read = spec.paths[BY_ID]?.get
const update = spec.paths[BY_ID]?.put
const remove = spec.paths[BY_ID]?.delete
const NEW_SCHEMAS = ['CreateNamedBuildResponse', 'UpdateNamedBuildResponse', 'NamedBuild']

const requestExample = create.requestBody.content['application/json'].examples.buildOrder.value
const ownProperties = (name: string) => keys(schemas[name].properties)
const namedProperties = () => [...ownProperties('SavedBuild'), ...keys(schemas.NamedBuild.allOf[1].properties)].sort()

test.beforeAll(async ({ request }) => {
  await postNamedBuild(request, requestExample, uniqueClient('named-contract-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(namedBuildUrl('warmupwarm'), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe('spec structure', () => {
  test('is version 2.6.0, has both named-builds paths, and every operationId is non-empty and unique', () => {
    expect(spec.info.version).toBe('2.6.0')
    expect(spec.paths).toHaveProperty([NAMED_BUILDS_PATH])
    expect(spec.paths).toHaveProperty([BY_ID])
    const ids = Object.values<any>(spec.paths).flatMap((path) => Object.values<any>(path).map((operation) => operation.operationId).filter((id) => id !== undefined))
    for (const id of ids) expect(typeof id === 'string' && id.length > 0, String(id)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect([create.operationId, read.operationId, update.operationId, remove.operationId]).toEqual(['createNamedBuild', 'getNamedBuild', 'updateNamedBuild', 'deleteNamedBuild'])
  })

  test('each operation declares exactly its statuses', () => {
    expect(keys(create.responses)).toEqual(['201', '400', '405', '413', '429', '500', '503'])
    expect(keys(read.responses)).toEqual(['200', '404', '405', '500', '503'])
    expect(keys(update.responses)).toEqual(['200', '400', '401', '403', '404', '405', '412', '413', '428', '429', '500', '503'])
    expect(keys(remove.responses)).toEqual(['204', '404', '405', '503'])
    expect(spec.paths[BY_ID].parameters[0].schema.pattern).toBe(NAMED_BUILD_ID_PATTERN.source)
    expect(read.responses['200'].headers['Cache-Control'].schema.const).toBe('no-store')
    expect(update.responses['401'].headers['WWW-Authenticate'].schema.const).toBe('Bearer')
  })

  test('the edit secret is an http bearer scheme that updateNamedBuild uses, with a required If-Match header', () => {
    expect(spec.components.securitySchemes.editSecret).toMatchObject({ type: 'http', scheme: 'bearer' })
    expect(update.security).toEqual([{ editSecret: [] }])
    expect(update.parameters).toContainEqual(expect.objectContaining({ name: 'If-Match', in: 'header', required: true }))
  })

  test('the three new schemas exist and each is referenced from a path or another schema', () => {
    const referenced = referencedSchemaNames()
    for (const name of NEW_SCHEMAS) {
      expect(schemas, name).toHaveProperty(name)
      expect(referenced.has(name), name).toBe(true)
    }
  })

  test('the three schemas are closed and have exactly the properties of their types', () => {
    expect(schemas.CreateNamedBuildResponse.additionalProperties).toBe(false)
    expect(schemas.UpdateNamedBuildResponse.additionalProperties).toBe(false)
    expect(schemas.NamedBuild.unevaluatedProperties).toBe(false)
    expect(ownProperties('CreateNamedBuildResponse')).toEqual(['editSecret', 'id', 'path', 'revision', 'updatedAt'])
    expect(ownProperties('UpdateNamedBuildResponse')).toEqual(['id', 'path', 'revision', 'updatedAt'])
    expect(schemas.NamedBuild.allOf[0]).toEqual({ $ref: '#/components/schemas/SavedBuild' })
    expect(namedProperties()).toEqual([...ownProperties('SavedBuild'), 'createdAt', 'id', 'revision', 'updatedAt'].sort())
    expect(namedProperties()).not.toContain('secretHash')
    for (const name of ['CreateNamedBuildResponse', 'UpdateNamedBuildResponse']) expect([...schemas[name].required].sort(), name).toEqual(ownProperties(name))
  })

  test('every property of the three schemas has a description', () => {
    const properties = [
      ...['CreateNamedBuildResponse', 'UpdateNamedBuildResponse'].flatMap((name) => Object.entries<any>(schemas[name].properties).map(([key, value]) => [`${name}.${key}`, value] as const)),
      ...Object.entries<any>(schemas.NamedBuild.allOf[1].properties).map(([key, value]) => [`NamedBuild.${key}`, value] as const),
    ]
    for (const [label, value] of properties) expect(value.description, label).toBeTruthy()
  })

  test('every JSON example of the four operations validates against its schema', () => {
    let checked = 0
    for (const operation of [create, read, update, remove]) {
      for (const response of Object.values<any>(operation.responses)) {
        const content = response.content?.['application/json']
        if (!content) continue
        const name = content.schema.$ref.split('/').pop()
        for (const example of Object.values<any>(content.examples)) {
          expectValid(name, example.value)
          checked += 1
        }
      }
    }
    expect(checked).toBeGreaterThan(20)
  })
})

test.describe.serial('real responses against the schemas', () => {
  const client = uniqueClient('named-contract-shapes')
  let created: any

  test('a real create validates as CreateNamedBuildResponse and not with an added property', async ({ request }) => {
    const body = { ...requestExample, buildOrder: { ...requestExample.buildOrder, name: `Shapes ${randomUUID()}` } }
    const response = await postNamedBuild(request, body, client)
    expect(response.status(), await response.text()).toBe(201)
    created = await response.json()
    expectValid('CreateNamedBuildResponse', created)
    expectInvalid('CreateNamedBuildResponse', { ...created, extra: 1 })
  })

  test('a real GET validates as NamedBuild and not with an added property', async ({ request }) => {
    const response = await request.get(namedBuildUrl(created.id), { timeout: 10_000 })
    expect(response.status(), await response.text()).toBe(200)
    const named = await response.json()
    expectValid('NamedBuild', named)
    expectInvalid('NamedBuild', { ...named, extra: 1 })
  })

  test('a real update validates as UpdateNamedBuildResponse and not with an added property', async ({ request }) => {
    const headers = { Authorization: `Bearer ${created.editSecret}`, 'If-Match': '"1"' }
    const response = await putNamedBuild(request, created.id, requestExample, client, headers)
    expect(response.status(), await response.text()).toBe(200)
    const updated = await response.json()
    expectValid('UpdateNamedBuildResponse', updated)
    expectInvalid('UpdateNamedBuildResponse', { ...updated, extra: 1 })
  })
})

test.describe('the 4xx examples equal the real responses', () => {
  const client = uniqueClient('named-contract')
  const unused = 'AAAAAAAAAAAAAAAAAAAAAA'
  const owner = { Authorization: `Bearer ${'w'.repeat(43)}`, 'If-Match': '"1"' }

  test('the 400 examples', async ({ request }) => {
    await expectBody(await postNamedBuild(request, [], client), 400, examples(create, '400').notAnObject)
    await expectBody(await putNamedBuild(request, unused, [], client, owner), 400, examples(update, '400').notAnObject)
  })

  test('the 401 example', async ({ request }) => {
    await expectBody(await putNamedBuild(request, unused, requestExample, client, { 'If-Match': '"1"' }), 401, examples(update, '401').secretRequired)
  })

  test('the 404 examples, for a malformed id', async ({ request }) => {
    await expectBody(await request.get(namedBuildUrl('abc'), { timeout: 10_000 }), 404, examples(read, '404').notFound)
    await expectBody(await putNamedBuild(request, 'abc', requestExample, client, owner), 404, examples(update, '404').notFound)
    await expectBody(await request.delete(namedBuildUrl('abc'), { timeout: 10_000 }), 404, examples(remove, '404').notFound)
  })

  test('the 405 examples', async ({ request }) => {
    await expectBody(await request.get(NAMED_BUILDS_PATH, { timeout: 10_000 }), 405, examples(create, '405').getOnCreate)
    for (const operation of [read, update, remove]) {
      await expectBody(await request.patch(namedBuildUrl(unused), { timeout: 10_000 }), 405, examples(operation, '405').patchOnId)
    }
  })

  test('the 428 example', async ({ request }) => {
    await expectBody(await putNamedBuild(request, unused, requestExample, client, { Authorization: owner.Authorization }), 428, examples(update, '428').revisionRequired)
  })
})
