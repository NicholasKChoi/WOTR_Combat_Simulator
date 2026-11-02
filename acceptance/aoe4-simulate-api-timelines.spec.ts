import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const START = { villagers: { sheep: 6 }, rally: 'sheep' }

test.describe.configure({ timeout: 60_000 })

type Timing = { step: number; status: string; startedAt: number | null; completedAt: number | null; waitSeconds: number }
type Series = { baseId: string; counts: number[] }

async function simulate(request: Parameters<typeof postSimulate>[0], body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

function finalCount(body: { unitsProduced: Series[] }, baseId: string) {
  return body.unitsProduced.find((s) => s.baseId === baseId)?.counts.at(-1)
}

function expectTiming(timing: Timing, expected: { startedAt: number; completedAt: number; waitSeconds: number }) {
  expect(timing.status).toBe('completed')
  expect(timing.startedAt).toBeCloseTo(expected.startedAt, 6)
  expect(timing.completedAt).toBeCloseTo(expected.completedAt, 6)
  expect(timing.waitSeconds).toBeCloseTo(expected.waitSeconds, 6)
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: 'start 6 sheep -> sheep' }, WARM_UP_TIMEOUT_MS)
})

// The expected numbers are the engine's results for these orders; a change to payment, tolerance or
// walk-time code that moves any of them is a behavior change, not a refactor.
test.describe('pinned timelines', () => {
  test('the prebuilt English build pays its first buildings after a 5 second wait and reaches Feudal at the pinned instant', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    expectTiming(body.steps[1], { startedAt: 25, completedAt: 45, waitSeconds: 5 })
    expectTiming(body.steps[2], { startedAt: 45, completedAt: 70, waitSeconds: 5 })
    expectTiming(body.steps[4], { startedAt: 143.56666666666663, completedAt: 262.5666666666666, waitSeconds: 83.56666666666663 })
    expect(body.ages).toEqual([{ age: 1, reachedAt: 0 }, { age: 2, reachedAt: expect.closeTo(262.5666666666666, 6) }])
    expect(['villager', 'spearman', 'longbowman'].map((id) => finalCount(body, id))).toEqual([57, 51, 50])
  })

  test('researches that wait on resources start at the pinned instants and the floating bank ends at the pinned values', async ({ request }) => {
    const steps = [
      ...english1tc.steps,
      { action: 'research', tech: 'textiles' },
      { action: 'research', tech: 'wheelbarrow' },
      { action: 'research', tech: 'fertilization' },
      { action: 'produce', producer: 'barracks', unit: 'spearman', count: 30 },
      { action: 'research', tech: 'veteran-spearmen' },
      { action: 'produce', producer: 'barracks', unit: 'spearman', count: 30 },
      { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 30 },
    ]
    const body = await simulate(request, { buildOrder: { ...english1tc, steps }, inputs: { durationSeconds: 900 } })
    expectTiming(body.steps[14], { startedAt: 363.82392930629044, completedAt: 408.82392930629044, waitSeconds: 11.093483539094677 })
    expectTiming(body.steps[22], { startedAt: 461.01536958786636, completedAt: 521.0153695878664, waitSeconds: 24.075222661396595 })
    expectTiming(body.steps[23], { startedAt: 508.3666666666666, completedAt: 581.0153695878664, waitSeconds: 47.35129707880026 })
    expectTiming(body.steps[24], { startedAt: 589.4333333333333, completedAt: 621.8190476190476, waitSeconds: 81.06666666666666 })
    expectTiming(body.steps[25], { startedAt: 711.0333333333333, completedAt: 801.0333333333333, waitSeconds: 121.60000000000002 })
    expect(body.steps[26]).toMatchObject({ status: 'waiting', startedAt: null })
    const last = <T,>(series: T[]) => series[series.length - 1]
    expect(last<number>(body.floating.food)).toBeCloseTo(596.2798390913501, 6)
    expect(last<number>(body.floating.wood)).toBeCloseTo(3269.775976995086, 6)
    expect(last<number>(body.floating.gold)).toBeCloseTo(242.9497986659074, 6)
    expect(last<number>(body.floating.stone)).toBe(0)
  })

  test('forty villagers with auto-houses finish at the pinned instant and end with the pinned bank', async ({ request }) => {
    const buildOrder = {
      civ: 'english',
      name: 'Auto houses',
      start: START,
      steps: [{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 40 }],
    }
    const body = await simulate(request, { buildOrder })
    expect(body.steps[0]).toMatchObject({ status: 'completed', completedAt: 800 })
    expect(finalCount(body, 'villager')).toBe(40)
    expect(body.floating.food.at(-1)).toBeCloseTo(21975.21613832855, 6)
    expect(body.floating.wood.at(-1)).toBe(0)
    expect(body.floating.gold.at(-1)).toBe(100)
  })

  test('an unpaid step keeps waiting while earlier steps complete at the pinned instants and the bank ends at the pinned values', async ({ request }) => {
    const buildOrder = {
      civ: 'english',
      name: 'Payment wait',
      start: START,
      steps: [
        { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 30 },
        { action: 'build', building: 'barracks', from: 'sheep', then: 'wood' },
        { action: 'produce', producer: 'barracks', unit: 'spearman', count: 15 },
        { action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 2 },
      ],
    }
    const body = await simulate(request, { buildOrder })
    expect(body.steps.map((s: Timing) => s.status)).toEqual(['completed', 'completed', 'waiting', 'not-reached'])
    expect(body.steps[0].completedAt).toBe(600)
    expect(body.steps[1].completedAt).toBe(35)
    expect(finalCount(body, 'villager')).toBe(30)
    expect(body.floating.food.at(-1)).toBeCloseTo(18800.864553314066, 6)
    expect(body.floating.wood.at(-1)).toBeCloseTo(460.6269376507071, 6)
    expect(body.floating.gold.at(-1)).toBe(100)
    expect(body.gatherRates.food.at(-1)).toBeCloseTo(1296.829971181556, 6)
    expect(body.gatherRates.wood.at(-1)).toBeCloseTo(31.00241129865656, 6)
  })
})
