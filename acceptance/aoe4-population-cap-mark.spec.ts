import { test, expect, type Page } from '@playwright/test'
import { estimateLabelWidth, timeMarkLabel } from '../components/apps/aoe4-build-order/chart-markers'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { CHART_MARKER_KINDS, type SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_IDS, WIDE_VIEWPORT, bodyDuration, openPage, plotPoint, setDurationInPlace, waitForRun } from './helpers'

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

const POSITION_TOLERANCE_PX = 1.5

interface MarkLayout {
  count: number
  at: number
  line: number
  label: { left: number; right: number }
  grid: { left: number; right: number; width: number }
}

const readMark = (page: Page): Promise<MarkLayout> =>
  page.getByTestId(POPULATION).evaluate((el) => {
    const lines = el.querySelectorAll('[data-testid="chart-time-mark"]')
    const label = [...el.querySelectorAll('text.recharts-label')].find((text) => text.textContent?.startsWith('Population cap'))
    const grid = el.querySelector('.recharts-cartesian-grid')!.getBoundingClientRect()
    const labelBox = label?.getBoundingClientRect()
    return {
      count: lines.length,
      at: Number(lines[0]?.getAttribute('data-at')),
      line: lines[0]?.getBoundingClientRect().left ?? NaN,
      label: { left: labelBox?.left ?? NaN, right: labelBox?.right ?? NaN },
      grid: { left: grid.left, right: grid.right, width: grid.width },
    }
  })

const zoomWindow = (page: Page) =>
  page.getByTestId(POPULATION).evaluate((el) => ({ from: Number(el.getAttribute('data-zoom-from')), to: Number(el.getAttribute('data-zoom-to')) }))

const axisX = (layout: MarkLayout, at: number, from: number, to: number) => layout.grid.left + (layout.grid.width * (at - from)) / (to - from)

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

  test('the Markers control lists exactly the marker kinds in the run and no entry names the population cap', async ({ page }) => {
    const result = await setup(page)
    const present = CHART_MARKER_KINDS.filter((kind) => result.markers.some((marker) => marker.kind === kind))
    expect(present.length, 'the run has marker kinds').toBeGreaterThan(0)
    const items = page.getByTestId('chart-marker-legend-item')
    await expect(items).toHaveCount(present.length)
    const entries = await items.evaluateAll((els) =>
      els.map((el) => ({ kind: el.getAttribute('data-kind'), text: el.textContent ?? '', name: el.getAttribute('aria-label') ?? '' })),
    )
    expect(entries.map((entry) => entry.kind)).toEqual(present)
    for (const entry of entries) expect(`${entry.kind} ${entry.text} ${entry.name}`).not.toMatch(/pop|cap/i)
  })

  test('a pinned run that reached the cap draws no mark against a current run that did not, and its cap time is in the Key results row', async ({ page }) => {
    const pinned = await setup(page)
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId(POPULATION).locator('path[data-series="pinned:population"]')).toHaveCount(1)
    const response = await waitForRun(page, () => setDurationInPlace(page, SHORT_RUN_SECONDS))
    expect(bodyDuration(response.request())).toBe(Number(SHORT_RUN_SECONDS))
    expect(((await response.json()) as SimulationResult).populationCapReachedAt, 'the 600 s run does not reach the cap').toBeNull()
    await expect(marks(page, POPULATION)).toHaveCount(0)
    const cells = page.locator('[data-testid="compare-row"][data-key="pop-cap"] td')
    await expect(cells.nth(1)).toHaveText(formatMinSec(pinned.populationCapReachedAt!))
    await expect(cells.nth(2)).toHaveText('not reached')
  })

  test('inside a zoom window containing the cap the line sits at the window axis position and the label right of it', async ({ page }) => {
    const result = await setup(page)
    const cap = result.populationCapReachedAt!
    const label = timeMarkLabel({ at: cap, label: 'Population cap' })
    await expect(async () => {
      const whole = await readMark(page)
      expect(whole.count).toBe(1)
      expect(Math.abs(whole.line - axisX(whole, cap, result.times[0], result.times.at(-1)!))).toBeLessThan(POSITION_TOLERANCE_PX)
    }).toPass()
    await zoomTo(page, 0.78, 0.99)
    const { from, to } = await zoomWindow(page)
    expect(cap, 'the cap time is inside the window').toBeGreaterThan(from)
    expect(cap).toBeLessThan(to)
    expect(to - from, 'the window is shorter than the cap time, so a side judged without its origin would flip left').toBeLessThan(cap)
    await expect(async () => {
      const zoomed = await readMark(page)
      const drawnWidth = zoomed.label.right - zoomed.label.left
      expect(estimateLabelWidth(label), 'the page judges the side with a width wider than the drawn text').toBeGreaterThan(drawnWidth)
      expect(((cap - from) / (to - from)) * zoomed.grid.width + estimateLabelWidth(label), 'the label fits right of the line in the window').toBeLessThanOrEqual(zoomed.grid.width)
      expect(zoomed.count).toBe(1)
      expect(zoomed.at).toBe(cap)
      expect(Math.abs(zoomed.line - axisX(zoomed, cap, from, to))).toBeLessThan(POSITION_TOLERANCE_PX)
      expect(zoomed.label.left).toBeGreaterThanOrEqual(zoomed.line - POSITION_TOLERANCE_PX)
      expect(zoomed.label.right).toBeLessThanOrEqual(zoomed.grid.right)
    }).toPass()
  })

  test('a reset after a zoom window that ends before the cap draws the mark again at its unzoomed position', async ({ page }) => {
    const result = await setup(page)
    const cap = result.populationCapReachedAt!
    const end = result.times.at(-1)!
    await zoomTo(page, 0.1, 0.3)
    const { to } = await zoomWindow(page)
    expect(to, 'the window ends before the cap time').toBeLessThan(cap)
    await expect(marks(page, POPULATION)).toHaveCount(0)
    await page.getByTestId(POPULATION).getByTestId('chart-zoom-reset').click()
    await expect(page.getByTestId(POPULATION)).not.toHaveAttribute('data-zoom-from', /.*/)
    await expect(async () => {
      const layout = await readMark(page)
      expect(layout.count).toBe(1)
      expect(layout.at).toBe(cap)
      expect(Math.abs(layout.line - axisX(layout, cap, result.times[0], end))).toBeLessThan(POSITION_TOLERANCE_PX)
    }).toPass()
  })

  test('a pointer-down on the mark label and a drag shows a zoom selection, and releasing it zooms the chart', async ({ page }) => {
    await setup(page)
    const chart = page.getByTestId(POPULATION)
    await markLabel(page).scrollIntoViewIfNeeded()
    await expect(chart).not.toHaveAttribute('data-zoom-from', /.*/)
    let point = { x: 0, y: 0 }
    await expect(async () => {
      const found = await readMark(page)
      const box = await markLabel(page).evaluate((el) => {
        const { left, right, top, bottom } = el.getBoundingClientRect()
        return { left, right, top, bottom }
      })
      expect(box.left, 'the label is inside the plot').toBeGreaterThanOrEqual(found.grid.left)
      expect(box.right).toBeLessThanOrEqual(found.grid.right)
      point = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }
    }).toPass()
    await page.mouse.move(point.x, point.y)
    await page.mouse.down()
    await page.mouse.move(point.x - 200, point.y, { steps: 5 })
    await expect(chart.getByTestId('chart-zoom-selection')).toBeVisible()
    await page.mouse.up()
    await expect(chart).toHaveAttribute('data-zoom-from', /\d+/)
  })
})
