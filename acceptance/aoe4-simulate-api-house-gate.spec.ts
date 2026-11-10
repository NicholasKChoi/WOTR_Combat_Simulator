import { test, expect, type APIRequestContext } from '@playwright/test'
import { buildOrderFrom, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

type Result = { times: number[]; spawnedPopulation: number[]; warnings: { code: string }[] }

const house = (seconds: number) => ({ action: 'build', building: 'house', builders: 1, from: 'sheep', trigger: { kind: 'time', seconds } })

function order(autoHouses: boolean) {
  return {
    buildOrder: { civ: 'english', name: 'Late house', start: { rally: 'sheep' }, steps: [house(0), house(600)] },
    inputs: { durationSeconds: 700, autoHouses },
  }
}

async function simulate(request: APIRequestContext, body: unknown): Promise<Result> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const populationAt = (result: Result, t: number) => result.spawnedPopulation[result.times.indexOf(t)]

// First sampled time at which population reaches the value it holds at `until`.
function heldSince(result: Result, until: number): number {
  return result.times[result.spawnedPopulation.indexOf(populationAt(result, until))]
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('auto-houses with a late build-house step through the simulate API', () => {
  test('with autoHouses off production blocks at supply until the late house adds more', async ({ request }) => {
    const off = await simulate(request, order(false))
    const hold = heldSince(off, 595)
    expect(hold).toBeLessThan(595 - 60)
    expect(populationAt(off, 700)).toBeGreaterThan(populationAt(off, 595))
  })

  test('with autoHouses on production continues past the supply limit the off run holds at, with no auto-houses warning', async ({ request }) => {
    const off = await simulate(request, order(false))
    const on = await simulate(request, order(true))
    const hold = heldSince(off, 595)
    expect(populationAt(on, 595)).toBeGreaterThan(populationAt(off, hold))
    expect(on.warnings.filter((w) => w.code.startsWith('auto-houses'))).toEqual([])
  })
})
