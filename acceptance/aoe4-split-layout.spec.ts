import { test, expect, type Page } from '@playwright/test'
import { AOE4_PAGE, MIN_SUPPORTED_VIEWPORT, SPLIT_VIEWPORT, WIDE_VIEWPORT, openPage, waitForRun } from './helpers'

const scrollWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth)

test.describe('AoE4 workbench split layout', () => {
  test('split at 1280: both panels shown side by side inside the viewport', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
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
    await expect(page.getByRole('tablist')).toHaveCount(0)
  })

  for (const viewport of [MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]) {
    test(`at ${viewport.width} px both panels sit side by side with no tab strip and no sideways scroll`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openPage(page)
      await expect
        .poll(() =>
          page.evaluate(() => {
            const rect = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect()
            return {
              sideBySide: rect('panel-build').right <= rect('panel-results').left,
              panelsShown: rect('panel-build').width > 0 && rect('panel-results').width > 0,
              scrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
            }
          }),
        )
        .toEqual({ sideBySide: true, panelsShown: true, scrollsSideways: false })
      await expect(page.getByRole('tablist')).toHaveCount(0)
    })
  }

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('server render is two columns with the editor in the build panel', async ({ page }) => {
      await page.goto(AOE4_PAGE)
      for (const id of ['workbench-split', 'panel-build', 'panel-results']) await expect(page.getByTestId(id)).toBeVisible()
      await expect(page.getByTestId('panel-build').getByTestId('build-order-editor')).toBeVisible()
    })
  })

  test('first load raises no hydration warning and the columns are the same before and after the first run', async ({ page }) => {
    const hydration: string[] = []
    page.on('console', (m) => {
      if (/hydrat/i.test(m.text())) hydration.push(m.text())
    })
    page.on('pageerror', (e) => {
      if (/hydrat/i.test(e.message)) hydration.push(e.message)
    })
    const columns = () =>
      page.evaluate(() => ['build-column', 'results-column'].map((id) => Math.round(document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().left)))
    await page.setViewportSize(SPLIT_VIEWPORT)
    const first = waitForRun(page, () => page.goto(AOE4_PAGE))
    await expect(page.getByTestId('workbench-split')).toBeVisible()
    const before = await columns()
    await first
    expect(await columns()).toEqual(before)
    expect(hydration).toEqual([])
  })
})
