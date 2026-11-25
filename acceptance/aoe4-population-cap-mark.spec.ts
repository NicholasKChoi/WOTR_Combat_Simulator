import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_IDS, WIDE_VIEWPORT, openPage, plotPoint, setDurationInPlace, waitForRun } from './helpers'

const POPULATION = 'chart-population'
const SHORT_RUN_SECONDS = '600'

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: WIDE_VIEWPORT })

const marks = (page: Page, id: string) => page.getByTestId(id).getByTestId('chart-time-mark')
const markLabel = (page: Page) => page.getByTestId(POPULATION).locator('svg text.recharts-label', { hasText: 'Population cap' })

async function setup(page: Page): Promise<SimulationResult> {
  const response = await waitForRun(page, () => openPage(page))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  expect(result.durationSeconds).toBe(1200)
  expect(result.populationCapReachedAt, 'the default build reaches the population cap at 18:15').toBeCloseTo(1095, 0)
  return result
}

async function zoomTo(page: Page, from: number, to: number) {
  const start = await plotPoint(page, POPULATION, from)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  const end = await plotPoint(page, POPULATION, to)
  await page.mouse.move(end.x, end.y, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByTestId(POPULATION)).toHaveAttribute('data-zoom-from', /\d+/)
}

test.describe('AoE4 population cap mark', () => {
  test('the Population chart is the last chart and carries exactly one mark at the API cap time, labelled with its m:ss', async ({ page }) => {
    const result = await setup(page)
    expect(CHART_IDS.at(-1)).toBe(POPULATION)
    await expect(page.getByTestId(POPULATION)).toBeVisible()
    await expect(marks(page, POPULATION)).toHaveCount(1)
    await expect(marks(page, POPULATION)).toHaveAttribute('data-at', String(result.populationCapReachedAt))
    await expect(marks(page, POPULATION)).toHaveAttribute('data-label', 'Population cap')
    await expect(markLabel(page)).toHaveText('Population cap 18:15')
    await expect(marks(page, POPULATION)).toHaveAttribute('stroke', '#a52a2a')
    await expect(marks(page, POPULATION)).toHaveAttribute('stroke-width', '2')
    for (const id of CHART_IDS.filter((chart) => chart !== POPULATION)) await expect(marks(page, id)).toHaveCount(0)
    await expect(page.getByTestId(POPULATION).locator('path[data-series="population"]')).toHaveCount(1)
  })

  test('a run that never reaches the cap draws no mark on any chart, and the mark returns with a longer run', async ({ page }) => {
    await setup(page)
    await waitForRun(page, () => setDurationInPlace(page, SHORT_RUN_SECONDS))
    await expect(page.getByTestId(POPULATION)).toBeVisible()
    for (const id of CHART_IDS) await expect(marks(page, id)).toHaveCount(0)
    await waitForRun(page, () => setDurationInPlace(page, '1200'))
    await expect(marks(page, POPULATION)).toHaveCount(1)
  })

  test('hiding every marker kind, pinning a run and hovering a marker entry leave the mark drawn where it was', async ({ page }) => {
    await setup(page)
    const mark = marks(page, POPULATION)
    const before = await mark.evaluate((el) => el.getBoundingClientRect().left)
    const items = page.getByTestId('chart-marker-legend-item')
    const kinds = await items.evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')))
    expect(kinds.length, 'the build has marker kinds to hide').toBeGreaterThan(1)
    await items.first().hover()
    await expect(mark).toHaveCount(1)
    expect(await mark.evaluate((el) => el.getBoundingClientRect().left)).toBe(before)
    for (const kind of kinds) await page.locator(`[data-testid="chart-marker-legend-item"][data-kind="${kind}"]`).click()
    await expect(page.getByTestId(POPULATION).getByTestId('chart-marker')).toHaveCount(0)
    await expect(mark).toHaveCount(1)
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId(POPULATION).locator('path[data-series="pinned:population"]')).toHaveCount(1)
    await expect(mark).toHaveCount(1)
    await expect(markLabel(page)).toHaveText('Population cap 18:15')
  })

  test('the mark is drawn while its time is inside the zoom window and not once the window ends before it', async ({ page }) => {
    await setup(page)
    await zoomTo(page, 0.8, 0.95)
    await expect(marks(page, POPULATION)).toHaveCount(1)
    await page.getByTestId(POPULATION).getByTestId('chart-zoom-reset').click()
    await expect(page.getByTestId(POPULATION)).not.toHaveAttribute('data-zoom-from', /.*/)
    await expect(marks(page, POPULATION)).toHaveCount(1)
    await zoomTo(page, 0.1, 0.3)
    await expect(marks(page, POPULATION)).toHaveCount(0)
  })

  test('the label stays inside the grid right edge and above the x axis line at 1200, 1280 and 1800 px', async ({ page }) => {
    await setup(page)
    for (const width of [1200, 1280, 1800]) {
      await page.setViewportSize({ width, height: 900 })
      await expect(async () => {
        const box = await page.getByTestId(POPULATION).evaluate((el) => {
          const label = [...el.querySelectorAll('text.recharts-label')].find((text) => text.textContent?.startsWith('Population cap'))!.getBoundingClientRect()
          const grid = el.querySelector('.recharts-cartesian-grid')!.getBoundingClientRect()
          const axis = el.querySelector('.recharts-xAxis .recharts-cartesian-axis-line')!.getBoundingClientRect()
          return { label, grid, axis }
        })
        expect(box.label.right).toBeLessThanOrEqual(box.grid.right)
        expect(box.label.bottom).toBeLessThan(box.axis.top + 1)
      }).toPass()
    }
  })
})
