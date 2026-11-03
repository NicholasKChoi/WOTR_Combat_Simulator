import { createHash } from 'crypto'
import { test, expect, type APIRequestContext } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

type Result = {
  times: number[]
  spawnedPopulation: number[]
  spent: unknown
  steps: unknown
  warnings: unknown
  populationCapReachedAt: number | null
}

test.describe.configure({ timeout: 60_000 })

async function simulate(request: APIRequestContext, buildOrder: unknown, durationSeconds: number, timeout?: number): Promise<Result> {
  const response = await postSimulate(request, { buildOrder, inputs: { durationSeconds } }, timeout)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)

test.beforeAll(async ({ request }) => {
  await simulate(request, knightLongbow, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('auto-houses planned against the house lead time through the simulate API', () => {
  // The three explicit houses between the second archery range and the King's Palace rally.
  const withoutPalaceHouses = {
    ...knightLongbow,
    steps: knightLongbow.steps.filter((_, i) => i < 21 || i > 23),
  }

  test("population keeps rising while the King's Palace builds when the explicit pre-palace houses are removed", async ({ request }) => {
    const result = await simulate(request, withoutPalaceHouses, 800)
    const population = (t: number) => result.spawnedPopulation[result.times.indexOf(t)]
    expect(population(690)).toBe(40)
    expect(population(695)).toBe(41)
    expect(population(765)).toBe(47)
    const window = result.times.flatMap((t, i) => (t >= 680 && t <= 760 ? [result.spawnedPopulation[i]] : []))
    expect(window.slice(1).every((p, i) => p >= window[i])).toBe(true)
    expect(window.at(-1)).toBeGreaterThan(window[0] + 5)
  })

  test('the first house during the palace build lands between 690 s and 695 s, pinning the series from 680 s to 765 s', async ({ request }) => {
    const result = await simulate(request, withoutPalaceHouses, 800)
    const series = result.times.flatMap((t, i) => (t >= 680 && t <= 765 ? [result.spawnedPopulation[i]] : []))
    expect(series).toEqual([40, 40, 40, 41, 41, 41, 41, 43, 43, 43, 44, 45, 45, 45, 45, 46, 47, 47])
  })

  test.describe('shipped builds at 1800 s', () => {
    const shipped = [
      ['english-1tc', english1tc, { cap: 1755.1554493716328, population: 'ff20f5fd6993f85f', spent: '631b1baf519287b2', steps: '6370e5d0b08d64b6', warnings: '43c68fa64f5fedd0' }],
      ['english-knight-longbow', knightLongbow, { cap: 1316.3859872134028, population: 'af29a7017b7e11ca', spent: '3aa9265132ebbc0f', steps: 'af5cbf5986dc59db', warnings: 'fd0832fe4520e3ef' }],
    ] as const

    for (const [name, buildOrder, expected] of shipped) {
      test(`${name} results are unchanged: population, spending, step timings, cap instant and warnings`, async ({ request }) => {
        const result = await simulate(request, buildOrder, 1800)
        expect(result.populationCapReachedAt).toBe(expected.cap)
        expect({
          population: digest(result.spawnedPopulation),
          spent: digest(result.spent),
          steps: digest(result.steps),
          warnings: digest(result.warnings),
        }).toEqual({ population: expected.population, spent: expected.spent, steps: expected.steps, warnings: expected.warnings })
      })
    }
  })
})
