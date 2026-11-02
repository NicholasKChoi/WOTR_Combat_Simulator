import { test, expect } from '@playwright/test'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const GOLD_NODES = ['gold', 'gold#2', 'gold#3', 'gold#4', 'gold#5']
const REACTION_COUNT = GOLD_NODES.length

type Result = {
  steps: { step: number; status: string; startedAt: number | null; waitingOn: string | null }[]
  warnings: { code: string; severity: string; node?: string }[]
  depletions: { node: string; depletedAt: number | null }[]
}

test.describe.configure({ timeout: 60_000 })

async function simulate(request: Parameters<typeof postSimulate>[0], durationSeconds: number, timeout?: number): Promise<Result> {
  const response = await postSimulate(request, { buildOrder: knightLongbow, inputs: { durationSeconds } }, timeout)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await simulate(request, 60, WARM_UP_TIMEOUT_MS)
})

test.describe('the knight/longbow build through the simulate API', () => {
  const reactionSteps = knightLongbow.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => 'reaction' in step)

  test('the five gold-switch reactions are the last five steps, one per deposit', () => {
    expect(reactionSteps.map(({ index }) => index)).toEqual(
      Array.from({ length: REACTION_COUNT }, (_, i) => knightLongbow.steps.length - REACTION_COUNT + i)
    )
  })

  test('at 1200 s no step waits, only the first gold deposit has run out and its reaction ran, and the later reactions are not reached', async ({ request }) => {
    const { steps, depletions, warnings } = await simulate(request, 1200)
    expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    const [first, ...later] = reactionSteps.map(({ index }) => steps[index])
    const goldDepletedAt = GOLD_NODES.map((node) => depletions.find((d) => d.node === node)?.depletedAt)
    expect(goldDepletedAt[0]).toEqual(expect.any(Number))
    expect(goldDepletedAt.slice(1)).toEqual([null, null, null, null])
    expect(first.startedAt).toBe(goldDepletedAt[0])
    for (const step of later) {
      expect(step).toMatchObject({ status: 'not-reached', startedAt: null, waitingOn: 'trigger' })
    }
    const others = steps.filter((s) => !reactionSteps.some(({ index }) => index === s.step))
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
    expect(reactionSteps.map(({ index }) => steps[index].startedAt)).toEqual(depletedAt)
    expect(warnings.filter((w) => w.severity === 'warning' && GOLD_NODES.includes(w.node ?? ''))).toEqual([])
  })
})
