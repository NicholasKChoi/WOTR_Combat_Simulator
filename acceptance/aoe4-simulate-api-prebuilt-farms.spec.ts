import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const MAX_SPEAR_LONGBOW_STEPS = 60

type Result = {
  steps: { step: number; status: string; startedAt: number | null; waitingOn: string | null }[]
  warnings: { code: string; severity: string; idleVillagers?: number }[]
  ages: { age: number; reachedAt: number }[]
}

const builds = [
  { name: 'English 1TC', build: english1tc },
  { name: 'knight/longbow', build: knightLongbow },
  { name: 'spear/longbow into men-at-arms/crossbow', build: spearLongbow },
]

test.describe.configure({ timeout: 60_000 })

async function simulate(request: Parameters<typeof postSimulate>[0], build: unknown, durationSeconds: number, timeout?: number): Promise<Result> {
  const response = await postSimulate(request, { buildOrder: build, inputs: { durationSeconds } }, timeout)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await simulate(request, spearLongbow, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('the prebuilt builds give every farming villager a built farm', () => {
  for (const { name, build } of builds) {
    for (const durationSeconds of [1200, 1800, 3600]) {
      test(`${name} has no villager waiting for a farm at ${durationSeconds} s`, async ({ request }) => {
        const { warnings } = await simulate(request, build, durationSeconds)
        expect(warnings.filter((w) => w.code === 'farm-idle')).toEqual([])
      })
    }
  }

  test.describe('spear/longbow bars after capping the farm rallies', () => {
    test('the build stays far smaller than the farm-step approach would make it', () => {
      expect(spearLongbow.steps.length).toBeLessThan(MAX_SPEAR_LONGBOW_STEPS)
    })

    for (const durationSeconds of [1200, 3600]) {
      test(`at ${durationSeconds} s every non-reaction step has started, none waits, and Castle is reached by 1200 s`, async ({ request }) => {
        const { steps, ages } = await simulate(request, spearLongbow, durationSeconds)
        expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
        expect(steps.filter((s) => !('reaction' in spearLongbow.steps[s.step]) && s.startedAt === null)).toEqual([])
        expect(steps.filter((s) => s.status === 'not-reached' && s.waitingOn !== 'trigger')).toEqual([])
        expect(ages.find((a) => a.age === 3)?.reachedAt).toBeLessThanOrEqual(1200)
      })
    }

    test('through 1800 s no villager arrives at an empty resource or is stuck', async ({ request }) => {
      const { warnings } = await simulate(request, spearLongbow, 1800)
      expect(warnings.filter((w) => w.code === 'idle-arrival' || w.code === 'step-stuck')).toEqual([])
    })

    test('the men-at-arms step arms at its time trigger, which is no earlier than Castle, and starts at or after Castle', async ({ request }) => {
      const index = spearLongbow.steps.findIndex((s) => 'unit' in s && s.unit === 'man-at-arms')
      const trigger = spearLongbow.steps[index].trigger
      expect(trigger?.kind).toBe('time')
      const { steps, ages } = await simulate(request, spearLongbow, 1200)
      const castle = ages.find((a) => a.age === 3)?.reachedAt ?? Infinity
      expect(trigger?.kind === 'time' ? trigger.seconds : null).toBeGreaterThanOrEqual(castle)
      expect(steps[index].startedAt ?? -1).toBeGreaterThanOrEqual(castle)
    })
  })

  test('knight/longbow leaves no villager idle through 1800 s', async ({ request }) => {
    const { warnings } = await simulate(request, knightLongbow, 1800)
    expect(warnings.filter((w) => w.code === 'idle-arrival' || w.code === 'step-stuck')).toEqual([])
  })
})
