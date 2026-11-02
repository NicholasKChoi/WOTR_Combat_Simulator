import { test, expect, type Page } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import type { BuildOrder, SimulationResult } from '../lib/aoe4-build-order/model'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { SIMULATE_PATH } from './helpers'

const PAGE = '/apps/aoe4-build-order'
const TITLE = 'AoE4 Build Order Simulator'
const CHARTS = ['chart-units-produced', 'chart-gather-rates', 'chart-floating-resources'] as const
const RESOURCES = ['food', 'wood', 'gold', 'stone'] as const

const RALLY_PASTE = [
  'start 6 sheep -> sheep',
  'produce villager from capital-town-center x3 -> sheep',
  'at 8 vils rally capital-town-center -> wood',
].join('\n')
const RESEARCH_PASTE = ['start -> sheep', 'research fitted-leatherwork at blacksmith'].join('\n')
const INVALID_PASTE = ['start -> sheep', 'at 8 vils fly capital-town-center'].join('\n')

async function openPage(page: Page) {
  await page.goto(PAGE)
  await page.waitForLoadState('networkidle')
}

async function runSimulation(page: Page) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith(SIMULATE_PATH) && r.request().method() === 'POST'
  )
  await page.getByTestId('run-simulation').click()
  return response
}

async function expectChartsDrawn(page: Page) {
  for (const chart of CHARTS) {
    await expect(page.getByTestId(chart)).toBeVisible()
    await expect(page.getByTestId(chart).locator('path.recharts-line-curve[data-series]').first()).toBeVisible()
  }
}

test.describe('AoE4 build order page', () => {
  test('serves its title and lists every prebuilt build; choosing one loads its text', async ({ page }) => {
    await openPage(page)
    await expect(page).toHaveTitle(TITLE)
    await expect(page.locator('h1')).toHaveText(TITLE)

    const select = page.getByTestId('build-order-select')
    const builds = listBuilds()
    await expect(select.locator('option')).toHaveText(builds.map((b) => b.name))

    const text = page.getByTestId('build-order-text')
    await expect(text).toHaveValue(formatBuildOrderText(builds[0]))
    await text.fill('start -> sheep')
    await expect(select).toHaveValue(builds[0].name)

    const owner = english1tc as unknown as BuildOrder
    await select.selectOption({ label: owner.name })
    await expect(text).toHaveValue(formatBuildOrderText(owner))
  })

  test('runs the default prebuilt build and draws every unit and resource series', async ({ page }) => {
    await openPage(page)
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult

    await expectChartsDrawn(page)
    const units = page.getByTestId('chart-units-produced')
    expect(result.unitsProduced.length).toBeGreaterThan(0)
    for (const { unitId } of result.unitsProduced) {
      await expect(units.locator(`path[data-series="${unitId}"]`)).toHaveCount(1)
    }
    for (const chart of ['chart-gather-rates', 'chart-floating-resources']) {
      for (const kind of RESOURCES) {
        await expect(page.getByTestId(chart).locator(`path[data-series="${kind}"]`)).toHaveCount(1)
      }
    }
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('runs a pasted build with a start line and a rally step', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(RALLY_PASTE)
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    expect(response.request().postDataJSON().text).toBe(RALLY_PASTE)
    await expectChartsDrawn(page)
  })

  test('sends the duration and gets it back', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('duration-seconds').fill('300')
    const response = await runSimulation(page)
    expect(response.request().postDataJSON().inputs.durationSeconds).toBe(300)
    expect(response.status()).toBe(200)
    expect(((await response.json()) as SimulationResult).durationSeconds).toBe(300)
  })

  test('an invalid paste shows the line and token with no chart; a valid run then clears it', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    const bad = await runSimulation(page)
    expect(bad.status()).toBe(400)
    const error = page.getByTestId('simulation-error')
    await expect(error).toBeVisible()
    await expect(error).toContainText('2')
    await expect(error).toContainText('fly')
    for (const chart of CHARTS) {
      await expect(page.getByTestId(chart)).toHaveCount(0)
    }

    await page.getByTestId('build-order-text').fill(RALLY_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(error).toHaveCount(0)
    await expectChartsDrawn(page)
  })

  test('a failed run after a successful one removes the charts', async ({ page }) => {
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)

    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toBeVisible()
    for (const chart of CHARTS) {
      await expect(page.getByTestId(chart)).toHaveCount(0)
    }
  })

  for (const { label, value, sent } of [
    { label: 'an out-of-range duration', value: '59', sent: 59 },
    { label: 'an emptied duration', value: '', sent: 0 },
  ]) {
    test(`${label} shows an error naming durationSeconds`, async ({ page }) => {
      await openPage(page)
      await page.getByTestId('duration-seconds').fill(value)
      const response = await runSimulation(page)
      expect(response.request().postDataJSON().inputs.durationSeconds).toBe(sent)
      expect(response.status()).toBe(400)
      await expect(page.getByTestId('simulation-error')).toContainText('durationSeconds')
    })
  }

  test('a non-JSON failure shows the HTTP status message', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' })
    )
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(500)
    await expect(page.getByTestId('simulation-error')).toHaveText('The simulation could not be run (HTTP 500).')
  })

  for (const { omittedIssues, shown } of [{ omittedIssues: 5, shown: true }, { omittedIssues: undefined, shown: false }]) {
    test(`a 400 ${shown ? 'with' : 'without'} omittedIssues ${shown ? 'ends the list with the omitted count' : 'shows no omitted-count line'}`, async ({ page }) => {
      await page.route(`**${SIMULATE_PATH}`, (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'first problem',
            issues: [
              { code: 'syntax', message: 'first problem' },
              { code: 'syntax', message: 'second problem' },
            ],
            ...(omittedIssues === undefined ? {} : { omittedIssues }),
          }),
        })
      )
      await openPage(page)
      expect((await runSimulation(page)).status()).toBe(400)
      const error = page.getByTestId('simulation-error')
      await expect(error).toContainText('first problem')
      await expect(error).toContainText('second problem')
      if (shown) {
        await expect(error.getByText('5 more issues not shown.')).toHaveCount(1)
        await expect(error.locator('li').last()).toHaveText('5 more issues not shown.')
      } else {
        await expect(error).not.toContainText('more issues not shown')
      }
    })
  }

  test('clicking a legend item hides its series and clicking again restores it', async ({ page }) => {
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)
    const chart = page.getByTestId('chart-gather-rates')
    const food = chart.locator('li.recharts-legend-item', { hasText: 'Food' })

    await food.click()
    await expect(chart.locator('li.recharts-legend-item.inactive')).toHaveCount(1)
    await expect(chart.locator('path[data-series="food"]')).toHaveCount(0)
    await expect(chart.locator('path[data-series="wood"]')).toHaveCount(1)

    await food.click()
    await expect(chart.locator('li.recharts-legend-item.inactive')).toHaveCount(0)
    await expect(chart.locator('path[data-series="food"]')).toHaveCount(1)
    await expect(chart.locator('path[data-series="wood"]')).toHaveCount(1)
  })

  test('a research of a tech with ignored effects shows a note naming it', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(RESEARCH_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(page.getByTestId('simulation-notes')).toContainText('fitted-leatherwork')
  })

  test('a run with no notes shows no notes element', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(RALLY_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)
    await expect(page.getByTestId('simulation-notes')).toHaveCount(0)
  })

  test('the Y-axis label does not overlap 4-digit tick labels at 1280 px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openPage(page)
    await page.getByTestId('build-order-text').fill('start -> sheep')
    await page.getByTestId('duration-seconds').fill('3600')
    expect((await runSimulation(page)).status()).toBe(200)
    await expectChartsDrawn(page)

    const yLabels = { 'chart-units-produced': 'Units', 'chart-gather-rates': 'Per minute', 'chart-floating-resources': 'Resources' }
    for (const chart of CHARTS) {
      const root = page.getByTestId(chart)
      await expect(root.locator('.recharts-label')).toHaveText(yLabels[chart])
      const label = (await root.locator('.recharts-label').boundingBox())!
      const ticks = await root.locator('.recharts-cartesian-axis-tick-value', { hasText: /^\d+$/ }).all()
      if (chart === 'chart-floating-resources') {
        const texts = await Promise.all(ticks.map((t) => t.textContent()))
        expect(texts.some((t) => (t ?? '').length >= 4)).toBe(true)
      }
      expect(ticks.length).toBeGreaterThan(1)
      for (const tick of ticks) {
        const box = (await tick.boundingBox())!
        const disjoint = label.x + label.width <= box.x || box.x + box.width <= label.x
        expect(disjoint || label.y + label.height <= box.y || box.y + box.height <= label.y).toBe(true)
      }
    }
  })
})
