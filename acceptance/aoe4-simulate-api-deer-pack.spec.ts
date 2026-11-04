import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { simulateOk } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const DEER_PACK_FOOD = 2450

type Result = { depletions: { node: string; amount: number | null; depletedAt: number | null }[] }

test.describe.configure({ timeout: 60_000 })

test.beforeAll(async ({ request }) => {
  await simulateOk<Result>(request, english1tc, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('deer pack starting stock on shipped builds', () => {
  for (const build of [english1tc, knightLongbow, spearLongbow]) {
    test(`${build.name} reports a deer pack of ${DEER_PACK_FOOD} food that is not run out`, async ({ request }) => {
      const { depletions } = await simulateOk<Result>(request, build, 1200)
      expect(depletions.find((d) => d.node === 'deer')).toEqual({ node: 'deer', amount: DEER_PACK_FOOD, depletedAt: null })
    })
  }
})
