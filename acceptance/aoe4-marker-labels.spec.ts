import { test, expect, type Locator, type Page } from '@playwright/test'
import type { ChartMarkerKind, SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_MARKER_KINDS } from '../lib/aoe4-build-order/model'
import { MARKER_KIND_LABELS, markerLabel } from '../components/apps/aoe4-build-order/chart-rows'
import { openPage, showTab, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const CHART = 'chart-gather-rates'
const PHONE = { width: 390, height: 844 }

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 900 } })

interface Setup {
  result: SimulationResult
  chart: Locator
  kind: ChartMarkerKind
}

async function setup(page: Page): Promise<Setup> {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
  expect(response.status()).toBe(200)
  await showTab(page, 'results')
  const result = (await response.json()) as SimulationResult
  const count = (k: ChartMarkerKind) => result.markers.filter((m) => m.kind === k).length
  const kind = CHART_MARKER_KINDS.filter((k) => k !== 'age-up' && count(k) > 0).sort((a, b) => count(b) - count(a))[0]
  expect(kind, 'the build has a non-age-up marker kind').toBeDefined()
  expect(result.markers.some((m) => m.kind === 'age-up')).toBe(true)
  return { result, chart: page.getByTestId(CHART), kind: kind! }
}

const labelsOf = (result: SimulationResult, kind: ChartMarkerKind) => result.markers.filter((m) => m.kind === kind).map(markerLabel).sort()

const item = (chart: Locator, kind: ChartMarkerKind) => chart.locator(`[data-testid="chart-marker-legend-item"][data-kind="${kind}"]`)

const expectLabels = (chart: Locator, expected: string[]) =>
  expect
    .poll(async () =>
      (
        await chart
          .locator('svg text.recharts-label')
          .evaluateAll((els) => els.filter((el) => !el.getAttribute('transform')?.includes('rotate')).map((el) => el.textContent ?? ''))
      ).sort(),
    )
    .toEqual(expected.sort())

const away = (page: Page) => page.mouse.move(0, 0)

async function tabTo(page: Page, chart: Locator, kind: ChartMarkerKind, present: readonly ChartMarkerKind[]) {
  await chart.getByTestId('chart-series-legend-item').last().focus()
  for (let i = 0; i <= present.indexOf(kind); i++) await page.keyboard.press('Tab')
  await expect(item(chart, kind)).toBeFocused()
}

const presentKinds = (result: SimulationResult) => CHART_MARKER_KINDS.filter((k) => result.markers.some((m) => m.kind === k))

test.describe('AoE4 chart marker labels', () => {
  test('hovering a legend item labels that kind without overlap, and leaving restores the age-up labels', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    const ageUps = labelsOf(result, 'age-up')
    await expectLabels(chart, ageUps)

    await item(chart, kind).hover()
    await expect(item(chart, kind)).toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, kind))
    await expect.poll(() => chart.locator('svg text.recharts-label', { hasText: ageUps[0] }).count()).toBe(0)

    expect(labelsOf(result, kind).length).toBeGreaterThanOrEqual(2)
    await expect
      .poll(() =>
        chart.locator('svg text.recharts-label').evaluateAll((els) => {
          const rects = els.filter((el) => !el.getAttribute('transform')?.includes('rotate')).map((el) => el.getBoundingClientRect())
          return rects.some((a, i) => rects.some((b, j) => i < j && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom))
        }),
      )
      .toBe(false)

    await away(page)
    await expect(item(chart, kind)).not.toHaveAttribute('data-active', 'true')
    await expectLabels(chart, ageUps)
  })

  test('every marker keeps exactly one line while another kind is active, and unlabelled age-ups have a hover title', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    expect(result.markers.length).toBeGreaterThan(0)
    await item(chart, kind).hover()
    await expectLabels(chart, labelsOf(result, kind))
    const lines = chart.locator('svg [data-testid="chart-marker"]')
    await expect(lines).toHaveCount(result.markers.length)
    const ageUpTitles = await lines.evaluateAll((els) =>
      els.filter((el) => el.getAttribute('data-kind') === 'age-up').map((el) => el.parentElement!.querySelector('title')?.textContent ?? null),
    )
    expect(ageUpTitles.sort()).toEqual(labelsOf(result, 'age-up'))
  })

  test('keyboard focus labels the kind like hover, blur restores, and hover wins over focus', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    const present = presentKinds(result)
    await away(page)

    await tabTo(page, chart, kind, present)
    await expect(item(chart, kind)).toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, kind))
    await page.keyboard.press('Escape')
    await page.keyboard.press('Enter')
    await expect(item(chart, kind)).toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, kind))
    await item(chart, kind).blur()
    await expect(item(chart, kind)).not.toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, 'age-up'))

    await tabTo(page, chart, 'age-up', present)
    await item(chart, kind).hover()
    await expect(item(chart, kind)).toHaveAttribute('data-active', 'true')
    await expect(item(chart, 'age-up')).not.toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, kind))
    await away(page)
    await expect(item(chart, 'age-up')).toHaveAttribute('data-active', 'true')
    await expect(item(chart, kind)).not.toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, 'age-up'))
  })

  test('clicking an item only focuses it: the labels stay with the focus and are not sticky after blur', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    await item(chart, kind).click()
    await expect(item(chart, kind)).toBeFocused()
    await away(page)
    await expect(item(chart, kind)).toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, kind))
    await item(chart, kind).click()
    await away(page)
    await expectLabels(chart, labelsOf(result, kind))
    await item(chart, kind).blur()
    await expect(item(chart, kind)).not.toHaveAttribute('data-active', 'true')
    await expectLabels(chart, labelsOf(result, 'age-up'))
  })

  test('collapsing a chart while an item is hovered clears the hover', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    await item(chart, kind).hover()
    await expect(item(chart, kind)).toHaveAttribute('data-active', 'true')
    await chart.getByTestId('chart-collapse').dispatchEvent('click')
    await expect(chart.getByTestId('chart-marker-legend')).toHaveCount(0)
    await away(page)
    await chart.getByTestId('chart-collapse').dispatchEvent('click')
    await expect(chart.getByTestId('chart-marker-legend')).toBeVisible()
    await expectLabels(chart, labelsOf(result, 'age-up'))
    await expect(chart.locator('[data-testid="chart-marker-legend-item"][data-active]')).toHaveCount(0)
  })

  test('the active item and a keyboard-focused item look different from the rest', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    const present = presentKinds(result)
    const style = (kindId: ChartMarkerKind) =>
      item(chart, kindId).evaluate((el) => {
        const s = getComputedStyle(el)
        return { background: s.backgroundColor, border: s.borderColor, outline: `${s.outlineStyle} ${s.outlineWidth}` }
      })
    await away(page)
    const inactive = await style(kind)
    await item(chart, kind).hover()
    expect(await style(kind)).not.toEqual(inactive)
    await away(page)
    await tabTo(page, chart, kind, present)
    expect((await style(kind)).outline).not.toEqual(inactive.outline)
    expect((await style(kind)).outline).not.toMatch(/^none/)
  })

  test('pinned age-ups stay dashed and unlabelled whatever kind is active, and no other pinned kind is drawn', async ({ page }) => {
    const { result, chart, kind } = await setup(page)
    await page.getByTestId('pin-run').click()
    const pinned = chart.locator('svg [data-testid="chart-pinned-marker"]')
    const ageUpCount = result.markers.filter((m) => m.kind === 'age-up').length
    await expect(pinned).toHaveCount(ageUpCount)
    await item(chart, kind).hover()
    await expectLabels(chart, labelsOf(result, kind))
    await expect(pinned).toHaveCount(ageUpCount)
    const dashes = await pinned.evaluateAll((els) => els.map((el) => [el.getAttribute('stroke-dasharray'), el.parentElement!.querySelectorAll('text').length]))
    for (const [dash, texts] of dashes) {
      expect(dash).not.toBeNull()
      expect(texts).toBe(0)
    }
  })

  test.describe('at a 390 px screen', () => {
    test.use({ viewport: PHONE })

    test('the marker legend and the page do not scroll sideways', async ({ page }) => {
      const { chart } = await setup(page)
      const legend = chart.getByTestId('chart-marker-legend')
      await expect(legend).toBeVisible()
      await expect(legend.getByTestId('chart-marker-legend-item')).not.toHaveCount(0)
      const widths = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        legend: document.querySelector<HTMLElement>('[data-testid="chart-marker-legend"]')!.scrollWidth,
        legendClient: document.querySelector<HTMLElement>('[data-testid="chart-marker-legend"]')!.clientWidth,
      }))
      expect(widths.page).toBeLessThanOrEqual(PHONE.width)
      expect(widths.legend).toBeLessThanOrEqual(widths.legendClient)
    })
  })

  test('the legend items name their kind in an aria-label', async ({ page }) => {
    const { result, chart } = await setup(page)
    for (const kindId of presentKinds(result)) {
      await expect(item(chart, kindId)).toHaveAttribute('aria-label', new RegExp(MARKER_KIND_LABELS[kindId]))
    }
  })
})
