import { test, expect, type Locator, type Page } from '@playwright/test'
import { openPage, runRejected, runSimulation, showTab, showView } from './helpers'

const PHONE = { width: 390, height: 844 }
const KNIGHT_LONGBOW = "ENG Knight/Longbow (King's Palace)"
const SCROLL_BOXES = ['step-timeline-scroll', 'compare-scroll'] as const

const pageWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth)

async function expectNoSidewaysScroll(page: Page) {
  await expect.poll(() => pageWidth(page)).toBeLessThanOrEqual(PHONE.width)
}

async function runOk(page: Page, duration: string) {
  await page.getByTestId('duration-seconds').fill(duration)
  const response = await runSimulation(page)
  expect(response.status()).toBe(200)
}

async function pinnedResults(page: Page) {
  await openPage(page)
  await runOk(page, '200')
  await page.getByTestId('pin-run').click()
  await runOk(page, '300')
  await showTab(page, 'results')
  await expect(page.getByTestId('compare-scroll')).toBeVisible()
}

const box = (locator: Locator) =>
  locator.evaluate((el) => ({ overflowX: getComputedStyle(el).overflowX, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }))

test.describe('AoE4 build order at a 390 px screen', () => {
  test.use({ viewport: PHONE })

  test('the Build tab text view does not scroll sideways', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('build-order-text')).toBeVisible()
    await expectNoSidewaysScroll(page)
  })

  test('the Build tab table view of the longest build does not scroll sideways', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-select').selectOption({ label: KNIGHT_LONGBOW })
    await showView(page, 'table')
    await expect(page.getByTestId('step-start-row')).toBeVisible()
    await expectNoSidewaysScroll(page)
  })

  test('the Results tab with a result and a pinned run does not scroll sideways', async ({ page }) => {
    await pinnedResults(page)
    for (const id of ['chart-series-legend', 'chart-marker-legend', ...SCROLL_BOXES]) {
      await expect(page.getByTestId(id).first()).toBeVisible()
    }
    await expectNoSidewaysScroll(page)
  })

  test('the timeline and compare tables scroll in their own boxes', async ({ page }) => {
    await pinnedResults(page)
    for (const id of SCROLL_BOXES) {
      const { overflowX, scrollWidth, clientWidth } = await box(page.getByTestId(id))
      expect(overflowX).toBe('auto')
      expect(scrollWidth).toBeGreaterThan(clientWidth)
    }
  })

  test('a 3000 character unknown unit id in an issue does not scroll the page sideways', async ({ page }) => {
    const id = 'a'.repeat(3000)
    await openPage(page)
    await page.getByTestId('build-order-text').fill(`start -> sheep\nproduce ${id} from town-center`)
    await runRejected(page)
    const issues = page.getByTestId('build-order-issue')
    await expect(issues).toHaveCount(1)
    await expect(issues.first()).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues.first()).toContainText(id)
    await expectNoSidewaysScroll(page)
  })
})

test.describe('AoE4 build order at a 1280 px screen', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('the timeline and compare tables fit their boxes', async ({ page }) => {
    await pinnedResults(page)
    for (const id of SCROLL_BOXES) {
      const { scrollWidth, clientWidth } = await box(page.getByTestId(id))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    }
  })
})
