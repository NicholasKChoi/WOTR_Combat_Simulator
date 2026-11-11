import { test, expect, type Page } from '@playwright/test'
import { CHART_LAYOUT_STORAGE_KEY, type ChartId } from '../components/apps/aoe4-build-order/chart-layout'
import { CHART_IDS, SPLIT_VIEWPORT, TABS_VIEWPORT, openPage, showTab, showView } from './helpers'

const [UNITS, RATES, GATHERED, FLOATING] = CHART_IDS
const DEFAULT_ORDER: readonly string[] = CHART_IDS

const chart = (page: Page, id: string) => page.getByTestId(id)
const control = (page: Page, id: string, name: 'chart-collapse' | 'chart-move-up' | 'chart-move-down') => chart(page, id).getByTestId(name)
const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), CHART_LAYOUT_STORAGE_KEY)

// One evaluate so a redraw cannot land between reads.
const readLayout = (page: Page) =>
  page.evaluate(() => {
    const charts = [...document.querySelectorAll('[data-testid="results-last-good"] > [data-collapsed]')]
    return {
      order: charts.map((el) => el.getAttribute('data-testid')),
      collapsed: charts.filter((el) => el.getAttribute('data-collapsed') === 'true').map((el) => el.getAttribute('data-testid')),
    }
  })

async function expectLayout(page: Page, order: readonly string[], collapsed: readonly string[] = []) {
  await expect.poll(async () => {
    const layout = await readLayout(page)
    return { order: layout.order, collapsed: [...layout.collapsed].sort() }
  }).toEqual({ order, collapsed: [...collapsed].sort() })
}

const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName)
const activeChart = (page: Page) => page.evaluate(() => document.activeElement?.closest('[data-collapsed]')?.getAttribute('data-testid') ?? null)

async function openResults(page: Page) {
  await openPage(page)
  await showTab(page, 'results')
  await expect(chart(page, UNITS)).toBeVisible()
}

async function expectNoAlert(page: Page, errors: string[]) {
  await expect(page.locator('[role="alert"]').filter({ hasText: /\S/ })).toHaveCount(0)
  expect(errors).toEqual([])
}

const collectErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test.describe('AoE4 chart collapse and reorder', () => {
  test.use({ viewport: TABS_VIEWPORT })

  test('with no stored layout the charts are in default order, expanded, and loading writes nothing', async ({ page }) => {
    await openResults(page)
    await expectLayout(page, DEFAULT_ORDER)
    expect(await stored(page)).toBeNull()
  })

  test('collapse hides the body and keeps the title and buttons; expanding restores it with its state', async ({ page }) => {
    await openResults(page)
    const body = chart(page, RATES).getByTestId('chart-body')
    const perVillager = page.getByTestId('gather-rates-per-villager')
    await perVillager.check()
    const legendItem = chart(page, RATES).getByTestId('chart-series-legend-item').first()
    await legendItem.click()
    await expect(legendItem).toHaveAttribute('aria-pressed', 'true')
    const hiddenKey = await legendItem.getAttribute('data-series')

    await control(page, RATES, 'chart-collapse').click()
    await expect(body).toBeHidden()
    await expect(control(page, RATES, 'chart-collapse')).toHaveAttribute('aria-expanded', 'false')
    await expect(chart(page, RATES)).toHaveAttribute('data-collapsed', 'true')
    await expect(chart(page, RATES).getByRole('heading', { name: 'Gather rates' })).toBeVisible()
    for (const name of ['chart-collapse', 'chart-move-up', 'chart-move-down'] as const) await expect(control(page, RATES, name)).toBeVisible()
    await expect(perVillager).toBeHidden()
    await expectLayout(page, DEFAULT_ORDER, [RATES])
    for (const id of [UNITS, GATHERED, FLOATING]) await expect(chart(page, id).getByTestId('chart-body')).toBeVisible()

    await control(page, RATES, 'chart-collapse').click()
    await expect(body).toBeVisible()
    await expect(control(page, RATES, 'chart-collapse')).toHaveAttribute('aria-expanded', 'true')
    await expect(perVillager).toBeChecked()
    await expect(chart(page, RATES).locator('.recharts-label', { hasText: 'Per villager per minute' })).toBeVisible()
    await expect(chart(page, RATES).locator(`[data-testid="chart-series-legend-item"][data-series="${hiddenKey}"]`)).toHaveAttribute('aria-pressed', 'true')
  })

  test('move up and down swap with the neighbour and the end buttons are disabled', async ({ page }) => {
    await openResults(page)
    await expect(control(page, UNITS, 'chart-move-up')).toBeDisabled()
    await expect(control(page, FLOATING, 'chart-move-down')).toBeDisabled()
    await expect(control(page, RATES, 'chart-move-up')).toBeEnabled()

    await control(page, RATES, 'chart-move-up').click()
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING])
    await control(page, RATES, 'chart-move-down').click()
    await expectLayout(page, DEFAULT_ORDER)
    await control(page, UNITS, 'chart-move-down').click()
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING])
  })

  test('the header buttons are reached by Tab in order and Enter activates, and focus survives a move', async ({ page }) => {
    await openResults(page)
    await control(page, RATES, 'chart-collapse').focus()
    await page.keyboard.press('Tab')
    expect([await activeTestId(page), await activeChart(page)]).toEqual(['chart-move-up', RATES])
    await page.keyboard.press('Tab')
    expect([await activeTestId(page), await activeChart(page)]).toEqual(['chart-move-down', RATES])

    await control(page, UNITS, 'chart-collapse').focus()
    await page.keyboard.press('Tab')
    expect([await activeTestId(page), await activeChart(page)]).toEqual(['chart-move-down', UNITS])
    await expect(control(page, UNITS, 'chart-move-up')).toBeDisabled()
    await page.keyboard.press('Enter')
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING])
    await expect.poll(async () => [await activeTestId(page), await activeChart(page)]).toEqual(['chart-move-down', UNITS])

    await control(page, GATHERED, 'chart-move-down').focus()
    await page.keyboard.press('Enter')
    await expectLayout(page, [RATES, UNITS, FLOATING, GATHERED])
    await expect.poll(async () => [await activeTestId(page), await activeChart(page)]).toEqual(['chart-move-up', GATHERED])
  })

  test('the layout survives two reloads without interaction and a reload does not rewrite it', async ({ page }) => {
    await openResults(page)
    await control(page, FLOATING, 'chart-collapse').click()
    await control(page, RATES, 'chart-move-up').click()
    const order = [RATES, UNITS, GATHERED, FLOATING]
    await expectLayout(page, order, [FLOATING])
    const written = await stored(page)
    expect(JSON.parse(written!)).toEqual({ version: 1, order, collapsed: [FLOATING] })

    for (let reload = 0; reload < 2; reload++) {
      await openResults(page)
      await expectLayout(page, order, [FLOATING])
      expect(await stored(page)).toBe(written)
    }
  })

  const setStored = (value: string) => ({ value, key: CHART_LAYOUT_STORAGE_KEY })
  const storedCases: Array<[string, string, readonly string[]]> = [
    ['unknown ids only', JSON.stringify({ version: 1, order: ['a', 'b'], collapsed: ['c'] }), DEFAULT_ORDER],
    ['not JSON', '{nope', DEFAULT_ORDER],
    ['a layout missing one id', JSON.stringify({ version: 1, order: [FLOATING, RATES, UNITS], collapsed: [] }), [FLOATING, RATES, UNITS, GATHERED]],
  ]
  for (const [label, value, order] of storedCases) {
    test(`a stored value of ${label} normalises with no error`, async ({ page }) => {
      const errors = collectErrors(page)
      await page.addInitScript(({ value, key }) => localStorage.setItem(key, value), setStored(value))
      await openResults(page)
      await expectLayout(page, order)
      await expectNoAlert(page, errors)
    })
  }

  test('blocked localStorage still lets the page load, collapse and move for the session', async ({ page }) => {
    const errors = collectErrors(page)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await openResults(page)
    await control(page, RATES, 'chart-collapse').click()
    await control(page, RATES, 'chart-move-up').click()
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING], [RATES])
    await expectNoAlert(page, errors)
  })
})

test.describe('AoE4 chart layout with the build view', () => {
  test.use({ viewport: SPLIT_VIEWPORT })

  test('after a reorder the step band and pinned lines show on expanded charts and not on a collapsed one', async ({ page }) => {
    await openPage(page)
    await showView(page, 'table')
    await page.getByTestId('pin-run').click()
    const expanded: ChartId[] = [UNITS, RATES, FLOATING]
    for (const id of expanded) await expect(chart(page, id).locator('path[data-series^="pinned:"]').first()).toBeAttached()

    await control(page, GATHERED, 'chart-collapse').click()
    await control(page, UNITS, 'chart-move-down').click()
    await control(page, FLOATING, 'chart-move-up').click()
    await expectLayout(page, [RATES, UNITS, FLOATING, GATHERED], [GATHERED])
    await expect(chart(page, GATHERED).getByTestId('chart-body')).toBeHidden()
    await expect(page.getByTestId('step-row').first()).toBeVisible()

    await page.getByTestId('step-row').nth(1).hover()
    for (const id of expanded) {
      await expect(chart(page, id).getByTestId('chart-step-band').first()).toBeVisible()
      await expect(chart(page, id).locator('path[data-series^="pinned:"]').first()).toBeAttached()
    }
    await expect(chart(page, GATHERED).getByTestId('chart-step-band')).toHaveCount(0)
  })
})
