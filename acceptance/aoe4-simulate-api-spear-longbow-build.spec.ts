import { test, expect } from '@playwright/test'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const GOLD_NODES = ['gold', 'gold#2', 'gold#3']
const MAN_AT_ARMS_STEP = 23
// The house lead time plans supply only from what lands in time, so the step arms at the landmark but starts after it.
const CASTLE_LANDMARK_SECONDS = 681
const MAN_AT_ARMS_START_SECONDS = 687.5475028949656
const FIRST_GOLD_DEPLETED_SECONDS = 1114.092642631611

type Result = {
  steps: { step: number; status: string; armedAt: number | null; startedAt: number | null }[]
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
    test(`at ${durationSeconds} s the men-at-arms step arms at the Castle landmark second and starts once the house lead time has supplied the population, with no waiting step`, async ({ request }) => {
      const { steps } = await simulate(request, durationSeconds)
      const step = steps.find((s) => s.step === MAN_AT_ARMS_STEP)
      expect(step).toMatchObject({ armedAt: CASTLE_LANDMARK_SECONDS, startedAt: MAN_AT_ARMS_START_SECONDS })
      expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    })
  }

  test('at 1200 s only the first gold deposit has run out and its info node-depleted warning is the only warning', async ({ request }) => {
    const { depletions, warnings } = await simulate(request, 1200)
    // The lead-time rule shifts the build later, so the first deposit now empties inside the window.
    expect(depletions.filter((d) => GOLD_NODES.includes(d.node)).map((d) => d.depletedAt)).toEqual([FIRST_GOLD_DEPLETED_SECONDS, null, null])
    expect(warnings.map((w) => [w.code, w.severity, w.node])).toEqual([['node-depleted', 'info', 'gold']])
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
