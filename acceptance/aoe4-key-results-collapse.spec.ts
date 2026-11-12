import { test, expect, type Page } from '@playwright/test'
import { CHART_LAYOUT_STORAGE_KEY } from '../components/apps/aoe4-build-order/chart-layout'
import { CHART_IDS, SPLIT_VIEWPORT, openPage } from './helpers'

const [, RATES] = CHART_IDS

const caret = (page: Page) => page.getByTestId('compare-collapse')
const storedLayout = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null') as { collapsed: string[] } | null, CHART_LAYOUT_STORAGE_KEY)

async function openWithPin(page: Page) {
  await openPage(page)
  await page.getByTestId('pin-run').click()
  await expect(page.getByTestId('pinned-label')).toBeVisible()
}

test.describe('AoE4 key results panel collapse', () => {
  test.use({ viewport: SPLIT_VIEWPORT })

  test('the caret hides the body content, keeps the pin buttons and focus, and a second click restores it', async ({ page }) => {
    await openWithPin(page)
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()

    await caret(page).click()
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('compare-body')).toHaveAttribute('data-collapsed', 'true')
    await expect(page.getByTestId('pinned-label')).toBeHidden()
    await expect(page.getByTestId('compare-key-numbers')).toBeHidden()
    await expect(page.getByTestId('pin-run')).toBeVisible()
    await expect(page.getByTestId('unpin-run')).toBeVisible()
    await expect(page.getByTestId('compare-heading')).toHaveText('Key results')
    await expect(caret(page)).toBeFocused()

    await caret(page).click()
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('compare-body')).toHaveAttribute('data-collapsed', 'false')
    await expect(page.getByTestId('pinned-label')).toBeVisible()
    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    await expect(caret(page)).toBeFocused()
  })

  test('a reload keeps the key results panel and a chart collapsed', async ({ page }) => {
    await openWithPin(page)
    const chartCaret = page.getByTestId(RATES).getByTestId('chart-collapse')
    await expect(chartCaret).toHaveAttribute('aria-expanded', 'true')
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'true')
    await chartCaret.click()
    await caret(page).click()
    await expect(chartCaret).toHaveAttribute('aria-expanded', 'false')
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'false')
    expect((await storedLayout(page))?.collapsed.sort()).toEqual([RATES, 'key-results'].sort())

    await page.reload()
    await expect(page.getByTestId('pinned-label')).toBeHidden()
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId(RATES).getByTestId('chart-collapse')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId(RATES)).toHaveAttribute('data-collapsed', 'true')
  })

  test('a stored M8 layout loads, and loading with nothing stored leaves the key unset', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId(RATES)).toBeVisible()
    expect(await storedLayout(page)).toBeNull()

    await page.evaluate(
      ({ key, ids }) => localStorage.setItem(key, JSON.stringify({ version: 1, order: ids, collapsed: [ids[1]] })),
      { key: CHART_LAYOUT_STORAGE_KEY, ids: [...CHART_IDS] },
    )
    await openPage(page)
    await expect(page.getByTestId(RATES)).toHaveAttribute('data-collapsed', 'true')
    await expect(caret(page)).toHaveAttribute('aria-expanded', 'true')
  })
})
