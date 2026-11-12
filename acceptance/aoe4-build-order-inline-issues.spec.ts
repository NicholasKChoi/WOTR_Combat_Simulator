import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { AOE4_PAGE, INVALID_PASTE, SIMULATE_PATH, TWO_UNKNOWN_IDS, expectFlySyntaxIssue, expectInvalidNoRun, fillTwoUnknownIds, openPage, showTab, showView, waitForRun } from './helpers'

const textarea = (page: Page) => page.getByTestId('build-order-text')
const gutterItem = (page: Page, line: number) => page.locator(`[data-testid="build-order-line-number"][data-line="${line}"]`)
const issues = (page: Page) => page.getByTestId('build-order-issue')

const UNKNOWN_ID_PASTE = ['start -> sheep', 'produce knigt from stable'].join('\n')
const VALID_PASTE = ['start -> sheep', 'produce knight from stable'].join('\n')
const SYNTAX_AND_UNKNOWN_ID_PASTE = ['start -> sheep', 'produce knigt from stable', 'build hous'].join('\n')
const FIXED_LINE_THREE_PASTE = ['start -> sheep', 'produce knigt from stable', 'produce villager from capital-town-center x3 -> sheep'].join('\n')
const summary = (page: Page) => page.getByTestId('build-order-issues-summary')

async function expectNoErrorMarks(page: Page) {
  await expect(page.locator('[data-testid="build-order-line-number"][data-error]')).toHaveCount(0)
}

test.describe('AoE4 build order live issues', () => {
  test('a parse issue shows once the text settles, marks its gutter line and has no suggestion', async ({ page }) => {
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

  test('check issues show once the text settles and track the text with a suggestion', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expectInvalidNoRun(page)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page)).toHaveAttribute('data-line', '2')
    await expect(issues(page)).toContainText('knigt')
    await expect(page.getByTestId('build-order-issue-suggestion')).toHaveText('Did you mean knight?')
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)

    await textarea(page).fill(VALID_PASTE)
    await expect(issues(page)).toHaveCount(0)
    await expectNoErrorMarks(page)

    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
  })

  test('the gutter number of an error line is bold and a different colour from a normal line', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(INVALID_PASTE)
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
    await expect
      .poll(() =>
        page.evaluate(() => {
          const style = (line: number) => getComputedStyle(document.querySelector(`[data-testid="build-order-line-number"][data-line="${line}"]`)!)
          const [error, normal] = [style(2), style(1)]
          return { errorWeight: error.fontWeight, errorDiffers: error.color !== normal.color, normalWeight: normal.fontWeight }
        })
      )
      .toEqual({ errorWeight: '700', errorDiffers: true, normalWeight: '400' })
  })

  test('a syntax error lists the other lines unknown-id issues, which stay once the line parses', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(SYNTAX_AND_UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(2)
    await expect(issues(page).nth(0)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page).nth(0)).toHaveAttribute('data-line', '2')
    await expect(issues(page).nth(1)).toHaveAttribute('data-code', 'syntax')
    await expect(issues(page).nth(1)).toHaveAttribute('data-line', '3')
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
    await expect(gutterItem(page, 3)).toHaveAttribute('data-error', 'true')

    await textarea(page).fill(FIXED_LINE_THREE_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).toHaveAttribute('data-code', 'unknown-id')
    await expect(gutterItem(page, 3)).not.toHaveAttribute('data-error', /.*/)
    await expectInvalidNoRun(page)
  })

  test('the summary counts the settled issues, tracks edits and goes away when the text converts', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(summary(page)).toHaveText('Fix 1 issue to run the simulation.')

    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await expect(issues(page)).toHaveCount(2)
    await expect(summary(page)).toHaveText('Fix 2 issues to run the simulation.')
    await expectInvalidNoRun(page)

    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(summary(page)).toHaveText('Fix 1 issue to run the simulation.')

    expect((await waitForRun(page, () => textarea(page).fill(VALID_PASTE))).status()).toBe(200)
    await expect(issues(page)).toHaveCount(0)
    await expect(summary(page)).toHaveCount(0)
    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(summary(page)).toHaveText('Fix 1 issue to run the simulation.')
  })

  test('check issues show after a valid run', async ({ page }) => {
    await openPage(page)
    expect((await waitForRun(page, () => textarea(page).fill(VALID_PASTE))).status()).toBe(200)
    await textarea(page).fill(UNKNOWN_ID_PASTE)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).toHaveAttribute('data-code', 'unknown-id')
    await expect(gutterItem(page, 2)).toHaveAttribute('data-error', 'true')
  })

  test('every issue is listed in line order and marks its gutter line', async ({ page }) => {
    await openPage(page)
    await fillTwoUnknownIds(page)
    await expect(page.locator('[data-testid="build-order-line-number"][data-error="true"]')).toHaveCount(2)
    await expect(gutterItem(page, 1)).not.toHaveAttribute('data-error', /.*/)
  })

  test('a check issue with no near match shows no suggestion', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(['start -> sheep', 'produce zzzzzzzzzz from stable'].join('\n'))
    await expectInvalidNoRun(page)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).toHaveAttribute('data-code', 'unknown-id')
    await expect(page.getByTestId('build-order-issue-suggestion')).toHaveCount(0)
  })

  test('the gutter marks exactly the lines that have an issue', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(
      ['start -> sheep', 'produce knigt from stable', 'produce villager from capital-town-center x3 -> sheep', 'produce spearmn from barracks', 'produce villager from capital-town-center x3 -> sheep'].join('\n')
    )
    await expectInvalidNoRun(page)
    await expect(issues(page)).toHaveCount(2)
    const marked = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-testid="build-order-line-number"][data-error="true"]')).map((el) => el.getAttribute('data-line'))
      )
    await expect.poll(marked).toEqual(['2', '4'])
  })

  test('in table view an invalid build shows the issue list and keeps the table view', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(
      ['start -> sheep', ...Array.from({ length: 30 }, () => 'produce villager from capital-town-center x3 -> sheep'), 'produce knigt from stable'].join('\n')
    )
    await showView(page, 'table')
    await expect(page.getByTestId('step-table')).toBeVisible()
    await expectInvalidNoRun(page)
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await expect(page.getByTestId('editor-view-table')).toHaveAttribute('aria-pressed', 'true')
  })

  test('a live issue never clears the shown result', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(INVALID_PASTE)
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await showTab(page, 'results')
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
  })

  test('a server 400 lists its issues under the editor and marks no gutter line', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'server problem', issues: [{ code: 'out-of-range', message: 'server problem', line: 2 }] }),
      })
    )
    await page.goto(AOE4_PAGE)
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'rejected')
    await expect(issues(page)).toHaveText(['server problem'])
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
    await expectNoErrorMarks(page)
  })
})

test.describe('AoE4 build order gold run-out info list', () => {
  test.describe.configure({ timeout: 90_000 })

  test('lists the gold run-outs only in the collapsed info list', async ({ page }) => {
    await openPage(page)
    const response = await waitForRun(page, async () => {
      await page.getByTestId('duration-seconds').fill('1800')
      await page.getByTestId('build-order-select').selectOption({ label: "ENG Knight/Longbow (King's Palace)" })
    })
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult
    const infos = [...result.warnings, ...result.notes].filter((m) => m.severity === 'info')
    const gold = infos.filter((m) => m.code === 'node-depleted' && /^gold(#2)? ran out/.test(m.message)).map((m) => m.message)
    expect(gold.length).toBeGreaterThanOrEqual(2)

    await showTab(page, 'results')
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
