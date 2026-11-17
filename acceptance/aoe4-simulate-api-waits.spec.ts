import { test, expect, type APIRequestContext } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { WARM_UP_TIMEOUT_MS, buildOrderFrom, postSimulate, type Timing } from './helpers'

test.describe.configure({ timeout: 60_000 })

type Warning = { code: string; severity: string; message: string; step?: number; waitingOn?: string; at: number }
type Result = { steps: Timing[]; warnings: Warning[]; durationSeconds: number }

const START = 'start 6 sheep -> sheep'
const lines = (...steps: string[]) => [START, ...steps].join('\n')
const sum = (breakdown: Timing['waitBreakdown']) => Object.values(breakdown).reduce((a, b) => a + b, 0)
const stuck = (result: Result) => result.warnings.filter((w) => w.code === 'step-stuck')

async function simulate(request: APIRequestContext, text: string, inputs: Record<string, unknown> = {}): Promise<Result> {
  const response = await postSimulate(request, { buildOrder: buildOrderFrom(text), inputs })
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom(START) }, WARM_UP_TIMEOUT_MS)
})

test.describe('each wait reason is reachable through the API', () => {
  test('prerequisite: an age 2 tech at age 1 waits on prerequisite for the whole run', async ({ request }) => {
    const result = await simulate(request, lines('research textiles'), { durationSeconds: 300 })
    expect(result.steps[0]).toMatchObject({ status: 'waiting', startedAt: null, armedAt: 0, waitingOn: 'prerequisite' })
    expect(result.steps[0].waitBreakdown).toEqual({ prerequisite: 300 })
  })

  test('prerequisite: a research whose producing building was never built waits on prerequisite', async ({ request }) => {
    const result = await simulate(request, lines('research wheelbarrow at mill'), { durationSeconds: 300 })
    expect(result.steps[0]).toMatchObject({ status: 'waiting', waitingOn: 'prerequisite' })
    expect(result.steps[0].waitBreakdown).toEqual({ prerequisite: 300 })
  })

  test('resources: a research waits on prerequisite until its building stands, then on resources', async ({ request }) => {
    const result = await simulate(request, lines('build mill from sheep', 'research wheelbarrow at mill'), { durationSeconds: 300 })
    const research = result.steps[1]
    expect(research).toMatchObject({ status: 'waiting', armedAt: 0, waitingOn: 'resources' })
    expect(research.waitBreakdown.prerequisite).toBeGreaterThan(0)
    expect(research.waitBreakdown.resources).toBeGreaterThan(0)
    expect(Object.keys(research.waitBreakdown).sort()).toEqual(['prerequisite', 'resources'])
    expect(sum(research.waitBreakdown)).toBeCloseTo(300, 9)
  })

  test('prerequisite: an instance that does not exist blocks the step and the steps behind it', async ({ request }) => {
    const result = await simulate(request, lines('produce villager from capital-town-center#2', 'rally capital-town-center -> wood'), {
      durationSeconds: 300,
    })
    expect(result.steps.map((s) => s.waitingOn)).toEqual(['prerequisite', 'earlier-step'])
    expect(result.steps[0].waitBreakdown).toEqual({ prerequisite: 300 })
    expect(result.steps[1]).toMatchObject({ status: 'not-reached', waitBreakdown: {} })
  })

  test('prerequisite: a building above the current age waits on prerequisite', async ({ request }) => {
    const result = await simulate(request, lines('build stable with 1 from sheep'), { durationSeconds: 600 })
    expect(result.steps[0]).toMatchObject({ status: 'waiting', waitingOn: 'prerequisite' })
    expect(result.steps[0].waitBreakdown).toEqual({ prerequisite: 600 })
  })

  test('villagers: a numeric move with too few villagers at the source waits on villagers', async ({ request }) => {
    const result = await simulate(request, lines('move 9 sheep to wood', 'rally capital-town-center -> wood'), { durationSeconds: 60 })
    expect(result.steps[0]).toMatchObject({ status: 'waiting', waitingOn: 'villagers' })
    expect(result.steps[0].waitBreakdown).toEqual({ villagers: 60 })
    expect(result.steps[1].waitingOn).toBe('earlier-step')
  })

  test('villagers: a build short of builders waits, then starts when they arrive and records the wait', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 9 from sheep'), { durationSeconds: 300 })
    const [step] = result.steps
    expect(step).toMatchObject({ status: 'completed', waitingOn: null })
    expect(step.waitSeconds).toBeGreaterThan(0)
    expect(Object.keys(step.waitBreakdown)).toEqual(['villagers'])
    expect(step.waitBreakdown.villagers).toBeCloseTo(step.waitSeconds, 9)
    expect(step.startedAt! - step.armedAt!).toBeCloseTo(step.waitSeconds, 9)
  })

  test('population: a produce held by supply with auto-houses off waits on population', async ({ request }) => {
    const result = await simulate(
      request,
      lines('produce villager from capital-town-center x4', '@3:00 produce villager from capital-town-center x1'),
      { durationSeconds: 300, autoHouses: false },
    )
    expect(result.steps[1]).toMatchObject({ status: 'waiting', armedAt: 180, waitingOn: 'population' })
    expect(result.steps[1].waitBreakdown).toEqual({ population: 120 })
  })

  test('population: the same order with auto-houses on does not wait', async ({ request }) => {
    const result = await simulate(
      request,
      lines('produce villager from capital-town-center x4', '@3:00 produce villager from capital-town-center x1'),
      { durationSeconds: 300, autoHouses: true },
    )
    expect(result.steps[1]).toMatchObject({ status: 'completed', startedAt: 180, waitingOn: null, waitBreakdown: {} })
  })

  test('resources: a step that cannot be paid for waits on resources for all its waiting time', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 1 from sheep', 'build barracks with 1 from sheep'), { durationSeconds: 300 })
    expect(result.steps[0]).toMatchObject({ status: 'completed', waitingOn: null, waitBreakdown: {} })
    expect(result.steps[1]).toMatchObject({ status: 'waiting', armedAt: 0, waitingOn: 'resources' })
    expect(result.steps[1].waitBreakdown).toEqual({ resources: 300 })
  })

  test('trigger and earlier-step: a step whose trigger never held, and the one behind it', async ({ request }) => {
    const result = await simulate(request, lines('@9:00 pause capital-town-center', 'rally capital-town-center -> wood'), { durationSeconds: 300 })
    expect(result.steps.map((s) => [s.status, s.waitingOn, s.waitBreakdown])).toEqual([
      ['not-reached', 'trigger', {}],
      ['not-reached', 'earlier-step', {}],
    ])
    expect(stuck(result)).toEqual([])
  })

  test('move all from a node with no villagers starts at once and never waits on villagers', async ({ request }) => {
    const response = await postSimulate(request, {
      buildOrder: {
        civ: 'english',
        name: 'move all',
        start: { villagers: { sheep: 6 }, rally: 'sheep' },
        steps: [{ action: 'move', count: 'all', from: 'wood', to: 'sheep' }],
      },
      inputs: { durationSeconds: 60 },
    })
    expect(response.status(), await response.text()).toBe(200)
    const result: Result = await response.json()
    expect(result.steps[0]).toMatchObject({ startedAt: 0, waitSeconds: 0, waitingOn: null, waitBreakdown: {} })
    expect(stuck(result)).toEqual([])
  })
})

test.describe('the wait breakdown adds up to the wait span', () => {
  test('a wait that changes reason splits its seconds, and the parts sum to the span the step waited', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 9 from sheep', 'build barracks with 1 from sheep'), { durationSeconds: 300 })
    const [first, second] = result.steps
    expect(Object.keys(first.waitBreakdown)).toEqual(['villagers'])
    expect(second.status).toBe('waiting')
    expect(second.waitingOn).toBe('resources')
    expect(second.waitBreakdown.villagers).toBeGreaterThan(0)
    expect(second.waitBreakdown.resources).toBeGreaterThan(0)
    expect(sum(second.waitBreakdown)).toBeCloseTo(result.durationSeconds - second.armedAt!, 9)
  })

  test('over a whole prebuilt build: started steps sum to waitSeconds, waiting steps to the time left, none are zero', async ({ request }) => {
    const response = await postSimulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 3600 } })
    expect(response.status(), await response.text()).toBe(200)
    const result: Result = await response.json()
    for (const step of result.steps) {
      for (const seconds of Object.values(step.waitBreakdown)) expect(seconds).toBeGreaterThan(0)
      if (step.startedAt !== null) {
        expect(step.waitingOn, `step ${step.step}`).toBeNull()
        expect(sum(step.waitBreakdown), `step ${step.step}`).toBeCloseTo(step.waitSeconds, 9)
      } else if (step.status === 'waiting') {
        expect(sum(step.waitBreakdown), `step ${step.step}`).toBeCloseTo(result.durationSeconds - step.armedAt!, 9)
      } else {
        expect(step.waitBreakdown).toEqual({})
      }
    }
    expect(result.steps.some((s) => Object.keys(s.waitBreakdown).length > 0)).toBe(true)
  })

  test('an order mixing resource and prerequisite waits keeps the sums for every step', async ({ request }) => {
    const result = await simulate(
      request,
      lines('build barracks with 1 from sheep', 'build barracks with 1 from sheep', 'research textiles'),
      { durationSeconds: 300 },
    )
    expect(result.steps.map((s) => s.waitingOn)).toEqual([null, 'resources', 'earlier-step'])
    expect(sum(result.steps[1].waitBreakdown)).toBeCloseTo(300, 9)
    expect(result.steps[2].waitBreakdown).toEqual({})
  })
})

test.describe('step-stuck warnings at the horizon', () => {
  test('a waiting step gets one warning with a 1-based message number and a 0-based step field', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 1 from sheep', 'build barracks with 1 from sheep', 'rally capital-town-center -> wood'), {
      durationSeconds: 300,
    })
    expect(result.steps.map((s) => s.status)).toEqual(['completed', 'waiting', 'not-reached'])
    expect(result.warnings).toEqual([
      {
        code: 'step-stuck',
        severity: 'warning',
        message: 'step 2 (build) was still waiting on resources at 5:00, from 0:00.',
        step: 1,
        waitingOn: 'resources',
        at: 0,
      },
    ])
  })

  test('the warning names the instant the step armed, in minutes and seconds', async ({ request }) => {
    const result = await simulate(request, lines('produce villager from capital-town-center x4', '@3:00 produce villager from capital-town-center x1'), {
      durationSeconds: 300,
      autoHouses: false,
    })
    expect(stuck(result)).toEqual([
      {
        code: 'step-stuck',
        severity: 'warning',
        message: 'step 2 (produce) was still waiting on population at 5:00, from 3:00.',
        step: 1,
        waitingOn: 'population',
        at: 180,
      },
    ])
  })

  test('a run where every step started has no step-stuck warning', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 1 from sheep', 'produce villager from capital-town-center x2'), { durationSeconds: 300 })
    expect(result.steps.every((s) => s.startedAt !== null)).toBe(true)
    expect(result.warnings).toEqual([])
  })

  test('an in-progress step is not stuck', async ({ request }) => {
    const result = await simulate(request, lines('produce villager from capital-town-center x4'), { durationSeconds: 60 })
    expect(result.steps[0]).toMatchObject({ status: 'in-progress', waitingOn: null })
    expect(stuck(result)).toEqual([])
  })

  test('node warnings and a step-stuck warning arrive together, ordered by time', async ({ request }) => {
    const result = await simulate(request, lines('build stable with 1 from sheep'), { durationSeconds: 600, nodeAmounts: { sheep: 100 } })
    const codes = new Set(result.warnings.map((w) => w.code))
    expect(codes).toContain('step-stuck')
    expect(codes).toContain('node-depleted')
    expect(result.warnings.length).toBeGreaterThan(1)
    expect(stuck(result)).toHaveLength(1)
    expect(result.warnings.map((w) => w.at)).toEqual([...result.warnings.map((w) => w.at)].sort((a, b) => a - b))
  })
})

test.describe('determinism', () => {
  test('the same order twice returns identical steps, breakdowns and warnings', async ({ request }) => {
    const text = lines('build barracks with 9 from sheep', 'build barracks with 1 from sheep', 'research textiles')
    const [a, b] = await Promise.all([simulate(request, text, { durationSeconds: 300 }), simulate(request, text, { durationSeconds: 300 })])
    expect(a.steps.length).toBe(3)
    expect(stuck(a).length).toBe(1)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

const VILLAGER_ORDER = { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 }
const SCOUT_AT_10 = { action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: { kind: 'time', seconds: 10 } }

async function simulateSteps(request: APIRequestContext, steps: unknown[], inputs: Record<string, unknown>): Promise<Result> {
  const buildOrder = { civ: 'english', name: 'Waits', start: { villagers: { sheep: 6 }, rally: 'sheep' }, steps }
  const response = await postSimulate(request, { buildOrder, inputs })
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

function secondsByReason(step: Timing): Record<string, number> {
  const byReason: Record<string, number> = {}
  for (const { detail, seconds } of step.waitDetails) {
    const reason = detail.kind === 'building-busy' || detail.kind === 'building' || detail.kind === 'age' ? 'prerequisite' : detail.kind === 'resources' ? 'resources' : detail.kind
    byReason[reason] = (byReason[reason] ?? 0) + seconds
  }
  return byReason
}

test.describe('waitingFor and waitDetails say what a wait is for', () => {
  test('a step that never waited carries a null waitingFor and no details', async ({ request }) => {
    const result = await simulate(request, lines('produce villager from capital-town-center x1'), { durationSeconds: 60 })
    expect(result.steps[0]).toMatchObject({ waitSeconds: 0, waitingFor: null, waitDetails: [] })
  })

  test('a resource wait names the short kinds as whole numbers and keeps one entry for the whole wait', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 1 from sheep', 'build barracks with 1 from sheep'), { durationSeconds: 300 })
    const waiting = result.steps[1]
    expect(waiting).toMatchObject({ status: 'waiting', waitingOn: 'resources' })
    expect(waiting.waitingFor?.kind).toBe('resources')
    const short = (waiting.waitingFor as { short: Record<string, number> }).short
    expect(Object.keys(short).length).toBeGreaterThan(0)
    for (const amount of Object.values(short)) {
      expect(Number.isInteger(amount)).toBe(true)
      expect(amount).toBeGreaterThanOrEqual(1)
    }
    expect(waiting.waitDetails).toHaveLength(1)
    expect(waiting.waitDetails[0].detail.kind).toBe('resources')
    expect(waiting.waitDetails[0].seconds).toBeCloseTo(300, 9)
  })

  test('a started step has a null waitingFor but keeps the details of the wait it finished', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 9 from sheep'), { durationSeconds: 300 })
    const [step] = result.steps
    expect(step.status).toBe('completed')
    expect(step.waitSeconds).toBeGreaterThan(0)
    expect(step.waitingFor).toBeNull()
    expect(step.waitDetails).toHaveLength(1)
    expect(step.waitDetails[0].detail).toMatchObject({ kind: 'villagers', node: 'sheep', needed: 9, available: 6 })
    expect(step.waitDetails[0].seconds).toBeCloseTo(step.waitBreakdown.villagers!, 9)
  })

  test('a move with too few villagers names the node and the missing count', async ({ request }) => {
    const result = await simulate(request, lines('move 9 sheep to wood'), { durationSeconds: 60 })
    expect(result.steps[0].waitingFor).toMatchObject({ kind: 'villagers', node: 'sheep', needed: 9 })
    const { available } = result.steps[0].waitingFor as { available: number }
    expect(available).toBeGreaterThanOrEqual(6)
    expect(available).toBeLessThan(9)
  })

  test('a step above the age waits for the age, with no landmark when none is under construction', async ({ request }) => {
    const result = await simulate(request, lines('build stable with 1 from sheep'), { durationSeconds: 600 })
    expect(result.steps[0]).toMatchObject({ status: 'waiting', waitingFor: { kind: 'age', age: 2, landmark: null } })
    expect(result.steps[0].waitDetails).toEqual([{ detail: { kind: 'age', age: 2, landmark: null }, seconds: 600 }])
  })

  test('a produce above the age reports the age before the missing building', async ({ request }) => {
    const result = await simulate(request, lines('produce knight from stable x1'), { durationSeconds: 60 })
    expect(result.steps[0]).toMatchObject({ waitingOn: 'prerequisite', waitingFor: { kind: 'age', age: 3, landmark: null } })
  })

  test('a produce from a building that was never built names the producer and a missing instance number', async ({ request }) => {
    const none = await simulate(request, lines('produce man-at-arms from barracks x1'), { durationSeconds: 60 })
    expect(none.steps[0].waitingFor).toMatchObject({ kind: 'building', instance: null })
    expect((none.steps[0].waitingFor as { buildings: { baseId: string }[] }).buildings.map((b) => b.baseId)).toEqual(['barracks'])
    const second = await simulate(request, lines('produce villager from capital-town-center#2'), { durationSeconds: 60 })
    expect(second.steps[0].waitingFor).toMatchObject({ kind: 'building', instance: 2 })
    expect((second.steps[0].waitingFor as { buildings: { baseId: string }[] }).buildings.map((b) => b.baseId)).toEqual(['capital-town-center'])
  })

  test('a produce held by supply names what it needs against what is used', async ({ request }) => {
    const result = await simulate(request, lines('produce villager from capital-town-center x4', '@3:00 produce villager from capital-town-center x1'), {
      durationSeconds: 300,
      autoHouses: false,
    })
    const detail = result.steps[1].waitingFor as { kind: string; needed: number; used: number; supply: number }
    expect(detail.kind).toBe('population')
    expect(detail.needed).toBeGreaterThan(0)
    expect(detail.used + detail.needed).toBeGreaterThan(detail.supply)
  })

  test('a produce behind a busy building waits on that building, not on a missing one', async ({ request }) => {
    const result = await simulateSteps(request, [VILLAGER_ORDER, SCOUT_AT_10], { durationSeconds: 120 })
    const villagerStep = result.steps[1]
    expect(villagerStep.waitBreakdown.prerequisite).toBeGreaterThan(0)
    expect(villagerStep.waitDetails).toHaveLength(1)
    expect(villagerStep.waitDetails[0].detail).toMatchObject({
      kind: 'building-busy',
      instance: null,
      every: false,
      buildings: [{ baseId: 'capital-town-center' }],
    })
    expect(villagerStep.waitDetails[0].seconds).toBeCloseTo(villagerStep.waitBreakdown.prerequisite!, 9)
  })

  test('a produce pinned to a busy instance names that instance and is not an every wait', async ({ request }) => {
    const pinned = { ...VILLAGER_ORDER, instance: 1 }
    const result = await simulateSteps(request, [pinned, { ...SCOUT_AT_10, instance: 1 }], { durationSeconds: 120 })
    const [entry] = result.steps[1].waitDetails
    expect(result.steps[1].waitDetails).toHaveLength(1)
    expect(entry.detail).toMatchObject({ kind: 'building-busy', instance: 1, every: false, buildings: [{ baseId: 'capital-town-center' }] })
  })

  test('a wait that changes target keeps one entry per target and the seconds per reason match the breakdown', async ({ request }) => {
    const result = await simulate(request, lines('build barracks with 9 from sheep', 'build barracks with 1 from sheep'), { durationSeconds: 300 })
    const second = result.steps[1]
    expect(second.waitDetails.map((e) => e.detail.kind)).toEqual(['villagers', 'resources'])
    expect(second.waitingFor?.kind).toBe('resources')
    expect(second.waitDetails[0].seconds).toBeCloseTo(second.waitBreakdown.villagers!, 9)
    expect(second.waitDetails[1].seconds).toBeCloseTo(second.waitBreakdown.resources!, 9)
  })

  test('a not-reached step carries no waitingFor and no details', async ({ request }) => {
    const result = await simulate(request, lines('@9:00 pause capital-town-center', 'rally capital-town-center -> wood'), { durationSeconds: 300 })
    for (const step of result.steps) {
      expect(step.status).toBe('not-reached')
      expect(step.waitingFor).toBeNull()
      expect(step.waitDetails).toEqual([])
    }
  })

  test('over a whole prebuilt build every reason sums to its breakdown and only waiting steps carry a waitingFor', async ({ request }) => {
    const response = await postSimulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 1200 } })
    expect(response.status(), await response.text()).toBe(200)
    const result: Result = await response.json()
    expect(result.steps.some((s) => s.waitDetails.length > 0)).toBe(true)
    for (const step of result.steps) {
      const byReason = secondsByReason(step)
      expect(Object.keys(byReason).sort(), `step ${step.step}`).toEqual(Object.keys(step.waitBreakdown).sort())
      for (const [reason, seconds] of Object.entries(step.waitBreakdown)) expect(byReason[reason], `step ${step.step} ${reason}`).toBeCloseTo(seconds, 6)
      expect(step.waitingFor !== null, `step ${step.step}`).toBe(step.status === 'waiting')
      for (const { detail } of step.waitDetails) {
        if (detail.kind !== 'resources') continue
        const amounts = Object.values(detail.short)
        expect(amounts.length, `step ${step.step}`).toBeGreaterThan(0)
        for (const amount of amounts) expect(Number.isInteger(amount) && amount >= 1, `step ${step.step}`).toBe(true)
      }
    }
  })

  test('the same order twice returns identical waitingFor and waitDetails', async ({ request }) => {
    const text = lines('build barracks with 9 from sheep', 'build barracks with 1 from sheep', 'research textiles')
    const [a, b] = await Promise.all([simulate(request, text, { durationSeconds: 300 }), simulate(request, text, { durationSeconds: 300 })])
    expect(a.steps.some((s) => s.waitDetails.length > 0)).toBe(true)
    expect(a.steps.map((s) => [s.waitingFor, s.waitDetails])).toEqual(b.steps.map((s) => [s.waitingFor, s.waitDetails]))
  })
})
