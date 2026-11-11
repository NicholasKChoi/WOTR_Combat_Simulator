import { test, expect, type Page } from '@playwright/test'
import { CHART_IDS, SPLIT_VIEWPORT, TABS_VIEWPORT, WIDE_VIEWPORT, openPage, showTab, waitForRun } from './helpers'

const REMOVED_TIMELINE_IDS = ['step-timeline', 'step-timeline-scroll', 'step-timeline-legend', 'results-split'] as const
const CHARTS_FILL_RATIO = 0.95

async function openResults(page: Page) {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('duration-seconds').fill('200'))
  expect(response.status()).toBe(200)
  await showTab(page, 'results')
  await expect(page.getByTestId('chart-units-produced')).toBeVisible()
}

const widths = (page: Page) =>
  page.evaluate(() => {
    const width = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().width
    return { units: width('chart-units-produced'), results: width('results-last-good'), page: document.documentElement.scrollWidth }
  })

test.describe('AoE4 results take the full width', () => {
  for (const [name, viewport] of [
    ['wide', WIDE_VIEWPORT],
    ['split', SPLIT_VIEWPORT],
    ['tabs', TABS_VIEWPORT],
  ] as const) {
    test(`the charts fill the Results width and no timeline is drawn at the ${name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openResults(page)
      for (const id of REMOVED_TIMELINE_IDS) await expect(page.getByTestId(id)).toHaveCount(0)
      await expect.poll(async () => {
        const { units, results } = await widths(page)
        return units / results >= CHARTS_FILL_RATIO
      }).toBe(true)
      if (viewport === WIDE_VIEWPORT) {
        await expect.poll(async () => (await widths(page)).page).toBeLessThanOrEqual(viewport.width)
      }
    })
  }

  test('the four charts are direct children of the results container and wrap no column', async ({ page }) => {
    await page.setViewportSize(WIDE_VIEWPORT)
    await openResults(page)
    const children = await page.getByTestId('results-last-good').evaluate((el) => [...el.children].map((child) => child.getAttribute('data-testid')))
    expect(children.filter((id) => id?.startsWith('chart-'))).toEqual(CHART_IDS)
    expect(children.slice(-CHART_IDS.length)).toEqual(CHART_IDS)
  })

  test('a build with no steps still draws the charts and shows no step rows or legend', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    await showTab(page, 'build')
    const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill('start -> sheep'))
    expect(response.status()).toBe(200)
    await page.getByTestId('editor-view-table').click()
    await showTab(page, 'results')
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
    await expect(page.getByTestId('step-row')).toHaveCount(0)
    await expect(page.getByTestId('step-kind-legend')).toHaveCount(0)
    for (const id of REMOVED_TIMELINE_IDS) await expect(page.getByTestId(id)).toHaveCount(0)
  })
})
