import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, type APIRequestContext } from '@playwright/test'
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020'
import { SIMULATE_PATH, postSimulate, postSimulateRaw } from './helpers'
import { SIM_INPUT_BOUNDS } from '../lib/aoe4-build-order/validate'
import { FINITE_GATHER_NODES, FINITE_NODE_REFS, NODE_REFS, SEVERITIES } from '../lib/aoe4-build-order/model'
import type { SimInputOverrides, SimulateError, SimulateRequest, TripInputOverrides } from '../lib/aoe4-build-order/api'
import type {
  BuildOrder,
  BuildOrderIssue,
  BuildOrderNote,
  BuildStart,
  NodeDepletion,
  SimWarning,
  SimulationResult,
  StepTiming,
  StepWait,
  UnitSeries,
} from '../lib/aoe4-build-order/model'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
const schemas = spec.components.schemas
const operation = spec.paths[SIMULATE_PATH].post
const requestExamples = operation.requestBody.content['application/json'].examples
const okExample = operation.responses['200'].content['application/json'].example
const errorExamples = operation.responses['400'].content['application/json'].examples

const ajv = new Ajv2020({ strict: false })
ajv.addSchema(spec, 'openapi.json')

function validator(name: string): ValidateFunction {
  const validate = ajv.getSchema(`openapi.json#/components/schemas/${name}`)
  if (!validate) {
    throw new Error(`no schema ${name} in docs/api/openapi.json`)
  }
  return validate
}

function expectValid(name: string, data: unknown) {
  const validate = validator(name)
  expect(validate(data), JSON.stringify(validate.errors)).toBe(true)
}

function expectInvalid(name: string, data: unknown) {
  expect(validator(name)(data)).toBe(false)
}

function keys(value: object) {
  return Object.keys(value).sort()
}

type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: unknown; oneOf?: Schema[]; description?: string }

function objectVariants(schema: Schema): Schema[] {
  return schema.oneOf ? schema.oneOf.flatMap(objectVariants) : schema.properties ? [schema] : []
}

const REQUEST_SCHEMAS = ['SimulateRequest', 'BuildOrder', 'BuildStart', 'BuildStep', 'Trigger', 'SimInputOverrides', 'TripInputOverrides']
const RESPONSE_SCHEMAS = ['SimulateError', 'SimulationResult', 'UnitSeries', 'StepTiming', 'BuildOrderIssue', 'BuildOrderNote', 'NodeDepletion']
const SHARED_SCHEMAS = ['GatherNodeId', 'ResourceKind', 'CivId', 'FiniteGatherNodeId', 'DepositRef', 'NodeRef', 'FiniteNodeRef', 'Severity', 'StepWait', 'SimWarning']

const PRODUCE = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const START = { villagers: { sheep: 6 }, rally: 'sheep' }

function buildOrderBody(steps: unknown[]) {
  return { buildOrder: { civ: 'english', name: 'Contract', start: START, steps } }
}

async function expect200(request: APIRequestContext, body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  const json = await response.json()
  expectValid('SimulationResult', json)
  return json
}

async function expect400(request: APIRequestContext, body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(400)
  const json = await response.json()
  expectValid('SimulateError', json)
  return json
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, requestExamples.buildOrder.value, WARM_UP_TIMEOUT_MS)
})

test.describe('spec structure', () => {
  test('declares simulateBuildOrder with exactly 200, 400 and 405 responses', () => {
    expect(operation.operationId).toBe('simulateBuildOrder')
    expect(keys(operation.responses)).toEqual(['200', '400', '405'])
    expect(operation.responses['405'].headers.Allow.schema).toEqual({ type: 'string', const: 'POST' })
  })

  test('the AoE4 schemas are named after the TypeScript types, with no schema for the alias or the resolved inputs', () => {
    for (const name of [...REQUEST_SCHEMAS, ...RESPONSE_SCHEMAS, ...SHARED_SCHEMAS]) {
      expect(schemas, name).toHaveProperty(name)
    }
    for (const name of ['SimulateResponse', 'SimInputs', 'TripInputs']) {
      expect(schemas, name).not.toHaveProperty(name)
    }
  })

  test('request-side schemas allow unknown properties', () => {
    for (const name of REQUEST_SCHEMAS) {
      for (const variant of objectVariants(schemas[name])) {
        expect(variant.additionalProperties, name).not.toBe(false)
      }
    }
  })

  test('response-side schemas are closed and require every property the type does not mark optional', () => {
    const optional: Record<string, string[]> = { BuildOrderIssue: ['line', 'step'], SimulateError: ['omittedIssues'] }
    for (const name of RESPONSE_SCHEMAS) {
      const schema = schemas[name]
      expect(schema.additionalProperties, name).toBe(false)
      const expected = keys(schema.properties).filter((k) => !(optional[name] ?? []).includes(k))
      expect([...schema.required].sort(), name).toEqual(expected)
    }
  })

  test('every SimWarning variant is closed, requires every property and is tagged by a code const', () => {
    const variants: Schema[] = schemas.SimWarning.oneOf
    expect(variants.map((v) => (v.properties.code as { const?: string }).const)).toEqual(['node-depleted', 'idle-arrival', 'step-stuck'])
    for (const variant of variants) {
      expect(variant.additionalProperties).toBe(false)
      expect([...variant.required].sort()).toEqual(keys(variant.properties))
    }
  })

  test('every AoE4 schema property and every oneOf variant has a description', () => {
    for (const name of [...REQUEST_SCHEMAS, ...RESPONSE_SCHEMAS, 'SimWarning']) {
      for (const variant of objectVariants(schemas[name])) {
        for (const [property, value] of Object.entries(variant.properties ?? {})) {
          expect(value.description, `${name}.${property}`).toBeTruthy()
        }
      }
      for (const variant of schemas[name].oneOf ?? []) {
        expect(variant.description, `${name} variant`).toBeTruthy()
      }
    }
  })

  test('the operation prose states the issues ordering, the issue location rules and both framework responses', () => {
    const prose = operation.description
    expect(prose).toMatch(/order-stage issues first, then inputs issues/)
    expect(prose).toMatch(/not a JSON object.*one syntax issue/)
    expect(prose).toMatch(/pasted step carries line and step/)
    expect(prose).toMatch(/JSON step carries step and never line/)
    expect(prose).toMatch(/at any depth take their defaults/)
    expect(prose).toContain('Invalid JSON')
    expect(prose).toContain('413')
  })
})

test.describe('enums and node-ref unions match the TypeScript constants', () => {
  const stepWaits: Record<StepWait, true> = {
    resources: true,
    villagers: true,
    population: true,
    prerequisite: true,
    trigger: true,
    'earlier-step': true,
  }

  function acceptedValues(name: string): string[] {
    const schema = schemas[name]
    return schema.enum ?? schema.oneOf.flatMap((variant: { $ref: string }) => acceptedValues(variant.$ref.split('/').pop()))
  }

  test('FiniteGatherNodeId, DepositRef, Severity and StepWait enumerate the TypeScript values', () => {
    expect(schemas.FiniteGatherNodeId.enum).toEqual(FINITE_GATHER_NODES)
    expect(schemas.DepositRef.enum).toEqual(['gold#2', 'gold#3', 'gold#4', 'gold#5', 'gold#6', 'gold#7', 'gold#8'])
    expect(schemas.Severity.enum).toEqual(SEVERITIES)
    expect(schemas.StepWait.enum).toEqual(Object.keys(stepWaits))
  })

  test('NodeRef accepts exactly NODE_REFS and FiniteNodeRef exactly FINITE_NODE_REFS', () => {
    expect([...acceptedValues('NodeRef')].sort()).toEqual([...NODE_REFS].sort())
    expect([...acceptedValues('FiniteNodeRef')].sort()).toEqual([...FINITE_NODE_REFS].sort())
    for (const ref of NODE_REFS) {
      expectValid('NodeRef', ref)
    }
    for (const ref of FINITE_NODE_REFS) {
      expectValid('FiniteNodeRef', ref)
    }
    for (const bad of ['gold#1', 'gold#9', 'wood#2']) {
      expectInvalid('NodeRef', bad)
    }
    for (const infinite of ['farm', 'wood']) {
      expectInvalid('FiniteNodeRef', infinite)
    }
  })
})

test.describe('bounds match SIM_INPUT_BOUNDS', () => {
  type Variant = { properties: Record<string, { const?: string } & Record<string, unknown>> }
  const variant = (action: string) => schemas.BuildStep.oneOf.find((v: Variant) => v.properties.action.const === action)
  const trigger = (kind: string) => schemas.Trigger.oneOf.find((v: Variant) => v.properties.kind.const === kind)
  const overrides = schemas.SimInputOverrides.properties
  const trip = schemas.TripInputOverrides.properties

  const locations: Record<keyof typeof SIM_INPUT_BOUNDS, () => Record<string, unknown>[]> = {
    textChars: () => [],
    steps: () => [],
    durationSeconds: () => [overrides.durationSeconds],
    triggerSeconds: () => [trigger('time').properties.seconds],
    triggerCount: () => [trigger('villagers').properties.count],
    count: () => [variant('produce').properties.count, variant('move').properties.count],
    builders: () => [variant('build').properties.builders],
    houseBuilders: () => [overrides.houseBuilders],
    instance: () => ['produce', 'rally', 'pause'].map((a) => variant(a).properties.instance),
    walkSeconds: () => [overrides.walkSeconds, ...['produce', 'rally', 'build', 'move'].map((a) => variant(a).properties.walkSeconds)],
    startVillagers: () => [schemas.BuildStart.properties.villagers.additionalProperties],
    walkSecondsCamp: () => [trip.walkSecondsCamp],
    walkSecondsTownCenter: () => [trip.walkSecondsTownCenter],
    dropOffSeconds: () => [trip.dropOffSeconds],
    influenceCoverage: () => [overrides.influenceCoverage.additionalProperties],
  }

  test('text and steps caps', () => {
    expect(schemas.SimulateRequest.properties.text.maxLength).toBe(SIM_INPUT_BOUNDS.textChars.max)
    expect(schemas.BuildOrder.properties.steps.maxItems).toBe(SIM_INPUT_BOUNDS.steps.max)
  })

  for (const [name, bound] of Object.entries(SIM_INPUT_BOUNDS)) {
    if (name === 'textChars' || name === 'steps') continue
    test(`${name} is ${bound.integer ? 'an integer' : 'a number'} in ${bound.min}..${bound.max} everywhere it appears`, () => {
      const found = locations[name as keyof typeof SIM_INPUT_BOUNDS]()
      expect(found.length).toBeGreaterThan(0)
      for (const schema of found) {
        expect(schema).toMatchObject({ type: bound.integer ? 'integer' : 'number', minimum: bound.min, maximum: bound.max })
      }
    })
  }
})

test.describe('examples', () => {
  test('every example validates against its schema', () => {
    for (const { value } of Object.values<{ value: unknown }>(requestExamples)) {
      expectValid('SimulateRequest', value)
    }
    expectValid('SimulationResult', okExample)
    for (const { value } of Object.values<{ value: unknown }>(errorExamples)) {
      expectValid('SimulateError', value)
    }
    expectValid('FightError', operation.responses['405'].content['application/json'].example)
  })

  for (const name of ['buildOrder', 'text']) {
    test(`the ${name} request example returns the documented 200 body`, async ({ request }) => {
      expect(await expect200(request, requestExamples[name].value)).toEqual(okExample)
    })
  }

  const errorRequests: Record<string, string> = {
    stepAndInputs: JSON.stringify({
      buildOrder: { civ: 'english', name: 'Bad producer', start: { rally: 'sheep' }, steps: [{ action: 'produce', producer: 'house', unit: 'villager' }] },
      inputs: { durationSeconds: 59 },
    }),
    pastedStep: JSON.stringify({ text: 'start 6 sheep -> sheep\n# opener\nproduce villager from house' }),
    pasteSyntax: JSON.stringify({ text: 'start 6 sheep -> sheep\n@1:61 produce villager from capital-town-center' }),
    exactlyOne: JSON.stringify({ inputs: { durationSeconds: 300 } }),
    notAnObject: '[]',
  }

  test('every 400 example has a request that reproduces it', () => {
    expect(keys(errorRequests)).toEqual(keys(errorExamples))
  })

  for (const [name, raw] of Object.entries(errorRequests)) {
    test(`the ${name} 400 example equals the real response`, async ({ request }) => {
      const response = await postSimulateRaw(request, raw)
      expect(response.status()).toBe(400)
      expect(await response.json()).toEqual(errorExamples[name].value)
    })
  }

  test('the 405 example equals the real GET response', async ({ request }) => {
    const response = await request.get(SIMULATE_PATH, { timeout: 10_000 })
    expect(response.status()).toBe(405)
    expect(await response.json()).toEqual(operation.responses['405'].content['application/json'].example)
  })
})

test.describe('real responses against the schemas', () => {
  test('a real 200 validates; an added property or a missing required one does not', async ({ request }) => {
    const body = await expect200(request, requestExamples.buildOrder.value)

    expectInvalid('SimulationResult', { ...body, extra: 1 })
    const { times, ...withoutTimes } = body
    expect(times.length).toBeGreaterThan(0)
    expectInvalid('SimulationResult', withoutTimes)

    const nested = structuredClone(body)
    nested.steps[0].extra = 1
    expectInvalid('SimulationResult', nested)
  })

  test('a real 400 validates; an issue with an extra property does not', async ({ request }) => {
    const body = await expect400(request, buildOrderBody([{ ...PRODUCE, producer: 'house' }]))
    const mutated = structuredClone(body)
    mutated.issues[0].extra = 1
    expectInvalid('SimulateError', mutated)
  })
})

test.describe('SimulateError issue cap', () => {
  const issue = (i: number) => ({ code: 'syntax', message: `m${i}`, line: i + 1 })
  const issues = (count: number) => Array.from({ length: count }, (_, i) => issue(i))

  test('a real capped response validates', async ({ request }) => {
    const text = Array.from({ length: 101 }, (_, i) => `bogus ${i}`).join('\n')
    const json = await expect400(request, { text })
    expect(json.omittedIssues).toBe(1)
  })

  test('100 issues with omittedIssues validate; 100 issues without it validate', () => {
    expectValid('SimulateError', { error: 'm0', issues: issues(100), omittedIssues: 5 })
    expectValid('SimulateError', { error: 'm0', issues: issues(100) })
  })

  test('101 issues are schema-invalid', () => {
    expectInvalid('SimulateError', { error: 'm0', issues: issues(101), omittedIssues: 1 })
  })

  test('omittedIssues of 0 or a non-integer is schema-invalid', () => {
    expectInvalid('SimulateError', { error: 'm0', issues: issues(1), omittedIssues: 0 })
    expectInvalid('SimulateError', { error: 'm0', issues: issues(1), omittedIssues: 1.5 })
  })
})

test.describe('schema and server agree on requests', () => {
  test('the Trigger description pins the unknown-kind rule', () => {
    expect(schemas.Trigger.description).toMatch(/neither time nor villagers is invalid under this schema/)
    expect(schemas.Trigger.description).toContain('unknown-trigger-kind')
  })

  test('a trigger of unknown kind is schema-invalid and the server returns unknown-trigger-kind', async ({ request }) => {
    const body = buildOrderBody([{ ...PRODUCE, trigger: { kind: 'resource' } }])
    expectInvalid('SimulateRequest', body)
    const json = await expect400(request, body)
    expect(json.issues[0].code).toBe('unknown-trigger-kind')
  })

  test('a time trigger is schema-valid and the server accepts it', async ({ request }) => {
    const body = buildOrderBody([{ ...PRODUCE, trigger: { kind: 'time', seconds: 10 } }])
    expectValid('SimulateRequest', body)
    await expect200(request, body)
  })

  test('text over maxLength is schema-invalid and the server rejects it', async ({ request }) => {
    const body = { text: 'x'.repeat(schemas.SimulateRequest.properties.text.maxLength + 1) }
    expectInvalid('SimulateRequest', body)
    const json = await expect400(request, body)
    expect(json.issues[0].code).toBe('out-of-range')
  })

  test('both text and buildOrder is schema-invalid and the server rejects it', async ({ request }) => {
    const body = { ...buildOrderBody([PRODUCE]), text: 'start 6 sheep -> sheep' }
    expectInvalid('SimulateRequest', body)
    const json = await expect400(request, body)
    expect(json.issues[0].code).toBe('syntax')
  })
})

test.describe('exported types match the spec', () => {
  const simulateRequest: Record<keyof SimulateRequest, true> = { text: true, buildOrder: true, inputs: true }
  const simulateError: Record<keyof SimulateError, true> = { error: true, issues: true, omittedIssues: true }
  const tripInputOverrides: Record<keyof TripInputOverrides, true> = { walkSecondsCamp: true, walkSecondsTownCenter: true, dropOffSeconds: true }
  const simInputOverrides: Record<keyof SimInputOverrides, true> = {
    durationSeconds: true,
    trips: true,
    walkSeconds: true,
    autoHouses: true,
    houseBuilders: true,
    houseBuilderSource: true,
    influenceCoverage: true,
  }
  const buildOrder: Record<keyof BuildOrder, true> = { civ: true, name: true, source: true, start: true, steps: true }
  const buildStart: Record<keyof BuildStart, true> = { villagers: true, rally: true }
  const simulationResult: Record<keyof SimulationResult, true> = {
    civ: true,
    durationSeconds: true,
    sampleSeconds: true,
    times: true,
    unitsProduced: true,
    gatherRates: true,
    floating: true,
    steps: true,
    ages: true,
    notes: true,
    depletions: true,
    warnings: true,
  }
  const nodeDepletion: Record<keyof NodeDepletion, true> = { node: true, amount: true, depletedAt: true }
  type WarningKeys<C extends SimWarning['code']> = Record<keyof Extract<SimWarning, { code: C }>, true>
  const nodeWarning = { code: true, severity: true, message: true, node: true, at: true, idleVillagers: true } as const
  const simWarningVariants: [WarningKeys<'node-depleted'>, WarningKeys<'idle-arrival'>, WarningKeys<'step-stuck'>] = [
    nodeWarning,
    nodeWarning,
    { code: true, severity: true, message: true, step: true, waitingOn: true, at: true },
  ]
  const unitSeries: Record<keyof UnitSeries, true> = { unitId: true, baseId: true, name: true, tier: true, counts: true }
  const stepTiming: Record<keyof StepTiming, true> = { step: true, status: true, armedAt: true, startedAt: true, completedAt: true, waitSeconds: true }
  const buildOrderIssue: Record<keyof BuildOrderIssue, true> = { code: true, message: true, step: true, line: true }
  const buildOrderNote: Record<keyof BuildOrderNote, true> = { code: true, severity: true, message: true, step: true, tech: true, properties: true }

  const typeKeys: Record<string, object> = {
    SimulateRequest: simulateRequest,
    SimulateError: simulateError,
    TripInputOverrides: tripInputOverrides,
    SimInputOverrides: simInputOverrides,
    BuildOrder: buildOrder,
    BuildStart: buildStart,
    SimulationResult: simulationResult,
    UnitSeries: unitSeries,
    StepTiming: stepTiming,
    BuildOrderIssue: buildOrderIssue,
    BuildOrderNote: buildOrderNote,
    NodeDepletion: nodeDepletion,
  }

  for (const [name, literal] of Object.entries(typeKeys)) {
    test(`${name} keys match the schema properties`, () => {
      expect(keys(literal)).toEqual(keys(schemas[name].properties))
    })
  }

  test('SimWarning variant keys match the schema variants', () => {
    simWarningVariants.forEach((literal, i) => {
      expect(keys(literal)).toEqual(keys(schemas.SimWarning.oneOf[i].properties))
    })
  })
})
