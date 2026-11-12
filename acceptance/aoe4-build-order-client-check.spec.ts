import { test, expect, type Page } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { AOE4_PAGE, SIMULATE_PATH, TWO_UNKNOWN_IDS, buildOrderFrom, expectInvalidNoRun, fillTwoUnknownIds, openPage, showView, waitForRun } from './helpers'

const textarea = (page: Page) => page.getByTestId('build-order-text')
const issues = (page: Page) => page.getByTestId('build-order-issue')


async function expectPostedChecked(page: Page, action: () => Promise<unknown>, readText = () => textarea(page).inputValue()) {
  const response = await waitForRun(page, action)
  expect(response.status()).toBe(200)
  const text = await readText()
  const body = response.request().postDataJSON()
  expect(Object.keys(body).sort()).toEqual(['buildOrder', 'inputs'])
  expect(body.buildOrder).toEqual(buildOrderFrom(text))
  return body
}

test.describe('AoE4 build order page checks the paste before posting', () => {
  for (const build of listBuilds()) {
    test(`the prebuilt build "${build.name}" posts a buildOrder and no text`, async ({ page }) => {
      await openPage(page)
      const body = await expectPostedChecked(page, async () => {
        await page.getByTestId('duration-seconds').fill('900')
        await page.getByTestId('build-order-select').selectOption({ label: build.name })
      })
      expect(body.inputs.durationSeconds).toBe(900)
    })
  }

  test('a pasted build posts a buildOrder and no text', async ({ page }) => {
    await openPage(page)
    await expectPostedChecked(page, () => textarea(page).fill('start 6 sheep -> sheep\nproduce villager from capital-town-center x3 -> sheep'))
  })

  test('a table edit posts a buildOrder that includes the edit and no text', async ({ page }) => {
    await openPage(page)
    const before = buildOrderFrom(await textarea(page).inputValue())
    await showView(page, 'table')
    const body = await expectPostedChecked(
      page,
      () => page.getByTestId('step-add').click(),
      async () => {
        await showView(page, 'text')
        return textarea(page).inputValue()
      }
    )
    expect(body.buildOrder.steps).toHaveLength(before.steps.length + 1)
  })

  test('every client issue carries its code and line, in order, and the next valid run removes them', async ({ page }) => {
    await openPage(page)
    await fillTwoUnknownIds(page)
    await expect(issues(page).nth(0)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page).nth(0)).toContainText('knigt')
    await expect(issues(page).nth(1)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page).nth(1)).toContainText('spearmn')

    expect((await waitForRun(page, () => textarea(page).fill('start -> sheep'))).status()).toBe(200)
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
  })

  test('an issue without a line has no data-line attribute', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill('x'.repeat(20001))
    await expectInvalidNoRun(page)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).not.toHaveAttribute('data-line', /.*/)
  })

  test('the issue list sits under the textarea', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await expectInvalidNoRun(page)
    const { textBottom, listTop } = await page.evaluate(() => {
      const text = document.querySelector('[data-testid="build-order-text"]')!.getBoundingClientRect()
      const list = document.querySelector('[data-testid="build-order-issues"]')!.getBoundingClientRect()
      return { textBottom: text.bottom, listTop: list.top }
    })
    expect(listTop).toBeGreaterThanOrEqual(textBottom)
  })

  test('a server 400 lists its issues under the editor and shows no simulation-error', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'server problem',
          issues: [{ code: 'out-of-range', message: 'server problem', line: 2 }],
        }),
      })
    )
    await page.goto(AOE4_PAGE)
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'rejected')
    await expect(issues(page)).toHaveText(['server problem'])
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('a server 400 after client issues replaces the client issues with the server issues', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await expectInvalidNoRun(page)
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'server problem', issues: [{ code: 'syntax', message: 'server problem' }] }),
      })
    )
    await waitForRun(page, () => textarea(page).fill('start -> sheep'), 'rejected')
    await expect(issues(page)).toHaveText(['server problem'])
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('client issues clear an earlier server error', async ({ page }) => {
    await openPage(page)
    await page.route(`**${SIMULATE_PATH}`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) }))
    await waitForRun(page, () => textarea(page).fill('start -> sheep'), 'failed')
    await expect(page.getByTestId('simulation-error')).toBeVisible()
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await expectInvalidNoRun(page)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('repeated invalid edits post nothing and a corrected edit runs', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await expectInvalidNoRun(page)
    await textarea(page).fill(`${TWO_UNKNOWN_IDS}\n`)
    await expectInvalidNoRun(page)
    await expect(issues(page)).toHaveCount(2)

    expect((await waitForRun(page, () => textarea(page).fill('start -> sheep'))).status()).toBe(200)
  })

  test('the table view of a prebuilt build offers catalog choices and its edits rewrite the text', async ({ page }) => {
    await openPage(page)
    await showView(page, 'table')
    await expect(page.getByTestId('step-table')).toBeVisible()
    const unit = page.getByTestId('step-row').first().getByTestId('step-field-unit')
    await expect(unit.locator('option[value="scout"]')).toHaveCount(1)
    await unit.selectOption('scout')
    await showView(page, 'text')
    await expect(textarea(page)).toHaveValue(/^produce scout from capital-town-center/m)
  })
})
