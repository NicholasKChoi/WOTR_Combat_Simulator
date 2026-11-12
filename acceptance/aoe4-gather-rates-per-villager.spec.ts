import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { CHART_IDS, openPage, plotPoint, showTab, waitForRun } from './helpers'

const CHART = 'chart-gather-rates'
const HOVER_FRACTION = 0.15
// The tooltip rounds to one decimal.
const TOLERANCE = 0.05
const PLAIN_PASTE = 'start 4 sheep 2 wood -> sheep'
const MIXED_NODES_PASTE = 'start 3 sheep 3 berry -> sheep'
const SHEEP_ONLY_PASTE = 'start 6 sheep -> sheep'

async function runOk(page: Page, text: string): Promise<SimulationResult> {
  await showTab(page, 'build')
  const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill(text))
  expect(response.status()).toBe(200)
  return (await response.json()) as SimulationResult
}

const yLabel = (page: Page, chart: string) => page.getByTestId(chart).locator('.recharts-label')
const toggle = (page: Page) => page.getByTestId('gather-rates-per-villager')

async function hoverPlot(page: Page) {
  const point = await plotPoint(page, CHART, HOVER_FRACTION)
  await page.mouse.move(point.x - 3, point.y)
  await page.mouse.move(point.x, point.y)
}

interface Reading {
  label: string
  values: Record<string, number>
}

async function readTooltip(page: Page): Promise<Reading> {
  const tooltip = page.getByTestId(CHART).locator('.recharts-tooltip-wrapper')
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

function samplesAt(result: SimulationResult, label: string): number[] {
  return result.times.flatMap((t, i) => (formatMinSec(t) === label ? [i] : []))
}

function expectOneOf(value: number, expected: number[]) {
  expect(expected.some((e) => Math.abs(e - value) <= TOLERANCE)).toBe(true)
}

const rawFood = (r: SimulationResult, idx: number[]) => idx.map((i) => r.gatherRates.food[i])
const perVillagerFood = (r: SimulationResult, idx: number[]) => idx.map((i) => (r.gatherers.food[i] === 0 ? 0 : r.gatherRates.food[i] / r.gatherers.food[i]))

test.describe('AoE4 Gather rates per-villager toggle', () => {
  test('the checkbox starts unchecked and switches the tooltip food value and y label between raw and per villager', async ({ page }) => {
    await openPage(page)
    const result = await runOk(page, PLAIN_PASTE)
    await showTab(page, 'results')

    await expect(toggle(page)).toBeVisible()
    await expect(toggle(page)).not.toBeChecked()
    await expect(page.getByTestId(CHART).getByText('Per villager', { exact: true })).toBeVisible()
    await expect(yLabel(page, CHART)).toHaveText('Per minute')

    const raw = await hoverRead(page, 'Food')
    const idx = samplesAt(result, raw.label)
    expect(idx.length).toBeGreaterThan(0)
    expectOneOf(raw.values.Food, rawFood(result, idx))

    await toggle(page).check()
    await expect(yLabel(page, CHART)).toHaveText('Per villager per minute')
    for (const id of CHART_IDS.filter((c) => c !== CHART)) {
      await expect(yLabel(page, id)).toHaveText(id === 'chart-units-produced' ? 'Units' : 'Resources')
    }
    let perVillager: Reading | undefined
    await expect(async () => {
      perVillager = await hoverRead(page, 'Food')
      expect(perVillager.label).toBe(raw.label)
      expectOneOf(perVillager.values.Food, perVillagerFood(result, idx))
    }).toPass()
    expect(Math.abs(perVillager!.values.Food - raw.values.Food)).toBeGreaterThan(TOLERANCE)

    await toggle(page).uncheck()
    await expect(yLabel(page, CHART)).toHaveText('Per minute')
    await expect(async () => {
      const again = await hoverRead(page, 'Food')
      expect(again.label).toBe(raw.label)
      expectOneOf(again.values.Food, rawFood(result, idx))
    }).toPass()
  })

  test('with a pin, a hidden legend entry keeps both its lines undrawn across the toggle while another series keeps both', async ({ page }) => {
    await openPage(page)
    await runOk(page, MIXED_NODES_PASTE)
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await runOk(page, SHEEP_ONLY_PASTE)
    await showTab(page, 'results')

    const chart = page.getByTestId(CHART)
    const line = (key: string) => chart.locator(`path[data-series="${key}"]`)
    const hiddenItem = chart.locator('[data-testid="chart-series-legend-item"][data-series="wood"]')
    const expectDrawn = async () => {
      await expect(line('wood')).toHaveCount(0)
      await expect(line('pinned:wood')).toHaveCount(0)
      await expect(line('food')).toHaveCount(1)
      await expect(line('pinned:food')).toHaveCount(1)
    }
    await expect(line('wood')).toHaveCount(1)
    await expect(line('pinned:wood')).toHaveCount(1)
    await hiddenItem.click()
    await expect(hiddenItem).toHaveCSS('opacity', '0.5')
    await expectDrawn()

    await toggle(page).check()
    await expect(yLabel(page, CHART)).toHaveText('Per villager per minute')
    await expect(hiddenItem).toHaveCSS('opacity', '0.5')
    await expectDrawn()
  })
})
