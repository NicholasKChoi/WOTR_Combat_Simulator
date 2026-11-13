import { test, expect, type Page } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { AOE4_PAGE, SIMULATE_PATH, expectNoRun, holdNextSimulate, isSimulatePost, openPage, showTab, waitForRun } from './helpers'

const UNKNOWN_ID = ['start -> sheep', 'produce knigt from stable'].join('\n')
const FIRST_BUILD = listBuilds()[0].name
// Long enough for a response that leaks past a held request to land and flip the status before the held run is released.
const HELD_RESPONSE_WAIT_MS = 1000

const status = (page: Page) => page.getByTestId('auto-run-status')
const textarea = (page: Page) => page.getByTestId('build-order-text')
const duration = (page: Page) => page.getByTestId('duration-seconds')

test.describe('AoE4 build order auto-run page contract', () => {
  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('the server-rendered page is loading with no issues, no duration error, no result and no POST', async ({ page }) => {
      const posts: string[] = []
      page.on('request', (r) => {
        if (isSimulatePost(r)) posts.push(r.url())
      })
      await page.goto(AOE4_PAGE)
      await expect(status(page)).toHaveAttribute('data-status', 'loading')
      await expect(status(page)).toHaveText('Loading the build.')
      await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
      await expect(page.getByTestId('duration-error')).toHaveCount(0)
      await expect(page.getByTestId('results-last-good')).toHaveCount(0)
      await page.waitForTimeout(1000)
      expect(posts).toEqual([])
    })
  })

  test('the status line reads computing on the first run, then updating while a later run is in flight, then empty', async ({ page }) => {
    const answered: string[] = []
    page.on('response', (r) => {
      if (isSimulatePost(r.request())) answered.push(r.url())
    })
    const release = await holdNextSimulate(page)
    await page.goto(AOE4_PAGE)
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    await expect(status(page)).toHaveText('Computing the simulation.')
    await page.waitForTimeout(HELD_RESPONSE_WAIT_MS)
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    expect(answered).toEqual([])
    release()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(status(page)).toHaveText('')

    await page.unroute(`**${SIMULATE_PATH}`)
    const release2 = await holdNextSimulate(page)
    await duration(page).fill('900')
    await expect(status(page)).toHaveAttribute('data-status', 'updating')
    await expect(status(page)).toHaveText('Updating the results.')
    release2()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
  })

  test('the retry button is absent when the settled input is rejected by the server', async ({ page }) => {
    await openPage(page)
    await page.route(
      `**${SIMULATE_PATH}`,
      (route) => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'bad', issues: [{ code: 'syntax', message: 'nope' }] }) }),
      { times: 1 },
    )
    await waitForRun(page, () => duration(page).fill('900'), 'rejected')
    await expect(status(page)).toHaveText('The charts show the last valid build.')
    await expect(page.getByTestId('simulation-retry')).toHaveCount(0)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
    await expect(page.getByTestId('build-order-issues-omitted')).toHaveCount(0)
  })

  test('pinning while the charts are dimmed names the pin after the shown result, not the invalid text', async ({ page }) => {
    await openPage(page)
    await waitForRun(page, () => duration(page).fill('900'))
    await expectNoRun(page, () => textarea(page).fill(UNKNOWN_ID))
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('pinned-label')).toHaveText(`Pinned: ${FIRST_BUILD}, 15:00`)
  })
})
