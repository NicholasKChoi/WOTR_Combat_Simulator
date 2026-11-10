import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, type APIRequestContext } from '@playwright/test'
import Ajv2020 from 'ajv/dist/2020'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_IDS, INFINITE_NODES, buildOrderFrom, openPage, postSimulate, runSimulation, showTab } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const RESOURCE_KINDS = ['food', 'wood', 'gold', 'stone'] as const
const PAUSE = { action: 'pause', producer: 'capital-town-center' }
const BERRY_STOCK = 601

test.describe.configure({ timeout: 60_000 })

const spec = JSON.parse(readFileSync(join(__dirname, '../docs/api/openapi.json'), 'utf8'))

function order(start: { villagers: Record<string, number>; rally: string }, inputs: object = {}) {
  return { buildOrder: { civ: 'english', name: 'Gathered', start, steps: [PAUSE] }, inputs: { autoHouses: false, ...inputs } }
}

async function simulate(request: APIRequestContext, body: unknown): Promise<SimulationResult> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('gathered in the simulate response', () => {
  test('excludes starting resources and grows by the gather rate over each sample interval', async ({ request }) => {
    const result = await simulate(request, order({ villagers: { sheep: 2, wood: 4 }, rally: 'wood' }, { nodeAmounts: INFINITE_NODES, durationSeconds: 300 }))

    expect(result.floating.food[0]).toBeGreaterThan(0)
    for (const kind of RESOURCE_KINDS) {
      expect(result.gathered[kind][0], kind).toBe(0)
      for (let i = 0; i + 1 < result.times.length; i++) {
        const expected = (result.gatherRates[kind][i] / 60) * (result.times[i + 1] - result.times[i])
        expect(result.gathered[kind][i + 1] - result.gathered[kind][i], `${kind}[${i}]`).toBeCloseTo(expected, 5)
      }
    }
    expect(result.gathered.food.at(-1)).toBeGreaterThan(0)
    expect(result.gathered.wood.at(-1)).toBeGreaterThan(0)
    expect(result.gathered.gold.at(-1)).toBe(0)
    expect(result.gathered.stone.at(-1)).toBe(0)
  })

  test('counts exactly the stock of a node that runs out, and stops growing afterwards', async ({ request }) => {
    const result = await simulate(request, order({ villagers: { berry: 3, wood: 3 }, rally: 'wood' }, { nodeAmounts: { berry: BERRY_STOCK }, durationSeconds: 600 }))

    const berry = result.depletions.find((d) => d.node === 'berry')!
    expect(berry.depletedAt).not.toBeNull()
    const after = result.times.findIndex((t) => t > berry.depletedAt!)
    expect(after).toBeGreaterThan(0)
    expect(result.gathered.food[after]).toBeCloseTo(BERRY_STOCK, 5)
    expect(result.gathered.food.at(-1)).toBeCloseTo(BERRY_STOCK, 5)
  })
})

test.describe('gathered in the OpenAPI document', () => {
  const ajv = new Ajv2020({ strict: false })
  ajv.addSchema({ $id: 'doc', components: spec.components })
  const validate = ajv.compile({ $ref: 'doc#/components/schemas/SimulationResult' })

  test('is a documented required property of the closed SimulationResult at version 2.4.0', () => {
    const schema = spec.components.schemas.SimulationResult
    expect(spec.info.version).toBe('2.4.0')
    expect(schema.required).toContain('gathered')
    expect(Object.keys(schema.properties.gathered.properties).sort()).toEqual([...RESOURCE_KINDS].sort())
    expect(schema.properties.gathered.additionalProperties).toBe(false)
  })

  test('a real response validates, and one without gathered, with a negative entry or an extra kind does not', async ({ request }) => {
    const body = await simulate(request, order({ villagers: { sheep: 2, wood: 4 }, rally: 'wood' }))
    expect(validate(body), JSON.stringify(validate.errors)).toBe(true)

    const { gathered, ...without } = body
    expect(gathered.food.length).toBeGreaterThan(0)
    expect(validate(without)).toBe(false)

    const negative = structuredClone(body)
    negative.gathered.wood[1] = -1
    expect(validate(negative)).toBe(false)

    const extra = structuredClone(body) as unknown as { gathered: Record<string, number[]> }
    extra.gathered.faith = [0]
    expect(validate(extra)).toBe(false)
  })
})

test.describe('Gathered resources chart', () => {
  test('is the third chart after a run, and its pinned overlay plots the pinned run, not the current one', async ({ page }) => {
    await openPage(page)
    await runSimulation(page)
    await showTab(page, 'results')

    const ids = await page.locator(CHART_IDS.map((id) => `[data-testid="${id}"]`).join(', ')).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
    expect(ids).toEqual(CHART_IDS)

    const chart = page.getByTestId('chart-gathered-resources')
    await expect(chart.locator('text.recharts-label[transform^="rotate(-90"]')).toHaveText('Resources')
    await expect(chart.getByText('Gathered resources')).toBeVisible()

    await page.getByTestId('pin-run').click()
    await page.getByTestId('duration-seconds').fill('300')
    const second = await runSimulation(page)
    expect(second.status()).toBe(200)

    const food = chart.locator('path[data-series="food"]')
    const pinnedFood = chart.locator('path[data-series="pinned:food"]')
    await expect(food).toHaveCount(1)
    await expect(pinnedFood).toHaveCount(1)
    expect(await pinnedFood.getAttribute('d')).not.toBe(await food.getAttribute('d'))
    expect(((await pinnedFood.getAttribute('stroke-dasharray')) ?? '').trim()).not.toBe('')
    expect(await food.getAttribute('stroke-dasharray')).toBeNull()
  })
})
