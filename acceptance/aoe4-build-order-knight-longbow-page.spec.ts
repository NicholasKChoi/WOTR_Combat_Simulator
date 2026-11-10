import { test, expect } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { openPage, postSimulate, showTab, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const REACTION_COUNT = 6

test.describe.configure({ timeout: 90_000 })

test.describe('the knight/longbow build on the page', () => {
  test('shows its six reactions and runs 1800 s with no idle-villager warning, listing the gold and sheep run-outs as info', async ({ page }) => {
    await openPage(page)
    const response = await waitForRun(page, async () => {
      await page.getByTestId('duration-seconds').fill('1800')
      await page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL })
    })
    expect(response.status()).toBe(200)
    const result = (await response.json()) as SimulationResult
    await showTab(page, 'results')

    await expect(page.getByTestId('step-timeline')).toBeVisible()
    await expect(page.locator('[data-testid="step-timeline-row"][data-reaction="true"]')).toHaveCount(REACTION_COUNT)
    await expect(page.getByTestId('step-timeline-row')).toHaveCount(knightLongbow.steps.length)

    const palace = knightLongbow.steps.findIndex((s) => s.action === 'build' && s.building === 'kings-palace')
    const research = knightLongbow.steps.findIndex((s) => s.action === 'research')
    expect(palace).toBeGreaterThanOrEqual(0)
    expect(research).toBeGreaterThanOrEqual(0)
    await expect(page.locator(`[data-testid="step-timeline-row"][data-step="${palace}"]`)).toHaveAttribute('data-kind', 'age-up')
    await expect(page.locator(`[data-testid="step-timeline-row"][data-step="${research}"]`)).toHaveAttribute('data-kind', 'research')
    await expect(page.getByTestId('step-timeline-legend')).toBeVisible()

    const warnings = page.locator('[data-testid="simulation-message"][data-severity="warning"]')
    await expect(warnings.filter({ hasText: /idle/i })).toHaveCount(0)
    await expect(page.locator('[data-testid="simulation-message"][data-code="idle-arrival"]')).toHaveCount(0)

    const depleted = result.warnings.filter((w) => w.code === 'node-depleted')
    expect(depleted.map((w) => w.node)).toEqual(expect.arrayContaining(['sheep', 'gold', 'gold#2']))

    await page.getByTestId('simulation-notes-toggle').click()
    const infoList = page.getByTestId('simulation-notes-list')
    for (const w of depleted) {
      await expect(infoList.locator('[data-testid="simulation-message"][data-code="node-depleted"][data-severity="info"]', { hasText: w.message })).toHaveCount(1)
    }
  })

  test('at 3600 s no step is stuck or waiting and no villager is left idle on any run-out', async ({ request }) => {
    const response = await postSimulate(request, { buildOrder: knightLongbow, inputs: { durationSeconds: 3600 } })
    expect(response.status()).toBe(200)
    const { steps, warnings } = (await response.json()) as SimulationResult
    expect(warnings.filter((w) => w.code === 'idle-arrival' || w.code === 'step-stuck')).toEqual([])
    expect(steps.filter((s) => s.status === 'waiting')).toEqual([])
    for (const w of warnings.filter((x) => x.code === 'node-depleted')) {
      expect(w, w.message).toMatchObject({ idleVillagers: 0 })
    }
  })
})
