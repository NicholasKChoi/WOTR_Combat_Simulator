import { test, expect, type Locator, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_IDS, openPage, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 900 } })

const seriesItems = (page: Page, id: string) => page.getByTestId(id).getByTestId('chart-series-legend-item')
const markerItems = (page: Page) => page.getByTestId('chart-marker-legend').getByTestId('chart-marker-legend-item')

const pressedOf = (items: Locator) => items.evaluateAll((els) => els.map((e) => e.getAttribute('aria-pressed')))
const opacityOf = (items: Locator) => items.evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))

async function openWithMarkers(page: Page) {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  expect(result.markers.length, 'the build has markers').toBeGreaterThan(0)
}

test.describe('AoE4 legend pressed state', () => {
  for (const id of CHART_IDS) {
    test(`${id}: hiding a series item reads false and dimmed while the others read true, and clicking again restores it`, async ({ page }) => {
      await openWithMarkers(page)
      const items = seriesItems(page, id)
      const count = await items.count()
      expect(count, 'the chart has several series').toBeGreaterThan(1)
      expect(await pressedOf(items)).toEqual(Array(count).fill('true'))
      expect(await opacityOf(items)).toEqual(Array(count).fill('1'))

      const target = items.nth(count - 1)
      await target.click()
      await expect(target).toHaveAttribute('aria-pressed', 'false')
      await expect(target).toHaveCSS('opacity', '0.5')
      const expectedPressed = Array(count).fill('true')
      expectedPressed[count - 1] = 'false'
      const expectedOpacity = Array(count).fill('1')
      expectedOpacity[count - 1] = '0.5'
      expect(await pressedOf(items)).toEqual(expectedPressed)
      expect(await opacityOf(items)).toEqual(expectedOpacity)

      await target.click()
      await expect(target).toHaveAttribute('aria-pressed', 'true')
      await expect(target).toHaveCSS('opacity', '1')
      expect(await pressedOf(items)).toEqual(Array(count).fill('true'))
    })
  }

  test('the marker control and the series legend agree: shown reads true and hidden reads false', async ({ page }) => {
    await openWithMarkers(page)
    const series = seriesItems(page, CHART_IDS[0])
    const markers = markerItems(page)
    expect(await markers.count(), 'the build has a marker kind').toBeGreaterThan(0)

    await expect(series.first()).toHaveAttribute('aria-pressed', 'true')
    await expect(markers.first()).toHaveAttribute('aria-pressed', 'true')

    await series.first().click()
    await markers.first().click()
    await expect(series.first()).toHaveAttribute('aria-pressed', 'false')
    await expect(markers.first()).toHaveAttribute('aria-pressed', 'false')
    await expect(series.first()).toHaveCSS('opacity', '0.5')
    await expect(markers.first()).toHaveCSS('opacity', '0.5')

    await series.first().click()
    await markers.first().click()
    await expect(series.first()).toHaveAttribute('aria-pressed', 'true')
    await expect(markers.first()).toHaveAttribute('aria-pressed', 'true')
  })
})
