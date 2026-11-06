import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import rules from '../data/aoe4-build-order/rules/english.json'
import snapshot from '../data/aoe4-build-order/aoe4world/english.json'
import { buildOrderFrom, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const CATEGORIES = ['villagers', 'military', 'buildings', 'research'] as const
const RESOURCE_KINDS = ['food', 'wood', 'gold', 'stone'] as const

test.describe.configure({ timeout: 60_000 })

type Series = { baseId: string; counts: number[] }
type Step = { startedAt: number | null }
type Body = {
  times: number[]
  spent: Record<(typeof CATEGORIES)[number], number[]>
  gathered: Record<(typeof RESOURCE_KINDS)[number], number[]>
  spawnedPopulation: number[]
  populationCapReachedAt: number | null
  unitsProduced: Series[]
  steps: Step[]
}

const SNAPSHOT_ENTRIES: { baseId: string; costs: { food: number; wood: number; gold: number; stone: number; popcap: number } }[] = [
  ...snapshot.units,
  ...snapshot.buildings,
  ...snapshot.technologies,
  ...snapshot.upgrades,
]

function costOf(baseId: string): number {
  const { costs } = SNAPSHOT_ENTRIES.find((e) => e.baseId === baseId)!
  return costs.food + costs.wood + costs.gold + costs.stone
}

function popcapOf(baseId: string): number {
  return SNAPSHOT_ENTRIES.find((e) => e.baseId === baseId)!.costs.popcap
}

async function simulate(request: Parameters<typeof postSimulate>[0], body: unknown): Promise<Body> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const last = <T,>(series: T[]) => series[series.length - 1]

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('spent on the prebuilt English build', () => {
  test('has the four categories, aligned to times, never decreasing, and zero at t=0 for buildings, research and military', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    expect(Object.keys(body.spent).sort()).toEqual([...CATEGORIES].sort())
    for (const category of CATEGORIES) {
      const series = body.spent[category]
      expect(series, category).toHaveLength(body.times.length)
      series.forEach((value, i) => expect(value, `${category}[${i}]`).toBeGreaterThanOrEqual(series[i - 1] ?? 0))
    }
    expect(body.spent.research[0]).toBe(0)
    expect(body.spent.military[0]).toBe(0)
    expect(body.spent.buildings[0]).toBe(0)
  })

  test('counts a payment made at exactly a sample time in that sample and a paid, unspawned villager only in spent', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    const at = (t: number) => body.times.indexOf(t)
    // Step 1 (a house) is paid at exactly 25 s.
    expect(body.steps[1].startedAt).toBe(25)
    expect(body.spent.buildings[at(20)]).toBe(0)
    expect(body.spent.buildings[at(25)]).toBe(costOf('house'))
    // The first villager is paid at 0 s and spawns at 20 s: paid immediately, unspawned until the 20 s sample.
    expect(body.spent.villagers[at(0)]).toBe(costOf('villager'))
    expect(body.spawnedPopulation[at(15)]).toBe(body.spawnedPopulation[0])
    expect(body.spawnedPopulation[at(20)]).toBe(body.spawnedPopulation[0] + popcapOf('villager'))
  })
})

test.describe('gathered on the prebuilt English build', () => {
  test('has the four resource kinds, aligned to times, starting at 0 and never decreasing', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    expect(Object.keys(body.gathered).sort()).toEqual([...RESOURCE_KINDS].sort())
    for (const kind of RESOURCE_KINDS) {
      const series = body.gathered[kind]
      expect(series, kind).toHaveLength(body.times.length)
      expect(series[0], kind).toBe(0)
      series.forEach((value, i) => expect(value, `${kind}[${i}]`).toBeGreaterThanOrEqual(series[i - 1] ?? 0))
    }
  })
})

test.describe('spawnedPopulation and populationCapReachedAt', () => {
  test('starts at the start villagers plus the start units popcap, never decreases, and ends at that plus every spawned unit', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    const startVillagers = Object.values(rules.startingState.villagers.value).reduce((a, b) => a + b, 0)
    const startUnits = Object.entries(rules.startingState.units.value).reduce((sum, [baseId, n]) => sum + n * popcapOf(baseId), 0)
    expect(body.spawnedPopulation).toHaveLength(body.times.length)
    expect(body.spawnedPopulation[0]).toBe(startVillagers + startUnits)
    body.spawnedPopulation.forEach((value, i) => expect(value).toBeGreaterThanOrEqual(body.spawnedPopulation[i - 1] ?? 0))
    const spawned = body.unitsProduced.reduce((sum, s) => sum + (s.counts.at(-1) ?? 0) * popcapOf(s.baseId), 0)
    expect(last(body.spawnedPopulation)).toBe(body.spawnedPopulation[0] + spawned)
  })

  test('is null while the population cap is never reached', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 1000 } })
    expect(Math.max(...body.spawnedPopulation)).toBeLessThan(200)
    expect(body.populationCapReachedAt).toBeNull()
  })

  test('is the spawn instant of the 200th population, between samples, and stays set as the horizon grows', async ({ request }) => {
    const long = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 1800 } })
    const reached = long.populationCapReachedAt!
    expect(reached).toBeGreaterThan(0)
    expect(reached % 5).not.toBe(0)
    const first = long.spawnedPopulation.findIndex((p) => p >= 200)
    expect(long.times[first - 1]).toBeLessThan(reached)
    expect(long.times[first]).toBeGreaterThanOrEqual(reached)
    expect(long.spawnedPopulation[first - 1]).toBeLessThan(200)
    expect(last(long.spawnedPopulation)).toBe(200)

    const longer = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: 3600 } })
    expect(longer.populationCapReachedAt).toBe(reached)

    const short = await simulate(request, { buildOrder: english1tc, inputs: { durationSeconds: Math.floor(reached / 5) * 5 } })
    expect(short.populationCapReachedAt).toBeNull()
  })
})
