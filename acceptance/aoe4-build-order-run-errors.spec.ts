import { test, expect, type Page } from '@playwright/test'
import { AOE4_PAGE, SIMULATE_PATH, TABS_VIEWPORT, openPage, showTab, waitForRun } from './helpers'

const errorBox = (page: Page) => page.getByTestId('simulation-error')
const status = (page: Page) => page.getByTestId('auto-run-status')

async function loadWithStatus(page: Page, expected: string) {
  await page.goto(AOE4_PAGE)
  await expect(status(page)).toHaveAttribute('data-status', expected)
}

test.describe('AoE4 build order page run outcomes', () => {
  test.use({ viewport: TABS_VIEWPORT })

  test('a successful run posts the request body to the simulate path and enables the results tab', async ({ page }) => {
    await openPage(page)
    const response = await waitForRun(page, () => page.getByTestId('duration-seconds').fill('300'))
    expect(response.status()).toBe(200)
    const request = response.request()
    expect(request.headers()['content-type']).toContain('application/json')
    expect(Object.keys(request.postDataJSON()).sort()).toEqual(['buildOrder', 'inputs'])
    expect(request.postDataJSON().inputs).toEqual({ durationSeconds: 300 })
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await showTab(page, 'results')
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
    await expect(errorBox(page)).toHaveCount(0)
  })

  test('a 400 with omitted issues lists each message then the count of issues not shown', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'bad',
          issues: [
            { code: 'syntax', message: 'first problem' },
            { code: 'syntax', message: 'second problem' },
          ],
          omittedIssues: 7,
        }),
      })
    )
    await loadWithStatus(page, 'rejected')
    const items = page.getByTestId('build-order-issues').locator('li')
    await expect(items).toHaveText(['first problem', 'second problem', '7 more issues not shown.'])
    await expect(errorBox(page)).toHaveCount(0)
  })

  test('a 400 whose omittedIssues is zero adds no count line', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'bad', issues: [{ code: 'syntax', message: 'only problem' }], omittedIssues: 0 }),
      })
    )
    await loadWithStatus(page, 'rejected')
    await expect(page.getByTestId('build-order-issues').locator('li')).toHaveText(['only problem'])
  })

  const unreadable: { name: string; status: number; body: string; contentType: string; message: string }[] = [
    { name: 'a 500', status: 500, body: '{}', contentType: 'application/json', message: 'The simulation could not be run (HTTP 500).' },
    { name: 'a 404', status: 404, body: 'nope', contentType: 'text/plain', message: 'The simulation could not be run (HTTP 404).' },
    { name: 'a 400 that is not JSON', status: 400, body: 'oops', contentType: 'text/plain', message: 'The simulation could not be run (HTTP 400).' },
    {
      name: 'a 400 with an empty issues list',
      status: 400,
      body: JSON.stringify({ error: 'bad', issues: [] }),
      contentType: 'application/json',
      message: 'The simulation could not be run (HTTP 400).',
    },
  ]

  for (const row of unreadable) {
    test(`${row.name} shows the HTTP status message on the build tab`, async ({ page }) => {
      await page.route(`**${SIMULATE_PATH}`, (route) => route.fulfill({ status: row.status, contentType: row.contentType, body: row.body }))
      await loadWithStatus(page, 'failed')
      await expect(errorBox(page)).toHaveText(row.message)
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    })
  }

  test('a network failure shows the try-again message and a later good run clears it', async ({ page }) => {
    await openPage(page)
    await page.route(`**${SIMULATE_PATH}`, (route) => route.abort())
    await page.getByTestId('duration-seconds').fill('900')
    await expect(status(page)).toHaveAttribute('data-status', 'failed')
    await expect(errorBox(page)).toHaveText('The simulation could not be run. Please try again.')

    await page.unroute(`**${SIMULATE_PATH}`)
    expect((await waitForRun(page, () => page.getByTestId('duration-seconds').fill('1000'))).status()).toBe(200)
    await expect(errorBox(page)).toHaveCount(0)
    await showTab(page, 'results')
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
  })

  test('a 200 whose body is not JSON is reported as the try-again failure', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: 'not json' }))
    await loadWithStatus(page, 'failed')
    await expect(errorBox(page)).toHaveText('The simulation could not be run. Please try again.')
  })
})
