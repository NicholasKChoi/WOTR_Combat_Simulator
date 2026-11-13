import { test, expect } from '@playwright/test'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { WARM_UP_TIMEOUT_MS, postSimulate } from './helpers'

type Series = { unitId: string; baseId: string; tier: number; counts: number[] }
type Result = { times: number[]; unitsProduced: Series[]; steps: { completedAt: number | null }[] }

test.describe.configure({ timeout: 60_000 })

const seriesOf = (body: Result, baseId: string) => body.unitsProduced.filter((u) => u.baseId === baseId)
const finalCountOf = (body: Result, baseId: string) => seriesOf(body, baseId).reduce((sum, s) => sum + (s.counts.at(-1) ?? 0), 0)

let result: Result

test.beforeAll(async ({ request }) => {
  const response = await postSimulate(request, { buildOrder: knightLongbow, inputs: { durationSeconds: 1800 } }, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(200)
  result = await response.json()
})

test.describe('Veteran Longbowmen converts the longbowmen on the field in the knight/longbow build', () => {
  function convertedSeries() {
    const [lower, upper, ...rest] = seriesOf(result, 'longbowman').sort((a, b) => a.tier - b.tier)
    expect(rest, 'exactly two longbowman series').toEqual([])
    expect(upper, 'a second longbowman series').toBeDefined()
    expect(lower.tier).toBeLessThan(upper.tier)
    const research = knightLongbow.steps.findIndex((s) => s.action === 'research' && 'tech' in s && s.tech === 'veteran-longbowmen')
    const completedAt = result.steps[research].completedAt
    expect(completedAt, 'veteran-longbowmen completes within the horizon').not.toBeNull()
    const before = result.times.filter((t) => t < completedAt!).length - 1
    const after = result.times.findIndex((t) => t >= completedAt!)
    expect(before, 'a sample before the completion').toBeGreaterThanOrEqual(0)
    expect(after, 'a sample at or after the completion').toBeGreaterThan(before)
    return { lower, upper, before, after }
  }

  test('the lower tier empties and the upper tier fills at the research completion', () => {
    const { lower, upper, before, after } = convertedSeries()
    expect(lower.counts[before]).toBeGreaterThan(0)
    expect(upper.counts[before]).toBe(0)
    expect(upper.counts[after]).toBeGreaterThan(0)
    const lowerAfter = lower.counts.slice(after)
    expect(lowerAfter.length).toBeGreaterThan(0)
    expect(lowerAfter.every((c) => c === 0)).toBe(true)
  })

  test('per-baseId counts sum to a cumulative produced total that never decreases', () => {
    const { lower, upper } = convertedSeries()
    const sums = result.times.map((_, i) => lower.counts[i] + upper.counts[i])
    for (let i = 1; i < sums.length; i++) {
      expect(sums[i], `at ${result.times[i]} s`).toBeGreaterThanOrEqual(sums[i - 1])
    }
    expect(sums.at(-1)).toBe(upper.counts.at(-1))
    expect(finalCountOf(result, 'longbowman')).toBe(sums.at(-1))
  })
})
