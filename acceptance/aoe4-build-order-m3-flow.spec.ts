import { test, expect } from '@playwright/test'
import type { SimulationResult, SimWarning } from '../lib/aoe4-build-order/model'
import { INVALID_PASTE, RESOURCE_CHARTS, expectedCompareKeys, openPage, runSimulation, showView, showTab } from './helpers'

const FLOW_PASTE = [
  'start 6 sheep -> sheep',
  'produce villager from capital-town-center x3 -> sheep',
  '@25:00 produce villager from capital-town-center x1 -> sheep',
].join('\n')

test.describe('AoE4 build order M3 flow', () => {
  test('edit a step in the table, run, see the depletion warning and timeline, pin and compare', async ({ page }) => {
    await openPage(page)
    const text = page.getByTestId('build-order-text')
    await text.fill(FLOW_PASTE)
    await showView(page, 'table')

    await expect(page.getByTestId('step-table')).toBeVisible()
    await expect(page.getByTestId('step-row')).toHaveCount(2)
    const count = page.getByTestId('step-row').nth(0).getByTestId('step-field-count')
    await expect(count).toHaveValue('3')

    const pinnedResult = (await (await runSimulation(page)).json()) as SimulationResult
    await page.getByTestId('pin-run').click()

    await showTab(page, 'build')
    await count.fill('5')
    await showView(page, 'text')
    await expect(text).toHaveValue(/produce villager from capital-town-center x5 -> sheep/)
    await showView(page, 'table')
    await expect(page.getByTestId('step-row')).toHaveCount(2)

    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult
    const depleted = result.warnings.find(
      (w): w is Extract<SimWarning, { code: 'node-depleted' }> => w.code === 'node-depleted' && w.node === 'sheep'
    )
    expect(depleted).toMatchObject({ severity: 'warning' })
    expect(depleted?.idleVillagers).toBeGreaterThan(0)

    const warnings = page.getByTestId('simulation-warnings')
    await expect(warnings).toBeVisible()
    const message = warnings.locator('[data-testid="simulation-message"][data-code="node-depleted"][data-severity="warning"]')
    await expect(message).toHaveText(depleted?.message ?? '')

    await expect(page.getByTestId('step-timeline')).toBeVisible()
    const rows = page.getByTestId('step-timeline-row')
    await expect(rows).toHaveCount(2)
    const first = rows.and(page.locator('[data-step="0"]'))
    await expect(first).toHaveAttribute('data-status', 'completed')
    await expect(first).not.toHaveAttribute('data-flagged', 'true')
    await expect(first).toContainText('x5')
    const late = rows.and(page.locator('[data-step="1"]'))
    await expect(late).toHaveAttribute('data-status', 'not-reached')
    await expect(late).toHaveAttribute('data-flagged', 'true')

    await expect(page.getByTestId('compare-key-numbers')).toBeVisible()
    const keys = await page.getByTestId('compare-row').evaluateAll((els) => els.map((el) => el.getAttribute('data-key')))
    expect(keys).toEqual(expectedCompareKeys(result, pinnedResult))
    for (const chart of RESOURCE_CHARTS) {
      await expect(page.getByTestId(chart).locator('path[data-series="food"]')).toHaveCount(1)
      await expect(page.getByTestId(chart).locator('path[data-series="pinned:food"]')).toHaveCount(1)
    }

    await page.getByTestId('unpin-run').click()
    await expect(page.getByTestId('compare-key-numbers')).toHaveCount(0)
    for (const chart of RESOURCE_CHARTS) {
      await expect(page.getByTestId(chart).locator('path[data-series="pinned:food"]')).toHaveCount(0)
    }
  })

  test('the ENG 1TC gold reaction shows in the timeline and table, and its depletion is not a warning', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-select').selectOption({ label: 'ENG 1TC' })
    await page.getByTestId('duration-seconds').fill('3600')

    const response = await runSimulation(page)
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult
    expect(result.depletions.find((d) => d.node === 'gold')).toMatchObject({ depletedAt: expect.any(Number) })

    const lastTimeline = page.getByTestId('step-timeline-row').last()
    await expect(lastTimeline).toHaveAttribute('data-reaction', 'true')
    await expect(lastTimeline).toHaveAttribute('data-status', 'completed')
    await showTab(page, 'build')
    await showView(page, 'table')
    await expect(page.getByTestId('step-row').last().getByTestId('step-field-reaction')).toBeChecked()
    await expect(page.getByTestId('simulation-warnings').getByTestId('simulation-message').filter({ hasText: /^gold ran out/ })).toHaveCount(0)
  })

  test('an unparseable paste hides the step table until a valid paste returns', async ({ page }) => {
    await openPage(page)
    const text = page.getByTestId('build-order-text')
    await text.fill(INVALID_PASTE)
    await showView(page, 'table')
    await expect(page.getByTestId('step-table-unavailable')).toBeVisible()
    await expect(page.getByTestId('step-table')).toHaveCount(0)

    await showView(page, 'text')
    await text.fill(FLOW_PASTE)
    await showView(page, 'table')
    await expect(page.getByTestId('step-table')).toBeVisible()
    await expect(page.getByTestId('step-table-unavailable')).toHaveCount(0)
  })
})
