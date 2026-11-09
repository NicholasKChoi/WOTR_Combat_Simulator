import { test, expect, type Page } from '@playwright/test'
import { SIMULATE_PATH, openPage, runSimulation, showTab } from './helpers'

const errorBox = (page: Page) => page.getByTestId('simulation-error')

test.describe('AoE4 build order page run outcomes', () => {
  test('a successful run posts the request body to the simulate path and shows the results tab', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('duration-seconds').fill('300')
    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    const request = response.request()
    expect(request.headers()['content-type']).toContain('application/json')
    expect(Object.keys(request.postDataJSON()).sort()).toEqual(['buildOrder', 'inputs'])
    expect(request.postDataJSON().inputs).toEqual({ durationSeconds: 300 })
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
    await openPage(page)
    expect((await runSimulation(page)).status()).toBe(400)
    const items = errorBox(page).locator('li')
    await expect(items).toHaveText(['first problem', 'second problem', '7 more issues not shown.'])
  })

  test('a 400 whose omittedIssues is zero adds no count line', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'bad', issues: [{ code: 'syntax', message: 'only problem' }], omittedIssues: 0 }),
      })
    )
    await openPage(page)
    await runSimulation(page)
    await expect(errorBox(page).locator('li')).toHaveText(['only problem'])
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
      await openPage(page)
      await runSimulation(page)
      await expect(errorBox(page).locator('li')).toHaveText([row.message])
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    })
  }

  test('a network failure shows the try-again message and a later good run clears it', async ({ page }) => {
    await openPage(page)
    await page.route(`**${SIMULATE_PATH}`, (route) => route.abort())
    await page.getByTestId('run-simulation').click()
    await expect(errorBox(page).locator('li')).toHaveText(['The simulation could not be run. Please try again.'])

    await page.unroute(`**${SIMULATE_PATH}`)
    expect((await runSimulation(page)).status()).toBe(200)
    await expect(errorBox(page)).toHaveCount(0)
    await showTab(page, 'results')
    await expect(page.getByTestId('chart-units-produced')).toBeVisible()
  })

  test('a 200 whose body is not JSON is reported as the try-again failure', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: 'not json' }))
    await openPage(page)
    await runSimulation(page)
    await expect(errorBox(page).locator('li')).toHaveText(['The simulation could not be run. Please try again.'])
  })
})
