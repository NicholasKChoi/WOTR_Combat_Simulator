import { test, expect, type Page } from '@playwright/test'
import { openPage, showTab, waitForRun } from './helpers'

const WIDE = { width: 1280, height: 800 }
const NARROW = { width: 1024, height: 768 }

interface Rects {
  timeline: DOMRect
  legend: DOMRect
  units: DOMRect
  bar: DOMRect
}

const rects = (page: Page) =>
  page.evaluate(() => {
    const rect = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().toJSON()
    return { timeline: rect('step-timeline-scroll'), legend: rect('step-timeline-legend'), units: rect('chart-units-produced'), bar: rect('run-bar') }
  }) as Promise<Rects>

async function openResults(page: Page) {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('duration-seconds').fill('200'))
  expect(response.status()).toBe(200)
  await showTab(page, 'results')
  await expect(page.getByTestId('step-timeline-scroll')).toBeVisible()
}

async function expectTimelineBelowRunBar(page: Page) {
  await expect
    .poll(async () => {
      const { legend, units, bar } = await rects(page)
      return units.top < bar.bottom && legend.top >= bar.bottom - 1 && legend.top <= bar.bottom + 1
    })
    .toBe(true)
}

test.describe('AoE4 results split at 1280 px', () => {
  test.use({ viewport: WIDE })

  test('the timeline sits left of the charts', async ({ page }) => {
    await openResults(page)
    await expect
      .poll(async () => {
        const { timeline, legend, units } = await rects(page)
        return timeline.right <= units.left && Math.abs(legend.top - units.top) <= 40
      })
      .toBe(true)
  })

  test('a build with no steps keeps both columns, empty timeline first, and draws no timeline', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'build')
    const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill('start -> sheep'))
    expect(response.status()).toBe(200)
    await showTab(page, 'results')
    const columns = page.getByTestId('results-split').locator('> *')
    await expect(columns).toHaveCount(2)
    await expect(columns.nth(0)).not.toHaveAttribute('data-testid', /.*/)
    await expect(columns.nth(1)).not.toHaveAttribute('data-testid', /.*/)
    await expect(columns.nth(1).getByTestId('chart-units-produced')).toBeVisible()
    await expect(page.getByTestId('step-timeline-scroll')).toHaveCount(0)
  })

  test('the timeline stays just below the run bar while the charts scroll', async ({ page }) => {
    await openResults(page)
    await page.getByTestId('chart-floating-resources').evaluate((el) => el.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await expectTimelineBelowRunBar(page)
  })

  test('the timeline stays below a run bar that wraps onto a second row', async ({ page }) => {
    await openResults(page)
    await page.getByTestId('chart-floating-resources').evaluate((el) => el.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await expectTimelineBelowRunBar(page)
    await page.getByTestId('run-bar').evaluate((bar) => {
      const filler = document.createElement('div')
      filler.style.cssText = 'flex: 0 0 100%; height: 3rem'
      bar.appendChild(filler)
    })
    await expectTimelineBelowRunBar(page)
  })

  test('the page does not scroll sideways', async ({ page }) => {
    await openResults(page)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(WIDE.width)
  })
})

test.describe('AoE4 results split at 1024 px', () => {
  test.use({ viewport: NARROW })

  test('the timeline is stacked above the charts', async ({ page }) => {
    await openResults(page)
    await expect
      .poll(async () => {
        const { timeline, units } = await rects(page)
        return timeline.bottom <= units.top
      })
      .toBe(true)
  })
})
