import { test, expect } from '@playwright/test'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const GOLD_NODES = ['gold', 'gold#2', 'gold#3']
const MAN_AT_ARMS_STEP = 24
// The step arms at the landmark and starts after it, once resources allow.
const CASTLE_LANDMARK_SECONDS = 757
const MAN_AT_ARMS_START_SECONDS = 767.6367192366768

type Result = {
  steps: { step: number; status: string; armedAt: number | null; startedAt: number | null; waitBreakdown?: { resources?: number } }[]
  warnings: { code: string; severity: string; node?: string }[]
  depletions: { node: string; depletedAt: number | null }[]
}

test.describe.configure({ timeout: 60_000 })

async function simulate(request: Parameters<typeof postSimulate>[0], durationSeconds: number, timeout?: number): Promise<Result> {
  const response = await postSimulate(request, { buildOrder: spearLongbow, inputs: { durationSeconds } }, timeout)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await simulate(request, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('the spear/longbow into men-at-arms/crossbow build through the simulate API', () => {
  for (const durationSeconds of [1200, 3600]) {
    test(`at ${durationSeconds} s the men-at-arms step arms at the Castle landmark second and starts when resources allow, with no waiting step`, async ({ request }) => {
      const { steps } = await simulate(request, durationSeconds)
      const step = steps.find((s) => s.step === MAN_AT_ARMS_STEP)
      expect(step).toMatchObject({ armedAt: CASTLE_LANDMARK_SECONDS, startedAt: MAN_AT_ARMS_START_SECONDS })
      expect(step?.waitBreakdown?.resources).toBeCloseTo(MAN_AT_ARMS_START_SECONDS - CASTLE_LANDMARK_SECONDS, 3)
      expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    })
  }

  test('at 1200 s no gold deposit has run out and the run has no warning', async ({ request }) => {
    const { depletions, warnings } = await simulate(request, 1200)
    expect(depletions.filter((d) => GOLD_NODES.includes(d.node)).map((d) => d.depletedAt)).toEqual([null, null, null])
    expect(warnings).toEqual([])
  })

  test('at 3600 s each of the three gold deposits runs out with an info node-depleted warning and no warning-severity gold issue', async ({ request }) => {
    const { depletions, warnings } = await simulate(request, 3600)
    for (const node of GOLD_NODES) {
      expect(depletions.find((d) => d.node === node)?.depletedAt, node).not.toBeNull()
    }
    const depleted = warnings.filter((w) => w.code === 'node-depleted')
    expect(depleted.map((w) => [w.node, w.severity])).toEqual(GOLD_NODES.map((node) => [node, 'info']))
    expect(warnings.filter((w) => w.severity === 'warning' && GOLD_NODES.includes(w.node ?? ''))).toEqual([])
  })
})
