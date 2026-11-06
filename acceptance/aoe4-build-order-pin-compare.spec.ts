import { test, expect, type Locator, type Page, type Request } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { CHART_IDS, INVALID_PASTE, RESOURCE_CHARTS, SIMULATE_PATH, expectFlySyntaxIssue, expectedCompareKeys, hexToRgb, openPage, runRejected, runSimulation, showTab } from './helpers'

const DASH = '—'
const MINUS = '−'
const NOT_REACHED = 'not reached'
const DEFAULT_PASTE = formatBuildOrderText(listBuilds()[0])
const NO_MILITARY_PASTE = 'start -> sheep'

async function run(page: Page, opts: { duration?: number; text?: string } = {}) {
  if (opts.text !== undefined) {
    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(opts.text)
  }
  if (opts.duration !== undefined) await page.getByTestId('duration-seconds').fill(String(opts.duration))
  return await runSimulation(page)
}

async function runOk(page: Page, opts: { duration?: number; text?: string } = {}) {
  const response = await run(page, opts)
  expect(response.status()).toBe(200)
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
  test('pin is disabled with no result, enabled after a run; unpin is disabled until a pin exists', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('pin-run')).toBeDisabled()
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
    await runOk(page)
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

  test('the pinned legend item toggles only the pinned line', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })
    const chart = page.getByTestId('chart-gather-rates')
    const item = chart.locator('[data-testid="chart-series-legend-item"][data-series="pinned:food"]')
    await expect(item).toHaveCount(1)

    const keys = await chart.getByTestId('chart-series-legend-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-series')))
    expect(keys.slice(0, 4)).toEqual(['food', 'pinned:food', 'wood', 'pinned:wood'])
    for (const key of ['food', 'pinned:food']) {
      const stroke = (await path(page, 'chart-gather-rates', key).getAttribute('stroke'))!
      const swatch = chart.locator(`[data-series="${key}"]`).getByTestId('chart-series-legend-swatch')
      await expect(swatch).toHaveCSS('border-top-style', key === 'food' ? 'solid' : 'dashed')
      await expect(swatch).toHaveCSS('border-top-color', hexToRgb(stroke))
    }

    await item.click()
    await expect(item).toHaveCSS('opacity', '0.5')
    await expect(chart.locator('[data-testid="chart-series-legend-item"][aria-pressed="true"]')).toHaveCount(1)
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(0)
    await expect(path(page, 'chart-gather-rates', 'food')).toHaveCount(1)
    await expect(path(page, 'chart-gather-rates', 'pinned:wood')).toHaveCount(1)

    await item.click()
    await expect(chart.locator('[data-testid="chart-series-legend-item"][aria-pressed="true"]')).toHaveCount(0)
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    await expect(path(page, 'chart-gather-rates', 'food')).toHaveCount(1)
  })

  test('the current legend item toggles only the current line', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })
    const chart = page.getByTestId('chart-gather-rates')
    const item = chart.locator('[data-testid="chart-series-legend-item"][data-series="food"]')
    const pinnedItem = chart.locator('[data-testid="chart-series-legend-item"][data-series="pinned:food"]')
    await expect(item).toHaveCount(1)
    await expect(pinnedItem).toHaveCount(1)

    await item.click()
    await expect(item).toHaveCSS('opacity', '0.5')
    await expect(pinnedItem).toHaveCSS('opacity', '1')
    await expect(chart.locator('[data-testid="chart-series-legend-item"][aria-pressed="true"]')).toHaveCount(1)
    await expect(path(page, 'chart-gather-rates', 'food')).toHaveCount(0)
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)

    await item.click()
    await expect(path(page, 'chart-gather-rates', 'food')).toHaveCount(1)
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
    await runOk(page, { duration: 1200 })
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

  test('the pin survives a text edit and a prebuilt change, and the overlay stays', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(NO_MILITARY_PASTE)
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await showTab(page, 'results')
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    await page.getByTestId('build-order-select').selectOption({ index: 0 })
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await runOk(page, { duration: 600, text: NO_MILITARY_PASTE })
    await expect(path(page, 'chart-gather-rates', 'pinned:food')).toHaveCount(1)
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
  })

  test('a rejected paste removes charts and table but keeps the pin; the next valid run restores both', async ({ page }) => {
    await openPage(page)
    await runOk(page, { duration: 300 })
    await pin(page)
    await runOk(page, { duration: 600 })
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    await runRejected(page)
    await expectFlySyntaxIssue(page)
    await expect(page.getByTestId('compare-key-numbers')).toHaveCount(0)
    for (const chart of CHART_IDS) await expect(page.getByTestId(chart)).toHaveCount(0)
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await expect(page.getByTestId('pin-run')).toBeDisabled()

    await runOk(page, { text: 'start -> sheep' })
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
    await runOk(page)
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
const STALE_TEXT = 'These results are from an earlier build or duration. Run again to update.'
const label = (page: Page) => page.getByTestId('pinned-label')
const storedPin = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), PIN_KEY)
const storePin = (page: Page, value: unknown) =>
  page.evaluate(([key, raw]) => window.localStorage.setItem(key, raw), [PIN_KEY, typeof value === 'string' ? value : JSON.stringify(value)])
const validStored = { version: 1, name: BUILDS[0].name, text: DEFAULT_PASTE, durationSeconds: 1200 }

function trackPosts(page: Page): Request[] {
  const posts: Request[] = []
  page.on('request', (r) => {
    if (r.url().endsWith(SIMULATE_PATH) && r.method() === 'POST') posts.push(r)
  })
  return posts
}

async function holdFirstSimulate(page: Page) {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  let first = true
  await page.route(`**${SIMULATE_PATH}`, async (route) => {
    if (first) {
      first = false
      await gate
    }
    await route.continue()
  })
  return release
}

async function expectNoPin(page: Page) {
  await expect(page.getByTestId('tab-results')).toBeDisabled()
  await expect(label(page)).toHaveCount(0)
  await expect(page.getByTestId('simulation-error')).toHaveCount(0)
}

test.describe('AoE4 build order pin persistence and label', () => {
  test('a reload keeps the pin and re-runs it without a Run', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (m) => {
      if (/hydrat|did not match/i.test(m.text())) warnings.push(m.text())
    })
    await openPage(page)
    await runOk(page, { duration: 1200 })
    await pin(page)

    const posts = trackPosts(page)
    await page.reload()
    await expect(page.getByTestId('tab-results')).toBeEnabled()
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await showTab(page, 'results')
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)
    await expect(page.getByTestId('build-order-text')).toHaveValue(DEFAULT_PASTE)
    expect(posts).toHaveLength(1)
    const body = posts[0].postDataJSON()
    expect(body.buildOrder).toBeDefined()
    expect(body.inputs.durationSeconds).toBe(1200)
    expect(warnings).toEqual([])

    await runOk(page, { duration: 600 })
    await expect(page.getByTestId('pin-run')).toBeEnabled()
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
  })

  test('the label names the prebuilt, marks an edit, and is fixed when pinned', async ({ page }) => {
    expect(BUILDS.length).toBeGreaterThan(1)
    await openPage(page)
    await runOk(page, { duration: 1200 })
    await pin(page)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)

    await page.getByTestId('unpin-run').click()
    await runOk(page, { text: NO_MILITARY_PASTE })
    await pin(page)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name} (edited), 20:00`)

    await page.getByTestId('unpin-run').click()
    await showTab(page, 'build')
    await page.getByTestId('build-order-select').selectOption({ index: 1 })
    await runOk(page, { text: DEFAULT_PASTE })
    await pin(page)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)

    await page.getByTestId('unpin-run').click()
    await runOk(page, { text: NO_MILITARY_PASTE })
    await pin(page)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[1].name} (edited), 20:00`)

    await runOk(page, { text: DEFAULT_PASTE })
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[1].name} (edited), 20:00`)

    await showTab(page, 'build')
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
    await runOk(page, { duration: 1200 })
    await pin(page)
    await expect(page.getByTestId('pin-run')).toBeDisabled()

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(NO_MILITARY_PASTE)
    await showTab(page, 'results')
    await expect(page.getByTestId('pin-run')).toBeDisabled()

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

  test('results are marked stale when the text or duration changes, and a Run clears it', async ({ page }) => {
    const stale = page.getByTestId('results-stale')
    await openPage(page)
    await runOk(page)
    await expect(stale).toHaveCount(0)

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(NO_MILITARY_PASTE)
    await showTab(page, 'results')
    await expect(stale).toBeVisible()
    await expect(stale).toHaveText(STALE_TEXT)
    await expect(page.getByTestId('chart-gather-rates')).toBeVisible()

    await showTab(page, 'build')
    await page.getByTestId('build-order-text').fill(DEFAULT_PASTE)
    await showTab(page, 'results')
    await expect(stale).toHaveCount(0)

    await page.getByTestId('duration-seconds').fill('600')
    await expect(stale).toBeVisible()
    await runOk(page)
    await expect(stale).toHaveCount(0)
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
    await page.reload()
    await expectNoPin(page)
  })

  for (const [name, stored] of [
    ['invalid JSON', '{nope'],
    ['version 2', { ...validStored, version: 2 }],
    ['a missing field', { version: 1, name: 'x', text: DEFAULT_PASTE }],
  ] as const) {
    test(`a stored pin with ${name} is dropped`, async ({ page }) => {
      await openPage(page)
      await storePin(page, stored)
      const posts = trackPosts(page)
      await page.reload()
      await expectNoPin(page)
      await expect.poll(() => storedPin(page)).toBeNull()
      expect(posts).toHaveLength(0)
    })
  }

  test('a stored text that does not convert is dropped without a request', async ({ page }) => {
    await openPage(page)
    await storePin(page, { ...validStored, text: INVALID_PASTE })
    const posts = trackPosts(page)
    await page.reload()
    await expectNoPin(page)
    await expect.poll(() => storedPin(page)).toBeNull()
    expect(posts).toHaveLength(0)
  })

  for (const [status] of [[400], [500]] as const) {
    test(`a restore answered with ${status} drops the stored pin and shows no pin`, async ({ page }) => {
      await openPage(page)
      await storePin(page, validStored)
      await page.route(`**${SIMULATE_PATH}`, (route) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ issues: [{ message: 'bad' }] }) })
      )
      const answered = page.waitForResponse((r) => r.url().endsWith(SIMULATE_PATH))
      await page.reload()
      await answered
      await expectNoPin(page)
      await expect.poll(() => storedPin(page)).toBeNull()
    })
  }

  test('after a dropped restore the next load makes no restore request', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    await page.route(`**${SIMULATE_PATH}`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
    const answered = page.waitForResponse((r) => r.url().endsWith(SIMULATE_PATH))
    await page.reload()
    await answered
    await expect.poll(() => storedPin(page)).toBeNull()
    await page.unroute(`**${SIMULATE_PATH}`)
    const posts = trackPosts(page)
    await page.reload()
    await expectNoPin(page)
    expect(posts).toHaveLength(0)
  })

  test('a restore whose request fails keeps the stored pin and shows no pin', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    await page.route(`**${SIMULATE_PATH}`, (route) => route.abort())
    const failed = page.waitForEvent('requestfailed', (r) => r.url().endsWith(SIMULATE_PATH))
    await page.reload()
    await failed
    await expectNoPin(page)
    expect(await storedPin(page)).not.toBeNull()
  })

  test('a Pin made while the restore is in flight keeps the user pin when the restore fails', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    let release = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    let restore = true
    await page.route(`**${SIMULATE_PATH}`, async (route) => {
      if (!restore) return route.continue()
      restore = false
      await gate
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    })
    await page.reload()
    await runOk(page, { duration: 300 })
    await pin(page)
    const stored = await storedPin(page)
    release()
    await expect(label(page)).toBeVisible()
    await page.waitForTimeout(300)
    expect(await storedPin(page)).toBe(stored)
  })

  test('with localStorage unavailable, Run and Pin still work and nothing persists', async ({ page }) => {
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
    await runOk(page)
    await pin(page)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)

    await page.reload()
    await expectNoPin(page)
    expect(errors).toEqual([])
  })

  test('a Run that finishes before the restore lands keeps its result; then only the pin appears', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    const release = await holdFirstSimulate(page)
    await page.reload()
    const result = await runOk(page, { duration: 600 })
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
    await expect(label(page)).toHaveCount(0)

    release()
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
    await expect(page.getByTestId('results-stale')).toHaveCount(0)
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    expect(result.durationSeconds).toBe(600)
    await expect(page.getByTestId('pin-run')).toBeEnabled()
    const deltas = await page.getByTestId('compare-row').evaluateAll((rows) => rows.map((row) => row.querySelectorAll('td')[3].textContent))
    expect(deltas.some((delta) => delta !== 'same')).toBe(true)
  })

  test('a Pin before the restore lands wins over the restore', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    const release = await holdFirstSimulate(page)
    await page.reload()
    await runOk(page, { duration: 600 })
    await pin(page)
    const landed = page.waitForResponse((r) => r.url().endsWith(SIMULATE_PATH))
    release()
    await landed
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)))
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 10:00`)
    expect(JSON.parse((await storedPin(page)) ?? 'null').durationSeconds).toBe(600)
  })

  test('an Unpin before the restore lands wins over the restore', async ({ page }) => {
    await openPage(page)
    await storePin(page, validStored)
    const release = await holdFirstSimulate(page)
    await page.reload()
    await runOk(page, { duration: 600 })
    await pin(page)
    await page.getByTestId('unpin-run').click()
    const landed = page.waitForResponse((r) => r.url().endsWith(SIMULATE_PATH))
    release()
    await landed
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)))
    await expect(label(page)).toHaveCount(0)
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
    expect(await storedPin(page)).toBeNull()
  })

  for (const [name, stored, requests] of [
    ['a numeric name', { ...validStored, name: 7 }, 0],
    ['a null duration', { ...validStored, durationSeconds: null }, 0],
    ['a text over the length cap', { ...validStored, text: 'start -> sheep\n'.repeat(2000) }, 0],
    ['a duration the route rejects', { ...validStored, durationSeconds: 99_999_999 }, 1],
  ] as const) {
    test(`a stored pin with ${name} is dropped and shows no pin`, async ({ page }) => {
      await openPage(page)
      await storePin(page, stored)
      const posts = trackPosts(page)
      await page.reload()
      await expectNoPin(page)
      await expect.poll(() => storedPin(page)).toBeNull()
      expect(posts).toHaveLength(requests)
    })
  }

  test('with every localStorage method throwing, Run and Pin still work and nothing persists', async ({ page }) => {
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
    await runOk(page)
    await pin(page)
    await expect(label(page)).toHaveText(`Pinned: ${BUILDS[0].name}, 20:00`)
    await page.getByTestId('unpin-run').click()
    await expect(label(page)).toHaveCount(0)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)

    await page.reload()
    await expectNoPin(page)
    expect(errors).toEqual([])
  })
})
