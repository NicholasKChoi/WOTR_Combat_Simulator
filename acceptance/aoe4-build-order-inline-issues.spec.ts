import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { INVALID_PASTE, SIMULATE_PATH, expectFlySyntaxIssue, openPage, runRejected, runSimulation, showTab, showView } from './helpers'

const textarea = (page: Page) => page.getByTestId('build-order-text')
const gutterItem = (page: Page, line: number) => page.locator(`[data-testid="build-order-line-number"][data-line="${line}"]`)
const issues = (page: Page) => page.getByTestId('build-order-issue')

const UNKNOWN_ID_PASTE = ['start -> sheep', 'produce knigt from stable'].join('\n')
const VALID_PASTE = ['start -> sheep', 'produce knight from stable'].join('\n')
const TWO_UNKNOWN_IDS = ['start -> sheep', 'produce knigt from stable', 'produce spearmn from barracks'].join('\n')
const LONG_PASTE = [
  'start -> sheep',
  ...Array.from({ length: 60 }, () => 'produce villager from capital-town-center x3 -> sheep'),
  'at 8 vils fly capital-town-center',
].join('\n')

async function expectNoErrorMarks(page: Page) {
  await expect(page.locator('[data-testid="build-order-line-number"][data-error]')).toHaveCount(0)
}

// Scrolling is smooth: the target passes through the valid window on its way past, so a position only counts
// once it has not moved for a while. Both rects are read in one evaluate.
// The list can be taller than the room left below it at the bottom of the page, so only its top has to be visible.
async function expectInViewBelowRunBar(page: Page, testId: string, line?: number) {
  const selector = line === undefined ? `[data-testid="${testId}"]` : `[data-testid="${testId}"][data-line="${line}"]`
  await expect
    .poll(() =>
      page.evaluate(async ({ sel, wholeItem }) => {
        const target = document.querySelector(sel)!
        const barBottom = document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect().bottom
        const before = target.getBoundingClientRect().top
        await new Promise((resolve) => setTimeout(resolve, 250))
        const rect = target.getBoundingClientRect()
        return rect.top === before && rect.top >= barBottom && rect.top < window.innerHeight && (!wholeItem || rect.bottom <= window.innerHeight)
      }, { sel: selector, wholeItem: line !== undefined })
    )
    .toBe(true)
}

function scrollToTop(page: Page) {
  return page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
}

test.describe('AoE4 build order live issues', () => {
  test('a parse issue shows without a Run, marks its gutter line and has no suggestion', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(INVALID_PASTE)
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await expectFlySyntaxIssue(page)
    await expect(page.getByTestId('build-order-issue-suggestion')).toHaveCount(0)
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
    await expect(gutterItem(page, 1)).not.toHaveAttribute('data-error', /.*/)

    await textarea(page).fill(VALID_PASTE)
    await expect(issues(page)).toHaveCount(0)
    await expectNoErrorMarks(page)
  })

  test('check issues wait for the first Run, then track the text with a suggestion', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
    await expectNoErrorMarks(page)

    await runRejected(page)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page)).toHaveAttribute('data-line', '2')
    await expect(issues(page)).toContainText('knigt')
    await expect(page.getByTestId('build-order-issue-suggestion')).toHaveText('did you mean knight?')
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)

    await textarea(page).fill(VALID_PASTE)
    await expect(issues(page)).toHaveCount(0)
    await expectNoErrorMarks(page)

    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
  })

  test('a valid Run also starts the live check issues', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(VALID_PASTE)
    expect((await runSimulation(page)).status()).toBe(200)
    await showTab(page, 'build')
    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).toHaveAttribute('data-code', 'unknown-id')
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
  })

  test('every issue is listed in line order and marks its gutter line', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await runRejected(page)
    await expect(issues(page)).toHaveCount(2)
    await expect(issues(page).nth(0)).toHaveAttribute('data-line', '2')
    await expect(issues(page).nth(1)).toHaveAttribute('data-line', '3')
    await expect(page.locator('[data-testid="build-order-line-number"][data-error="true"]')).toHaveCount(2)
    await expect(gutterItem(page, 1)).not.toHaveAttribute('data-error', /.*/)
  })

  test('a rejected Run scrolls the first issue line under the run bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await openPage(page)
    await textarea(page).fill(LONG_PASTE)
    await runRejected(page)
    await expectInViewBelowRunBar(page, 'build-order-line-number', 62)
  })

  test('a rejected Run whose issue has no line scrolls to the list', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await openPage(page)
    await textarea(page).fill(Array.from({ length: 201 }, () => 'x'.repeat(99)).join('\n'))
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await scrollToTop(page)
    expect(await page.getByTestId('build-order-issues').evaluate((el) => el.getBoundingClientRect().top > window.innerHeight)).toBe(true)
    await runRejected(page)
    await expectInViewBelowRunBar(page, 'build-order-issues')
  })

  test('rejecting the same text again scrolls to the issue again', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await openPage(page)
    await textarea(page).fill(LONG_PASTE)
    await runRejected(page)
    await expectInViewBelowRunBar(page, 'build-order-line-number', 62)
    await scrollToTop(page)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await runRejected(page)
    await expectInViewBelowRunBar(page, 'build-order-line-number', 62)
  })

  test('an issue in the middle of the text lands below the run bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await openPage(page)
    const lines = Array.from({ length: 151 }, () => 'produce villager from capital-town-center x3 -> sheep')
    lines[0] = 'start -> sheep'
    lines[80] = 'produce knigt from stable'
    await textarea(page).fill(lines.join('\n'))
    await runRejected(page)
    await expectInViewBelowRunBar(page, 'build-order-line-number', 81)
  })

  test('in table view a rejection scrolls the list and keeps the table view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await openPage(page)
    await textarea(page).fill(
      ['start -> sheep', ...Array.from({ length: 30 }, () => 'produce villager from capital-town-center x3 -> sheep'), 'produce knigt from stable'].join('\n')
    )
    await showView(page, 'table')
    await expect(page.getByTestId('step-table')).toBeVisible()
    await runRejected(page)
    await expect(page.getByTestId('editor-view-table')).toHaveAttribute('aria-pressed', 'true')
    await expectInViewBelowRunBar(page, 'build-order-issues')
  })

  test('a live issue never clears the shown result', async ({ page }) => {
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(200)
    await showTab(page, 'build')
    await textarea(page).fill(INVALID_PASTE)
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await showTab(page, 'results')
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
  })

  test('a server 400 stays in simulation-error and marks no gutter line', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'server problem', issues: [{ code: 'out-of-range', message: 'server problem', line: 2 }] }),
      })
    )
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toContainText('server problem')
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
    await expectNoErrorMarks(page)
  })
})

test.describe('AoE4 build order gold run-out info list', () => {
  test.describe.configure({ timeout: 90_000 })

  test('lists the gold run-outs only in the collapsed info list', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-select').selectOption({ label: "ENG Knight/Longbow (King's Palace)" })
    await page.getByTestId('duration-seconds').fill('1800')
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult
    const infos = [...result.warnings, ...result.notes].filter((m) => m.severity === 'info')
    const gold = infos.filter((m) => m.code === 'node-depleted' && /^gold(#2)? ran out/.test(m.message)).map((m) => m.message)
    expect(gold.length).toBeGreaterThanOrEqual(2)

    await expect(page.getByTestId('simulation-notes-list')).toHaveCount(0)
    await expect(page.getByTestId('simulation-notes-toggle')).toHaveText(`Show ${infos.length} info messages`)
    await page.getByTestId('simulation-notes-toggle').click()
    const goldItems = page
      .getByTestId('simulation-notes-list')
      .locator('[data-testid="simulation-message"][data-severity="info"][data-code="node-depleted"]')
      .filter({ hasText: /^gold(#2)? ran out/ })
    await expect(goldItems).toHaveText(gold)
    await expect(page.getByTestId('simulation-warnings').getByTestId('simulation-message').filter({ hasText: /^gold/ })).toHaveCount(0)
  })
})
