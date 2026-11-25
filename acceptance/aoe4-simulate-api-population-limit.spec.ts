import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { buildOrderFrom, postSimulate, type Timing } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

type Body = {
  times: number[]
  spent: { buildings: number[] }
  spawnedPopulation: number[]
  populationCapReachedAt: number | null
  unitsProduced: { baseId: string; counts: number[] }[]
  steps: Timing[]
}

const LATE_PRODUCE_AT = 1500
const LATE_SPEARMEN = 3

const withoutVillagerStep = { ...english1tc, steps: english1tc.steps.slice(1) }
const withLateSpearmen = {
  ...english1tc,
  steps: [
    ...english1tc.steps,
    { trigger: { kind: 'time', seconds: LATE_PRODUCE_AT }, action: 'produce', producer: 'barracks', unit: 'spearman', count: LATE_SPEARMEN },
  ],
}

async function simulate(request: Parameters<typeof postSimulate>[0], buildOrder: unknown, durationSeconds: number): Promise<Body> {
  const response = await postSimulate(request, { buildOrder, inputs: { durationSeconds } })
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const last = <T,>(series: T[]) => series[series.length - 1]
const villagersAt = (body: Body, t: number) => body.unitsProduced.find((s) => s.baseId === 'villager')!.counts[body.times.indexOf(t)]

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('production past the population cap through the simulate API', () => {
  test('keeps growing the spawned population after the cap, sample after sample, as the horizon grows', async ({ request }) => {
    const short = await simulate(request, english1tc, 1800)
    const long = await simulate(request, english1tc, 3600)
    expect(last(short.spawnedPopulation)).toBeGreaterThan(200)
    expect(last(long.spawnedPopulation)).toBeGreaterThan(last(short.spawnedPopulation))
    const everyFiveMinutes = [1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600].map((t) => long.spawnedPopulation[long.times.indexOf(t)])
    expect(everyFiveMinutes[0]).toBeGreaterThan(200)
    everyFiveMinutes.forEach((value, i) => expect(value, `${1200 + 300 * i} s`).toBeGreaterThan(everyFiveMinutes[i - 1] ?? 200))
  })

  test('plans and pays no house after the cap although the population keeps growing', async ({ request }) => {
    const body = await simulate(request, english1tc, 3600)
    const atCap = body.times.findIndex((t) => t >= body.populationCapReachedAt!)
    expect(body.spent.buildings[atCap], 'houses and other buildings were paid before the cap').toBeGreaterThan(body.spent.buildings[0])
    expect(last(body.spawnedPopulation), 'the population grows after the cap').toBeGreaterThan(body.spawnedPopulation[atCap] + 100)
    expect(last(body.spent.buildings)).toBe(body.spent.buildings[atCap])
  })

  test('starts a produce step armed after the cap and waits on population in no step', async ({ request }) => {
    const body = await simulate(request, withLateSpearmen, 3600)
    const capInstant = body.populationCapReachedAt!
    const late = body.steps[body.steps.length - 1]
    expect(late.armedAt, 'the step is armed after the cap instant').toBeGreaterThanOrEqual(LATE_PRODUCE_AT)
    expect(capInstant).toBeLessThan(late.armedAt!)
    for (const step of body.steps) {
      const allowed = Math.max(0, capInstant - (step.armedAt ?? Infinity))
      expect.soft(step.waitBreakdown.population ?? 0, `step ${step.step} population wait`).toBeLessThanOrEqual(allowed + 1e-9)
      expect.soft(step.waitingOn, `step ${step.step} at the horizon`).not.toBe('population')
    }
    expect(late.startedAt).not.toBeNull()
  })

  test('stops the default villager order at the villager target after the cap while a produce villager step goes on past it', async ({ request }) => {
    const byDefault = await simulate(request, withoutVillagerStep, 3600)
    const byStep = await simulate(request, english1tc, 3600)
    expect(byDefault.populationCapReachedAt!).toBeLessThan(1800)
    expect(byStep.populationCapReachedAt!).toBeLessThan(1800)
    // The order is still hiring after the cap and has stopped well before the horizon.
    expect(villagersAt(byDefault, 1800)).toBeGreaterThan(villagersAt(byDefault, 1100))
    expect(villagersAt(byDefault, 3600)).toBeGreaterThan(villagersAt(byDefault, 1800))
    expect(villagersAt(byDefault, 3600)).toBe(villagersAt(byDefault, 3000))
    expect(villagersAt(byStep, 3600)).toBeGreaterThan(villagersAt(byDefault, 3600))
    expect(villagersAt(byStep, 3600)).toBeGreaterThan(villagersAt(byStep, 3000))
  })
})
