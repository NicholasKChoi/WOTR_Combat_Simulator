import { test, expect, type APIRequestContext } from '@playwright/test'
import { buildOrderFrom, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

type Warning = { code: string; severity: string; message: string; at: number; idleVillagers?: number }
type Step = { completedAt: number | null }
type Result = {
  times: number[]
  gatherRates: Record<'food' | 'wood', number[]>
  steps: Step[]
  warnings: Warning[]
}

const PAUSE = { action: 'pause', producer: 'capital-town-center' }
const buildFarm = (extra: object = {}) => ({ action: 'build', building: 'farm', from: 'wood', then: 'farm', ...extra })
const move = (count: number, from: string, to: string, seconds: number) => ({
  action: 'move',
  count,
  from,
  to,
  walkSeconds: 5,
  trigger: { kind: 'time', seconds },
})

function order(villagers: Record<string, number>, steps: unknown[], inputs: object = {}) {
  return {
    buildOrder: { civ: 'english', name: 'Farm slots', start: { villagers, rally: 'wood' }, steps },
    inputs: { autoHouses: false, durationSeconds: 600, ...inputs },
  }
}

async function simulate(request: APIRequestContext, body: unknown): Promise<Result> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const farmIdle = (result: Result) => result.warnings.filter((w) => w.code === 'farm-idle')
const firstSampleAtOrAfter = (result: Result, seconds: number) => result.times.findIndex((t) => t >= seconds)
const foodAt = (result: Result, seconds: number) => result.gatherRates.food[firstSampleAtOrAfter(result, seconds)]
const foodJustBefore = (result: Result, seconds: number) => result.gatherRates.food[firstSampleAtOrAfter(result, seconds) - 1]

// Per-minute food rate of one farmer on one built farm: the builder of the only farm gathers on it.
let farmRate = 0

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
  const result = await simulate(request, order({ wood: 6 }, [PAUSE, buildFarm()]))
  farmRate = result.gatherRates.food[result.gatherRates.food.length - 1]
  expect(farmRate).toBeGreaterThan(0)
})

test.describe('a farm holds one villager per built farm', () => {
  test('a lone farmer on a built farm is not idle and raises no warning', async ({ request }) => {
    const result = await simulate(request, order({ wood: 6 }, [PAUSE, buildFarm()]))

    expect(farmIdle(result)).toEqual([])
  })

  test('starting farmers with no farm gather no food and raise one farm-idle warning at 0 with the plural message', async ({ request }) => {
    const result = await simulate(request, order({ wood: 3, farm: 3 }, [PAUSE]))

    expect(result.gatherRates.food.every((rate) => rate === 0)).toBe(true)
    expect(result.warnings).toEqual([
      {
        code: 'farm-idle',
        severity: 'warning',
        message: '3 villagers arrived at farm from 0:00 on with no free farm and wait idle until one is built.',
        at: 0,
        idleVillagers: 3,
      },
    ])
  })

  test('a single idle farmer gets the singular message', async ({ request }) => {
    const result = await simulate(request, order({ wood: 5, farm: 1 }, [PAUSE]))

    expect(farmIdle(result)).toEqual([
      expect.objectContaining({
        message: '1 villager arrived at farm from 0:00 on with no free farm and waits idle until one is built.',
        idleVillagers: 1,
      }),
    ])
  })

  test('moved villagers add up in one warning at the first arrival', async ({ request }) => {
    const result = await simulate(request, order({ wood: 6 }, [PAUSE, move(1, 'wood', 'farm', 30), move(2, 'wood', 'farm', 60)]))

    expect(result.gatherRates.food.every((rate) => rate === 0)).toBe(true)
    expect(farmIdle(result)).toEqual([
      expect.objectContaining({
        at: 35,
        idleVillagers: 3,
        message: '3 villagers arrived at farm from 0:35 on with no free farm and wait idle until one is built.',
      }),
    ])
  })

  test('three farmers on one farm earn one farmer, and each further farm completing adds one at that instant', async ({ request }) => {
    const second = { trigger: { kind: 'time', seconds: 200 } }
    const result = await simulate(request, order({ wood: 3, farm: 3 }, [PAUSE, buildFarm(), buildFarm(second)]))
    const [firstDone, secondDone] = result.steps.slice(1).map((step) => step.completedAt!)

    expect(foodJustBefore(result, firstDone)).toBe(0)
    expect(foodAt(result, firstDone)).toBeCloseTo(farmRate, 9)
    expect(foodJustBefore(result, secondDone)).toBeCloseTo(farmRate, 9)
    expect(foodAt(result, secondDone)).toBeCloseTo(2 * farmRate, 9)
    // The three starting farmers and both builders find every farm taken when they arrive.
    expect(farmIdle(result)).toEqual([expect.objectContaining({ at: 0, idleVillagers: 5 })])
  })

  test('builders returning to farm: one fits a single farm, the other two idle and are counted once', async ({ request }) => {
    const result = await simulate(request, order({ wood: 6 }, [PAUSE, buildFarm({ builders: 3 })]))

    expect(result.gatherRates.food[result.gatherRates.food.length - 1]).toBeCloseTo(farmRate, 9)
    expect(farmIdle(result)).toEqual([expect.objectContaining({ idleVillagers: 2 })])
  })

  test('moving a villager off a full farm takes the idle one first, so food income is unchanged', async ({ request }) => {
    const result = await simulate(request, order({ wood: 4, farm: 2 }, [PAUSE, buildFarm({ then: 'wood' }), move(1, 'farm', 'wood', 200)]))
    const woodBefore = result.gatherRates.wood[firstSampleAtOrAfter(result, 190)]

    expect(foodAt(result, 190)).toBeCloseTo(farmRate, 9)
    expect(foodAt(result, 400)).toBeCloseTo(farmRate, 9)
    expect(result.gatherRates.wood[firstSampleAtOrAfter(result, 400)]).toBeGreaterThan(woodBefore)
  })

  test('wood gathering is not capped: villagers beyond any building count still gather', async ({ request }) => {
    const five = await simulate(request, order({ wood: 5, sheep: 1 }, [PAUSE]))
    const six = await simulate(request, order({ wood: 6 }, [PAUSE]))

    expect(six.gatherRates.wood[0]).toBeCloseTo((6 / 5) * five.gatherRates.wood[0], 9)
    expect(farmIdle(six)).toEqual([])
  })
})
