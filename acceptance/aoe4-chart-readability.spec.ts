import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { MARKER_COLORS, markerLabel } from '../components/apps/aoe4-build-order/chart-rows'
import { CHART_IDS, openPage, plotPoint, showTab, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const HOVER_FRACTION = 0.5
const RAW_DECIMALS = /\d+\.\d{2,}/

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 900 } })

async function runKnightLongbow(page: Page): Promise<SimulationResult> {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
  expect(response.status()).toBe(200)
  await showTab(page, 'results')
  return (await response.json()) as SimulationResult
}

test.describe('AoE4 chart readability', () => {
  test('only age-up markers carry a text label; every other marker is an unlabelled line with a hover title', async ({ page }) => {
    const result = await runKnightLongbow(page)
    const ageUps = result.markers.filter((m) => m.kind === 'age-up')
    const others = result.markers.filter((m) => m.kind !== 'age-up')
    expect(ageUps.length).toBeGreaterThan(0)
    expect(others.length).toBeGreaterThan(0)

    for (const id of CHART_IDS) {
      const chart = page.getByTestId(id)
      await expect(chart.locator('svg [data-testid="chart-marker"]')).toHaveCount(result.markers.length)
      await expect
        .poll(async () => {
          const texts = await chart
            .locator('svg text.recharts-label')
            .evaluateAll((els) => els.filter((el) => !el.getAttribute('transform')?.includes('rotate')).map((el) => el.textContent ?? ''))
          return texts.sort()
        })
        .toEqual(ageUps.map(markerLabel).sort())
      const rows = Number(await chart.getAttribute('data-label-rows'))
      expect(rows).toBeGreaterThanOrEqual(1)
      expect(rows).toBeLessThanOrEqual(ageUps.length)

      const lines = await chart.locator('svg [data-testid="chart-marker"]').evaluateAll((els) =>
        els.map((el) => ({
          kind: el.getAttribute('data-kind'),
          label: el.getAttribute('data-label'),
          at: el.getAttribute('data-at'),
          stroke: el.getAttribute('stroke'),
          dash: el.getAttribute('stroke-dasharray'),
          texts: el.parentElement!.querySelectorAll('text').length,
          title: el.parentElement!.querySelector('title')?.textContent ?? null,
        })),
      )
      for (const m of result.markers) {
        const found = lines.filter((l) => l.kind === m.kind && l.label === m.label && l.at === String(m.at))
        expect(found).toHaveLength(1)
        expect(found[0].stroke).toBe(MARKER_COLORS[m.kind])
        expect(found[0].dash).toBeNull()
        if (m.kind !== 'age-up') {
          expect(found[0].texts).toBe(0)
          expect(found[0].title).toBe(markerLabel(m))
        }
      }
    }
  })

  test('tooltips in the gather rates and floating resources charts show no value with 2 or more decimals', async ({ page }) => {
    await runKnightLongbow(page)
    for (const id of ['chart-gather-rates', 'chart-floating-resources']) {
      const chart = page.getByTestId(id)
      const point = await plotPoint(page, id, HOVER_FRACTION)
      await page.mouse.move(point.x, point.y)
      const tooltip = chart.locator('.recharts-tooltip-wrapper')
      await expect(tooltip).toBeVisible()
      await expect(tooltip).toContainText(/\d/)
      expect(await tooltip.innerText()).not.toMatch(RAW_DECIMALS)
    }
  })
})
