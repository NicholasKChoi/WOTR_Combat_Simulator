import { test, expect, type Page } from '@playwright/test'
import { SPLIT_VIEWPORT, openPage } from './helpers'

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
  })
})
