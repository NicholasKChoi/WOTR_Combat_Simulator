import { test, expect } from '@playwright/test'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { WARM_UP_TIMEOUT_MS, simulateOk } from './helpers'

const GOLD_NODES = ['gold', 'gold#2', 'gold#3', 'gold#4', 'gold#5']
const GOLD_REACTION_COUNT = GOLD_NODES.length

type Result = {
  steps: { step: number; status: string; startedAt: number | null; waitingOn: string | null }[]
  warnings: { code: string; severity: string; node?: string; idleVillagers?: number }[]
  depletions: { node: string; depletedAt: number | null }[]
}

test.describe.configure({ timeout: 60_000 })

const simulate = (request: Parameters<typeof simulateOk>[0], durationSeconds: number, timeout?: number) =>
  simulateOk<Result>(request, knightLongbow, durationSeconds, timeout)

test.beforeAll(async ({ request }) => {
  await simulate(request, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('the knight/longbow build through the simulate API', () => {
  const reactionSteps = knightLongbow.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => 'reaction' in step)
  const goldReactionSteps = reactionSteps.filter(({ step }) => 'from' in step && GOLD_NODES.includes(step.from ?? ''))

  test('the five gold-switch reactions, one per deposit, are followed by the sheep reaction as the last steps', () => {
    const lastIndexes = Array.from({ length: GOLD_REACTION_COUNT + 1 }, (_, i) => knightLongbow.steps.length - GOLD_REACTION_COUNT - 1 + i)
    expect(reactionSteps.map(({ index }) => index)).toEqual(lastIndexes)
    expect(reactionSteps.slice(0, -1).map(({ step }) => 'from' in step && step.from)).toEqual(GOLD_NODES)
    expect(reactionSteps.at(-1)?.step).toMatchObject({ from: 'sheep', to: 'farm' })
  })

  test('at 1200 s no step waits, only the first gold deposit has run out and its reaction ran, and the later reactions are not reached', async ({ request }) => {
    const { steps, depletions, warnings } = await simulate(request, 1200)
    expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    const [first, ...later] = goldReactionSteps.map(({ index }) => steps[index])
    const goldDepletedAt = GOLD_NODES.map((node) => depletions.find((d) => d.node === node)?.depletedAt)
    expect(goldDepletedAt[0]).toEqual(expect.any(Number))
    expect(goldDepletedAt.slice(1)).toEqual([null, null, null, null])
    expect(first.startedAt).toBe(goldDepletedAt[0])
    for (const step of later) {
      expect(step).toMatchObject({ status: 'not-reached', startedAt: null, waitingOn: 'trigger' })
    }
    const others = steps.filter((s) => !goldReactionSteps.some(({ index }) => index === s.step))
    expect(others.filter((s) => s.startedAt === null)).toEqual([])
    expect(warnings.filter((w) => w.severity === 'warning' && GOLD_NODES.includes(w.node ?? ''))).toEqual([])
  })

  test('at 3600 s all five gold deposits run out, each reaction starts at its deposit run-out instant, and no gold warning has warning severity', async ({ request }) => {
    const { steps, depletions, warnings } = await simulate(request, 3600)
    expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    const depletedAt = GOLD_NODES.map((node) => depletions.find((d) => d.node === node)?.depletedAt)
    for (const [i, at] of depletedAt.entries()) {
      expect(at, GOLD_NODES[i]).toEqual(expect.any(Number))
    }
    expect(depletedAt).toEqual([...depletedAt].sort((a, b) => (a as number) - (b as number)))
    expect(goldReactionSteps.map(({ index }) => steps[index].startedAt)).toEqual(depletedAt)
    expect(warnings.filter((w) => w.severity === 'warning' && GOLD_NODES.includes(w.node ?? ''))).toEqual([])
  })

  test('at 1800 s no villager is left idle, nothing is stuck, and the sheep reaction runs at the sheep run-out', async ({ request }) => {
    const { steps, depletions, warnings } = await simulate(request, 1800)
    expect(warnings.filter((w) => w.code === 'idle-arrival' || w.code === 'step-stuck')).toEqual([])
    expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    const depleted = warnings.filter((w) => w.code === 'node-depleted')
    expect(depleted.map((w) => w.node)).toEqual(expect.arrayContaining(['sheep', 'gold', 'gold#2']))
    for (const warning of depleted) {
      expect(warning.idleVillagers, warning.node).toBe(0)
    }
    const sheepReaction = reactionSteps.at(-1)
    expect(steps[sheepReaction?.index ?? -1].startedAt).toBe(depletions.find((d) => d.node === 'sheep')?.depletedAt)
  })
})
