import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect } from '@playwright/test'
import { DEFAULT_ARMIES, postFight, type FightBody } from './helpers'

const TIMEOUT = { timeout: 10_000 }

const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
const schemas = spec.components.schemas
const FIGHT_SCHEMA_NAMES = [
  'ArmyCount',
  'FightError',
  'FightOutcomes',
  'FightRequest',
  'FightResponse',
  'FightSurvivors',
  'HitsPerRound',
  'OutcomeTally',
  'RoundStats',
  'SurvivorCombination',
]
const fightSchemas = Object.fromEntries(Object.entries<any>(schemas).filter(([name]) => FIGHT_SCHEMA_NAMES.includes(name)))
const operation = spec.paths['/api/fight'].post
const errorExamples = operation.responses['400'].content['application/json'].examples

const BASELINE: FightBody = { ...DEFAULT_ARMIES, battles: 20 }

test.describe.configure({ timeout: 60_000 })

test.beforeAll(async ({ request }) => {
  await request.post('/api/fight', { data: BASELINE, timeout: 60_000 })
})

test.describe('spec file shape', () => {
  test('is OpenAPI 3.1 and lists /api/fight and /api/aoe4-build-order/simulate', () => {
    expect(spec.openapi).toMatch(/^3\.1\./)
    expect(Object.keys(spec.paths).sort()).toEqual(['/api/aoe4-build-order/simulate', '/api/fight'])
    expect(spec.info.version).toBeTruthy()
    expect(spec.info.description).not.toContain('/api/models/army')
  })

  test('has exactly the pinned fight schema names', () => {
    expect(Object.keys(fightSchemas).filter((n) => n !== 'ArmyCount').sort()).toEqual(
      [
        'FightError',
        'FightOutcomes',
        'FightRequest',
        'FightResponse',
        'FightSurvivors',
        'HitsPerRound',
        'OutcomeTally',
        'RoundStats',
        'SurvivorCombination',
      ].sort(),
    )
  })

  test('defines no object schema inline under paths', () => {
    const inline: string[] = []
    const walk = (node: unknown, path: string) => {
      if (!node || typeof node !== 'object') return
      const record = node as Record<string, unknown>
      if (record.type === 'object') inline.push(path)
      for (const [k, v] of Object.entries(record)) walk(v, `${path}.${k}`)
    }
    walk(spec.paths, 'paths')
    expect(inline).toEqual([])
  })

  test('every fight object schema requires every property and describes each; only FightOutcomes is open', () => {
    const open: string[] = []
    for (const [name, schema] of Object.entries<any>(fightSchemas)) {
      if (schema.type !== 'object') continue
      if (schema.additionalProperties !== false) open.push(name)
      const props = Object.keys(schema.properties)
      const expectedRequired = name === 'FightRequest' ? props.filter((p) => p !== 'battles') : props
      expect([...schema.required].sort(), `${name}.required`).toEqual([...expectedRequired].sort())
      for (const [prop, def] of Object.entries<any>(schema.properties)) {
        expect(def.description, `${name}.${prop} description`).toBeTruthy()
      }
    }
    expect(open).toEqual(['FightOutcomes'])
    expect(schemas.FightOutcomes.additionalProperties).toEqual({ $ref: '#/components/schemas/OutcomeTally' })
    expect([...schemas.FightOutcomes.required].sort()).toEqual(['attacker', 'defender', 'tie'])
    expect(schemas.FightOutcomes.description).toMatch(/unknown/i)
  })

  test('FightRequest has seven properties, battles default 1000, and battles is not required', () => {
    const request = schemas.FightRequest
    expect(Object.keys(request.properties)).toHaveLength(7)
    expect(request.required).not.toContain('battles')
    expect(request.properties.battles.default).toBe(1000)
  })

  test('each field offers an integer branch and a digit-string branch with the same range', () => {
    const ranges: Record<string, [number, number]> = {
      'attack-regs': [0, 10],
      'attack-elts': [0, 10],
      'attack-ldrs': [0, 5],
      'defend-regs': [0, 10],
      'defend-elts': [0, 10],
      'defend-ldrs': [0, 5],
      battles: [1, 100000],
    }
    for (const [field, [min, max]] of Object.entries(ranges)) {
      const prop = schemas.FightRequest.properties[field]
      const branches = prop.oneOf ?? schemas[prop.$ref?.split('/').pop()]?.oneOf
      expect(branches, field).toHaveLength(2)
      const integer = branches.find((b: any) => b.type === 'integer')
      const digits = branches.find((b: any) => b.type === 'string')
      expect([integer.minimum, integer.maximum], field).toEqual([min, max])
      expect(digits.pattern, field).toBe('^[0-9]+$')
      expect([digits['x-minimum'], digits['x-maximum']], field).toEqual([min, max])
    }
  })

  test('HitsPerRound arrays are fixed at six items and the 405 response pins Allow to POST', () => {
    for (const side of ['attacker', 'defender']) {
      const arr = schemas.HitsPerRound.properties[side]
      expect([arr.minItems, arr.maxItems]).toEqual([6, 6])
    }
    expect(operation.responses['405'].headers.Allow.schema).toEqual({ type: 'string', const: 'POST' })
  })
})

test.describe('the documented request encodings are what the server accepts', () => {
  test('digit strings with leading zeros are read as decimal integers', async ({ request }) => {
    const response = await postFight(
      request,
      { ...BASELINE, 'attack-regs': '010', 'attack-elts': '0', battles: '000005' },
      10_000,
    )
    expect(response.status(), await response.text()).toBe(200)
    expect((await response.json()).battles).toBe(5)
  })

  test('a digit string above the documented maximum is rejected naming the field', async ({ request }) => {
    const response = await postFight(request, { ...BASELINE, 'attack-ldrs': '6' }, 10_000)
    expect(response.status()).toBe(400)
    expect((await response.json()).error).toContain('attack-ldrs')
  })

  for (const [label, value] of [
    ['a negative digit string', '-1'],
    ['a fractional number', 1.5],
    ['a non-numeric string', 'abc'],
    ['an empty string', ''],
    ['null', null],
    ['a boolean', true],
  ] as [string, unknown][]) {
    test(`${label} outside the integer or digit-string encodings is a 400`, async ({ request }) => {
      const response = await postFight(request, { ...BASELINE, 'defend-regs': value }, 10_000)
      expect(response.status()).toBe(400)
      expect((await response.json()).error).toContain('defend-regs')
    })
  }

  test('unknown extra keys are ignored', async ({ request }) => {
    const response = await postFight(request, { ...BASELINE, bogus: 'x' }, 10_000)
    expect(response.status(), await response.text()).toBe(200)
  })

  test('battles sent as a string and as a number both run the stated count', async ({ request }) => {
    const asString = await postFight(request, { ...DEFAULT_ARMIES, battles: '7' }, 10_000)
    expect((await asString.json()).battles).toBe(7)
    const asNumber = await postFight(request, { ...DEFAULT_ARMIES, battles: 7 }, 10_000)
    expect((await asNumber.json()).battles).toBe(7)
  })
})

test.describe('documented validation order', () => {
  test('the first failing army field in the listed order is the one reported', async ({ request }) => {
    const response = await postFight(
      request,
      { ...BASELINE, 'defend-regs': 99, 'attack-elts': 99, battles: 0 },
      10_000,
    )
    expect(response.status()).toBe(400)
    expect((await response.json()).error).toContain('attack-elts')
  })

  test('per-side rules are checked attack before defend, and before battles', async ({ request }) => {
    const bothSides = await postFight(
      request,
      { ...BASELINE, 'attack-regs': 10, 'attack-elts': 10, 'defend-regs': 0, 'defend-elts': 0, battles: 0 },
      10_000,
    )
    expect((await bothSides.json()).error).toContain('attack')

    const sideBeforeBattles = await postFight(
      request,
      { ...BASELINE, 'defend-regs': 0, 'defend-elts': 0, battles: 0 },
      10_000,
    )
    expect((await sideBeforeBattles.json()).error).toContain('defend')
  })

  test('a JSON array body is rejected with the documented message', async ({ request }) => {
    const response = await request.post('/api/fight', { data: [BASELINE], ...TIMEOUT })
    expect(response.status()).toBe(400)
    expect((await response.json()).error).toBe(errorExamples.notAnObject.value.error)
  })
})

test.describe('the error examples are what the server returns', () => {
  const cases: [string, FightBody][] = [
    ['fieldOutOfRange', { ...BASELINE, 'attack-ldrs': 6 }],
    ['emptySide', { ...BASELINE, 'defend-regs': 0, 'defend-elts': 0 }],
    ['invalidBattles', { ...BASELINE, battles: 0 }],
  ]
  for (const [name, body] of cases) {
    test(`${name} example matches a real response body`, async ({ request }) => {
      const response = await postFight(request, body, 10_000)
      expect(response.status()).toBe(400)
      expect(await response.json()).toEqual(errorExamples[name].value)
    })
  }

  test('the 405 example matches a real response body', async ({ request }) => {
    const response = await request.get('/api/fight', TIMEOUT)
    expect(await response.json()).toEqual(operation.responses['405'].content['application/json'].example)
  })
})

test.describe('methods other than POST', () => {
  for (const method of ['put', 'delete', 'patch'] as const) {
    test(`${method.toUpperCase()} returns 405 with Allow: POST`, async ({ request }) => {
      const response = await request[method]('/api/fight', { data: BASELINE, ...TIMEOUT })
      expect(response.status()).toBe(405)
      expect(response.headers()['allow']).toBe('POST')
      expect(typeof (await response.json()).error).toBe('string')
    })
  }
})

test.describe('documented response semantics', () => {
  test('outcome counts sum to battles, frequencies are count over battles, and hit shares sum to 1', async ({
    request,
  }) => {
    const response = await postFight(request, { ...BASELINE, battles: 300 }, 10_000)
    const body = await response.json()
    expect(body.battles).toBe(300)
    let total = 0
    for (const tally of Object.values<any>(body.outcomes)) {
      total += tally.count
      expect(tally.frequency).toBeCloseTo(tally.count / 300, 10)
    }
    expect(total).toBe(300)
    for (const side of ['attacker', 'defender']) {
      expect(body.hitsPerRound[side]).toHaveLength(6)
      const sum = body.hitsPerRound[side].reduce((a: number, b: number) => a + b, 0)
      expect(sum).toBeCloseTo(1, 6)
    }
    const { median, p10, p90, mean } = body.rounds
    expect(p10).toBeLessThanOrEqual(median)
    expect(median).toBeLessThanOrEqual(p90)
    expect(mean).toBeGreaterThanOrEqual(1)
  })

  test("survivor frequencies are shares of that side's wins, sorted by count descending", async ({ request }) => {
    const response = await postFight(request, { ...BASELINE, battles: 300 }, 10_000)
    const body = await response.json()
    for (const side of ['attacker', 'defender'] as const) {
      const combos = body.survivors[side]
      const wins = body.outcomes[side].count
      expect(combos.reduce((a: number, c: any) => a + c.count, 0)).toBe(wins)
      for (const c of combos) expect(c.frequency).toBeCloseTo(c.count / wins, 10)
      const counts = combos.map((c: any) => c.count)
      expect(counts).toEqual([...counts].sort((a: number, b: number) => b - a))
    }
  })
})

test.describe('the spec file is not served', () => {
  test('GET /docs/api/openapi.json is 404', async ({ request }) => {
    const response = await request.get('/docs/api/openapi.json', TIMEOUT)
    expect(response.status()).toBe(404)
  })
})
