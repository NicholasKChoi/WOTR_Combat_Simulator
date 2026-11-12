import { test, expect, type Locator, type Page, type Request, type Route } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { AOE4_PAGE, CHART_IDS, acceptBeforeUnload, INVALID_PASTE, RESOURCE_CHARTS, SIMULATE_PATH, TABS_VIEWPORT, bodyDuration, expectFlySyntaxIssue, expectInvalidNoRun, expectedCompareKeys, hexToRgb, holdNextSimulate, isSimulatePost, openPage, plotPoint, showTab, waitForRun } from './helpers'

const DASH = '—'
const MINUS = '−'
const NOT_REACHED = 'not reached'
const DEFAULT_PASTE = formatBuildOrderText(listBuilds()[0])
const NO_MILITARY_PASTE = 'start -> sheep'

const LOAD_DURATION = 1200
const status = (page: Page) => page.getByTestId('auto-run-status')
const lastGoodOpacity = (page: Page) => page.getByTestId('results-last-good').evaluate((el) => Number(getComputedStyle(el).opacity))

// Every call must change the text or the duration; an unchanged input posts nothing.
async function runOk(page: Page, opts: { duration?: number; text?: string }) {
  const response = await waitForRun(page, async () => {
    if (opts.text !== undefined) {
      await showTab(page, 'build')
      await page.getByTestId('build-order-text').fill(opts.text)
    }
    if (opts.duration !== undefined) await page.getByTestId('duration-seconds').fill(String(opts.duration))
  })
  expect(response.status()).toBe(200)
  if (opts.duration !== undefined) expect(bodyDuration(response.request())).toBe(opts.duration)
  await showTab(page, 'results')
  return (await response.json()) as SimulationResult
}

const pin = (page: Page) => page.getByTestId('pin-run').click()
const path = (page: Page, chart: string, key: string): Locator => page.getByTestId(chart).locator(`path[data-series="${key}"]`)

function militaryAt(result: SimulationResult, t: number): number | null {
  const i = result.times.indexOf(t)
  return i < 0 ? null : result.spent.military[i]
}

function militaryDelta(delta: number): string {
  return delta === 0 ? 'same' : `${delta > 0 ? '+' : MINUS}${Math.abs(Math.round(delta))} resources`
}

test.describe('AoE4 build order pin and compare', () => {
  test('pin is disabled with no result, enabled once the load run lands; unpin is disabled until a pin exists', async ({ page }) => {
    const release = await holdNextSimulate(page, LOAD_DURATION)
    await page.goto(AOE4_PAGE)
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    await expect(page.getByTestId('pin-run')).toBeDisabled()
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
    release()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await showTab(page, 'results')
    await expect(page.getByTestId('pin-run')).toBeEnabled()
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
    await pin(page)
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
  })

  test('pinned lines are dashed in the current series colour while current lines are solid, in every chart', async ({ page }) => {
    await openPage(page)
    const first = await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })

    for (const chart of RESOURCE_CHARTS) {
      const pinned = path(page, chart, 'pinned:food')
      const current = path(page, chart, 'food')
      await expect(pinned).toHaveCount(1)
      await expect(current).toHaveCount(1)
      expect(((await pinned.getAttribute('stroke-dasharray')) ?? '').trim()).not.toBe('')
      expect(await current.getAttribute('stroke-dasharray')).toBeNull()
      expect(await pinned.getAttribute('stroke')).toBe(await current.getAttribute('stroke'))
    }
    expect(first.unitsProduced.length).toBeGreaterThan(0)
    for (const { unitId } of first.unitsProduced) {
      const pinned = path(page, 'chart-units-produced', `pinned:${unitId}`)
      await expect(pinned).toHaveCount(1)
      expect(((await pinned.getAttribute('stroke-dasharray')) ?? '').trim()).not.toBe('')
      expect(await path(page, 'chart-units-produced', unitId).getAttribute('stroke-dasharray')).toBeNull()
    }
  })

  test('each chart lists a series once and has one dashed pinned legend entry that goes away on unpin', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    for (const id of CHART_IDS) await expect(page.getByTestId(id).getByTestId('chart-pinned-legend')).toHaveCount(0)
    await pin(page)
    await runOk(page, { duration: 600 })

    for (const id of CHART_IDS) {
      const chart = page.getByTestId(id)
      const entry = chart.getByTestId('chart-pinned-legend')
      await expect(entry).toHaveCount(1)
      await expect(entry).toHaveText('dashed = pinned build')
      await expect(chart.getByTestId('chart-pinned-key')).toHaveCount(0)
      await expect(chart.locator('[data-kind="pinned-age-up"]')).toHaveCount(0)
      await expect(entry.getByTestId('chart-pinned-legend-swatch')).toHaveCSS('border-top-style', 'dashed')
      expect(await entry.evaluate((el) => el.tagName + String(el.tabIndex))).toBe('P-1')
      expect(await entry.evaluate((el) => el.previousElementSibling?.getAttribute('data-testid') ?? '')).toMatch(/^chart-(series|marker)-legend$/)
      const keys = await chart.getByTestId('chart-series-legend-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-series')))
      expect(keys.length).toBeGreaterThan(0)
      expect(keys.filter((k) => k?.startsWith('pinned:'))).toEqual([])
      expect(new Set(keys).size).toBe(keys.length)
    }

    await page.getByTestId('unpin-run').click()
    for (const id of CHART_IDS) await expect(page.getByTestId(id).getByTestId('chart-pinned-legend')).toHaveCount(0)
  })

  test('the pinned legend entry follows the series legend: hiding every pinned line removes it, showing one restores it, repeatedly', async ({ page }) => {
    await openPage(page)
    await runOk(page, { text: NO_MILITARY_PASTE })
    await pin(page)
    await runOk(page, { text: DEFAULT_PASTE })

    const chart = page.getByTestId('chart-gather-rates')
    const entry = chart.getByTestId('chart-pinned-legend')
    const items = chart.getByTestId('chart-series-legend-item')
    await expect(chart.getByTestId('chart-pinned-marker')).toHaveCount(0)
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    await expect(entry).toHaveCount(1)
    const count = await items.count()
    expect(count).toBeGreaterThan(1)

    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < count; i++) await items.nth(i).click()
      await expect(chart.locator('path[data-series^="pinned:"]')).toHaveCount(0)
      await expect(entry).toHaveCount(0)
      await items.first().click()
      await expect(chart.locator('path[data-series^="pinned:"]')).toHaveCount(1)
      await expect(entry).toHaveCount(1)
      for (let i = 1; i < count; i++) await items.nth(i).click()
      await expect(entry).toHaveCount(1)
    }
  })

  test('hovering a chart with a pinned run lists only current-run series in the tooltip while the pinned lines stay drawn', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })

    for (const id of RESOURCE_CHARTS) {
      const chart = page.getByTestId(id)
      await expect(path(page, id, 'pinned:food')).toHaveCount(1)
      await expect(path(page, id, 'food')).toHaveCount(1)
      let names: string[] = []
      await expect(async () => {
        const point = await plotPoint(page, id, 0.15)
        await page.mouse.move(point.x - 3, point.y)
        await page.mouse.move(point.x, point.y)
        const tooltip = chart.locator('.recharts-tooltip-wrapper')
        await expect(tooltip).toBeVisible()
        names = await tooltip.locator('.recharts-tooltip-item-name').allTextContents()
        expect(names).toContain('Food')
      }).toPass()
      expect(names.filter((n) => n.endsWith('(pinned)'))).toEqual([])
      expect(((await path(page, id, 'pinned:food').getAttribute('stroke-dasharray')) ?? '').trim()).not.toBe('')
    }
  })

  test('a legend item has a solid swatch in its line colour and hides and restores both lines of its series', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })
    const chart = page.getByTestId('chart-gather-rates')
    const item = chart.locator('[data-testid="chart-series-legend-item"][data-series="food"]')
    await expect(item).toHaveCount(1)

    const stroke = (await path(page, 'chart-gather-rates', 'food').getAttribute('stroke'))!
    const swatch = item.getByTestId('chart-series-legend-swatch')
    await expect(swatch).toHaveCSS('border-top-style', 'solid')
    await expect(swatch).toHaveCSS('border-top-color', hexToRgb(stroke))
    expect(await path(page, 'chart-gather-rates', 'pinned:food').getAttribute('stroke')).toBe(stroke)

    await item.click()
    await expect(item).toHaveCSS('opacity', '0.5')
    await expect(chart.locator('[data-testid="chart-series-legend-item"][aria-pressed="true"]')).toHaveCount(1)
    await expect(item).toHaveAttribute('aria-pressed', 'true')
    await expect(path(page, 'chart-gather-rates', 'food')).toHaveCount(0)
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(0)
    await expect(path(page, 'chart-gather-rates', 'wood')).toHaveCount(1)
    await expect(path(page, 'chart-gather-rates', 'pinned:wood')).toHaveCount(1)

    await item.click()
    await expect(chart.locator('[data-testid="chart-series-legend-item"][aria-pressed="true"]')).toHaveCount(0)
    await expect(item).toHaveCSS('opacity', '1')
    await expect(path(page, 'chart-gather-rates', 'food')).toHaveCount(1)
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
  })

  test('a series only the pinned run has gets one dashed legend item that hides its dashed line', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('build-order-text')).toHaveValue(DEFAULT_PASTE)
    await pin(page)
    await runOk(page, { text: NO_MILITARY_PASTE })
    const chart = page.getByTestId('chart-units-produced')
    const keys = await chart.getByTestId('chart-series-legend-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-series')!))
    const current = new Set(await chart.locator('path[data-series]:not([data-series^="pinned:"])').evaluateAll((els) => els.map((e) => e.getAttribute('data-series'))))
    const only = keys.filter((k) => !current.has(k))
    expect(only.length).toBeGreaterThan(0)
    const item = chart.locator(`[data-testid="chart-series-legend-item"][data-series="${only[0]}"]`)
    const swatch = item.getByTestId('chart-series-legend-swatch')
    await expect(swatch).toHaveCSS('border-top-style', 'dashed')
    const stroke = (await path(page, 'chart-units-produced', `pinned:${only[0]}`).getAttribute('stroke'))!
    await expect(swatch).toHaveCSS('border-top-color', hexToRgb(stroke))
    await item.click()
    await expect(path(page, 'chart-units-produced', `pinned:${only[0]}`)).toHaveCount(0)
  })

  test('the compare table appears only with a pin and a result, omits rows blank on both sides and shows delta = current - pinned', async ({ page }) => {
    await openPage(page)
    const table = page.getByTestId('compare-key-numbers')
    const pinnedRun = await runOk(page, { duration: 1200, text: NO_MILITARY_PASTE })
    await expect(table).toHaveCount(0)
    await pin(page)
    await expect(table).toBeVisible()
    const current = await runOk(page, { duration: 1200, text: DEFAULT_PASTE })

    const rows = table.getByTestId('compare-row')
    const keys = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-key')))
    expect(keys).toEqual(expectedCompareKeys(current, pinnedRun))

    let nonZero = 0
    for (const [key, t] of [['military-600', 600], ['military-900', 900], ['military-1200', 1200]] as const) {
      const cells = rows.and(page.locator(`[data-key="${key}"]`)).locator('td')
      const cur = militaryAt(current, t)
      const pin0 = militaryAt(pinnedRun, t)
      await expect(cells.nth(1)).toHaveText(String(Math.round(pin0!)))
      await expect(cells.nth(2)).toHaveText(String(Math.round(cur!)))
      await expect(cells.nth(3)).toHaveText(militaryDelta(cur! - pin0!))
      const row = rows.and(page.locator(`[data-key="${key}"]`))
      if (cur! === pin0!) await expect(row).toHaveAttribute('data-direction', 'same')
      else if (cur! > pin0!) {
        await expect(row).toHaveAttribute('data-direction', 'better')
        await expect(cells.nth(3)).toHaveClass(/text-success/)
      } else {
        await expect(row).toHaveAttribute('data-direction', 'worse')
        await expect(cells.nth(3)).toHaveClass(/text-danger/)
      }
      if (cur! !== pin0!) nonZero++
    }
    expect(nonZero).toBeGreaterThan(0)
    // The pinned paste has no age-up, so an age row is missing on the pinned side and its delta is a dash.
    const missing = current.ages.find((a) => !pinnedRun.ages.some((p) => p.age === a.age))
    expect(missing).toBeDefined()
    const ageCells = rows.and(page.locator(`[data-key="age-${missing!.age}"]`)).locator('td')
    await expect(ageCells.nth(1)).toHaveText(NOT_REACHED)
    await expect(ageCells.nth(3)).toHaveText(DASH)
    await expect(ageCells.nth(2)).not.toHaveText(NOT_REACHED)
    await expect(rows.and(page.locator(`[data-key="age-${missing!.age}"]`))).not.toHaveAttribute('data-direction', /.*/)
  })

  test('a pinned 1200 s run against a 300 s run shows the run end for later military rows and a gap in current lines', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await pin(page)
    await runOk(page, { duration: 300 })

    for (const key of ['military-900', 'military-1200']) {
      const cells = page.locator(`[data-testid="compare-row"][data-key="${key}"] td`)
      await expect(cells.nth(1)).not.toHaveText(DASH)
      await expect(cells.nth(2)).toHaveText('run ends at 5:00')
      await expect(cells.nth(3)).toHaveText(DASH)
    }
    // The shared x axis runs out to the pinned run's 1200 s, past the 300 s current run.
    const chart = page.getByTestId('chart-gather-rates')
    await expect(chart.locator('.recharts-cartesian-axis-tick-value', { hasText: /^20:00$/ })).toHaveCount(1)
    const box = async (key: string) => (await path(page, 'chart-gather-rates', key).boundingBox())!
    const current = await box('food')
    const pinned = await box('pinned:food')
    expect(pinned.width).toBeGreaterThan(current.width * 2)
  })

  test('a pinned run that ends earlier shows run ends at on the pinned side of a military row the current run has', async ({ page }) => {
    await openPage(page)
    const short = await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 1200 })
    expect(short.times).not.toContain(900)
    const row = page.locator('[data-testid="compare-row"][data-key="military-900"]')
    const cells = row.locator('td')
    await expect(cells.nth(1)).toHaveText('run ends at 5:00')
    await expect(cells.nth(2)).not.toHaveText(/run ends|not reached|—/)
    await expect(cells.nth(3)).toHaveText(DASH)
    await expect(row).not.toHaveAttribute('data-direction', /.*/)
  })

  test('age deltas read m:ss earlier or later with matching direction and colour', async ({ page }) => {
    const loaded = await waitForRun(page, () => page.goto(AOE4_PAGE))
    const first = (await loaded.json()) as SimulationResult
    await showTab(page, 'results')
    await pin(page)
    let checked = 0
    for (const build of listBuilds().slice(1)) {
      const second = await runOk(page, { text: formatBuildOrderText(build) })
      for (const age of second.ages) {
        const other = first.ages.find((a) => a.age === age.age)
        if (!other || other.reachedAt === age.reachedAt) continue
        const delta = age.reachedAt - other.reachedAt
        const row = page.locator(`[data-testid="compare-row"][data-key="age-${age.age}"]`)
        await expect(row.locator('td').nth(1)).toHaveText(formatMinSec(other.reachedAt))
        await expect(row.locator('td').nth(2)).toHaveText(formatMinSec(age.reachedAt))
        await expect(row.locator('td').nth(3)).toHaveText(`${formatMinSec(Math.abs(delta))} ${delta < 0 ? 'earlier' : 'later'}`)
        await expect(row).toHaveAttribute('data-direction', delta < 0 ? 'better' : 'worse')
        await expect(row.locator('td').nth(3)).toHaveClass(delta < 0 ? /text-success/ : /text-danger/)
        checked++
      }
      if (checked > 0) break
    }
    expect(checked).toBeGreaterThan(0)
  })

  test('the pin survives a text edit and a prebuilt change, and the overlay stays', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { text: NO_MILITARY_PASTE })
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    page.once('dialog', (dialog) => dialog.accept())
    await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ index: 0 }))
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await runOk(page, { duration: 600, text: NO_MILITARY_PASTE })
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
  })

  test('an invalid paste dims charts and table and keeps the pin; the next valid run restores full opacity', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    await expectFlySyntaxIssue(page)
    await expectInvalidNoRun(page)
    await showTab(page, 'results')
    await expect.poll(() => lastGoodOpacity(page)).toBeLessThanOrEqual(0.5)
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    for (const chart of CHART_IDS) await expect(page.getByTestId(chart)).toBeVisible()
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await expect(page.getByTestId('pin-run')).toBeEnabled()

    await runOk(page, { text: 'start -> sheep' })
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    // Same pin: its run was 300 s, so the pinned line still ends at 5:00 while the current one runs to 10:00.
    await expect
      .poll(async () => {
        const pinnedBox = await path(page, 'chart-gather-rates', 'pinned:food').boundingBox()
        const currentBox = await path(page, 'chart-gather-rates', 'food').boundingBox()
        return pinnedBox !== null && currentBox !== null && pinnedBox.width < currentBox.width
      })
      .toBe(true)
  })

  test('pinning the shown result gives same on every row with a value; unpin removes overlay and table', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 900 })
    await pin(page)

    const rows = page.getByTestId('compare-row')
    const texts = await rows.evaluateAll((els) => els.map((e) => ({
      key: e.getAttribute('data-key'),
      direction: e.getAttribute('data-direction'),
      cells: Array.from(e.querySelectorAll('td')).map((td) => td.textContent),
    })))
    expect(texts.length).toBeGreaterThan(0)
    for (const { cells, direction } of texts) {
      const [, pinnedValue, currentValue, delta] = cells
      expect(currentValue).toBe(pinnedValue)
      expect(delta).toBe('same')
      expect(direction).toBe('same')
    }
    expect(texts.map((r) => r.key)).not.toContain('military-1200')
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)

    await page.getByTestId('unpin-run').click()
    await expect(page.getByTestId('compare-key-numbers')).toHaveCount(0)
    for (const chart of CHART_IDS) {
      await expect(page.getByTestId(chart).locator('path[data-series^="pinned:"]')).toHaveCount(0)
      await expect(page.getByTestId(chart).locator('path[data-series]').first()).toBeVisible()
    }
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
  })

  test('shows compare-empty when both runs are blank on every row', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300, text: NO_MILITARY_PASTE })
    await pin(page)
    await expect(page.getByTestId('compare-empty')).toHaveText('Nothing to compare yet')
    await expect(page.getByTestId('compare-row')).toHaveCount(0)
    await expect(page.getByTestId('compare-scroll')).toHaveCount(0)
  })

  test('the compare table sits in a scroll wrapper', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await pin(page)
    await expect(page.getByTestId('compare-scroll').getByTestId('compare-key-numbers')).toBeVisible()
    await expect(page.getByTestId('compare-scroll')).toHaveCSS('overflow-x', 'auto')
  })

  test('with a pin, axis labels do not overlap the tick labels at 1280 px wide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openPage(page)
    await runOk(page, { duration: 3600, text: NO_MILITARY_PASTE })
    await pin(page)
    await runOk(page, { duration: 3000 })
    await expect(path(page, 'chart-floating-resources', 'pinned:food')).toHaveCount(1)

    for (const chart of CHART_IDS) {
      const root = page.getByTestId(chart)
      const label = (await root.locator('.recharts-label').boundingBox())!
      const ticks = await root.locator('.recharts-cartesian-axis-tick-value', { hasText: /^\d+$/ }).all()
      expect(ticks.length).toBeGreaterThan(1)
      for (const tick of ticks) {
        const box = (await tick.boundingBox())!
        const disjoint =
          label.x + label.width <= box.x || box.x + box.width <= label.x ||
          label.y + label.height <= box.y || box.y + box.height <= label.y
        expect(disjoint).toBe(true)
      }
    }
  })
})

const PIN_KEY = 'aoe4-build-order.pinned-run'
const BUILDS = listBuilds().map((b) => ({ name: b.name, text: formatBuildOrderText(b) }))
const label = (page: Page) => page.getByTestId('pinned-label')

async function pinAndExpectLabel(page: Page, name: string) {
  await pin(page)
  await expect(label(page)).toHaveText(`Pinned: ${name}, 20:00`)
}

const storedPin = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), PIN_KEY)
const storePin = (page: Page, value: unknown) =>
  page.evaluate(([key, raw]) => window.localStorage.setItem(key, raw), [PIN_KEY, typeof value === 'string' ? value : JSON.stringify(value)])
const validStored = { version: 1, name: BUILDS[0].name, text: DEFAULT_PASTE, durationSeconds: LOAD_DURATION }
// A duration the load run never uses, so the restore request can be told apart from it by body.
const RESTORE_DURATION = 900
const restoreStored = { ...validStored, durationSeconds: RESTORE_DURATION }
// Only for loads with no edit, where every other post is the load run.
const isRestore = (r: Request) => isSimulatePost(r) && bodyDuration(r) !== LOAD_DURATION

function trackPosts(page: Page, keep: (r: Request) => boolean): Request[] {
  const posts: Request[] = []
  page.on('request', (r) => {
    if (keep(r)) posts.push(r)
  })
  return posts
}

const routeRestore = (page: Page, answer: (route: Route) => Promise<void>) =>
  page.route(`**${SIMULATE_PATH}`, (route) => (bodyDuration(route.request()) === RESTORE_DURATION ? answer(route) : route.continue()))

async function expectNoPin(page: Page) {
  await expect(status(page)).toHaveAttribute('data-status', 'current')
  await expect(page.getByTestId('unpin-run')).toBeDisabled()
  await expect(label(page)).toHaveCount(0)
  await expect(page.getByTestId('simulation-error')).toHaveCount(0)
}

test.describe('AoE4 build order pin persistence and label', () => {
  test.describe('a reload keeps the pin in the tabs layout', () => {
    test.use({ viewport: TABS_VIEWPORT })

    test('a reload keeps the pin and re-runs it on load', async ({ page }) => {
      const warnings: string[] = []
      page.on('console', (m) => {
        if (/hydrat|did not match/i.test(m.text())) warnings.push(m.text())
      })
      await openPage(page)
      await showTab(page, 'results')
      await pin(page)

      const posts = trackPosts(page, isSimulatePost)
      await page.reload()
      await expect(page.getByTestId('tab-results')).toBeEnabled()
      await expect(page.getByTestId('unpin-run')).toBeEnabled()
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
      await showTab(page, 'results')
      await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)
      await expect(page.getByTestId('build-order-text')).toHaveValue(DEFAULT_PASTE)
      await expect(status(page)).toHaveAttribute('data-status', 'current')
      await expect.poll(() => posts.length).toBe(2)
      for (const post of posts) {
        expect(post.postDataJSON().buildOrder).toBeDefined()
        expect(bodyDuration(post)).toBe(LOAD_DURATION)
      }
      expect(warnings).toEqual([])

      await runOk(page, { duration: 600 })
      await expect(page.getByTestId('pin-run')).toBeEnabled()
      await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    })
  })

  test('the label names the prebuilt, marks an edit, and is fixed when pinned', async ({ page }) => {
    expect(BUILDS.length).toBeGreaterThan(1)
    await openPage(page)
    await showTab(page, 'results')
    await pinAndExpectLabel(page, BUILDS[0].name)

    await page.getByTestId('unpin-run').click()
    await runOk(page, { text: NO_MILITARY_PASTE })
    await pinAndExpectLabel(page, `${BUILDS[0].name} (edited)`)

    await page.getByTestId('unpin-run').click()
    await showTab(page, 'build')
    page.once('dialog', (dialog) => dialog.accept())
    await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ index: 1 }))
    await runOk(page, { text: DEFAULT_PASTE })
    await pinAndExpectLabel(page, BUILDS[0].name)

    await page.getByTestId('unpin-run').click()
    await runOk(page, { text: NO_MILITARY_PASTE })
    await pinAndExpectLabel(page, `${BUILDS[1].name} (edited)`)

    await runOk(page, { text: DEFAULT_PASTE })
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[1].name} (edited), 20:00`)

    await showTab(page, 'build')
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByTestId('build-order-select').selectOption({ index: 0 })
    await showTab(page, 'results')
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[1].name} (edited), 20:00`)
    expect(JSON.parse((await storedPin(page)) ?? '{}').name).toBe(`${BUILDS[1].name} (edited)`)
  })

  test('a restored pin shows its stored name', async ({ page }) => {
    await openPage(page)
    await storePin(page, { ...validStored, name: 'My name' })
    await page.reload()
    await showTab(page, 'results')
    await expect(label(page)).toHaveText('Pinned: My name, 20:00')
  })

  test('pin is disabled while the shown run equals the pin', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await pin(page)
    await expect(page.getByTestId('pin-run')).toBeDisabled()

    await runOk(page, { text: NO_MILITARY_PASTE })
    await expect(page.getByTestId('pin-run')).toBeEnabled()

    await runOk(page, { text: DEFAULT_PASTE })
    await expect(page.getByTestId('pin-run')).toBeDisabled()

    await runOk(page, { duration: 600 })
    await expect(page.getByTestId('pin-run')).toBeEnabled()
    await pin(page)
    await expect(page.getByTestId('pin-run')).toBeDisabled()

    await runOk(page, { duration: 1200 })
    await expect(page.getByTestId('pin-run')).toBeEnabled()
    await pin(page)
    await expect(page.getByTestId('pin-run')).toBeDisabled()

    await page.getByTestId('unpin-run').click()
    await expect(page.getByTestId('pin-run')).toBeEnabled()
  })

  test('results dim when the text or duration turns invalid, and the next settled valid input restores them', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    await showTab(page, 'results')
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect.poll(() => lastGoodOpacity(page)).toBeLessThanOrEqual(0.5)
    await expect(page.getByTestId('chart-gather-rates')).toBeVisible()

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(DEFAULT_PASTE)
    await showTab(page, 'results')
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)

    await page.getByTestId('duration-seconds').fill('59')
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect.poll(() => lastGoodOpacity(page)).toBeLessThanOrEqual(0.5)
    await runOk(page, { duration: 600 })
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)
  })

  test('pin and unpin write through to localStorage', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600, text: NO_MILITARY_PASTE })
    await pin(page)
    expect(JSON.parse((await storedPin(page)) ?? 'null')).toEqual({
      version: 1,
      name: `${BUILDS[0].name} (edited)`,
      text: NO_MILITARY_PASTE,
      durationSeconds: 600,
    })

    await page.getByTestId('unpin-run').click()
    expect(await storedPin(page)).toBeNull()
    acceptBeforeUnload(page)
    await page.reload()
    await expectNoPin(page)
  })

  for (const [name, stored] of [
    ['invalid JSON', '{nope'],
    ['version 2', { ...restoreStored, version: 2 }],
    ['a missing field', { version: 1, name: 'x', text: DEFAULT_PASTE }],
  ] as const) {
    test(`a stored pin with ${name} is dropped`, async ({ page }) => {
      await openPage(page)
      await storePin(page, stored)
      const posts = trackPosts(page, isRestore)
      await page.reload()
      await expectNoPin(page)
      await expect.poll(() => storedPin(page)).toBeNull()
      expect(posts).toHaveLength(0)
    })
  }

  test('a stored text that does not convert is dropped without a request', async ({ page }) => {
    await openPage(page)
    await storePin(page, { ...restoreStored, text: INVALID_PASTE })
    const posts = trackPosts(page, isRestore)
    await page.reload()
    await expectNoPin(page)
    await expect.poll(() => storedPin(page)).toBeNull()
    expect(posts).toHaveLength(0)
  })

  for (const [status] of [[400], [500]] as const) {
    test(`a restore answered with ${status} drops the stored pin and shows no pin`, async ({ page }) => {
      await openPage(page)
      await storePin(page, restoreStored)
      await routeRestore(page, (route) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ issues: [{ message: 'bad' }] }) })
      )
      const answered = page.waitForResponse((r) => isRestore(r.request()))
      await page.reload()
      await answered
      await expectNoPin(page)
      await expect.poll(() => storedPin(page)).toBeNull()
    })
  }

  test('after a dropped restore the next load makes no restore request', async ({ page }) => {
    await openPage(page)
    await storePin(page, restoreStored)
    await routeRestore(page, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
    const answered = page.waitForResponse((r) => isRestore(r.request()))
    await page.reload()
    await answered
    await expect.poll(() => storedPin(page)).toBeNull()
    await page.unroute(`**${SIMULATE_PATH}`)
    const posts = trackPosts(page, isRestore)
    await page.reload()
    await expectNoPin(page)
    expect(posts).toHaveLength(0)
  })

  test('a restore whose request fails keeps the stored pin and shows no pin', async ({ page }) => {
    await openPage(page)
    await storePin(page, restoreStored)
    await routeRestore(page, (route) => route.abort())
    const failed = page.waitForEvent('requestfailed', isRestore)
    await page.reload()
    await failed
    await expectNoPin(page)
    expect(await storedPin(page)).not.toBeNull()
  })

  test('a Pin made while the restore is in flight keeps the user pin when the restore fails', async ({ page }) => {
    await openPage(page)
    await storePin(page, restoreStored)
    let release = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    await routeRestore(page, async (route) => {
      await gate
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    })
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await runOk(page, { duration: 300 })
    await pin(page)
    const stored = await storedPin(page)
    release()
    await expect(label(page)).toBeVisible()
    await page.waitForTimeout(300)
    expect(await storedPin(page)).toBe(stored)
  })

  test('with localStorage unavailable, runs and Pin still work and nothing persists', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('blocked')
        },
      })
    })
    await openPage(page)
    await showTab(page, 'results')
    await pinAndExpectLabel(page, BUILDS[0].name)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)

    await page.reload()
    await expectNoPin(page)
    expect(errors).toEqual([])
  })

  test('a run that finishes before the restore lands keeps its result; then only the pin appears', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    const heldAnswers: string[] = []
    page.on('response', (r) => {
      if (isSimulatePost(r.request()) && bodyDuration(r.request()) === LOAD_DURATION) heldAnswers.push(r.url())
    })
    const release = await holdNextSimulate(page, LOAD_DURATION)
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    const result = await runOk(page, { duration: 600 })
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
    await expect(label(page)).toHaveCount(0)
    expect(heldAnswers).toEqual([])

    release()
    await expect.poll(() => heldAnswers.length).toBe(1)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    expect(result.durationSeconds).toBe(600)
    await expect(page.getByTestId('pin-run')).toBeEnabled()
    const deltas = await page.getByTestId('compare-row').evaluateAll((rows) => rows.map((row) => row.querySelectorAll('td')[3].textContent))
    expect(deltas.some((delta) => delta !== 'same')).toBe(true)
  })

  test('a Pin before the restore lands wins over the restore', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    const release = await holdNextSimulate(page, LOAD_DURATION)
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    await runOk(page, { duration: 600 })
    await pin(page)
    const landed = page.waitForResponse((r) => isSimulatePost(r.request()) && bodyDuration(r.request()) === LOAD_DURATION)
    release()
    await landed
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)))
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 10:00`)
    expect(JSON.parse((await storedPin(page)) ?? 'null').durationSeconds).toBe(600)
  })

  test('an Unpin before the restore lands wins over the restore', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    const release = await holdNextSimulate(page, LOAD_DURATION)
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    await runOk(page, { duration: 600 })
    await pin(page)
    await page.getByTestId('unpin-run').click()
    const landed = page.waitForResponse((r) => isSimulatePost(r.request()) && bodyDuration(r.request()) === LOAD_DURATION)
    release()
    await landed
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)))
    await expect(label(page)).toHaveCount(0)
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
    expect(await storedPin(page)).toBeNull()
  })

  for (const [name, stored, requests] of [
    ['a numeric name', { ...restoreStored, name: 7 }, 0],
    ['a null duration', { ...restoreStored, durationSeconds: null }, 0],
    ['a text over the length cap', { ...restoreStored, text: 'start -> sheep\n'.repeat(2000) }, 0],
    ['a duration the route rejects', { ...restoreStored, durationSeconds: 99_999_999 }, 1],
  ] as const) {
    test(`a stored pin with ${name} is dropped and shows no pin`, async ({ page }) => {
      await openPage(page)
      await storePin(page, stored)
      const posts = trackPosts(page, isRestore)
      await page.reload()
      await expectNoPin(page)
      await expect.poll(() => storedPin(page)).toBeNull()
      expect(posts).toHaveLength(requests)
    })
  }

  test('with every localStorage method throwing, runs and Pin still work and nothing persists', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => {
      for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
        Storage.prototype[method] = () => {
          throw new Error('quota')
        }
      }
    })
    await openPage(page)
    await showTab(page, 'results')
    await pinAndExpectLabel(page, BUILDS[0].name)
    await page.getByTestId('unpin-run').click()
    await expect(label(page)).toHaveCount(0)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)

    await page.reload()
    await expectNoPin(page)
    expect(errors).toEqual([])
  })
})
