import { test, expect, type APIRequestContext } from '@playwright/test'
import { WARM_UP_TIMEOUT_MS, postSimulate, type Timing } from './helpers'

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const VILLAGER = { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 }
const scoutAt = (seconds: number) => ({ action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: { kind: 'time', seconds } })

type Result = {
  times: number[]
  steps: (Timing & { completedAt: number | null })[]
  floating: { food: number[]; wood: number[]; gold: number[]; stone: number[] }
  warnings: { code: string; step?: number }[]
}

async function simulate(request: APIRequestContext, steps: unknown[], durationSeconds: number, extra: Record<string, unknown> = {}): Promise<Result> {
  const response = await postSimulate(request, { buildOrder: { civ: 'english', name: 'Busy', start: START, steps }, inputs: { durationSeconds, ...extra } })
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: { civ: 'english', name: 'Warm', start: START, steps: [VILLAGER] } }, WARM_UP_TIMEOUT_MS)
})

test.describe('a produce step waits for its building to be idle', () => {
  test('starts when the villager in training spawns, accrues the wait to prerequisite, and charges nothing before then', async ({ request }) => {
    const result = await simulate(request, [VILLAGER, scoutAt(10)], 120)
    const alone = await simulate(request, [VILLAGER], 120)
    expect(result.steps[1]).toMatchObject({ status: 'completed', armedAt: 10, startedAt: 20, completedAt: 43, waitBreakdown: { prerequisite: 10 } })
    const at10 = result.times.indexOf(10)
    const at20 = result.times.indexOf(20)
    expect(at10).toBeGreaterThanOrEqual(0)
    expect(result.floating.food[at10]).toBeCloseTo(alone.floating.food[at10], 6)
    expect(result.floating.food[at20]).toBeLessThan(alone.floating.food[at20])
  })

  test('replaces a continuous villager order only when the villager in training spawns, so no villager is lost mid-training', async ({ request }) => {
    const continuous = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
    const result = await simulate(request, [continuous, scoutAt(10)], 300)
    expect(result.steps[1]).toMatchObject({ status: 'completed', startedAt: 20, waitBreakdown: { prerequisite: 10 } })
    expect(result.warnings.filter((w) => w.code === 'step-stuck')).toEqual([])
  })
})
