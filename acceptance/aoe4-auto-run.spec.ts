import { test, expect, type Page, type Request } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import {
  AOE4_PAGE,
  SIMULATE_PATH,
  buildOrderFrom,
  expectNoRun,
  isSimulatePost,
  openPage,
  scrollInstantly,
  setDurationInPlace,
  settledScrollY,
  showTab,
  showView,
  waitForRun,
} from './helpers'
import { AUTO_RUN_DEBOUNCE_MS } from '../components/apps/aoe4-build-order/auto-run'
import { hasOptionalField } from '../components/apps/aoe4-build-order/step-table-model'

const BUILDS = listBuilds().map((b) => ({ name: b.name, text: formatBuildOrderText(b) }))
const VALID_A = ['start -> sheep', 'produce knight from stable'].join('\n')
const VALID_B = ['start -> sheep', 'produce spearman from barracks'].join('\n')
const UNKNOWN_ID = ['start -> sheep', 'produce knigt from stable'].join('\n')
const RANGE_MESSAGE = 'Duration must be a whole number of seconds from 60 to 3600.'

const status = (page: Page) => page.getByTestId('auto-run-status')
const textarea = (page: Page) => page.getByTestId('build-order-text')
const duration = (page: Page) => page.getByTestId('duration-seconds')
const lastGoodOpacity = (page: Page) => page.getByTestId('results-last-good').evaluate((el) => Number(getComputedStyle(el).opacity))
const posted = (r: Request) => r.postDataJSON() as { buildOrder: unknown; inputs: { durationSeconds: number } }
const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

function trackPosts(page: Page): Request[] {
  const posts: Request[] = []
  page.on('request', (r) => {
    if (isSimulatePost(r)) posts.push(r)
  })
  return posts
}

async function openPausedPage(page: Page) {
  await page.clock.install()
  await openPage(page)
  await page.clock.pauseAt(Date.now() + 60_000)
}

async function settle(page: Page) {
  await page.clock.runFor(AUTO_RUN_DEBOUNCE_MS + 1)
}

async function expectDimmed(page: Page) {
  await expect.poll(() => lastGoodOpacity(page)).toBeLessThanOrEqual(0.5)
}

test.describe('AoE4 build order auto-run', () => {
  test('no Run control', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('run-simulation')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^run\b/i })).toHaveCount(0)
    await expect(page.getByTestId('run-bar').getByTestId('auto-run-status')).toHaveCount(1)
  })

  test('first load runs once', async ({ page }) => {
    const hydration: string[] = []
    page.on('console', (m) => {
      if (/hydrat/i.test(m.text())) hydration.push(m.text())
    })
    const posts = trackPosts(page)
    await openPage(page)
    await expectNoRun(page)
    expect(posts).toHaveLength(1)
    expect(Object.keys(posted(posts[0])).sort()).toEqual(['buildOrder', 'inputs'])
    expect(posted(posts[0]).inputs).toEqual({ durationSeconds: 1200 })
    expect(posted(posts[0]).buildOrder).toEqual(json(buildOrderFrom(await textarea(page).inputValue())))
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tab-results')).toBeEnabled()
    expect(hydration).toEqual([])
  })

  test('one POST per settled text edit', async ({ page }) => {
    await openPausedPage(page)
    await textarea(page).fill(UNKNOWN_ID)
    await settle(page)
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect(page.getByTestId('build-order-issue')).toHaveCount(1)

    const posts = trackPosts(page)
    await textarea(page).fill(VALID_A)
    await page.clock.runFor(AUTO_RUN_DEBOUNCE_MS / 2)
    await textarea(page).fill(VALID_B)
    await page.clock.runFor(AUTO_RUN_DEBOUNCE_MS - 1)
    await expect(status(page)).not.toHaveAttribute('data-status', 'running')
    await expect(page.getByTestId('build-order-issue')).toHaveCount(1)
    await expect(page.getByTestId('build-order-issue')).toContainText('knigt')
    expect(posts).toHaveLength(0)

    const response = await waitForRun(page, () => page.clock.runFor(2))
    expect(response.status()).toBe(200)
    expect(posts).toHaveLength(1)
    expect(posted(posts[0]).buildOrder).toEqual(json(buildOrderFrom(VALID_B)))
    await expect(page.getByTestId('build-order-issue')).toHaveCount(0)
  })

  test('one POST per step-table and duration edit', async ({ page }) => {
    await openPage(page)
    const steps = buildOrderFrom(await textarea(page).inputValue()).steps.length
    await showView(page, 'table')
    const posts = trackPosts(page)
    await waitForRun(page, () => page.getByTestId('step-add').click())
    await expectNoRun(page)
    expect(posts).toHaveLength(1)
    expect((posted(posts[0]).buildOrder as { steps: unknown[] }).steps).toHaveLength(steps + 1)

    await waitForRun(page, () => duration(page).fill('900'))
    await expectNoRun(page)
    expect(posts).toHaveLength(2)
    expect(posted(posts[1]).inputs).toEqual({ durationSeconds: 900 })
  })

  test('an undo inside the debounce sends nothing', async ({ page }) => {
    await openPausedPage(page)
    const original = await textarea(page).inputValue()
    await expectNoRun(page, async () => {
      await textarea(page).fill(VALID_A)
      await page.clock.runFor(AUTO_RUN_DEBOUNCE_MS - 100)
      await textarea(page).fill(original)
      await settle(page)
    })
    await expect(status(page)).toHaveAttribute('data-status', 'current')

    await expectNoRun(page, async () => {
      await textarea(page).fill(`${original}\n# note`)
      await settle(page)
    })
    await expect(status(page)).toHaveAttribute('data-status', 'current')
  })

  test('Enter and build select skip the pause', async ({ page }) => {
    await openPausedPage(page)
    const byEnter = await waitForRun(page, async () => {
      await duration(page).fill('900')
      await duration(page).press('Enter')
    })
    expect(posted(byEnter.request()).inputs).toEqual({ durationSeconds: 900 })
    expect(page.url()).toContain(AOE4_PAGE)

    const other = BUILDS[1]
    const bySelect = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: other.name }))
    expect(posted(bySelect.request()).buildOrder).toEqual(json(buildOrderFrom(other.text)))
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('pinned-label')).toHaveText(`Pinned: ${other.name}, 15:00`)
  })

  test('an invalid text edit dims the charts', async ({ page }) => {
    await openPage(page)
    const original = await textarea(page).inputValue()
    await expectNoRun(page, () => textarea(page).fill(UNKNOWN_ID))
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect(status(page)).toHaveText('The charts show the last valid build.')
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await expect(page.getByTestId('build-order-issues-summary')).toHaveText('Fix 1 issue to run the simulation.')
    await expect(page.getByTestId('tab-results')).toBeEnabled()
    await showTab(page, 'results')
    await expect(page.getByTestId('results-last-good')).toBeVisible()
    await expectDimmed(page)

    await showTab(page, 'build')
    await expectNoRun(page, () => textarea(page).fill(original))
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)
  })

  test('a first invalid load state has no target', async ({ page }) => {
    let release = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    await page.route(`**${SIMULATE_PATH}`, async (route) => {
      await gate
      await route.continue().catch(() => {})
    })
    await page.goto(AOE4_PAGE)
    await expect(status(page)).toHaveAttribute('data-status', 'running')
    await textarea(page).fill(UNKNOWN_ID)
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect(status(page)).toHaveText('No valid build to simulate yet.')
    await expect(page.getByTestId('results-last-good')).toHaveCount(0)
    for (const chart of ['chart-units-produced', 'chart-gather-rates']) await expect(page.getByTestId(chart)).toHaveCount(0)
    release()
  })

  test('an invalid duration', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    for (const [value, message] of [
      ['59', RANGE_MESSAGE],
      ['3601', RANGE_MESSAGE],
      ['61.5', RANGE_MESSAGE],
      ['', 'Duration is required.'],
    ]) {
      await expectNoRun(page, () => duration(page).fill(value))
      await expect(page.getByTestId('duration-error')).toHaveText(message)
      await expect(duration(page)).toHaveAttribute('aria-invalid', 'true')
      await expect(duration(page)).toHaveAttribute('aria-describedby', 'duration-error')
      await expect(status(page)).toHaveAttribute('data-status', 'invalid')
      await expectDimmed(page)
    }

    await waitForRun(page, () => duration(page).fill('1000'))
    await expect(page.getByTestId('duration-error')).toHaveCount(0)
    await expect(duration(page)).not.toHaveAttribute('aria-invalid', /.*/)
    await expect(duration(page)).not.toHaveAttribute('aria-describedby', /.*/)
  })

  test('a 400 keeps the last result', async ({ page }) => {
    await openPage(page)
    await page.route(
      `**${SIMULATE_PATH}`,
      (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'bad', issues: [{ code: 'syntax', message: 'the server said no' }], omittedIssues: 2 }),
        }),
      { times: 1 },
    )
    await waitForRun(page, () => duration(page).fill('900'), 'rejected')
    await expect(page.getByTestId('build-order-issues').locator('li')).toHaveText(['the server said no', '2 more issues not shown.'])
    await expectDimmed(page)
    await expectNoRun(page)

    await waitForRun(page, () => duration(page).fill('1000'))
    await expect(page.getByTestId('build-order-issues')).toHaveCount(0)
  })

  test('a failure shows a retry', async ({ page }) => {
    await openPage(page)
    let answer: 'fail' | 'abort' | 'continue' = 'fail'
    await page.route(`**${SIMULATE_PATH}`, (route) => {
      if (answer === 'fail') return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
      if (answer === 'abort') return route.abort()
      return route.continue()
    })
    await waitForRun(page, () => duration(page).fill('900'), 'failed')
    await expect(page.getByTestId('simulation-error')).toHaveText('The simulation could not be run (HTTP 500).')
    await expect(page.getByTestId('simulation-retry')).toHaveText('Try again')
    await expectDimmed(page)

    answer = 'abort'
    const failed = page.waitForEvent('requestfailed', isSimulatePost)
    await page.getByTestId('simulation-retry').click()
    await failed
    await expect(page.getByTestId('simulation-error')).toHaveText('The simulation could not be run. Please try again.')
    await expect(status(page)).toHaveAttribute('data-status', 'failed')

    answer = 'continue'
    const posts = trackPosts(page)
    await waitForRun(page, () => page.getByTestId('simulation-retry').click())
    await expectNoRun(page)
    expect(posts).toHaveLength(1)
    await expect(page.getByTestId('simulation-error')).toHaveCount(0)
    await expect(page.getByTestId('simulation-retry')).toHaveCount(0)
  })

  test('a superseded request is aborted and its response never shows', async ({ page }) => {
    await openPage(page)
    let release = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    await page.route(`**${SIMULATE_PATH}`, async (route) => {
      if (posted(route.request()).inputs.durationSeconds === 900) await gate
      await route.continue().catch(() => {})
    })
    const first = page.waitForRequest((r) => isSimulatePost(r) && posted(r).inputs.durationSeconds === 900)
    const aborted = page.waitForEvent('requestfailed', (r) => isSimulatePost(r) && posted(r).inputs.durationSeconds === 900)
    await duration(page).fill('900')
    await first

    const second = await waitForRun(page, () => duration(page).fill('1000'))
    expect(posted(second.request()).inputs.durationSeconds).toBe(1000)
    await aborted
    release()
    await expectNoRun(page)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('pinned-label')).toHaveText(`Pinned: ${BUILDS[0].name}, 16:40`)
  })

  test.describe('at 390 px wide', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('the page never scrolls by itself', async ({ page }) => {
      await openPage(page)
      const before = await scrollInstantly(page, 400)
      expect(before).toBeGreaterThan(0)

      await waitForRun(page, () => setDurationInPlace(page, '900'))
      expect(await settledScrollY(page)).toBe(before)
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')

      await expectNoRun(page, () => setDurationInPlace(page, '59'))
      await expect(status(page)).toHaveAttribute('data-status', 'invalid')
      expect(await settledScrollY(page)).toBe(before)
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    })
  })

  test('select keeps open step rows and opens the new rows that have options', async ({ page }) => {
    await openPage(page)
    await showView(page, 'table')
    const more = page.getByTestId('step-more')
    await expect(more.first()).toHaveAttribute('aria-expanded', 'false')
    await more.first().click()
    await expect(more.first()).toHaveAttribute('aria-expanded', 'true')
    const other = BUILDS[2]
    await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: other.name }))
    const before = buildOrderFrom(BUILDS[0].text).steps.map((step, i) => i === 0 || hasOptionalField(step))
    const expected = buildOrderFrom(other.text).steps.map((step, i) => String((before[i] ?? false) || hasOptionalField(step)))
    await expect.poll(() => more.evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-expanded')))).toEqual(expected)
  })
})
