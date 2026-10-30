import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, type APIRequestContext } from '@playwright/test'
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020'
import { DEFAULT_ARMIES, postFight, type FightBody } from './helpers'
import { OUTCOME_KINDS } from '../lib/combat-simulator/battle'
import type {
  FightError,
  FightOutcomes,
  FightRequest,
  FightResponse,
  FightSurvivors,
  HitsPerRound,
  OutcomeTally,
  RoundStats,
  SurvivorCombination,
} from '../lib/combat-simulator/fight-api'

const REQUEST_TIMEOUT_MS = 10_000
// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
const schemas = spec.components.schemas
const operation = spec.paths['/api/fight'].post
const requestExample = operation.requestBody.content['application/json'].example
const okExample = operation.responses['200'].content['application/json'].example

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

const BASELINE: FightBody = { ...DEFAULT_ARMIES, battles: 20 }

async function expect200(request: APIRequestContext, body: FightBody) {
  const response = await postFight(request, body, REQUEST_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(200)
  const json = await response.json()
  expectValid('FightResponse', json)
  return json as FightResponse
}

async function expect400(request: APIRequestContext, body: FightBody, errorContains: string) {
  const response = await postFight(request, body, REQUEST_TIMEOUT_MS)
  expect(response.status()).toBe(400)
  const json = await response.json()
  expectValid('FightError', json)
  expect(json.error).toContain(errorContains)
}

function integerRange(field: string): { min: number; max: number } {
  const branches = schemas.FightRequest.properties[field].oneOf
  const integer = branches.find((b: { type: string }) => b.type === 'integer')
  const digits = branches.find((b: { type: string }) => b.type === 'string')
  expect(digits['x-minimum']).toBe(integer.minimum)
  expect(digits['x-maximum']).toBe(integer.maximum)
  return { min: integer.minimum, max: integer.maximum }
}

test.beforeAll(async ({ request }) => {
  await postFight(request, BASELINE, WARM_UP_TIMEOUT_MS)
})

test.describe('spec structure', () => {
  test('declares runFight with exactly 200, 400 and 405 responses', () => {
    expect(operation.operationId).toBe('runFight')
    expect(keys(operation.responses)).toEqual(['200', '400', '405'])
    expect(operation.responses['405'].headers.Allow).toBeDefined()
  })

  test('every example validates against its schema', () => {
    expectValid('FightRequest', requestExample)
    expectValid('FightResponse', okExample)
    for (const { value } of Object.values<{ value: unknown }>(operation.responses['400'].content['application/json'].examples)) {
      expectValid('FightError', value)
    }
    expectValid('FightError', operation.responses['405'].content['application/json'].example)
  })

  for (const kind of ['attacker', 'defender', 'tie']) {
    test(`a response without outcomes.${kind} is rejected`, () => {
      const body = structuredClone(okExample)
      delete body.outcomes[kind]
      expectInvalid('FightResponse', body)
    })
  }

  test('an extra outcome kind is accepted only with the {count, frequency} shape', () => {
    const wellFormed = structuredClone(okExample)
    wellFormed.outcomes.retreat = { count: 0, frequency: 0 }
    expectValid('FightResponse', wellFormed)

    const malformed = structuredClone(okExample)
    malformed.outcomes.retreat = { count: 0 }
    expectInvalid('FightResponse', malformed)
  })
})

test.describe('real responses', () => {
  test('the request example returns a 200 with the example key set at every level', async ({ request }) => {
    const body = await expect200(request, requestExample)

    expect(keys(body)).toEqual(keys(okExample))
    expect(keys(body.outcomes)).toEqual(keys(okExample.outcomes))
    for (const kind of Object.keys(body.outcomes)) {
      expect(keys(body.outcomes[kind])).toEqual(keys(okExample.outcomes[kind]))
    }
    expect(keys(body.rounds)).toEqual(keys(okExample.rounds))
    expect(keys(body.survivors)).toEqual(keys(okExample.survivors))
    const combinationKeys = keys([...okExample.survivors.attacker, ...okExample.survivors.defender][0])
    for (const combination of [...body.survivors.attacker, ...body.survivors.defender]) {
      expect(keys(combination)).toEqual(combinationKeys)
    }
    expect(keys(body.hitsPerRound)).toEqual(keys(okExample.hitsPerRound))

    expect(new Set(Object.keys(body.outcomes))).toEqual(new Set(OUTCOME_KINDS))
  })

  test('an out-of-range field returns a FightError 400', async ({ request }) => {
    await expect400(request, { ...BASELINE, 'attack-ldrs': 6 }, 'attack-ldrs')
  })

  test('GET returns a FightError 405 with Allow: POST', async ({ request }) => {
    const response = await request.get('/api/fight', { timeout: REQUEST_TIMEOUT_MS })
    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expectValid('FightError', await response.json())
  })

  test('malformed JSON returns the plain-text 400 the spec documents', async ({ request }) => {
    const response = await request.post('/api/fight', {
      // A string body would be JSON-encoded by Playwright as a valid JSON string.
      data: Buffer.from('{"attack-regs":'),
      headers: { 'Content-Type': 'application/json' },
      timeout: REQUEST_TIMEOUT_MS,
    })
    expect(response.status()).toBe(400)
    expect(await response.text()).toBe('Invalid JSON')
    expect(operation.responses['400'].description).toContain('Invalid JSON')
  })
})

test.describe('boundaries from the spec', () => {
  const pairs: [string, string][] = [
    ['attack-regs', 'attack-elts'],
    ['attack-elts', 'attack-regs'],
    ['defend-regs', 'defend-elts'],
    ['defend-elts', 'defend-regs'],
  ]
  for (const [field, partner] of pairs) {
    test(`${field} range`, async ({ request }) => {
      const { min, max } = integerRange(field)
      await expect200(request, { ...BASELINE, [field]: max, [partner]: 0 })
      await expect400(request, { ...BASELINE, [field]: max + 1, [partner]: 0 }, field)
      await expect200(request, { ...BASELINE, [field]: min })
      await expect400(request, { ...BASELINE, [field]: min - 1 }, field)
    })
  }

  for (const field of ['attack-ldrs', 'defend-ldrs']) {
    test(`${field} range`, async ({ request }) => {
      const { min, max } = integerRange(field)
      await expect200(request, { ...BASELINE, [field]: max })
      await expect400(request, { ...BASELINE, [field]: max + 1 }, field)
      await expect200(request, { ...BASELINE, [field]: min })
      await expect400(request, { ...BASELINE, [field]: min - 1 }, field)
    })
  }

  test('battles range', async ({ request }) => {
    const { min, max } = integerRange('battles')
    const body = await expect200(request, { ...BASELINE, battles: min })
    expect(body.battles).toBe(min)
    await expect400(request, { ...BASELINE, battles: min - 1 }, 'battles')
    await expect400(request, { ...BASELINE, battles: max + 1 }, 'battles')
  })
})

test.describe('cross-field rules', () => {
  test('more than 10 regulars and elites on a side is rejected', async ({ request }) => {
    await expect400(request, { ...BASELINE, 'attack-regs': 10, 'attack-elts': 1 }, 'attack')
  })

  test('a side with no regulars or elites is rejected', async ({ request }) => {
    await expect400(request, { ...BASELINE, 'defend-regs': 0, 'defend-elts': 0, 'defend-ldrs': 1 }, 'defend')
  })

  test('omitting battles runs the documented default', async ({ request }) => {
    const { battles, ...withoutBattles } = BASELINE
    const body = await expect200(request, withoutBattles)
    expect(body.battles).toBe(schemas.FightRequest.properties.battles.default)
  })
})

test.describe('exported types match the spec', () => {
  const fightRequest: Record<keyof FightRequest, true> = {
    'attack-regs': true,
    'attack-elts': true,
    'attack-ldrs': true,
    'defend-regs': true,
    'defend-elts': true,
    'defend-ldrs': true,
    battles: true,
  }
  const fightResponse: Record<keyof FightResponse, true> = {
    battles: true,
    outcomes: true,
    rounds: true,
    survivors: true,
    hitsPerRound: true,
  }
  const fightError: Record<keyof FightError, true> = { error: true }
  const fightOutcomes: Record<keyof FightOutcomes, true> = { attacker: true, defender: true, tie: true }
  const outcomeTally: Record<keyof OutcomeTally, true> = { count: true, frequency: true }
  const roundStats: Record<keyof RoundStats, true> = { mean: true, median: true, p10: true, p90: true }
  const fightSurvivors: Record<keyof FightSurvivors, true> = { attacker: true, defender: true }
  const survivorCombination: Record<keyof SurvivorCombination, true> = {
    regulars: true,
    elites: true,
    count: true,
    frequency: true,
  }
  const hitsPerRound: Record<keyof HitsPerRound, true> = { attacker: true, defender: true }

  const typeKeys: Record<string, object> = {
    FightRequest: fightRequest,
    FightResponse: fightResponse,
    FightError: fightError,
    FightOutcomes: fightOutcomes,
    OutcomeTally: outcomeTally,
    RoundStats: roundStats,
    FightSurvivors: fightSurvivors,
    SurvivorCombination: survivorCombination,
    HitsPerRound: hitsPerRound,
  }

  test('every schema has an exported type and the reverse', () => {
    expect(keys(typeKeys)).toEqual(keys(schemas))
  })

  for (const [name, literal] of Object.entries(typeKeys)) {
    test(`${name} keys match the schema properties`, () => {
      expect(keys(literal)).toEqual(keys(schemas[name].properties))
    })
  }

  test('OUTCOME_KINDS matches the required outcome kinds', () => {
    expect(new Set(OUTCOME_KINDS)).toEqual(new Set(schemas.FightOutcomes.required))
  })
})
