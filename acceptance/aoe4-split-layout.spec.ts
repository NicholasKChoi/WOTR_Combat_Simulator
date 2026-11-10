import { test, expect, type Page } from '@playwright/test'
import { AOE4_PAGE, CHART_IDS, SPLIT_MIN_WIDTH, SPLIT_VIEWPORT, TABS_VIEWPORT, expectNoRun, openPage, showTab, showView, waitForRun } from './helpers'

const tablist = (page: Page) => page.getByTestId('workbench-tabs')
const scrollWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth)

test.describe('AoE4 workbench split layout', () => {
  test('split at 1280: no tabs, both panels shown side by side inside the viewport', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    await expect(tablist(page)).toHaveCount(0)
    await expect(page.getByTestId('tab-build')).toHaveCount(0)
    await expect(page.getByTestId('tab-results')).toHaveCount(0)
    for (const panel of ['panel-build', 'panel-results']) {
      await expect(page.getByTestId(panel)).toBeVisible()
      await expect(page.getByTestId(panel)).not.toHaveAttribute('hidden', /.*/)
      await expect(page.getByTestId(panel)).not.toHaveAttribute('role', /.*/)
    }
    await expect(page.getByTestId('results-last-good')).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const rect = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect()
          const build = rect('panel-build')
          const results = rect('panel-results')
          const editor = rect('build-order-text')
          const last = rect('results-last-good')
          const within = (r: DOMRect) => r.top >= 0 && r.left >= 0 && r.right <= window.innerWidth
          return {
            sideBySide: build.right <= results.left,
            editorTopInside: within(editor) && editor.top < window.innerHeight,
            lastGoodTopInside: within(last) && last.top < window.innerHeight,
          }
        }),
      )
      .toEqual({ sideBySide: true, editorTopInside: true, lastGoodTopInside: true })
    expect(await scrollWidth(page)).toBeLessThanOrEqual(SPLIT_VIEWPORT.width)
  })

  test('tabs at 390: Build is selected and nothing scrolls sideways on either tab', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openPage(page)
    await expect(tablist(page)).toHaveCount(1)
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-results')).not.toBeVisible()
    await expect.poll(() => scrollWidth(page)).toBeLessThanOrEqual(390)
    await showTab(page, 'results')
    await expect(page.getByTestId('panel-results')).toBeVisible()
    await expect.poll(() => scrollWidth(page)).toBeLessThanOrEqual(390)
  })

  test('the breakpoint is 1200 px', async ({ page }) => {
    await page.setViewportSize({ width: 1199, height: 800 })
    await openPage(page)
    await expect.poll(() => tablist(page).count()).toBe(1)
    await page.setViewportSize({ width: SPLIT_MIN_WIDTH, height: 800 })
    await expect.poll(() => tablist(page).count()).toBe(0)
    await expect.poll(() => scrollWidth(page)).toBeLessThanOrEqual(SPLIT_MIN_WIDTH)
    await page.setViewportSize({ width: SPLIT_MIN_WIDTH - 1, height: 800 })
    await expect.poll(() => tablist(page).count()).toBe(1)
  })

  test('the layout switches live, keeps the selected tab, and never re-runs', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    await expectNoRun(page, async () => {
      await page.setViewportSize(TABS_VIEWPORT)
      await expect(tablist(page)).toHaveCount(1)
      await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByTestId('panel-results')).not.toBeVisible()
      await page.getByTestId('tab-results').click()
      await expect(page.getByTestId('panel-results')).toBeVisible()
      await page.setViewportSize(SPLIT_VIEWPORT)
      await expect(tablist(page)).toHaveCount(0)
      await expect(page.getByTestId('panel-build')).toBeVisible()
      await expect(page.getByTestId('panel-results')).toBeVisible()
      await page.setViewportSize(TABS_VIEWPORT)
      await expect(page.getByTestId('tab-results')).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByTestId('panel-results')).toBeVisible()
      await expect(page.getByTestId('panel-build')).not.toBeVisible()
    })
  })

  test('a layout round trip keeps editor focus, text and the pin in the text view', async ({ page }) => {
    await page.setViewportSize(TABS_VIEWPORT)
    await openPage(page)
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('pinned-label')).toBeVisible()
    const pinned = await page.getByTestId('pinned-label').innerText()
    await showTab(page, 'build')
    const editor = page.getByTestId('build-order-text')
    const text = await editor.inputValue()
    await editor.focus()
    await expectNoRun(page, async () => {
      await page.setViewportSize(SPLIT_VIEWPORT)
      await expect(tablist(page)).toHaveCount(0)
      await page.setViewportSize(TABS_VIEWPORT)
      await expect(tablist(page)).toHaveCount(1)
    })
    await expect(editor).toBeFocused()
    await expect(editor).toHaveValue(text)
    await showTab(page, 'results')
    await expect(page.getByTestId('pinned-label')).toHaveText(pinned)
  })

  test('a layout round trip keeps an open step row and its uncommitted cell draft in the table view', async ({ page }) => {
    await page.setViewportSize(TABS_VIEWPORT)
    await openPage(page)
    await waitForRun(page, () => page.getByTestId('build-order-text').fill('start -> sheep\n@2:00 produce villager from capital-town-center x3'))
    await showView(page, 'table')
    const row = page.getByTestId('step-row').first()
    const seconds = row.getByTestId('step-field-seconds')
    await seconds.fill('abc')
    await expect(row.getByTestId('step-more')).toHaveAttribute('aria-expanded', 'true')
    await expectNoRun(page, async () => {
      await page.setViewportSize(SPLIT_VIEWPORT)
      await expect(tablist(page)).toHaveCount(0)
      await page.setViewportSize(TABS_VIEWPORT)
      await expect(tablist(page)).toHaveCount(1)
    })
    await expect(seconds).toHaveValue('abc')
    await expect(seconds).toBeFocused()
    await expect(row.getByTestId('step-more')).toHaveAttribute('aria-expanded', 'true')
  })

  test('the view toggle is disabled by Results only in the tabs layout', async ({ page }) => {
    await page.setViewportSize(TABS_VIEWPORT)
    await openPage(page)
    await expect(page.getByTestId('editor-view-text')).toBeEnabled()
    await expect(page.getByTestId('editor-view-table')).toBeEnabled()
    await showTab(page, 'results')
    await expect(page.getByTestId('editor-view-text')).toBeDisabled()
    await expect(page.getByTestId('editor-view-table')).toBeDisabled()
    await page.setViewportSize(SPLIT_VIEWPORT)
    await expect(page.getByTestId('editor-view-text')).toBeEnabled()
    await expect(page.getByTestId('editor-view-table')).toBeEnabled()
    await showView(page, 'table')
    await expect(page.getByTestId('step-table')).toBeVisible()
    await expect(page.getByTestId('panel-results')).toBeVisible()
    await page.setViewportSize(TABS_VIEWPORT)
    await expect(page.getByTestId('editor-view-text')).toBeDisabled()
    await expect(page.getByTestId('editor-view-table')).toBeDisabled()
  })

  test('first paint matches the server render and the page ends split', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) messages.push(message.text())
    })
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    await expect(tablist(page)).toHaveCount(0)
    expect(messages.filter((text) => /hydrat/i.test(text))).toEqual([])
  })

  test.describe('resize while the Results panel is hidden', () => {
    const cases: { name: string; start: { width: number; height: number }; sizes: { width: number; height: number }[] }[] = [
      { name: '700 then 390', start: { width: 700, height: 900 }, sizes: [{ width: 390, height: 844 }] },
      { name: 'split, tabs, then 700', start: SPLIT_VIEWPORT, sizes: [TABS_VIEWPORT, { width: 700, height: 900 }] },
    ]
    for (const { name, start, sizes } of cases) {
      test(`every chart has a width after showing Results: ${name}`, async ({ page }) => {
        await page.setViewportSize(start)
        await page.goto(AOE4_PAGE)
        await page.waitForLoadState('networkidle')
        await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
        for (const size of sizes) await page.setViewportSize(size)
        const final = sizes[sizes.length - 1]
        await showTab(page, 'results')
        await expect(page.getByTestId('panel-results')).toBeVisible()
        for (const id of CHART_IDS) {
          await expect(page.getByTestId(id)).toBeVisible()
          await expect
            .poll(() => page.getByTestId(id).evaluate((el) => el.getBoundingClientRect().width))
            .toBeGreaterThan(0)
          await expect
            .poll(() => page.getByTestId(id).evaluate((el) => el.getBoundingClientRect().width <= window.innerWidth))
            .toBe(true)
        }
        await expect.poll(() => scrollWidth(page)).toBeLessThanOrEqual(final.width)
      })
    }
  })
})
