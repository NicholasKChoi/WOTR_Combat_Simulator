import { test, expect, type APIRequestContext } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import snapshot from '../data/aoe4-build-order/aoe4world/english.json'
import type { BuildingSeries, SimulationResult } from '../lib/aoe4-build-order/model'
import { WARM_UP_TIMEOUT_MS, buildOrderFrom, postSimulate } from './helpers'

test.describe.configure({ timeout: 60_000 })

const START = 'start 6 sheep -> sheep'
const lines = (...steps: string[]) => [START, ...steps].join('\n')

// From the shipped snapshot, independent of the simulator: building baseIds a unit lists in producedBy.
const BUILDING_NAMES = new Map<string, string>()
for (const building of [...snapshot.buildings].sort((a, b) => a.age - b.age)) {
  if (!BUILDING_NAMES.has(building.baseId)) BUILDING_NAMES.set(building.baseId, building.name)
}
const PRODUCTION_IDS = new Set(snapshot.units.flatMap((unit) => unit.producedBy).filter((baseId) => BUILDING_NAMES.has(baseId)))

async function simulate(request: APIRequestContext, buildOrder: unknown, inputs: Record<string, unknown>): Promise<SimulationResult> {
  const response = await postSimulate(request, { buildOrder, inputs })
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const run = (request: APIRequestContext, text: string, inputs: Record<string, unknown>) => simulate(request, buildOrderFrom(text), inputs)

const countsOf = (result: SimulationResult, baseId: string) => result.productionBuildings.find((s) => s.baseId === baseId)?.counts

function expectOrdered(series: BuildingSeries[]) {
  const key = (s: BuildingSeries) => [s.counts.findIndex((n) => n > 0), s.baseId] as const
  for (let i = 1; i < series.length; i++) {
    const [a, b] = [key(series[i - 1]), key(series[i])]
    expect(a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]), `${series[i - 1].baseId} before ${series[i].baseId}`).toBe(true)
  }
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom(START) }, WARM_UP_TIMEOUT_MS)
})

test.describe('productionBuildings in the simulate response', () => {
  test('on the prebuilt English order: capital-town-center first at 1 at t=0, one count per sample through a duration off the sample grid', async ({ request }) => {
    const result = await simulate(request, english1tc, { durationSeconds: 1203 })
    expect(1203 % result.sampleSeconds).not.toBe(0)
    expect(result.times.at(-1)).toBe(1203)
    expect(result.productionBuildings.length).toBeGreaterThan(1)
    expect(result.productionBuildings[0]).toMatchObject({ baseId: 'capital-town-center', name: 'Capital Town Center' })
    expect(result.productionBuildings[0].counts[0]).toBe(1)
    for (const series of result.productionBuildings) expect(series.counts, series.baseId).toHaveLength(result.times.length)
  })

  test('a barracks is 0 from the sample its construction starts and 1 from the sample at its completion on', async ({ request }) => {
    const result = await run(request, lines('@1:00 build barracks with 1 from sheep'), { durationSeconds: 302, walkSeconds: 0 })
    const [step] = result.steps
    expect(step).toMatchObject({ status: 'completed', startedAt: 60, completedAt: 90 })
    expect(result.times).toContain(60)
    expect(result.times).toContain(90)
    expect(countsOf(result, 'barracks')).toEqual(result.times.map((t) => (t >= 90 ? 1 : 0)))
  })

  test('the starting capital-town-center and a built town-center are two series with their own names', async ({ request }) => {
    const result = await run(
      request,
      lines('produce villager from capital-town-center x6', 'rally capital-town-center -> stone', 'move 3 sheep to wood', 'build town-center with 6 from stone'),
      { durationSeconds: 1200 },
    )
    const built = result.steps[3]
    expect(built.status).toBe('completed')
    expect(result.productionBuildings.map((s) => [s.baseId, s.name])).toEqual([
      ['capital-town-center', 'Capital Town Center'],
      ['town-center', 'Town Center'],
    ])
    expect(countsOf(result, 'capital-town-center')!.every((n) => n === 1)).toBe(true)
    expect(countsOf(result, 'town-center')).toEqual(result.times.map((t) => (t >= built.completedAt! ? 1 : 0)))
  })

  test('two buildings first completed at the same sample are ordered by baseId, whatever the step order', async ({ request }) => {
    const result = await run(
      request,
      lines('move 4 sheep to wood', '@2:00 build dock with 1 from sheep', '@2:00 build barracks with 1 from sheep'),
      { durationSeconds: 302, walkSeconds: 0 },
    )
    expect(result.steps[1].completedAt).toBe(150)
    expect(result.steps[2].completedAt).toBe(150)
    expect(result.productionBuildings.map((s) => s.baseId)).toEqual(['capital-town-center', 'barracks', 'dock'])
  })

  test('a production building still under construction, or never started, at the horizon has no series', async ({ request }) => {
    const result = await run(request, lines('@0:40 build barracks with 1 from sheep', 'build stable with 1 from sheep'), { durationSeconds: 60, walkSeconds: 0 })
    expect(result.steps.map((s) => s.status)).toEqual(['in-progress', 'waiting'])
    expect(result.productionBuildings.map((s) => s.baseId)).toEqual(['capital-town-center'])
  })

  test('a completed house is not a production building', async ({ request }) => {
    const result = await run(request, lines('build house with 1 from sheep'), { durationSeconds: 120, walkSeconds: 0, autoHouses: false })
    expect(result.steps[0].status).toBe('completed')
    expect(PRODUCTION_IDS.has('house')).toBe(false)
    expect(result.productionBuildings.map((s) => s.baseId)).toEqual(['capital-town-center'])
  })

  test('on the prebuilt English order every series is a data-defined production building, named by its building entry, in order', async ({ request }) => {
    const result = await simulate(request, english1tc, { durationSeconds: 1200 })
    expect(result.productionBuildings.length).toBeGreaterThan(1)
    for (const series of result.productionBuildings) {
      expect(PRODUCTION_IDS.has(series.baseId), series.baseId).toBe(true)
      expect(series.name).toBe(BUILDING_NAMES.get(series.baseId))
      expect(series.counts.some((n) => n > 0), series.baseId).toBe(true)
    }
    expectOrdered(result.productionBuildings)
  })

  test('two runs of the same order and inputs return deeply equal productionBuildings', async ({ request }) => {
    const [a, b] = await Promise.all([simulate(request, english1tc, { durationSeconds: 1200 }), simulate(request, english1tc, { durationSeconds: 1200 })])
    expect(a.productionBuildings.length).toBeGreaterThan(1)
    expect(a.productionBuildings).toEqual(b.productionBuildings)
  })
})
