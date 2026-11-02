import { test, expect } from '@playwright/test'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const VILLAGER = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }

type Issue = { code: string; message: string; step?: number; line?: number; suggestion?: string }
type Rejection = { error: string; issues: Issue[]; omittedIssues?: number }

function order(steps: unknown[], start: unknown = START) {
  return { civ: 'english', name: 'Test', start, steps }
}

async function rejected(request: Parameters<typeof postSimulate>[0], body: unknown): Promise<Rejection> {
  const response = await postSimulate(request, body, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(400)
  const json = (await response.json()) as Rejection
  expect(json.error).toBe(json.issues[0].message)
  return json
}

test.describe('unknown unit suggestion', () => {
  test('a lone JSON unknown unit is exactly one issue with the nearest unit as a suggestion on its step', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: order([{ action: 'produce', producer: 'stable', unit: 'knigt' }]) })
    expect(issues).toEqual([{ code: 'unknown-id', message: expect.stringContaining('knigt'), step: 0, suggestion: 'knight' }])
    expect(issues[0].line).toBeUndefined()
  })

  test('a JSON unknown unit carries the nearest unit as a suggestion on its step', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: order([VILLAGER, { action: 'produce', producer: 'stable', unit: 'knigt' }]) })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ code: 'unknown-id', step: 1, suggestion: 'knight' })
    expect(issues[0].message).toContain('knigt')
  })

  test('an unknown unit with no near match has no suggestion key', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: order([{ action: 'produce', producer: 'stable', unit: 'zzzzzzzzzz' }]) })
    expect(issues).toHaveLength(1)
    expect('suggestion' in issues[0]).toBe(false)
  })

  test('an unknown unit hides the producer-cannot-produce rule for that step but not for other steps', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([{ action: 'produce', producer: 'house', unit: 'villager' }, { action: 'produce', producer: 'house', unit: 'knigt' }]),
    })
    expect(issues.map((i) => [i.step, i.code])).toEqual([[0, 'invalid'], [1, 'unknown-id']])
  })
})

test.describe('field and cross-step issue order', () => {
  const RESEARCH = { action: 'research', tech: 'wheelbarrow' }

  test('a cross-step issue follows the cross-field issue of a later step', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([RESEARCH, RESEARCH, { action: 'produce', producer: 'house', unit: 'villager' }]),
    })
    expect(issues.map((i) => [i.step, i.code])).toEqual([[2, 'invalid'], [1, 'invalid']])
    expect(issues[0].message).toContain('house')
    expect(issues[1].message).toContain('wheelbarrow')
  })

  test('several cross-step issues come last, ordered by the later step', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([RESEARCH, RESEARCH, RESEARCH, { action: 'produce', producer: 'house', unit: 'villager' }]),
    })
    expect(issues.map((i) => i.step)).toEqual([3, 1, 2])
  })

  test('a cross-step issue is not reported while any step has a field issue', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([RESEARCH, RESEARCH, { action: 'produce', producer: 'capital-town-center', unit: 'knigt' }]),
    })
    expect(issues.map((i) => [i.step, i.code])).toEqual([[2, 'unknown-id']])
  })

  test('a cross-field issue is not reported on a step with a field issue', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: order([{ action: 'produce', producer: 'house', unit: 'villager', count: 0 }]) })
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('out-of-range')
    expect(issues[0].message).toContain('count')
  })

  test('an unknown action reports only that issue even when the trigger is also bad', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([{ trigger: { kind: 'bogus' }, action: 'dance', producer: 'capital-town-center' }]),
    })
    expect(issues).toHaveLength(1)
    expect(issues[0].step).toBe(0)
    expect(issues[0].message).toContain('dance')
  })

  test('a known action with a bad trigger reports the trigger issue', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: order([{ trigger: { kind: 'bogus' }, ...VILLAGER }]) })
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ code: 'unknown-trigger-kind', step: 0 })
  })

  test('every field issue of one step is reported, trigger first', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([{ trigger: { kind: 'bogus' }, action: 'produce', producer: 'no-such-building', unit: 'knigt', count: 0 }]),
    })
    expect(issues.map((i) => i.code)).toEqual(['unknown-trigger-kind', 'unknown-id', 'unknown-id', 'out-of-range'])
    expect(issues.every((i) => i.step === 0)).toBe(true)
  })

  test('start issues come before step issues and a bad start does not hide step field issues', async ({ request }) => {
    const { issues } = await rejected(request, {
      buildOrder: order([{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }], { villagers: { sheep: 6 }, rally: 'nowhere' }),
    })
    expect(issues).toHaveLength(2)
    expect(issues[0].step).toBeUndefined()
    expect(issues[0].message).toContain('start')
    expect(issues[1]).toMatchObject({ code: 'unknown-id', step: 0 })
  })

  test('the same rejection is returned on repeat', async ({ request }) => {
    const body = { buildOrder: order([RESEARCH, RESEARCH, { action: 'produce', producer: 'house', unit: 'villager' }]) }
    expect(await rejected(request, body)).toEqual(await rejected(request, body))
  })
})

test.describe('oversized input bounds', () => {
  test('a 900000-character unknown unit id in JSON is rejected within 1 second with no suggestion', async ({ request }) => {
    await postSimulate(request, { buildOrder: order([VILLAGER]) }, WARM_UP_TIMEOUT_MS)
    const started = Date.now()
    const { issues } = await rejected(request, { buildOrder: order([{ action: 'produce', producer: 'capital-town-center', unit: 'x'.repeat(900_000) }]) })
    expect(Date.now() - started).toBeLessThan(1000)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('unknown-id')
    expect('suggestion' in issues[0]).toBe(false)
  })

  // The 20,000-character paste cap is the page-side conversion's; lib/aoe4-build-order/text-to-build.test.ts covers it.
})

test.describe('issue cap for a JSON build order', () => {
  const badSteps = (count: number) => Array.from({ length: count }, () => ({ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }))

  for (const [count, omitted] of [[100, undefined], [101, 1], [150, 50]] as const) {
    test(`${count} step issues list ${Math.min(count, 100)} and omit ${omitted ?? 0}`, async ({ request }) => {
      const json = await rejected(request, { buildOrder: order(badSteps(count)) })
      expect(json.issues).toHaveLength(Math.min(count, 100))
      expect(json.omittedIssues).toBe(omitted)
      expect(json.issues.map((i) => i.step)).toEqual(Array.from({ length: Math.min(count, 100) }, (_, i) => i))
    })
  }

  test('the cap applies to order issues followed by inputs issues', async ({ request }) => {
    const json = await rejected(request, { buildOrder: order(badSteps(100)), inputs: { durationSeconds: 59 } })
    expect(json.issues).toHaveLength(100)
    expect(json.omittedIssues).toBe(1)
    expect(json.issues.every((i) => i.step !== undefined)).toBe(true)
  })
})

test.describe('unchanged request rules after the swap', () => {
  for (const method of ['get', 'put', 'delete'] as const) {
    test(`${method.toUpperCase()} is 405 with Allow: POST`, async ({ request }) => {
      const response = await request[method]('/api/aoe4-build-order/simulate')
      expect(response.status()).toBe(405)
      expect(response.headers().allow).toBe('POST')
    })
  }

  test('a buildOrder that is not an object is a 400 issue on the order', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: 'nope' })
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0].message).toMatch(/buildOrder|build order|order/i)
  })

  test('an order issue and an inputs issue are both reported, order first', async ({ request }) => {
    const { issues } = await rejected(request, { buildOrder: order([{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }]), inputs: { durationSeconds: 59 } })
    expect(issues.map((i) => i.code)).toEqual(['unknown-id', 'out-of-range'])
  })
})
