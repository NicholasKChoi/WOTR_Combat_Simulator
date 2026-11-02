import { test, expect, type Page } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { SIMULATE_PATH, buildOrderFrom, openPage, runRejected, runSimulation, showView } from './helpers'

const textarea = (page: Page) => page.getByTestId('build-order-text')
const issues = (page: Page) => page.getByTestId('build-order-issue')

const TWO_UNKNOWN_IDS = ['start -> sheep', 'produce knigt from stable', 'produce spearmn from barracks'].join('\n')

async function expectPostedChecked(page: Page, duration?: string) {
  if (duration !== undefined) await page.getByTestId('duration-seconds').fill(duration)
  const text = await textarea(page).inputValue()
  const response = await runSimulation(page)
  expect(response.status()).toBe(200)
  const body = response.request().postDataJSON()
  expect(Object.keys(body).sort()).toEqual(['buildOrder', 'inputs'])
  expect(body.buildOrder).toEqual(buildOrderFrom(text))
  return body
}

test.describe('AoE4 build order page checks the paste before posting', () => {
  for (const build of listBuilds()) {
    test(`the prebuilt build "${build.name}" posts a buildOrder and no text`, async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-select').selectOption({ label: build.name })
      const body = await expectPostedChecked(page, '900')
      expect(body.inputs.durationSeconds).toBe(900)
    })
  }

  test('a pasted build posts a buildOrder and no text', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill('start 6 sheep -> sheep\nproduce villager from capital-town-center x3 -> sheep')
    await expectPostedChecked(page)
  })

  test('a table edit posts a buildOrder that includes the edit and no text', async ({ page }) => {
    await openPage(page)
    const before = buildOrderFrom(await textarea(page).inputValue())
    await showView(page, 'table')
    await page.getByTestId('step-add').click()
    await showView(page, 'text')
    const body = await expectPostedChecked(page)
    expect(body.buildOrder.steps).toHaveLength(before.steps.length + 1)
  })

  test('every client issue carries its code and line, in order, and the next valid run removes them', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await runRejected(page)
    await expect(issues(page)).toHaveCount(2)
    await expect(issues(page).nth(0)).toHaveAttribute('data-line', '2')
    await expect(issues(page).nth(0)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page).nth(0)).toContainText('knigt')
    await expect(issues(page).nth(1)).toHaveAttribute('data-line', '3')
    await expect(issues(page).nth(1)).toHaveAttribute('data-code', 'unknown-id')
    await expect(issues(page).nth(1)).toContainText('spearmn')

    await textarea(page).fill('start -> sheep')
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
  })

  test('an issue without a line has no data-line attribute', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill('x'.repeat(20001))
    await runRejected(page)
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page)).not.toHaveAttribute('data-line', /.*/)
  })

  test('the issue list sits under the textarea', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await runRejected(page)
    const { textBottom, listTop } = await page.evaluate(() => {
      const text = document.querySelector('[data-testid="build-order-text"]')!.getBoundingClientRect()
      const list = document.querySelector('[data-testid="build-order-issues"]')!.getBoundingClientRect()
      return { textBottom: text.bottom, listTop: list.top }
    })
    expect(listTop).toBeGreaterThanOrEqual(textBottom)
  })

  test('a server 400 shows its issues in simulation-error and none in build-order-issues', async ({ page }) => {
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
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toContainText('server problem')
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
    await expect(issues(page)).toHaveCount(0)
  })

  test('a server 400 after a client rejection replaces the issue list with the server error', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'server problem', issues: [{ code: 'syntax', message: 'server problem' }] }),
      })
    )
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await runRejected(page)
    await textarea(page).fill('start -> sheep')
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toContainText('server problem')
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
  })

  test('a client rejection clears an earlier server error', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('duration-seconds').fill('59')
    expect((await runSimulation(page)).status()).toBe(400)
    await expect(page.getByTestId('simulation-error')).toBeVisible()
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await runRejected(page)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
  })

  test('Run stays enabled after a rejection, so repeated and corrected runs act', async ({ page }) => {
    await openPage(page)
    await textarea(page).fill(TWO_UNKNOWN_IDS)
    await runRejected(page)
    await expect(page.getByTestId('run-simulation')).toBeEnabled()
    await runRejected(page)
    await expect(issues(page)).toHaveCount(2)
    await expect(page.getByTestId('run-simulation')).toBeEnabled()

    await textarea(page).fill('start -> sheep')
    expect((await runSimulation(page)).status()).toBe(200)
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
