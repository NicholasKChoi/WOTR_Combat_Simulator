import { test, expect } from '@playwright/test'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

type Series = { unitId: string; baseId: string; tier: number; counts: number[] }
type Result = { times: number[]; unitsProduced: Series[] }

test.describe.configure({ timeout: 60_000 })

let result: Result

test.beforeAll(async ({ request }) => {
  const response = await postSimulate(request, { buildOrder: knightLongbow, inputs: { durationSeconds: 1800 } }, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(200)
  result = await response.json()
})

function countAt(unitId: string, seconds: number): number {
  const index = result.times.indexOf(seconds)
  expect(index, `a sample at ${seconds} s`).toBeGreaterThanOrEqual(0)
  const series = result.unitsProduced.find((u) => u.unitId === unitId)
  expect(series, unitId).toBeDefined()
  return series!.counts[index]
}

test.describe('Veteran Longbowmen converts the longbowmen on the field in the knight/longbow build', () => {
  test('longbowman-2 holds 12 at 845 s and none from 850 s on', () => {
    expect(countAt('longbowman-2', 845)).toBe(12)
    const lower = result.unitsProduced.find((u) => u.unitId === 'longbowman-2')!
    const after = lower.counts.filter((_, i) => result.times[i] >= 850)
    expect(after.length).toBeGreaterThan(0)
    expect(after.every((c) => c === 0)).toBe(true)
  })

  test('longbowman-3 holds none at 845 s, 13 at 850 s and 66 at 1800 s', () => {
    expect(countAt('longbowman-3', 845)).toBe(0)
    expect(countAt('longbowman-3', 850)).toBe(13)
    expect(countAt('longbowman-3', 1800)).toBe(66)
  })

  test('per-baseId counts sum to a cumulative produced total that never decreases', () => {
    const longbowmen = result.unitsProduced.filter((u) => u.baseId === 'longbowman')
    expect(longbowmen.map((u) => u.unitId)).toEqual(['longbowman-2', 'longbowman-3'])
    const sums = result.times.map((_, i) => longbowmen.reduce((n, u) => n + u.counts[i], 0))
    for (let i = 1; i < sums.length; i++) {
      expect(sums[i], `at ${result.times[i]} s`).toBeGreaterThanOrEqual(sums[i - 1])
    }
    expect(countAt('longbowman-2', 845) + countAt('longbowman-3', 845)).toBe(sums[result.times.indexOf(845)])
    expect(sums[result.times.indexOf(850)]).toBe(13)
    expect(sums.at(-1)).toBe(66)
  })
})
