import { test, expect, type APIRequestContext } from '@playwright/test'
import { SIMULATE_PATH, postSimulate, postSimulateRaw } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const START_LINE = 'start 6 sheep -> sheep'
const PASTE = [START_LINE, '# opener', 'produce villager from capital-town-center x3', '@0:40 rally capital-town-center -> wood'].join('\n')
const JSON_ORDER = {
  civ: 'english',
  name: 'Opener',
  start: START,
  steps: [
    { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 3 },
    { trigger: { kind: 'time', seconds: 40 }, action: 'rally', producer: 'capital-town-center', to: 'wood' },
  ],
}

type Issue = { code: string; message: string; step?: number; line?: number }

function order(steps: unknown[], start: unknown = START) {
  return { civ: 'english', name: 'Test', start, steps }
}

function paste(...stepLines: string[]) {
  return [START_LINE, ...stepLines].join('\n')
}

async function expectOk(request: APIRequestContext, body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

async function expectIssues(request: APIRequestContext, body: unknown): Promise<Issue[]> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(400)
  const json = await response.json()
  expect(json.issues.length).toBeGreaterThan(0)
  expect(json.error).toBe(json.issues[0].message)
  return json.issues
}

async function expectFirstCode(request: APIRequestContext, body: unknown, code: string): Promise<Issue> {
  const issues = await expectIssues(request, body)
  expect(issues[0].code, JSON.stringify(issues)).toBe(code)
  return issues[0]
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: PASTE }, WARM_UP_TIMEOUT_MS)
})

test.describe('text and JSON paths', () => {
  test('a paste order with a start line and a rally step simulates English with one timing per step line', async ({ request }) => {
    const body = await expectOk(request, { text: PASTE })
    expect(body.civ).toBe('english')
    expect(body.steps).toHaveLength(2)
  })

  test('the equivalent JSON build order gives the same units, steps and times as the paste', async ({ request }) => {
    const fromText = await expectOk(request, { text: PASTE })
    const fromJson = await expectOk(request, { buildOrder: JSON_ORDER })
    expect(fromJson.unitsProduced).toEqual(fromText.unitsProduced)
    expect(fromJson.steps).toEqual(fromText.steps)
    expect(fromJson.times).toEqual(fromText.times)
  })

  test('two identical requests return identical bodies', async ({ request }) => {
    const first = await postSimulate(request, { buildOrder: JSON_ORDER })
    const second = await postSimulate(request, { buildOrder: JSON_ORDER })
    expect(await second.text()).toBe(await first.text())
  })
})

test.describe('inputs', () => {
  test('omitting inputs and sending an empty inputs object give the same body', async ({ request }) => {
    const omitted = await expectOk(request, { buildOrder: JSON_ORDER })
    const empty = await expectOk(request, { buildOrder: JSON_ORDER, inputs: {} })
    expect(empty).toEqual(omitted)
  })

  test('durationSeconds sets the horizon and the last sample time', async ({ request }) => {
    const body = await expectOk(request, { buildOrder: JSON_ORDER, inputs: { durationSeconds: 300 } })
    expect(body.durationSeconds).toBe(300)
    expect(body.times.at(-1)).toBe(300)
  })

  test('a single trip field override is accepted with every other trip field defaulted', async ({ request }) => {
    await expectOk(request, { buildOrder: JSON_ORDER, inputs: { trips: { farm: { walkSecondsCamp: 3 } } } })
  })

  test('an out-of-range trip field is one issue naming its full path', async ({ request }) => {
    const issues = await expectIssues(request, { buildOrder: JSON_ORDER, inputs: { trips: { farm: { walkSecondsCamp: 999 } } } })
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('out-of-range')
    expect(issues[0].message).toContain('inputs.trips.farm.walkSecondsCamp')
  })
})

test.describe('each issue code over HTTP', () => {
  const syntaxCases: [string, unknown, RegExp][] = [
    ['neither text nor buildOrder', { inputs: {} }, /text.*buildOrder/],
    ['both text and buildOrder', { text: PASTE, buildOrder: JSON_ORDER }, /text.*buildOrder/],
    ['text null beside buildOrder counts as both', { text: null, buildOrder: JSON_ORDER }, /text.*buildOrder/],
    ['text that is not a string', { text: 42 }, /^text/],
    ['a body that is an array', [{ text: PASTE }], /body/],
    ['a step that is not an object', { buildOrder: order(['produce']) }, /steps\[0\]/],
  ]
  for (const [label, body, message] of syntaxCases) {
    test(`syntax: ${label}`, async ({ request }) => {
      const issue = await expectFirstCode(request, body, 'syntax')
      expect(issue.message).toMatch(message)
    })
  }

  test('syntax: a paste line that does not parse carries its line', async ({ request }) => {
    const issue = await expectFirstCode(request, { text: paste('@1:61 produce villager from capital-town-center') }, 'syntax')
    expect(issue.line).toBe(2)
  })

  test('unknown-trigger-kind: a trigger of kind resource', async ({ request }) => {
    const step = { trigger: { kind: 'resource' }, action: 'produce', producer: 'capital-town-center', unit: 'villager' }
    await expectFirstCode(request, { buildOrder: order([step]) }, 'unknown-trigger-kind')
  })

  test('unknown-id: an unknown producer', async ({ request }) => {
    const issue = await expectFirstCode(request, { text: paste('produce villager from no-such-building') }, 'unknown-id')
    expect(issue.message).toContain('no-such-building')
  })

  test('unsupported-tech: military-academy', async ({ request }) => {
    const issue = await expectFirstCode(request, { text: paste('research military-academy') }, 'unsupported-tech')
    expect(issue.message).toContain('military-academy')
  })

  test('unknown-tech-effect: forestry', async ({ request }) => {
    const issue = await expectFirstCode(request, { text: paste('research forestry') }, 'unknown-tech-effect')
    expect(issue.message).toContain('forestry')
  })

  test('out-of-range: inputs.durationSeconds 59', async ({ request }) => {
    const issue = await expectFirstCode(request, { buildOrder: JSON_ORDER, inputs: { durationSeconds: 59 } }, 'out-of-range')
    expect(issue.message).toContain('inputs.durationSeconds')
  })

  test('out-of-range: 201 steps', async ({ request }) => {
    const step = { action: 'pause', producer: 'capital-town-center' }
    const issue = await expectFirstCode(request, { buildOrder: order(Array(201).fill(step)) }, 'out-of-range')
    expect(issue.message).toContain('201')
  })

  test('out-of-range: text of 20,001 characters is rejected without parsing', async ({ request }) => {
    const text = 'x'.repeat(20_001)
    const issues = await expectIssues(request, { text })
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('out-of-range')
    expect(issues[0].message).toContain('text')
    expect(issues[0].message).toContain('20000')
  })

  test('text of exactly 20,000 characters is not rejected for length', async ({ request }) => {
    const prefix = `${PASTE}\n#`
    const text = prefix + 'x'.repeat(20_000 - prefix.length)
    expect(text).toHaveLength(20_000)
    await expectOk(request, { text })
  })

  test('invalid: a producer that cannot produce the unit', async ({ request }) => {
    await expectFirstCode(request, { text: paste('produce villager from house') }, 'invalid')
  })
})

test.describe('invalid rules', () => {
  const cases: [string, unknown, RegExp][] = [
    ['start.villagers summing to 5', { text: 'start 5 sheep -> sheep' }, /line 1.*5/],
    ['walkSeconds on a produce without rally', { buildOrder: order([{ action: 'produce', producer: 'capital-town-center', unit: 'villager', walkSeconds: 4 }]) }, /steps\[0\].*walkSeconds/],
    ['rally on a produce of scout', { text: paste('produce scout from capital-town-center -> sheep') }, /line 2.*scout/],
    ['a rally step on house', { text: paste('rally house -> wood') }, /line 2.*house/],
    ['no start.rally while English starts with capital-town-center', { text: 'start 6 sheep' }, /line 1.*capital-town-center/],
    ['produce villager from house', { text: paste('produce villager from house') }, /line 2.*house.*villager/],
    ['research wheelbarrow at house', { text: paste('research wheelbarrow at house') }, /line 2.*wheelbarrow.*house/],
  ]
  for (const [label, body, message] of cases) {
    test(label, async ({ request }) => {
      const issue = await expectFirstCode(request, body, 'invalid')
      expect(issue.message).toMatch(message)
    })
  }

  test('a build of town-center with no start.rally and no earlier rally source', async ({ request }) => {
    const issues = await expectIssues(request, { text: 'start 6 sheep\nbuild town-center from wood' })
    const build = issues.find((i) => i.step === 0)
    expect(build?.code).toBe('invalid')
    expect(build?.message).toMatch(/line 2.*town-center/)
  })

  const neighbours: [string, unknown][] = [
    ['start.villagers summing to 6 with start.rally', { text: START_LINE }],
    ['produce villager from kings-palace', { text: paste('produce villager from kings-palace') }],
    ['research wheelbarrow at mill', { text: paste('research wheelbarrow at mill') }],
  ]
  for (const [label, body] of neighbours) {
    test(`passing neighbour: ${label}`, async ({ request }) => {
      await expectOk(request, body)
    })
  }
})

test.describe('issue location', () => {
  test('a paste step issue carries line and step; the same fault as JSON carries step and no line', async ({ request }) => {
    const [pasted] = await expectIssues(request, { text: paste('produce villager from house') })
    expect(pasted).toMatchObject({ step: 0, line: 2 })
    const [json] = await expectIssues(request, { buildOrder: order([{ action: 'produce', producer: 'house', unit: 'villager' }]) })
    expect(json.step).toBe(0)
    expect(json).not.toHaveProperty('line')
  })

  test('a JSON start issue and an inputs issue carry neither step nor line', async ({ request }) => {
    const [start] = await expectIssues(request, { buildOrder: order([], { villagers: { sheep: 5 }, rally: 'sheep' }) })
    expect(start).not.toHaveProperty('step')
    expect(start).not.toHaveProperty('line')
    const [inputs] = await expectIssues(request, { text: PASTE, inputs: { durationSeconds: 59 } })
    expect(inputs).not.toHaveProperty('step')
    expect(inputs).not.toHaveProperty('line')
  })
})

test.describe('issue ordering', () => {
  test('order and inputs issues are both reported, the order issue first', async ({ request }) => {
    const response = await postSimulate(request, {
      buildOrder: order([{ action: 'produce', producer: 'house', unit: 'villager' }]),
      inputs: { durationSeconds: 59 },
    })
    expect(response.status()).toBe(400)
    const { error, issues } = await response.json()
    expect(issues.map((i: Issue) => i.code)).toEqual(['invalid', 'out-of-range'])
    expect(issues[1].message).toContain('inputs.durationSeconds')
    expect(error).toBe(issues[0].message)
  })

  for (const raw of ['[]', '"x"', 'null']) {
    test(`a ${raw} body is one syntax issue with no location and no inputs stage`, async ({ request }) => {
      const response = await postSimulateRaw(request, raw)
      expect(response.status()).toBe(400)
      const { issues } = await response.json()
      expect(issues).toHaveLength(1)
      expect(issues[0].code).toBe('syntax')
      expect(issues[0]).not.toHaveProperty('step')
      expect(issues[0]).not.toHaveProperty('line')
    })
  }
})

test.describe('framework and method responses', () => {
  for (const method of ['get', 'put', 'delete'] as const) {
    test(`${method.toUpperCase()} returns 405 with Allow: POST`, async ({ request }) => {
      const response = await request[method](SIMULATE_PATH, { data: { text: PASTE }, timeout: 10_000 })
      expect(response.status()).toBe(405)
      expect(response.headers()['allow']).toBe('POST')
      expect(typeof (await response.json()).error).toBe('string')
    })
  }

  test('malformed JSON is the plain-text 400 Invalid JSON', async ({ request }) => {
    const response = await postSimulateRaw(request, '{"text":')
    expect(response.status()).toBe(400)
    expect(await response.text()).toBe('Invalid JSON')
  })

  test('a body just over 1 MB is a plain-text 413', async ({ request }) => {
    const raw = JSON.stringify({ text: 'x'.repeat(1024 * 1024) })
    expect(raw.length).toBeLessThan(1024 * 1024 + 20)
    const response = await postSimulateRaw(request, raw, 30_000)
    expect(response.status()).toBe(413)
    expect(response.headers()['content-type'] ?? '').not.toContain('json')
  })
})
