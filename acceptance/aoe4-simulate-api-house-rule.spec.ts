import { test, expect, type APIRequestContext } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import spearLongbow from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import openapi from '../docs/api/openapi.json'
import { buildOrderFrom, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const REMAINING_WARNING_CODES = ['farm-idle', 'idle-arrival', 'node-depleted', 'step-stuck']

test.describe.configure({ timeout: 60_000 })

type Result = { sampleSeconds: number; times: number[]; spawnedPopulation: number[]; spent: { buildings: number[] }; steps: { startedAt: number | null; status: string }[]; warnings: { code: string }[] }

const house = (extra: object = {}) => ({ action: 'build', building: 'house', builders: 1, from: 'sheep', ...extra })
const start = { rally: 'sheep' }
const DURATION = 400

async function simulate(request: APIRequestContext, steps: object[], autoHouses: boolean, durationSeconds = DURATION): Promise<Result> {
  const body = { buildOrder: { civ: 'english', name: 'House rule', start, steps }, inputs: { durationSeconds, autoHouses } }
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const populationAt = (result: Result, t: number) => result.spawnedPopulation[result.times.indexOf(t)]
const finalPopulation = (result: Result) => result.spawnedPopulation[result.spawnedPopulation.length - 1]
const finalBuildingSpend = (result: Result) => result.spent.buildings[result.spent.buildings.length - 1]
const autoHouseCodes = (result: Result) => result.warnings.map((w) => w.code).filter((code) => code.startsWith('auto-houses'))

// First sampled time at which population reaches the value it holds at the end.
function heldSince(result: Result): number {
  return result.times[result.spawnedPopulation.indexOf(finalPopulation(result))]
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('auto-houses plan from the start through the simulate API', () => {
  test('an order with no build house step stops at supply with autoHouses off and keeps growing with it on', async ({ request }) => {
    const off = await simulate(request, [], false)
    const on = await simulate(request, [], true)
    expect(heldSince(off)).toBeLessThan(DURATION - 60)
    expect(finalBuildingSpend(off)).toBe(0)
    expect(finalBuildingSpend(on)).toBeGreaterThan(0)
    expect(finalPopulation(on)).toBeGreaterThan(finalPopulation(off))
  })

  test('a reaction build house step that never fires does not keep auto-houses off', async ({ request }) => {
    const steps = [house({ trigger: { kind: 'depleted', node: 'berry' }, reaction: true })]
    const off = await simulate(request, steps, false)
    const on = await simulate(request, steps, true)
    expect(on.steps[0].startedAt).toBeNull()
    expect(finalPopulation(off)).toBe(populationAt(off, heldSince(off)))
    expect(finalPopulation(on)).toBeGreaterThan(finalPopulation(off))
    expect(autoHouseCodes(on)).toEqual([])
  })

  test('an explicit house started in the second the first auto-house would start leaves no surplus house', async ({ request }) => {
    const none = await simulate(request, [], true)
    const sampledStart = none.times[none.spent.buildings.findIndex((cost) => cost > 0)]
    expect(sampledStart).toBeGreaterThan(none.sampleSeconds)
    const houseCost = none.spent.buildings[none.times.indexOf(sampledStart)]
    // Two houses cover the 400 s of production; a planner that ignores houses under construction buys more.
    expect(finalBuildingSpend(none)).toBe(2 * houseCost)
    // Sampled spend lags the payment by up to one sample, so one of these seconds is the planner's own instant.
    for (let seconds = sampledStart - none.sampleSeconds + 1; seconds <= sampledStart; seconds += 1) {
      const explicit = await simulate(request, [house({ trigger: { kind: 'time', seconds } })], true)
      expect(explicit.steps[0].startedAt).toBe(seconds)
      expect(finalBuildingSpend(explicit), `explicit house at ${seconds}`).toBe(2 * houseCost)
    }
  })

  test('the same order and inputs return identical results', async ({ request }) => {
    const steps = [house({ trigger: { kind: 'time', seconds: 0 } }), house({ trigger: { kind: 'time', seconds: 300 } })]
    expect(await simulate(request, steps, true)).toEqual(await simulate(request, steps, true))
  })
})

test.describe('removed house-gate warnings', () => {
  test('the documented warnings field lists only the four remaining codes', () => {
    const description: string = openapi.components.schemas.SimulationResult.properties.warnings.description
    for (const code of REMAINING_WARNING_CODES) expect(description).toContain(code)
    expect(description).not.toContain('auto-houses')
  })

  for (const [name, build] of [['english-1tc', english1tc], ['english-knight-longbow', knightLongbow], ['english-spear-longbow-maa-crossbow', spearLongbow]] as const) {
    test(`${name} returns only remaining warning codes and no step waits at 1800 s with auto-houses on`, async ({ request }) => {
      const response = await postSimulate(request, { buildOrder: build, inputs: { durationSeconds: 1800, autoHouses: true } })
      expect(response.status(), await response.text()).toBe(200)
      const result: Result = await response.json()
      expect(result.warnings.map((w) => w.code).filter((code) => !REMAINING_WARNING_CODES.includes(code))).toEqual([])
      expect(result.steps.filter((s) => s.status === 'waiting')).toEqual([])
    })
  }
})
