import { createHash } from 'node:crypto'
import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const GUIDE_STEP_COUNT = 24
const GUIDE_STEPS_SHA256 = '4c3a50b2a9ec3a1b7d42b0d02b825be98005ef9df453e2725fe6361779cf5e53'

type Step = { trigger?: { kind: string; seconds?: number }; reaction?: boolean; unit?: string; action: string; to?: string; from?: string; count?: unknown }
type Result = {
  steps: { step: number; status: string; startedAt: number | null; waitingOn: string | null }[]
  warnings: { code: string }[]
  ages: { age: number; reachedAt: number }[]
  unitsProduced: { baseId: string; counts: number[] }[]
}

const plans = [
  { build: english1tc, units: ['longbowman', 'spearman', 'villager'] },
  { build: knightLongbow, units: ['knight', 'longbowman', 'villager'] },
  { build: spearLongbow, units: ['crossbowman', 'longbowman', 'man-at-arms', 'spearman', 'villager'] },
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

test.describe('each prebuilt build stays a runnable version of its plan', () => {
  for (const { build, units } of plans) {
    for (const durationSeconds of [1200, 3600]) {
      test(`${build.name} at ${durationSeconds} s: no step waits and every non-reaction step has started`, async ({ request }) => {
        const { steps } = await simulate(request, build, durationSeconds)
        const defs = build.steps as Step[]
        expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
        expect(steps.filter((s) => !defs[s.step].reaction && s.startedAt === null)).toEqual([])
        expect(steps.filter((s) => s.status === 'not-reached' && s.waitingOn !== 'trigger')).toEqual([])
      })
    }

    test(`${build.name} leaves no villager stuck or at an empty resource through 1800 s`, async ({ request }) => {
      const { warnings } = await simulate(request, build, 1800)
      expect(warnings.filter((w) => w.code === 'idle-arrival' || w.code === 'step-stuck')).toEqual([])
    })

    test(`${build.name} produces exactly its plan's unit types by 3600 s`, async ({ request }) => {
      const { unitsProduced } = await simulate(request, build, 3600)
      const produced = unitsProduced.filter((u) => u.counts[u.counts.length - 1] > 0).map((u) => u.baseId)
      expect([...new Set(produced)].sort()).toEqual(units)
    })
  }

  test('spear/longbow reaches Castle by 1200 s and arms its men-at-arms step no earlier than Castle', async ({ request }) => {
    const defs = spearLongbow.steps as Step[]
    const index = defs.findIndex((s) => s.unit === 'man-at-arms')
    const trigger = defs[index].trigger
    expect(trigger?.kind).toBe('time')
    const { steps, ages } = await simulate(request, spearLongbow, 1200)
    const castle = ages.find((a) => a.age === 3)?.reachedAt
    expect(castle).toBeLessThanOrEqual(1200)
    expect(trigger?.seconds).toBeGreaterThanOrEqual(castle as number)
    expect(steps[index].startedAt ?? -1).toBeGreaterThanOrEqual(castle as number)
  })
})

test.describe('the 1TC build keeps its guide transcription and adds only late or reactive steps', () => {
  const steps = english1tc.steps as Step[]

  test('the first guide steps are unchanged', () => {
    const digest = createHash('sha256').update(JSON.stringify(steps.slice(0, GUIDE_STEP_COUNT))).digest('hex')
    expect(digest).toBe(GUIDE_STEPS_SHA256)
  })

  test('the gold depleted reaction to gold#2 is the first reaction step', () => {
    const first = steps.find((s) => s.reaction)
    expect(first).toMatchObject({ trigger: { kind: 'depleted', node: 'gold' }, action: 'move', count: 'all', from: 'gold', to: 'gold#2' })
  })

  test('every step after the guide is a reaction or has a time trigger of 420 s or later', () => {
    const late = steps.slice(GUIDE_STEP_COUNT).filter((s) => !s.reaction && !(s.trigger?.kind === 'time' && (s.trigger.seconds ?? 0) >= 420))
    expect(late).toEqual([])
  })
})
