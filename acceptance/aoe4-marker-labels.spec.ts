import { test, expect, type Locator, type Page } from '@playwright/test'
import type { ChartMarkerKind, SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_MARKER_KINDS } from '../lib/aoe4-build-order/model'
import { MARKER_KIND_LABELS, markerLabel } from '../components/apps/aoe4-build-order/chart-markers'
import { CHART_IDS, openPage, setDurationInPlace, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 900 } })

interface Setup {
  result: SimulationResult
  control: Locator
  kind: ChartMarkerKind
  present: readonly ChartMarkerKind[]
}

async function setup(page: Page): Promise<Setup> {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  const count = (k: ChartMarkerKind) => result.markers.filter((m) => m.kind === k).length
  const present = CHART_MARKER_KINDS.filter((k) => count(k) > 0)
  const kind = present.filter((k) => k !== 'age-up').sort((a, b) => count(b) - count(a))[0]
  expect(present, 'the build has an age-up marker').toContain('age-up')
  expect(kind, 'the build has a non-age-up marker kind').toBeDefined()
  return { result, control: page.getByTestId('chart-marker-legend'), kind: kind!, present }
}

const labelsOf = (result: SimulationResult, kind: ChartMarkerKind) => result.markers.filter((m) => m.kind === kind).map(markerLabel).sort()

const item = (control: Locator, kind: ChartMarkerKind) => control.locator(`[data-testid="chart-marker-legend-item"][data-kind="${kind}"]`)

const chartLabels = (chart: Locator) =>
  chart.locator('svg text.recharts-label').evaluateAll((els) => els.filter((el) => !el.getAttribute('transform')?.includes('rotate')).map((el) => el.textContent ?? ''))

const expectLabels = async (page: Page, expected: string[]) => {
  for (const id of CHART_IDS) {
    await expect.poll(async () => (await chartLabels(page.getByTestId(id))).sort()).toEqual([...expected].sort())
  }
}

const expectLines = async (page: Page, expected: number) => {
  for (const id of CHART_IDS) await expect(page.getByTestId(id).locator('svg [data-testid="chart-marker"]')).toHaveCount(expected)
}

const away = (page: Page) => page.mouse.move(0, 0)

async function tabTo(page: Page, control: Locator, kind: ChartMarkerKind, present: readonly ChartMarkerKind[]) {
  await page.getByTestId('simulation-notes-toggle').focus()
  for (let i = 0; i <= present.indexOf(kind); i++) await page.keyboard.press('Tab')
  await expect(item(control, kind)).toBeFocused()
}

test.describe('AoE4 marker control', () => {
  test('one control sits between the order status and the chart table, lists the present kinds in order, and no chart holds one', async ({ page }) => {
    const { control, present } = await setup(page)
    await expect(page.getByTestId('chart-marker-legend')).toHaveCount(1)
    await expect(control.locator('h3')).toHaveText('Markers')
    expect(await control.getByTestId('chart-marker-legend-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')))).toEqual(present)
    for (const kind of present) await expect(item(control, kind)).toHaveAccessibleName(`${MARKER_KIND_LABELS[kind]} markers`)
    for (const id of CHART_IDS) await expect(page.getByTestId(id).getByTestId('chart-marker-legend')).toHaveCount(0)
    const order = await page.evaluate(() => {
      const status = document.querySelector('[data-testid="chart-order-status"]')!
      const marker = document.querySelector('[data-testid="chart-marker-legend"]')!
      const table = document.querySelector('[data-testid="chart-table"]')!
      return [status.compareDocumentPosition(marker), marker.compareDocumentPosition(table)]
    })
    // 4 is Node.DOCUMENT_POSITION_FOLLOWING
    for (const position of order) expect(position & 4).toBe(4)
  })

  test('hovering an item labels that kind on every chart without overlap, and leaving restores the age-up labels', async ({ page }) => {
    const { result, control, kind } = await setup(page)
    const ageUps = labelsOf(result, 'age-up')
    await expectLabels(page, ageUps)

    await item(control, kind).hover()
    await expect(item(control, kind)).toHaveAttribute('data-active', 'true')
    await expect(control.locator('[data-active]')).toHaveCount(1)
    await expectLabels(page, labelsOf(result, kind))
    expect(labelsOf(result, kind).length).toBeGreaterThanOrEqual(2)
    for (const id of CHART_IDS) {
      await expect
        .poll(() =>
          page
            .getByTestId(id)
            .locator('svg text.recharts-label')
            .evaluateAll((els) => {
              const rects = els.filter((el) => !el.getAttribute('transform')?.includes('rotate')).map((el) => el.getBoundingClientRect())
              return rects.some((a, i) => rects.some((b, j) => i < j && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom))
            }),
        )
        .toBe(false)
    }

    await away(page)
    await expect(item(control, kind)).not.toHaveAttribute('data-active', 'true')
    await expectLabels(page, ageUps)
  })

  test('every marker keeps one line while a kind is labelled, and unlabelled markers have a hover title', async ({ page }) => {
    const { result, control, kind } = await setup(page)
    await item(control, kind).hover()
    await expectLabels(page, labelsOf(result, kind))
    await expectLines(page, result.markers.length)
    const titles = await page
      .getByTestId(CHART_IDS[0])
      .locator('svg [data-testid="chart-marker"]')
      .evaluateAll((els) => els.map((el) => [el.getAttribute('data-kind'), el.parentElement!.querySelector('title')?.textContent ?? null]))
    const unlabelled = titles.filter(([k]) => k !== kind).map(([, title]) => title)
    expect(unlabelled.length).toBeGreaterThan(0)
    expect(unlabelled.sort()).toEqual(result.markers.filter((m) => m.kind !== kind).map(markerLabel).sort())
  })

  test('keyboard: Tab from the info toggle reaches the first item, focus labels the kind, hover wins over focus', async ({ page }) => {
    const { result, control, kind, present } = await setup(page)
    await expect(page.getByTestId('simulation-notes-toggle')).toBeVisible()
    await away(page)
    await page.getByTestId('simulation-notes-toggle').focus()
    await page.keyboard.press('Tab')
    await expect(item(control, present[0])).toBeFocused()

    await tabTo(page, control, kind, present)
    await expect(item(control, kind)).toHaveAttribute('data-active', 'true')
    await expectLabels(page, labelsOf(result, kind))
    await item(control, kind).blur()
    await expect(item(control, kind)).not.toHaveAttribute('data-active', 'true')
    await expectLabels(page, labelsOf(result, 'age-up'))

    await tabTo(page, control, 'age-up', present)
    await item(control, kind).hover()
    await expect(item(control, kind)).toHaveAttribute('data-active', 'true')
    await expect(item(control, 'age-up')).not.toHaveAttribute('data-active', 'true')
    await expectLabels(page, labelsOf(result, kind))
    await away(page)
    await expect(item(control, 'age-up')).toHaveAttribute('data-active', 'true')
    await expectLabels(page, labelsOf(result, 'age-up'))
  })

  test('clicking, Enter and Space toggle a kind on every chart, keep focus, and show the pressed state and opacity', async ({ page }) => {
    const { result, control, kind } = await setup(page)
    const total = result.markers.length
    const ofKind = result.markers.filter((m) => m.kind === kind).length
    expect(ofKind).toBeGreaterThan(0)
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'true')
    await expect(item(control, kind)).toHaveCSS('opacity', '1')

    await item(control, kind).click()
    await expect(item(control, kind)).toBeFocused()
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'false')
    await expect(item(control, kind)).toHaveCSS('opacity', '0.5')
    await expectLines(page, total - ofKind)

    await page.keyboard.press('Enter')
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'true')
    await expect(item(control, kind)).toHaveCSS('opacity', '1')
    await expectLines(page, total)

    await page.keyboard.press('Space')
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'false')
    await expectLines(page, total - ofKind)
    await expect(item(control, kind)).toBeFocused()
    await item(control, kind).click()
    await expectLines(page, total)
  })

  test('hiding the labelled kind removes its labels; hovering a hidden kind falls back to age-up; hiding age-up leaves no labels', async ({ page }) => {
    const { result, control, kind } = await setup(page)
    await item(control, kind).click()
    await away(page)
    await item(control, kind).hover()
    await expect(item(control, kind)).not.toHaveAttribute('data-active', 'true')
    await expect(control.locator('[data-active]')).toHaveCount(0)
    await expectLabels(page, labelsOf(result, 'age-up'))
    await away(page)

    await item(control, 'age-up').click()
    await away(page)
    await expectLabels(page, [])
    for (const id of CHART_IDS) await expect(page.getByTestId(id)).toHaveAttribute('data-label-rows', '0')
    await item(control, kind).hover()
    await expectLabels(page, [])
    await away(page)

    await item(control, kind).click()
    await item(control, kind).hover()
    await expectLabels(page, labelsOf(result, kind))
    await expectLines(page, result.markers.length - labelsOf(result, 'age-up').length)
  })

  test('pinned age-ups follow the age-up toggle on every chart and other kinds do not touch them', async ({ page }) => {
    const { result, control, kind } = await setup(page)
    await page.getByTestId('pin-run').click()
    const ageUpCount = labelsOf(result, 'age-up').length
    const pinnedCount = async (expected: number) => {
      for (const id of CHART_IDS) await expect(page.getByTestId(id).locator('svg [data-testid="chart-pinned-marker"]')).toHaveCount(expected)
    }
    await pinnedCount(ageUpCount)
    await item(control, kind).click()
    await pinnedCount(ageUpCount)
    await item(control, 'age-up').click()
    await pinnedCount(0)
    for (const id of CHART_IDS) await expect(page.getByTestId(id).getByTestId('chart-pinned-legend')).toHaveCount(1)
    await item(control, 'age-up').click()
    await pinnedCount(ageUpCount)
    const dashes = await page
      .getByTestId(CHART_IDS[0])
      .locator('svg [data-testid="chart-pinned-marker"]')
      .evaluateAll((els) => els.map((el) => [el.getAttribute('stroke-dasharray'), el.parentElement!.querySelectorAll('text').length]))
    for (const [dash, texts] of dashes) {
      expect(dash).not.toBeNull()
      expect(texts).toBe(0)
    }
  })

  test('the hidden kinds survive collapsing a chart, pinning, and a new run, and hiding leaves the series lines', async ({ page }) => {
    const { result, control, kind } = await setup(page)
    const seriesCount = () => page.getByTestId(CHART_IDS[0]).locator('svg path.recharts-line-curve').count()
    const before = await seriesCount()
    expect(before).toBeGreaterThan(0)
    await item(control, kind).click()
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'false')
    expect(await seriesCount()).toBe(before)

    await page.getByTestId(CHART_IDS[0]).getByTestId('chart-collapse').dispatchEvent('click')
    await page.getByTestId(CHART_IDS[0]).getByTestId('chart-collapse').dispatchEvent('click')
    await page.getByTestId('pin-run').click()
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'false')
    await expectLines(page, result.markers.length - labelsOf(result, kind).length)
    expect(await seriesCount()).toBeGreaterThanOrEqual(before)

    await waitForRun(page, () => setDurationInPlace(page, '1200'))
    await expect(item(control, kind)).toHaveAttribute('aria-pressed', 'false')
  })

  test('the active item and a keyboard-focused item look different from the rest', async ({ page }) => {
    const { control, kind, present } = await setup(page)
    const style = (kindId: ChartMarkerKind) =>
      item(control, kindId).evaluate((el) => {
        const s = getComputedStyle(el)
        return { background: s.backgroundColor, border: s.borderColor, outline: `${s.outlineStyle} ${s.outlineWidth}` }
      })
    await away(page)
    const inactive = await style(kind)
    await item(control, kind).hover()
    expect(await style(kind)).not.toEqual(inactive)
    await away(page)
    await tabTo(page, control, kind, present)
    expect((await style(kind)).outline).not.toEqual(inactive.outline)
    expect((await style(kind)).outline).not.toMatch(/^none/)
  })
})
