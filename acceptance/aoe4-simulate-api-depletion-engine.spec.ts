import { test, expect, type APIRequestContext } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

type Start = { villagers: Record<string, number>; rally: string }
type Warning = { code: string; severity: string; node: string; at: number; idleVillagers: number }
type Result = {
  sampleSeconds: number
  times: number[]
  gatherRates: Record<string, number[]>
  floating: Record<string, number[]>
  steps: { status: string; startedAt: number | null; completedAt: number | null; waitSeconds: number }[]
  depletions: { node: string; amount: number | null; depletedAt: number | null }[]
  warnings: Warning[]
}

const PAUSE = { action: 'pause', producer: 'capital-town-center' }
const NO_HOUSES = { autoHouses: false }

function order(start: Start, steps: unknown[], inputs: object = {}) {
  return { buildOrder: { civ: 'english', name: 'Depletion', start, steps }, inputs: { ...NO_HOUSES, ...inputs } }
}

async function simulate(request: APIRequestContext, body: unknown): Promise<Result> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const depletionOf = (result: Result, node: string) => result.depletions.find((d) => d.node === node)
const warningsOf = (result: Result, code: string, node: string) => result.warnings.filter((w) => w.code === code && w.node === node)
const sampleAtOrAfter = (result: Result, seconds: number) => result.times.findIndex((t) => t >= seconds)
const last = <T>(series: T[]) => series[series.length - 1]

// Per-villager rate per second of one node, read off the first sample of a run that gathers only it.
async function perVillagerRate(request: APIRequestContext, node: string, resource: 'food' | 'gold' | 'wood') {
  const result = await simulate(request, order({ villagers: { [node]: 1, wood: 5 }, rally: 'wood' }, [PAUSE]))
  return result.gatherRates[resource][0] / 60
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: 'start 6 sheep -> sheep' }, WARM_UP_TIMEOUT_MS)
})

test.describe('a node with a finite stock', () => {
  const AMOUNT = 601
  const start = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }

  test('runs out at an exact instant between samples and gathers exactly its stock', async ({ request }) => {
    const rate = await perVillagerRate(request, 'berry', 'food')
    const result = await simulate(request, order(start, [PAUSE], { nodeAmounts: { berry: AMOUNT } }))

    const row = depletionOf(result, 'berry')!
    expect(row.amount).toBe(AMOUNT)
    expect(row.depletedAt).toBeCloseTo(AMOUNT / (3 * rate), 5)
    expect(row.depletedAt! % result.sampleSeconds).not.toBe(0)

    expect(last(result.floating.food) - result.floating.food[0]).toBeCloseTo(AMOUNT, 5)
  })

  test('leaves its gatherers idle: the food rate drops to zero and the bank stops rising', async ({ request }) => {
    const result = await simulate(request, order(start, [PAUSE], { nodeAmounts: { berry: AMOUNT } }))
    const after = sampleAtOrAfter(result, depletionOf(result, 'berry')!.depletedAt!)

    expect(result.gatherRates.food[after - 1]).toBeGreaterThan(0)
    expect(result.gatherRates.food[after]).toBe(0)
    expect(result.floating.food[after]).toBeCloseTo(last(result.floating.food), 9)
  })

  test('is reported once as a node-depleted warning at the run-out instant with the idle villager count', async ({ request }) => {
    const result = await simulate(request, order(start, [PAUSE], { nodeAmounts: { berry: AMOUNT } }))

    expect(result.warnings).toEqual([
      expect.objectContaining({ code: 'node-depleted', severity: 'warning', node: 'berry', at: depletionOf(result, 'berry')!.depletedAt, idleVillagers: 3 }),
    ])
  })

  test('with a stock of 0 is depleted at time 0, and the warning is info when nobody is there', async ({ request }) => {
    const empty = await simulate(request, order({ villagers: { wood: 6 }, rally: 'wood' }, [PAUSE], { nodeAmounts: { berry: 0 } }))
    expect(depletionOf(empty, 'berry')).toEqual({ node: 'berry', amount: 0, depletedAt: 0 })
    expect(warningsOf(empty, 'node-depleted', 'berry')).toEqual([expect.objectContaining({ at: 0, severity: 'info', idleVillagers: 0 })])

    const staffed = await simulate(request, order(start, [PAUSE], { nodeAmounts: { berry: 0 } }))
    expect(warningsOf(staffed, 'node-depleted', 'berry')).toEqual([expect.objectContaining({ at: 0, severity: 'warning', idleVillagers: 3 })])
  })

  test('with a null override stays infinite: no run-out, no warning, income continues to the horizon', async ({ request }) => {
    const result = await simulate(request, order(start, [PAUSE], { nodeAmounts: { berry: null }, durationSeconds: 3600 }))

    expect(depletionOf(result, 'berry')).toEqual({ node: 'berry', amount: null, depletedAt: null })
    expect(result.warnings).toEqual([])
    expect(last(result.gatherRates.food)).toBeGreaterThan(0)
  })

  test('returns identical bodies for the same request twice', async ({ request }) => {
    const body = order(start, [PAUSE, { action: 'move', count: 'all', from: 'berry', to: 'wood', trigger: { kind: 'time', seconds: 400 } }], { nodeAmounts: { berry: AMOUNT } })
    const first = await postSimulate(request, body)
    const second = await postSimulate(request, body)

    expect(first.status()).toBe(200)
    expect(await second.text()).toBe(await first.text())
  })
})

test.describe('villagers arriving at a dry node', () => {
  test('a move onto it records one idle-arrival at the arrival time after the node-depleted warning', async ({ request }) => {
    const result = await simulate(
      request,
      order({ villagers: { sheep: 3, wood: 3 }, rally: 'wood' }, [{ action: 'move', count: 3, from: 'sheep', to: 'berry', walkSeconds: 10 }], { nodeAmounts: { berry: 0 } }),
    )

    expect(result.warnings.map((w) => [w.code, w.node])).toEqual([['node-depleted', 'berry'], ['idle-arrival', 'berry']])
    expect(result.warnings[1]).toMatchObject({ severity: 'warning', at: 10, idleVillagers: 3 })
  })

  test('produced villagers rallied to it add to a single idle-arrival warning', async ({ request }) => {
    const produce = { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 2, rally: 'berry', walkSeconds: 5 }
    const result = await simulate(request, order({ villagers: { sheep: 6 }, rally: 'sheep' }, [produce], { nodeAmounts: { berry: 0 } }))

    const arrivals = warningsOf(result, 'idle-arrival', 'berry')
    expect(arrivals).toHaveLength(1)
    expect(arrivals[0]).toMatchObject({ severity: 'warning', idleVillagers: 2 })
    expect(arrivals[0].at).toBeGreaterThan(0)
  })

  test('villagers the run-out itself made idle are not counted as arrivals', async ({ request }) => {
    const result = await simulate(request, order({ villagers: { berry: 3, wood: 3 }, rally: 'wood' }, [PAUSE], { nodeAmounts: { berry: 601 } }))

    expect(warningsOf(result, 'idle-arrival', 'berry')).toEqual([])
  })

  test('an arrival at the run-out instant counts in both warnings', async ({ request }) => {
    const result = await simulate(
      request,
      order({ villagers: { sheep: 2, wood: 4 }, rally: 'wood' }, [{ action: 'move', count: 2, from: 'sheep', to: 'berry', walkSeconds: 0 }], { nodeAmounts: { berry: 0 } }),
    )

    expect(warningsOf(result, 'node-depleted', 'berry')).toEqual([expect.objectContaining({ at: 0, severity: 'warning', idleVillagers: 2 })])
    expect(warningsOf(result, 'idle-arrival', 'berry')).toEqual([expect.objectContaining({ at: 0, severity: 'warning', idleVillagers: 2 })])
  })
})

test.describe('move all', () => {
  test('takes every villager on the source node and never waits', async ({ request }) => {
    const moved = await simulate(
      request,
      order({ villagers: { sheep: 4, berry: 2 }, rally: 'sheep' }, [{ action: 'move', count: 'all', from: 'sheep', to: 'wood', walkSeconds: 0 }]),
    )
    const control = await simulate(request, order({ villagers: { wood: 4, berry: 2 }, rally: 'wood' }, [PAUSE]))

    expect(moved.steps[0]).toMatchObject({ status: 'completed', startedAt: 0, completedAt: 0, waitSeconds: 0 })
    expect(moved.gatherRates.food[0]).toBeCloseTo(control.gatherRates.food[0], 9)
    expect(moved.gatherRates.wood[0]).toBeCloseTo(control.gatherRates.wood[0], 9)
  })

  test('from a node with nobody on it completes at its start instant and moves no one', async ({ request }) => {
    const result = await simulate(
      request,
      order({ villagers: { sheep: 6 }, rally: 'sheep' }, [PAUSE, { action: 'move', count: 'all', from: 'gold', to: 'wood', walkSeconds: 30 }]),
    )
    const control = await simulate(request, order({ villagers: { sheep: 6 }, rally: 'sheep' }, [PAUSE]))

    expect(result.steps[1]).toMatchObject({ status: 'completed', startedAt: 0, completedAt: 0 })
    expect(result.gatherRates).toEqual(control.gatherRates)
  })

  test('takes the idle villagers of a node that ran out', async ({ request }) => {
    const start = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }
    const steps = [PAUSE, { action: 'move', count: 'all', from: 'berry', to: 'wood', walkSeconds: 0, trigger: { kind: 'time', seconds: 400 } }]
    const result = await simulate(request, order(start, steps, { nodeAmounts: { berry: 601 } }))
    const control = await simulate(request, order({ villagers: { wood: 6 }, rally: 'wood' }, [PAUSE]))

    expect(result.steps[1].startedAt).toBe(400)
    expect(last(result.gatherRates.wood)).toBeCloseTo(last(control.gatherRates.wood), 9)
  })
})

test.describe('numbered gold deposits', () => {
  const start = { villagers: { gold: 2, 'gold#2': 4 }, rally: 'gold' }

  test('run out independently: deposit 1 running dry leaves deposit 2 on the same run-out instant', async ({ request }) => {
    const bothFinite = await simulate(request, order(start, [PAUSE], { nodeAmounts: { gold: 100, 'gold#2': 300 } }))
    const firstInfinite = await simulate(request, order(start, [PAUSE], { nodeAmounts: { gold: null, 'gold#2': 300 } }))
    const rate = await perVillagerRate(request, 'gold', 'gold')

    expect(depletionOf(bothFinite, 'gold')).toEqual({ node: 'gold', amount: 100, depletedAt: expect.closeTo(100 / (2 * rate), 5) })
    expect(depletionOf(bothFinite, 'gold#2')!.depletedAt).toBeCloseTo(300 / (4 * rate), 5)
    expect(depletionOf(firstInfinite, 'gold#2')).toEqual(depletionOf(bothFinite, 'gold#2'))
    expect(depletionOf(firstInfinite, 'gold')).toEqual({ node: 'gold', amount: null, depletedAt: null })
  })

  test('credit each deposit its full stock', async ({ request }) => {
    const result = await simulate(request, order(start, [PAUSE], { nodeAmounts: { gold: 100, 'gold#2': 300 } }))

    expect(last(result.floating.gold) - result.floating.gold[0]).toBeCloseTo(400, 5)
  })

  test('appear in depletions only when the order names them, and an override for an unnamed one is accepted', async ({ request }) => {
    const result = await simulate(request, order({ villagers: { gold: 6 }, rally: 'gold' }, [PAUSE], { nodeAmounts: { 'gold#2': 300 } }))

    expect(result.depletions.map((d) => d.node)).not.toContain('gold#2')
  })
})

test.describe('infinite nodes', () => {
  test('farm and wood never run out over an hour', async ({ request }) => {
    const result = await simulate(request, order({ villagers: { farm: 3, wood: 3 }, rally: 'wood' }, [PAUSE], { durationSeconds: 3600 }))

    expect(result.depletions.map((d) => d.node)).not.toContain('farm')
    expect(result.depletions.map((d) => d.node)).not.toContain('wood')
    expect(result.warnings).toEqual([])
    expect(last(result.gatherRates.food)).toBeGreaterThan(0)
    expect(last(result.gatherRates.wood)).toBeGreaterThan(0)
  })
})

test.describe('a farm build', () => {
  const start = { villagers: { sheep: 3, wood: 3 }, rally: 'wood' }
  const build = (building: string, then: string) => [{ action: 'build', building, from: 'sheep', then, walkSeconds: 20 }]
  const run = (request: APIRequestContext, building: string, then: string) => simulate(request, order(start, build(building, then), { durationSeconds: 300 }))

  test('has its builders gather on the farm at completion, without a second walk', async ({ request }) => {
    const result = await run(request, 'farm', 'farm')
    const completedAt = result.steps[0].completedAt!
    const joined = sampleAtOrAfter(result, completedAt)

    expect(result.gatherRates.food[joined - 1]).toBe(result.gatherRates.food[0])
    expect(result.gatherRates.food[joined]).toBeGreaterThan(result.gatherRates.food[0])
    expect(result.gatherRates.food[joined]).toBeCloseTo(last(result.gatherRates.food), 9)
    expect(result.times[joined] - completedAt).toBeLessThan(result.sampleSeconds)
  })

  test('other buildings keep the walk back to the node: the builders arrive a walk after completion', async ({ request }) => {
    for (const then of ['sheep', 'berry']) {
      const result = await run(request, 'mill', then)
      const completedAt = result.steps[0].completedAt!
      const walkedBack = sampleAtOrAfter(result, completedAt + 20)

      expect(result.gatherRates.food[sampleAtOrAfter(result, completedAt)], then).toBe(result.gatherRates.food[0])
      expect(result.gatherRates.food[walkedBack], then).toBeGreaterThan(result.gatherRates.food[0])
    }
  })
})

test.describe('the prebuilt English build against the pre-depletion engine', () => {
  const noDepletion = (result: Result) => {
    expect(result.depletions.every((d) => d.amount === null && d.depletedAt === null)).toBe(true)
    expect(result.warnings).toEqual([])
  }

  test('differs only by the farm builders joining at completion: the 1200 second bank and the farm-walk food rates', async ({ request }) => {
    const result = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 1200 } })
    noDepletion(result)

    expect(last(result.floating.food)).toBeCloseTo(400.1852203506393, 6)
    expect(result.gatherRates.food[52]).toBeCloseTo(116.59414409921604, 6)
    expect(last(result.gatherRates.food)).toBeCloseTo(523.6100713570142, 6)
    expect(last(result.floating.wood)).toBeCloseTo(8506.4628655923, 6)
    expect(last(result.floating.gold)).toBeCloseTo(853.1661184210515, 6)
  })

  test('keeps every step timing to within a float ulp', async ({ request }) => {
    const result = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 1200 } })

    expect(result.steps[23].startedAt).toBeCloseTo(508.3666666666666, 9)
    expect(result.steps[23].completedAt).toBeCloseTo(581.0153695878664, 9)
    expect(result.steps[23].waitSeconds).toBeCloseTo(47.35129707880026, 9)
    expect(result.steps[4].completedAt).toBeCloseTo(262.5666666666666, 9)
  })

  test('leaves orders without a farm build exactly as before', async ({ request }) => {
    const villagers = await simulate(request, { text: 'start 6 sheep -> sheep\nproduce villager from capital-town-center x20' })
    noDepletion(villagers)
    expect(villagers.steps[0]).toMatchObject({ completedAt: 400 })
    expect(last(villagers.floating.food)).toBeCloseTo(15780.897488678529, 6)

    const mill = await simulate(
      request,
      order({ villagers: { sheep: 6 }, rally: 'sheep' }, [
        { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 8 },
        { action: 'build', building: 'mill', from: 'sheep', then: 'berry' },
        { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 4 },
      ], { autoHouses: true }),
    )
    expect(mill.steps.map((s) => s.completedAt)).toEqual([0, 25, 100])
    expect(last(mill.floating.food)).toBeCloseTo(7786.373096630632, 6)
  })
})
