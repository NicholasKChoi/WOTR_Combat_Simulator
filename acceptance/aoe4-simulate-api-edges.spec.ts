import { test, expect } from '@playwright/test'
import { SIMULATE_PATH, postSimulate, postSimulateRaw } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const START_LINE = 'start 6 sheep -> sheep'
const VILLAGERS_TEXT = [START_LINE, 'produce villager from capital-town-center x3'].join('\n')
const RESEARCH_TEXT = [VILLAGERS_TEXT, 'research textiles'].join('\n')
const RESEARCH_ORDER = {
  civ: 'english',
  name: 'Research',
  start: START,
  steps: [
    { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 3 },
    { action: 'research', tech: 'textiles' },
  ],
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: START_LINE }, WARM_UP_TIMEOUT_MS)
})

async function okBody(request: Parameters<typeof postSimulate>[0], body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

async function issuesOf(request: Parameters<typeof postSimulate>[0], body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(400)
  const json = await response.json()
  expect(json.error).toBe(json.issues[0].message)
  return json.issues as { code: string; message: string; step?: number; line?: number }[]
}

test.describe('result shape', () => {
  test('a villager-only order returns every result field, aligned to the times axis', async ({ request }) => {
    const response = await postSimulate(request, { text: VILLAGERS_TEXT })
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')
    const body = await response.json()
    expect(Object.keys(body).sort()).toEqual(
      ['ages', 'civ', 'durationSeconds', 'floating', 'gatherRates', 'notes', 'sampleSeconds', 'steps', 'times', 'unitsProduced'].sort(),
    )
    expect(body.times[0]).toBe(0)
    expect(body.times[body.times.length - 1]).toBe(body.durationSeconds)
    expect(body.times).toHaveLength(body.durationSeconds / body.sampleSeconds + 1)
    expect(body.unitsProduced.length).toBeGreaterThan(0)
    for (const series of body.unitsProduced) expect(series.counts).toHaveLength(body.times.length)
    const villagers = body.unitsProduced.find((s: { baseId: string }) => s.baseId === 'villager')
    expect(villagers.counts[villagers.counts.length - 1]).toBe(3)
    for (const series of Object.values(body.gatherRates) as number[][]) expect(series).toHaveLength(body.times.length)
    expect(body.steps).toEqual([expect.objectContaining({ step: 0, status: 'completed' })])
  })

  test('a research step returns a timing for each step and a note for an unmodelled effect', async ({ request }) => {
    const body = await okBody(request, { text: RESEARCH_TEXT })
    expect(body.steps).toHaveLength(2)
    expect(body.steps.map((s: { step: number }) => s.step)).toEqual([0, 1])
    expect(body.notes).toEqual([expect.objectContaining({ code: 'tech-effect-ignored', step: 1, tech: 'textiles' })])
  })

  test('the research order gives the same result as paste and as JSON, and is stable across repeats', async ({ request }) => {
    const [fromText, fromJson, again] = [
      await okBody(request, { text: RESEARCH_TEXT }),
      await okBody(request, { buildOrder: RESEARCH_ORDER }),
      await okBody(request, { text: RESEARCH_TEXT }),
    ]
    expect(fromJson.steps).toEqual(fromText.steps)
    expect(fromJson.unitsProduced).toEqual(fromText.unitsProduced)
    expect(fromJson.times).toEqual(fromText.times)
    expect(fromJson.notes).toEqual(fromText.notes)
    expect(again).toEqual(fromText)
  })

  test('CRLF line endings give the same result as LF', async ({ request }) => {
    const lf = await okBody(request, { text: VILLAGERS_TEXT })
    const crlf = await okBody(request, { text: VILLAGERS_TEXT.replace(/\n/g, '\r\n') })
    expect(crlf).toEqual(lf)
  })
})

test.describe('inputs', () => {
  test('null inputs behave as absent inputs', async ({ request }) => {
    expect(await okBody(request, { text: VILLAGERS_TEXT, inputs: null })).toEqual(await okBody(request, { text: VILLAGERS_TEXT }))
  })

  test('a non-object inputs is one syntax issue', async ({ request }) => {
    const issues = await issuesOf(request, { text: VILLAGERS_TEXT, inputs: 'x' })
    expect(issues).toEqual([expect.objectContaining({ code: 'syntax' })])
    expect(issues[0].message).toContain('inputs')
  })

  test('a trip override changes the gather rates the engine reports', async ({ request }) => {
    const base = await okBody(request, { text: VILLAGERS_TEXT })
    const near = await okBody(request, { text: VILLAGERS_TEXT, inputs: { trips: { sheep: { walkSecondsTownCenter: 30 } } } })
    expect(near.gatherRates).not.toEqual(base.gatherRates)
  })

  test('a trips key that is not a gather node is unknown-id', async ({ request }) => {
    const issues = await issuesOf(request, { text: VILLAGERS_TEXT, inputs: { trips: { bogus: {} } } })
    expect(issues[0].code).toBe('unknown-id')
    expect(issues[0].message).toContain('inputs.trips.bogus')
  })

  test('durationSeconds 60 and 3600 are accepted and 3601 is out of range', async ({ request }) => {
    expect((await okBody(request, { text: START_LINE, inputs: { durationSeconds: 60 } })).times.at(-1)).toBe(60)
    expect((await okBody(request, { text: START_LINE, inputs: { durationSeconds: 3600 } })).times.at(-1)).toBe(3600)
    expect((await issuesOf(request, { text: START_LINE, inputs: { durationSeconds: 3601 } }))[0].code).toBe('out-of-range')
  })

  test('a fractional or string durationSeconds is rejected', async ({ request }) => {
    expect((await issuesOf(request, { text: START_LINE, inputs: { durationSeconds: 60.5 } }))[0].code).toBe('out-of-range')
    expect((await issuesOf(request, { text: START_LINE, inputs: { durationSeconds: '60' } }))[0].code).toBe('syntax')
  })

  test('unknown input and body properties are ignored', async ({ request }) => {
    const plain = await okBody(request, { text: START_LINE })
    expect(await okBody(request, { text: START_LINE, extra: 1, inputs: { sampleSeconds: 7, zzz: true } })).toEqual(plain)
  })
})

test.describe('request shape', () => {
  for (const [label, body] of [
    ['an empty object', {}],
    ['text null alone', { text: null }],
    ['buildOrder null alone', { buildOrder: null }],
    ['a numeric text', { text: 5 }],
    ['an array buildOrder', { buildOrder: [] }],
  ] as const) {
    test(`syntax: ${label} is rejected with a single syntax issue`, async ({ request }) => {
      const issues = await issuesOf(request, body)
      expect(issues[0].code).toBe('syntax')
      expect(issues[0].line).toBeUndefined()
    })
  }

  test('the neither-key issue names both keys', async ({ request }) => {
    const issues = await issuesOf(request, {})
    expect(issues).toHaveLength(1)
    expect(issues[0].message).toContain('text')
    expect(issues[0].message).toContain('buildOrder')
  })

  test('a civ other than english is unknown-id', async ({ request }) => {
    const issues = await issuesOf(request, { buildOrder: { ...RESEARCH_ORDER, civ: 'french' } })
    expect(issues[0].code).toBe('unknown-id')
    expect(issues[0].message).toContain('french')
  })

  test('a JSON order with exactly 200 steps is accepted', async ({ request }) => {
    const steps = Array.from({ length: 200 }, () => ({ action: 'rally', producer: 'capital-town-center', to: 'wood' }))
    const body = await okBody(request, { buildOrder: { ...RESEARCH_ORDER, steps } })
    expect(body.steps).toHaveLength(200)
  })

  test('a non-JSON content type is a one-issue syntax rejection, not a server error', async ({ request }) => {
    const response = await request.post(SIMULATE_PATH, { data: Buffer.from(START_LINE), headers: { 'Content-Type': 'text/plain' } })
    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.issues).toEqual([expect.objectContaining({ code: 'syntax' })])
    expect(json.issues).toHaveLength(1)
  })

  test('a body of a bare string is one syntax issue with no inputs issue', async ({ request }) => {
    const response = await postSimulateRaw(request, '"x"')
    expect(response.status()).toBe(400)
    expect((await response.json()).issues).toHaveLength(1)
  })
})

test.describe('framework responses', () => {
  test('PATCH is 405 with Allow: POST and the method in the message', async ({ request }) => {
    const response = await request.patch(SIMULATE_PATH, { data: {} })
    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
    expect(await response.json()).toEqual({ error: 'method PATCH is not allowed; use POST' })
  })

  test('a truncated JSON body is the plain-text 400, not a SimulateError', async ({ request }) => {
    const response = await postSimulateRaw(request, '{"text": "start 6 sheep')
    expect(response.status()).toBe(400)
    expect(response.headers()['content-type'] ?? '').not.toContain('application/json')
    expect(await response.text()).toContain('Invalid JSON')
  })

  test('a body under 1 MB with an oversized text reaches the handler caps, not the 413', async ({ request }) => {
    const response = await postSimulate(request, { text: 'x'.repeat(900_000) })
    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.issues).toEqual([expect.objectContaining({ code: 'out-of-range' })])
  })
})

test.describe('issue cap', () => {
  const junkLines = (count: number, tag = 'bogus') => Array.from({ length: count }, (_, i) => `${tag} ${i + 1}`).join('\n')
  const unknownBuildings = (count: number) =>
    Object.fromEntries(Array.from({ length: count }, (_, i) => [`no-such-building-${i + 1}`, 1]))

  async function rejected(request: Parameters<typeof postSimulate>[0], body: unknown) {
    const response = await postSimulate(request, body)
    expect(response.status(), await response.text()).toBe(400)
    const json = await response.json()
    expect(json.error).toBe(json.issues[0].message)
    return json as { error: string; issues: { code: string; message: string; line?: number }[]; omittedIssues?: number }
  }

  for (const count of [99, 100]) {
    test(`${count} issues are all listed with no omittedIssues key`, async ({ request }) => {
      const json = await rejected(request, { text: junkLines(count) })
      expect(json.issues).toHaveLength(count)
      expect('omittedIssues' in json).toBe(false)
    })
  }

  for (const [count, omitted] of [[101, 1], [250, 150]]) {
    test(`${count} issues return the first 100 and omittedIssues ${omitted}`, async ({ request }) => {
      const json = await rejected(request, { text: junkLines(count) })
      expect(json.issues).toHaveLength(100)
      expect(json.omittedIssues).toBe(omitted)
      expect(json.issues.map((i) => i.line)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1))
    })
  }

  test('the cap applies after paste issues and inputs issues are combined, paste first', async ({ request }) => {
    const json = await rejected(request, { text: junkLines(60), inputs: { influenceCoverage: unknownBuildings(60) } })
    expect(json.issues).toHaveLength(100)
    expect(json.omittedIssues).toBe(20)
    expect(json.issues.slice(0, 60).map((i) => i.line)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1))
    expect(json.issues.slice(60).map((i) => i.message)).toEqual(
      Array.from({ length: 40 }, (_, i) => `inputs.influenceCoverage.no-such-building-${i + 1}: unknown building "no-such-building-${i + 1}"`),
    )
  })

  test('a capped body is the same on repeat', async ({ request }) => {
    const body = { text: junkLines(101) }
    expect(await rejected(request, body)).toEqual(await rejected(request, body))
  })
})
