import { test, expect, type Page } from '@playwright/test'
import type { ChartMarkerKind, SimulationResult } from '../lib/aoe4-build-order/model'
import { markerLabel } from '../components/apps/aoe4-build-order/chart-markers'
import { CHART_IDS, openPage, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const FIRST = CHART_IDS[0]
const LAST = CHART_IDS[CHART_IDS.length - 1]
const EPS = 1

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 800 } })

async function setup(page: Page) {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  const kind = result.markers.map((m) => m.kind).find((k) => k !== 'age-up')
  expect(kind, 'the build has a non-age-up marker kind').toBeDefined()
  return { result, kind: kind! }
}

const item = (page: Page, kind: ChartMarkerKind) => page.locator(`[data-testid="chart-marker-legend-item"][data-kind="${kind}"]`)

const scrollColumn = (page: Page, where: 'top' | 'bottom' | number) =>
  page.getByTestId('results-column').evaluate((el, target) => {
    const max = el.scrollHeight - el.clientHeight
    el.scrollTo({ top: target === 'top' ? 0 : target === 'bottom' ? max : target, behavior: 'instant' })
  }, where)

const columnRange = (page: Page) =>
  page.getByTestId('results-column').evaluate((el) => ({ max: el.scrollHeight - el.clientHeight, client: el.clientHeight }))

interface Stuck {
  columnTop: number
  columnBottom: number
  controlTop: number
  controlBottom: number
  controlHeight: number
  onTop: boolean
  opaque: boolean
  targetTop: number | null
}

const readStuck = (page: Page, targetSelector?: string): Promise<Stuck> =>
  page.evaluate((target) => {
    const column = document.querySelector('[data-testid="results-column"]')!.getBoundingClientRect()
    const control = document.querySelector('[data-testid="chart-marker-legend"]')!
    const rect = control.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    return {
      columnTop: column.top,
      columnBottom: column.bottom,
      controlTop: rect.top,
      controlBottom: rect.bottom,
      controlHeight: rect.height,
      onTop: hit !== null && control.contains(hit),
      opaque: /^rgb\(/.test(getComputedStyle(control).backgroundColor),
      targetTop: target ? (document.querySelector(target)?.getBoundingClientRect().top ?? null) : null,
    }
  }, targetSelector)

const relativeTop = (page: Page, chart: string, part: string) =>
  page.evaluate(
    ([c, p]) => {
      const column = document.querySelector('[data-testid="results-column"]')!
      const el = document.querySelector(`[data-testid="${c}"] [data-testid="${p}"]`)!
      return el.getBoundingClientRect().top - column.getBoundingClientRect().top + column.scrollTop
    },
    [chart, part],
  )

test.describe('AoE4 marker control stays in view', () => {
  test('stays at the top of the column at every scroll position, and does not cover the first chart at scrollTop 0', async ({ page }) => {
    await setup(page)
    const { max } = await columnRange(page)
    expect(max, 'the column scrolls well past the first chart').toBeGreaterThan(600)
    for (const where of [Math.round(max / 3), Math.round((2 * max) / 3), 'bottom'] as const) {
      await scrollColumn(page, where)
      await expect
        .poll(async () => {
          const s = await readStuck(page)
          return Math.abs(s.controlTop - s.columnTop) <= EPS && s.controlBottom <= s.columnBottom
        }, { message: `control pinned at scroll ${where}` })
        .toBe(true)
    }
    await scrollColumn(page, 'top')
    await expect
      .poll(async () => {
        const s = await readStuck(page, `[data-testid="${FIRST}"] [data-testid="chart-header-row"]`)
        return s.targetTop! >= s.controlBottom - EPS
      })
      .toBe(true)
  })

  test('hover labels the kind on the last chart and clicking hides and restores its lines there', async ({ page }) => {
    const { result, kind } = await setup(page)
    await scrollColumn(page, 'bottom')
    const last = page.getByTestId(LAST)
    const lines = last.locator('svg [data-testid="chart-marker"]')
    const labels = () =>
      last.locator('svg text.recharts-label').evaluateAll((els) => els.filter((el) => !el.getAttribute('transform')?.includes('rotate')).map((el) => el.textContent ?? '').sort())
    const expected = result.markers.filter((m) => m.kind === kind).map(markerLabel).sort()
    await expect
      .poll(async () => {
        const s = await readStuck(page)
        return s.controlTop >= s.columnTop - EPS && s.controlBottom <= s.columnBottom
      })
      .toBe(true)
    await expect(lines).toHaveCount(result.markers.length)

    await item(page, kind).hover()
    await expect.poll(labels).toEqual(expected)
    await page.mouse.move(0, 0)

    await item(page, kind).click()
    await expect(item(page, kind)).toHaveAttribute('aria-pressed', 'false')
    await expect(lines).toHaveCount(result.markers.filter((m) => m.kind !== kind).length)
    await item(page, kind).click()
    await expect(item(page, kind)).toHaveAttribute('aria-pressed', 'true')
    await expect(lines).toHaveCount(result.markers.length)
  })

  test('a drag handle scrolled into view and focused below the control lands at or below the control, also after the control wraps taller', async ({ page }) => {
    await setup(page)
    const focusClearance = async (id: string) => {
      const handle = `[data-testid="${id}"] [data-testid="chart-drag-handle"]`
      await scrollColumn(page, 'top')
      const handleTop = await relativeTop(page, id, 'chart-drag-handle')
      await scrollColumn(page, Math.round(handleTop + 300))
      const before = await readStuck(page, handle)
      expect(before.targetTop!, 'the handle starts above the column top').toBeLessThan(before.columnTop)
      await page.getByTestId(id).getByTestId('chart-drag-handle').evaluate((el) => {
        el.scrollIntoView({ block: 'nearest', behavior: 'instant' })
        el.focus()
      })
      await expect
        .poll(async () => {
          const s = await readStuck(page, handle)
          return s.targetTop! - s.controlBottom
        })
        .toBeGreaterThanOrEqual(-EPS)
    }
    await focusClearance(CHART_IDS[1])

    const oneLine = (await readStuck(page)).controlHeight
    await page.addStyleTag({ content: '[data-testid="chart-marker-legend"] { width: 7rem; }' })
    await expect.poll(async () => (await readStuck(page)).controlHeight).toBeGreaterThan(oneLine + 10)
    await focusClearance(CHART_IDS[CHART_IDS.length - 2])
  })

  test('draws over a chart plot scrolled beneath it', async ({ page }) => {
    await setup(page)
    const bodyTop = await relativeTop(page, FIRST, 'chart-body-row')
    await scrollColumn(page, Math.round(bodyTop + 40))
    await expect
      .poll(async () => {
        const s = await readStuck(page, `[data-testid="${FIRST}"] [data-testid="chart-body-row"]`)
        return [s.targetTop! < s.controlBottom, s.onTop, s.opaque]
      })
      .toEqual([true, true, true])
  })

  test('a run without markers draws no control and leaves the Results column with no scroll padding, and the Build column never has it', async ({ page }) => {
    await setup(page)
    const padding = (id: string) => page.getByTestId(id).evaluate((el) => getComputedStyle(el).scrollPaddingTop)
    const isZero = (v: string) => v === 'auto' || parseFloat(v) === 0
    await expect.poll(async () => parseFloat(await padding('results-column'))).toBeGreaterThan(20)
    expect(isZero(await padding('build-column'))).toBe(true)

    const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill('start -> sheep'))
    expect(((await response.json()) as SimulationResult).markers, 'the run has no markers').toHaveLength(0)
    await expect(page.getByTestId('chart-marker-legend')).toHaveCount(0)
    await expect.poll(async () => isZero(await padding('results-column'))).toBe(true)
    expect(isZero(await padding('build-column'))).toBe(true)
  })
})
