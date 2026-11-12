import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import english1tcCouncilHall from '../data/aoe4-build-order/builds/english-1tc-council-hall.json'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { PRODUCTION_FLOORS, productionChecks } from '../lib/aoe4-build-order/production-floors'
import { simulateOk } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

type Result = {
  warnings: { code: string; severity: string; idleVillagers?: number }[]
  times: number[]
  unitsProduced: { baseId: string; counts: number[] }[]
  gatherRates: { food: number[] }
  floating: Record<'food' | 'wood' | 'gold' | 'stone', number[]>
}

const builds = [
  { name: 'English 1TC', build: english1tc },
  { name: 'knight/longbow', build: knightLongbow },
  { name: 'spear/longbow into men-at-arms/crossbow', build: spearLongbow },
  { name: 'English 1TC Council Hall', build: english1tcCouncilHall },
]

test.describe.configure({ timeout: 60_000 })

test.beforeAll(async ({ request }) => {
  await simulateOk<Result>(request, spearLongbow, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('the prebuilt builds give every farming villager a built farm', () => {
  for (const { name, build } of builds) {
    for (const durationSeconds of [1200, 1800, 3600]) {
      test(`${name} has no villager waiting for a farm at ${durationSeconds} s`, async ({ request }) => {
        const { warnings } = await simulateOk<Result>(request, build, durationSeconds)
        expect(warnings.filter((w) => w.code === 'farm-idle')).toEqual([])
      })
    }
  }

  for (const { name, build } of builds) {
    test(`${name} meets its production floors and floating cap at 1200 s`, async ({ request }) => {
      const floors = PRODUCTION_FLOORS[build.name]
      expect(floors, 'production floors for the build').toBeDefined()
      const result = await simulateOk<Result>(request, build, 1200)
      const i = result.times.indexOf(1200)
      expect(i, 'sample at 1200 s').toBeGreaterThanOrEqual(0)
      const countOf = (unit: string) => result.unitsProduced.filter((u) => u.baseId === unit).reduce((sum, u) => sum + u.counts[i], 0)
      const { atLeast, atMost } = productionChecks(floors, result, i, countOf)
      for (const [label, actual, floor] of atLeast) expect(actual, label).toBeGreaterThanOrEqual(floor)
      for (const [label, actual, cap] of atMost) expect(actual, label).toBeLessThanOrEqual(cap)
    })
  }

  test('knight/longbow leaves no villager idle through 1800 s', async ({ request }) => {
    const { warnings } = await simulateOk<Result>(request, knightLongbow, 1800)
    expect(warnings.filter((w) => w.code === 'idle-arrival' || w.code === 'step-stuck')).toEqual([])
  })
})
