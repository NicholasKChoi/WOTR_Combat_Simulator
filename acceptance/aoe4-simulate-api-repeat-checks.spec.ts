import { test, expect } from '@playwright/test'
import { WARM_UP_TIMEOUT_MS, postSimulate, simulateOk, type Timing } from './helpers'

test.describe.configure({ timeout: 60_000 })

const START = { rally: 'sheep', villagers: { wood: 3, sheep: 3 } }
const VILLAGER = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const HOUSE = { action: 'build', from: 'wood', building: 'house' }
const MOVE = { action: 'move', from: 'sheep', to: 'wood', count: 1 }

type Issue = { code: string; message: string; step?: number; line?: number }
type Warning = { code: string; message: string; step?: number }
type Result = { steps: Timing[]; warnings: Warning[] }

function order(steps: unknown[]) {
  return { civ: 'english', name: 'Repeat', start: START, steps }
}

async function rejectedIssues(request: Parameters<typeof postSimulate>[0], steps: unknown[]): Promise<Issue[]> {
  const response = await postSimulate(request, { buildOrder: order(steps) }, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(400)
  return (await response.json()).issues
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: order([VILLAGER]) }, WARM_UP_TIMEOUT_MS)
})

test.describe('repeat field validation', () => {
  test.describe('a bad repeat is one issue on its step', () => {
    for (const [value, code] of [
      ['3', 'syntax'],
      [true, 'syntax'],
      [null, 'syntax'],
      [0, 'out-of-range'],
      [201, 'out-of-range'],
      [2.5, 'out-of-range'],
      [-1, 'out-of-range'],
    ] as const) {
      test(`repeat ${JSON.stringify(value)} is ${code}`, async ({ request }) => {
        const issues = await rejectedIssues(request, [VILLAGER, { ...HOUSE, repeat: value }])
        expect(issues).toHaveLength(1)
        expect(issues[0]).toMatchObject({ code, step: 1 })
      })
    }
  })

  test('repeat 1 and repeat 200 are accepted and repeat 1 gives one copy', async ({ request }) => {
    const once = await simulateOk<Result>(request, order([VILLAGER, { ...HOUSE, repeat: 1 }]), 120)
    expect(once.steps).toHaveLength(2)
    expect(once.steps[1]).toMatchObject({ step: 1, source: 1, copy: 1 })
    const most = await postSimulate(request, { buildOrder: order([{ ...MOVE, repeat: 200 }]), inputs: { durationSeconds: 60 } })
    expect(most.status(), await most.text()).toBe(200)
    expect((await most.json()).steps).toHaveLength(200)
  })

  for (const step of [
    { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
    { action: 'research', tech: 'wheelbarrow' },
    { action: 'rally', producer: 'capital-town-center', to: 'wood' },
    { action: 'pause', producer: 'capital-town-center' },
  ]) {
    test(`repeat on ${step.action} is one invalid issue on that step naming the action`, async ({ request }) => {
      const plain = await postSimulate(request, { buildOrder: order([VILLAGER, step]) })
      expect(plain.status(), await plain.text()).toBe(200)
      const issues = await rejectedIssues(request, [VILLAGER, { ...step, repeat: 2 }])
      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ code: 'invalid', step: 1 })
      expect(issues[0].message).toContain(step.action)
    })
  }
})

test.describe('expanded step cap', () => {
  const filler = (count: number) => Array.from({ length: count }, () => VILLAGER)

  test('an expansion of exactly 200 steps is accepted', async ({ request }) => {
    const result = await simulateOk<Result>(request, order([...filler(199), { ...MOVE, repeat: 1 }]), 60)
    expect(result.steps).toHaveLength(200)
    const split = await postSimulate(request, { buildOrder: order([{ ...MOVE, repeat: 100 }, { ...MOVE, repeat: 100 }]) })
    expect(split.status(), await split.text()).toBe(200)
  })

  test('an expansion of 201 steps is one out-of-range issue on steps with no step and no line', async ({ request }) => {
    const issues = await rejectedIssues(request, [...filler(199), { ...MOVE, repeat: 2 }])
    expect(issues).toEqual([{ code: 'out-of-range', message: 'steps: 201 steps after repeats, more than 200' }])
  })

  test('the cap issue is not reported when another step has a field issue', async ({ request }) => {
    const issues = await rejectedIssues(request, [...filler(198), { ...MOVE, repeat: 2 }, { ...MOVE, count: 0 }])
    expect(issues.map((issue) => issue.code)).toEqual(['out-of-range'])
  })
})

test.describe('copies in the simulation', () => {
  test('a stuck copy of a repeated move has its own warning naming the submitted step and its copy', async ({ request }) => {
    const result = await simulateOk<Result>(request, order([HOUSE, { ...MOVE, count: 3, repeat: 5 }]), 300)
    const stuck = result.warnings.filter((warning) => warning.code === 'step-stuck')
    expect(stuck).toHaveLength(1)
    expect(stuck[0].step).toBe(result.steps.findIndex((timing) => timing.status === 'waiting'))
    expect(stuck[0].message).toMatch(/^step 2 \(move, copy \d of 5\) was still waiting on villagers at /)
    const copy = result.steps[stuck[0].step!].copy
    expect(stuck[0].message).toContain(`copy ${copy} of 5`)
    expect(result.steps.map(({ status, waitingOn }) => [status, waitingOn])).toEqual([
      ['completed', null],
      ['completed', null],
      ['completed', null],
      ['completed', null],
      ['waiting', 'villagers'],
      ['not-reached', 'earlier-step'],
    ])
  })

  test('a stuck step with repeat 1 after a repeated step is numbered by its submitted position', async ({ request }) => {
    const stuckMessage = async (repeat: number | undefined) => {
      const result = await simulateOk<Result>(request, order([{ ...HOUSE, repeat: 3 }, { ...MOVE, count: 50, ...(repeat === undefined ? {} : { repeat }) }]), 120)
      const stuck = result.warnings.filter((warning) => warning.code === 'step-stuck')
      expect(stuck).toHaveLength(1)
      expect(stuck[0].step).toBe(3)
      return stuck[0].message
    }
    const plain = await stuckMessage(undefined)
    expect(plain).toMatch(/^step 2 \(move\) was still waiting on /)
    expect(await stuckMessage(1)).toBe(plain)
  })

  test('a research step after a repeated step has its note on the expanded index', async ({ request }) => {
    const response = await postSimulate(request, {
      buildOrder: order([VILLAGER, { ...HOUSE, repeat: 3 }, { action: 'research', tech: 'bloomery' }]),
      inputs: { durationSeconds: 300 },
    })
    expect(response.status(), await response.text()).toBe(200)
    const { steps, notes } = await response.json()
    expect(steps[4]).toMatchObject({ source: 2, copy: 1 })
    expect((notes as { step: number; tech: string }[]).map(({ step, tech }) => [step, tech])).toEqual([[4, 'bloomery']])
  })

  test('the same repeated order twice gives the same result', async ({ request }) => {
    const body = { buildOrder: order([VILLAGER, { ...HOUSE, repeat: 3 }, { ...MOVE, repeat: 2 }]), inputs: { durationSeconds: 200 } }
    const first = await postSimulate(request, body)
    const second = await postSimulate(request, body)
    expect(await second.json()).toEqual(await first.json())
  })
})
