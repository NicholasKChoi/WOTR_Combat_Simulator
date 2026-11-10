import { test, expect, type Request } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { SIMULATE_PATH, TABS_VIEWPORT, openPage, showTab, waitForRun } from './helpers'

test.describe.configure({ timeout: 90_000 })

const KNIGHT_LONGBOW = "ENG Knight/Longbow (King's Palace)"
const PIN_KEY = 'aoe4-build-order.pinned-run'
const OTHER_BUILD = 'ENG 1TC'
const textOf = (name: string) => {
  const build = listBuilds().find((b) => b.name === name)
  if (build === undefined) throw new Error(`no build named ${name}`)
  return formatBuildOrderText(build)
}

test.describe('AoE4 build order M4 flow', () => {
  test.use({ viewport: TABS_VIEWPORT })

  test('tabs, info list, inline error with suggestion, and a pin that survives a reload', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('workbench-tabs')).toBeVisible()
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-results')).toHaveAttribute('hidden', '')
    await expect(page.getByTestId('tab-results')).toBeEnabled()

    const response = await waitForRun(page, async () => {
      await page.getByTestId('duration-seconds').fill('1800')
      await page.getByTestId('build-order-select').selectOption({ label: KNIGHT_LONGBOW })
    })
    const result = (await response.json()) as SimulationResult
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await showTab(page, 'results')
    await expect(page.getByTestId('panel-results')).toBeVisible()

    const goldRunOuts = [...result.warnings, ...result.notes]
      .filter((m) => m.severity === 'info' && m.code === 'node-depleted' && /^gold(#2)? ran out/.test(m.message))
      .map((m) => m.message)
    expect(goldRunOuts.length).toBeGreaterThanOrEqual(2)
    await expect(page.getByTestId('simulation-notes-list')).toHaveCount(0)
    await page.getByTestId('simulation-notes-toggle').click()
    const depleted = page
      .getByTestId('simulation-notes-list')
      .locator('[data-testid="simulation-message"][data-code="node-depleted"]')
      .filter({ hasText: /^gold(#2)? ran out/ })
    await expect(depleted).toHaveText(goldRunOuts)
    await expect(page.getByTestId('simulation-warnings').getByTestId('simulation-message').filter({ hasText: /^gold/ })).toHaveCount(0)

    await showTab(page, 'build')
    const posted: string[] = []
    const onRequest = (r: Request) => {
      if (r.url().endsWith(SIMULATE_PATH) && r.method() === 'POST') posted.push(r.url())
    }
    page.on('request', onRequest)
    try {
      await page.getByTestId('build-order-text').fill('start -> sheep\nproduce knigt from stable')
      const issue = page.getByTestId('build-order-issue')
      await expect(page.getByTestId('build-order-issues')).toBeVisible()
      await expect(issue).toHaveCount(1)
      await expect(issue).toContainText('knigt')
      await expect(issue.getByTestId('build-order-issue-suggestion')).toHaveText('Did you mean knight?')
      await expect(page.locator('[data-testid="build-order-line-number"][data-line="2"]')).toHaveAttribute('data-error', 'true')
      await showTab(page, 'results')
      await expect(page.getByTestId('chart-units-produced')).toBeVisible()
      await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'invalid')
      await expect
        .poll(() => page.getByTestId('results-last-good').evaluate((el) => Number(getComputedStyle(el).opacity)))
        .toBeLessThanOrEqual(0.5)
      await showTab(page, 'build')
      expect(posted).toEqual([])
    } finally {
      page.off('request', onRequest)
    }

    await page.getByTestId('build-order-select').selectOption({ label: OTHER_BUILD })
    await page.getByTestId('build-order-select').selectOption({ label: KNIGHT_LONGBOW })
    await expect(page.getByTestId('build-order-text')).toHaveValue(textOf(KNIGHT_LONGBOW))
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await page.reload()
    await expect(page.getByTestId('tab-results')).toBeEnabled()
    await expect(page.getByTestId('unpin-run')).toBeEnabled()
    await showTab(page, 'results')
    await expect(page.getByTestId('pinned-label')).toHaveText(`Pinned: ${KNIGHT_LONGBOW}, 30:00`)

    await page.getByTestId('unpin-run').click()
    expect(await page.evaluate((key) => window.localStorage.getItem(key), PIN_KEY)).toBeNull()
    await page.reload()
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
    await showTab(page, 'results')
    await expect(page.getByTestId('unpin-run')).toBeDisabled()
    await expect(page.getByTestId('pinned-label')).toHaveCount(0)
  })
})
