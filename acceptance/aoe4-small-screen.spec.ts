import { test, expect, type Page } from '@playwright/test'
import { AOE4_PAGE, SIMULATE_PATH, TABS_VIEWPORT, openPage, scrollInstantly, setDurationInPlace, settledScrollY, showTab, showView, waitForRun } from './helpers'

const KNIGHT_LONGBOW = "ENG Knight/Longbow (King's Palace)"

const barPosition = (page: Page) => page.getByTestId('run-bar').evaluate((el) => getComputedStyle(el).position)

for (const viewport of [
  { width: 320, height: 700 },
  { width: 360, height: 760 },
]) {
  test.describe(`step table cards at ${viewport.width} px`, () => {
    test.use({ viewport })

    test('no select or input leaves the screen', async ({ page }) => {
      await openPage(page)
      await page.getByTestId('build-order-select').selectOption({ label: KNIGHT_LONGBOW })
      await showView(page, 'table')
      await expect(page.getByTestId('step-start-row')).toBeVisible()
      await expect
        .poll(() =>
          page.evaluate(() => {
            const rights = [...document.querySelectorAll('[data-testid="step-table"] select, [data-testid="step-table"] input')].map(
              (el) => el.getBoundingClientRect().right,
            )
            return Math.max(document.documentElement.scrollWidth, ...rights) - window.innerWidth
          }),
        )
        .toBeLessThanOrEqual(0)
    })
  })
}

test.describe('run bar at 360x760', () => {
  test.use({ viewport: { width: 360, height: 760 } })

  test('scrolls away with the page, and a run does not scroll the page by itself', async ({ page }) => {
    await openPage(page)
    expect(await barPosition(page)).toBe('static')
    let before = 0
    await expect.poll(async () => (before = await scrollInstantly(page, 400))).toBeGreaterThan(0)
    const response = await waitForRun(page, () => setDurationInPlace(page, '900'))
    expect(response.status()).toBe(200)
    expect(await settledScrollY(page)).toBe(before)
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')

    await showTab(page, 'results')
    await expect(page.getByTestId('panel-results')).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          window.scrollTo({ top: 400, behavior: 'instant' })
          const bar = document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect()
          const titles = [...document.querySelectorAll('[data-testid="panel-results"] h2, [data-testid="panel-results"] h3, [data-testid="panel-results"] h4, [data-testid="panel-results"] h5')]
          const overlaps = titles.filter((t) => t.getBoundingClientRect().bottom > bar.top && t.getBoundingClientRect().top < bar.bottom).length
          return { scrolled: window.scrollY > 0, barAbove: bar.top < 0, overlaps }
        }),
      )
      .toEqual({ scrolled: true, barAbove: true, overlaps: 0 })
  })
})

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
]) {
  test.describe(`run bar at ${viewport.width} px`, () => {
    test.use({ viewport })

    test('stays sticky at the top', async ({ page }) => {
      await openPage(page)
      expect(await barPosition(page)).toBe('sticky')
      await showTab(page, 'results')
      await expect(page.getByTestId('panel-results')).toBeVisible()
      await expect
        .poll(() =>
          page.evaluate(() => {
            window.scrollTo(0, 300)
            return { scrolled: window.scrollY > 0, stuck: Math.abs(document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect().top) < 1 }
          }),
        )
        .toEqual({ scrolled: true, stuck: true })
    })
  })
}

test.describe('workbench tabs keyboard model', () => {
  test.use({ viewport: TABS_VIEWPORT })

  test('arrow keys, Home and End move between tabs and focus follows', async ({ page }) => {
    await openPage(page)
    const select = async (key: string, tab: 'build' | 'results') => {
      await page.keyboard.press(key)
      await expect(page.getByTestId(`tab-${tab}`)).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByTestId(`tab-${tab}`)).toBeFocused()
      await expect(page.getByTestId(`panel-${tab}`)).toBeVisible()
    }
    await page.getByTestId('tab-build').focus()
    await select('ArrowRight', 'results')
    await select('ArrowLeft', 'build')
    await select('ArrowLeft', 'results')
    await select('ArrowRight', 'build')
    await select('End', 'results')
    await select('Home', 'build')
    await select('ArrowRight', 'results')
    await select('Home', 'build')
  })

  test('one tab stop: the selected tab has tabindex 0 and Tab leaves the tab list', async ({ page }) => {
    await openPage(page)
    await showTab(page, 'results')
    await expect(page.getByTestId('tab-results')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('tab-build')).toHaveAttribute('tabindex', '-1')
    await page.getByTestId('tab-results').focus()
    await page.keyboard.press('Tab')
    const inTablist = await page.evaluate(() => !!document.activeElement?.closest('[role="tablist"]'))
    expect(inTablist).toBe(false)
  })

  test('with Results disabled every navigation key leaves Build selected and focused', async ({ page }) => {
    await page.route(`**${SIMULATE_PATH}`, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
    await page.goto(AOE4_PAGE)
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'failed')
    await expect(page.getByTestId('tab-results')).toBeDisabled()
    await page.getByTestId('tab-build').focus()
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      await page.keyboard.press(key)
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByTestId('tab-build')).toBeFocused()
    }
  })
})
