import { test, expect } from '@playwright/test'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import { WARM_UP_TIMEOUT_MS, simulateOk } from './helpers'

const GOLD_NODES = ['gold', 'gold#2', 'gold#3']

type Result = {
  steps: { step: number; status: string; armedAt: number | null; startedAt: number | null; waitBreakdown?: { resources?: number } }[]
  warnings: { code: string; severity: string; node?: string }[]
  depletions: { node: string; depletedAt: number | null }[]
}

test.describe.configure({ timeout: 60_000 })

const simulate = (request: Parameters<typeof simulateOk>[0], durationSeconds: number, timeout?: number) =>
  simulateOk<Result>(request, spearLongbow, durationSeconds, timeout)

test.beforeAll(async ({ request }) => {
  await simulate(request, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('the spear/longbow into men-at-arms/crossbow build through the simulate API', () => {
  for (const durationSeconds of [1200, 3600]) {
    test(`at ${durationSeconds} s the first timed men-at-arms step arms at its trigger second and starts when resources allow, with no waiting step`, async ({ request }) => {
      const index = spearLongbow.steps.findIndex((s) => s.action === 'produce' && 'unit' in s && s.unit === 'man-at-arms' && 'trigger' in s && s.trigger?.kind === 'time')
      expect(index, 'a time-triggered men-at-arms step').toBeGreaterThanOrEqual(0)
      const trigger = spearLongbow.steps[index].trigger as { seconds: number }
      const { steps } = await simulate(request, durationSeconds)
      const step = steps.find((s) => s.step === index)
      expect(step?.armedAt).toBe(trigger.seconds)
      expect(step?.startedAt, 'the step starts within the horizon').not.toBeNull()
      expect(step!.startedAt!).toBeGreaterThanOrEqual(trigger.seconds)
      expect(step?.waitBreakdown?.resources).toBeCloseTo(step!.startedAt! - trigger.seconds, 3)
      expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    })
  }

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
