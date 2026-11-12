import { test, expect, type Locator, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { CHART_IDS, acceptBeforeUnload, openPage, plotPoint, showTab, waitForRun } from './helpers'

const RATES = 'chart-gather-rates'
const UNITS = 'chart-units-produced'
const HOVER_FRACTION = 0.15
// The tooltip rounds to one decimal.
const TOLERANCE = 0.05
const PLAIN_PASTE = 'start 4 sheep 2 wood -> sheep'
const MIXED_NODES_PASTE = 'start 3 sheep 3 berry -> sheep'
const SHEEP_ONLY_PASTE = 'start 6 sheep -> sheep'
const BARRACKS_PASTE = ['start 6 sheep -> sheep', '@1:00 build barracks with 1 from sheep'].join('\n')
const DEFAULT_Y_LABELS: Record<string, string> = {
  [UNITS]: 'Count',
  [RATES]: 'Per minute',
  'chart-gathered-resources': 'Resources',
  'chart-floating-resources': 'Resources',
}

async function runOk(page: Page, text: string): Promise<SimulationResult> {
  await showTab(page, 'build')
  const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill(text))
  expect(response.status()).toBe(200)
  return (await response.json()) as SimulationResult
}

const chart = (page: Page, id: string) => page.getByTestId(id)
const yLabel = (page: Page, id: string) => chart(page, id).locator('text.recharts-label[transform^="rotate(-90"]')
const option = (page: Page, id: string, view: string) => chart(page, id).locator(`[data-testid="chart-view-option"][data-view="${view}"]`)
const legendNames = (page: Page, id: string) => chart(page, id).getByTestId('chart-series-legend-item').allTextContents()
const line = (page: Page, id: string, key: string) => chart(page, id).locator(`path[data-series="${key}"]`)

async function expectPressed(page: Page, id: string, view: string, other: string) {
  await expect(option(page, id, view)).toHaveAttribute('aria-pressed', 'true')
  await expect(option(page, id, other)).toHaveAttribute('aria-pressed', 'false')
}

async function expectOtherLabelsUnchanged(page: Page, changed: string) {
  for (const id of CHART_IDS.filter((c) => c !== changed)) await expect(yLabel(page, id)).toHaveText(DEFAULT_Y_LABELS[id])
}

async function hoverPlot(page: Page) {
  const point = await plotPoint(page, RATES, HOVER_FRACTION)
  await page.mouse.move(point.x - 3, point.y)
  await page.mouse.move(point.x, point.y)
}

interface Reading {
  label: string
  values: Record<string, number>
}

async function readTooltip(page: Page): Promise<Reading> {
  const tooltip = chart(page, RATES).locator('.recharts-tooltip-wrapper')
  await expect(tooltip).toBeVisible()
  return await tooltip.evaluate((el) => {
    const values: Record<string, number> = {}
    el.querySelectorAll('.recharts-tooltip-item').forEach((item) => {
      const name = item.querySelector('.recharts-tooltip-item-name')?.textContent ?? ''
      values[name] = Number(item.querySelector('.recharts-tooltip-item-value')?.textContent)
    })
    return { label: el.querySelector('.recharts-tooltip-label')?.textContent ?? '', values }
  })
}

// Hovers the same point and returns the readings once they are stable and include `name`.
async function hoverRead(page: Page, name: string): Promise<Reading> {
  let reading: Reading | undefined
  await expect(async () => {
    await hoverPlot(page)
    reading = await readTooltip(page)
    expect(Number.isFinite(reading.values[name])).toBe(true)
  }).toPass()
  return reading!
}

const samplesAt = (result: SimulationResult, label: string) => result.times.flatMap((t, i) => (formatMinSec(t) === label ? [i] : []))

function expectOneOf(value: number, expected: number[]) {
  expect(expected.some((e) => Math.abs(e - value) <= TOLERANCE)).toBe(true)
}

const drawn = (path: Locator) => path.getAttribute('d')

test.describe('AoE4 chart view toggles', () => {
  test('Gather rates starts as Rate; Villagers shows the gatherers at the hovered sample and Rate restores the rates', async ({ page }) => {
    await openPage(page)
    const result = await runOk(page, PLAIN_PASTE)
    await showTab(page, 'results')

    await expectPressed(page, RATES, 'rate', 'villagers')
    await expect(yLabel(page, RATES)).toHaveText('Per minute')
    const rate = await hoverRead(page, 'Food')
    const idx = samplesAt(result, rate.label)
    expect(idx.length).toBeGreaterThan(0)
    expectOneOf(rate.values.Food, idx.map((i) => result.gatherRates.food[i]))
    for (const i of idx) expect(Math.abs(result.gatherers.food[i] - result.gatherRates.food[i])).toBeGreaterThan(TOLERANCE)

    await option(page, RATES, 'villagers').click()
    await expectPressed(page, RATES, 'villagers', 'rate')
    await expect(yLabel(page, RATES)).toHaveText('Villagers')
    await expectOtherLabelsUnchanged(page, RATES)
    await expect(async () => {
      const villagers = await hoverRead(page, 'Food')
      expect(villagers.label).toBe(rate.label)
      expectOneOf(villagers.values.Food, idx.map((i) => result.gatherers.food[i]))
    }).toPass()

    await option(page, RATES, 'villagers').click()
    await expectPressed(page, RATES, 'villagers', 'rate')
    await expect(yLabel(page, RATES)).toHaveText('Villagers')

    await option(page, RATES, 'rate').click()
    await expectPressed(page, RATES, 'rate', 'villagers')
    await expect(yLabel(page, RATES)).toHaveText('Per minute')
    await expect(async () => {
      const again = await hoverRead(page, 'Food')
      expect(again.label).toBe(rate.label)
      expectOneOf(again.values.Food, idx.map((i) => result.gatherRates.food[i]))
    }).toPass()
  })

  test('Units produced starts as Units; Buildings shows the production buildings and Units restores the original', async ({ page }) => {
    await openPage(page)
    const result = await runOk(page, BARRACKS_PASTE)
    await showTab(page, 'results')
    expect(result.productionBuildings.length).toBeGreaterThan(0)
    const buildingNames = result.productionBuildings.map((b) => b.name)

    await expectPressed(page, UNITS, 'units', 'buildings')
    await expect(yLabel(page, UNITS)).toHaveText('Count')
    const unitNames = await legendNames(page, UNITS)
    expect(unitNames).not.toEqual(buildingNames)

    await option(page, UNITS, 'buildings').click()
    await expectPressed(page, UNITS, 'buildings', 'units')
    await expect(yLabel(page, UNITS)).toHaveText('Buildings')
    await expectOtherLabelsUnchanged(page, UNITS)
    expect(await legendNames(page, UNITS)).toEqual(buildingNames)
    await expect(chart(page, UNITS).locator('path[data-series]')).toHaveCount(buildingNames.length)

    await option(page, UNITS, 'units').click()
    await expectPressed(page, UNITS, 'units', 'buildings')
    await expect(yLabel(page, UNITS)).toHaveText('Count')
    expect(await legendNames(page, UNITS)).toEqual(unitNames)
  })

  test('a toggle works while its chart is collapsed and the new view is shown on expand', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    const body = chart(page, RATES).getByTestId('chart-body')
    await chart(page, RATES).getByTestId('chart-collapse').click()
    await expect(body).toBeHidden()
    await expect(option(page, RATES, 'villagers')).toBeVisible()

    await option(page, RATES, 'villagers').click()
    await expectPressed(page, RATES, 'villagers', 'rate')
    await expect(body).toBeHidden()

    await chart(page, RATES).getByTestId('chart-collapse').click()
    await expect(body).toBeVisible()
    await expect(yLabel(page, RATES)).toHaveText('Villagers')
  })

  test('a reload resets both charts to Rate and Units', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await option(page, RATES, 'villagers').click()
    await option(page, UNITS, 'buildings').click()
    await expectPressed(page, RATES, 'villagers', 'rate')
    await expectPressed(page, UNITS, 'buildings', 'units')

    acceptBeforeUnload(page)
    await openPage(page)
    await showTab(page, 'results')
    await expectPressed(page, RATES, 'rate', 'villagers')
    await expectPressed(page, UNITS, 'units', 'buildings')
    await expect(yLabel(page, RATES)).toHaveText('Per minute')
    await expect(yLabel(page, UNITS)).toHaveText('Count')
  })

  test('Enter and Space on a focused option select it', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await option(page, RATES, 'villagers').focus()
    await page.keyboard.press('Enter')
    await expectPressed(page, RATES, 'villagers', 'rate')
    await option(page, RATES, 'rate').focus()
    await page.keyboard.press('Space')
    await expectPressed(page, RATES, 'rate', 'villagers')
  })

  test('with a pin, Villagers draws the pinned line from the pinned run and a hidden series stays hidden across the switch', async ({ page }) => {
    await openPage(page)
    const first = await runOk(page, PLAIN_PASTE)
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    const second = await runOk(page, SHEEP_ONLY_PASTE)
    await showTab(page, 'results')
    expect(first.gatherers.food.some((n, i) => n !== second.gatherers.food[i])).toBe(true)

    await expect(line(page, RATES, 'food')).toHaveCount(1)
    await expect(line(page, RATES, 'pinned:food')).toHaveCount(1)
    const ratePaths = [await drawn(line(page, RATES, 'food')), await drawn(line(page, RATES, 'pinned:food'))]

    await option(page, RATES, 'villagers').click()
    await expect(yLabel(page, RATES)).toHaveText('Villagers')
    await expect(line(page, RATES, 'food')).toHaveCount(1)
    await expect(line(page, RATES, 'pinned:food')).toHaveCount(1)
    const current = await drawn(line(page, RATES, 'food'))
    const pinned = await drawn(line(page, RATES, 'pinned:food'))
    expect(current).not.toEqual(pinned)
    expect(current).not.toEqual(ratePaths[0])
    expect(pinned).not.toEqual(ratePaths[1])

    const woodItem = chart(page, RATES).locator('[data-testid="chart-series-legend-item"][data-series="wood"]')
    await woodItem.click()
    await expect(woodItem).toHaveAttribute('aria-pressed', 'true')
    for (const view of ['rate', 'villagers', 'rate']) {
      await option(page, RATES, view).click()
      await expectPressed(page, RATES, view, view === 'rate' ? 'villagers' : 'rate')
      await expect(woodItem).toHaveAttribute('aria-pressed', 'true')
      await expect(line(page, RATES, 'wood')).toHaveCount(0)
      await expect(line(page, RATES, 'pinned:wood')).toHaveCount(0)
      await expect(line(page, RATES, 'food')).toHaveCount(1)
    }
  })

  test('with a pin, Buildings draws a dashed line only for a building the current run lacks and both lines for a shared one', async ({ page }) => {
    await openPage(page)
    const first = await runOk(page, BARRACKS_PASTE)
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    const second = await runOk(page, SHEEP_ONLY_PASTE)
    await showTab(page, 'results')
    const ids = (r: SimulationResult) => r.productionBuildings.map((b) => b.baseId)
    expect(ids(first)).toContain('barracks')
    expect(ids(second)).not.toContain('barracks')
    const shared = ids(first).find((id) => ids(second).includes(id))!
    expect(shared).toBeDefined()

    await option(page, UNITS, 'buildings').click()
    await expect(yLabel(page, UNITS)).toHaveText('Buildings')
    await expect(line(page, UNITS, 'pinned:barracks')).toHaveCount(1)
    await expect(line(page, UNITS, 'barracks')).toHaveCount(0)
    await expect(line(page, UNITS, shared)).toHaveCount(1)
    await expect(line(page, UNITS, `pinned:${shared}`)).toHaveCount(1)
  })
})
