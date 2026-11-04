import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { openPage, runSimulation, showTab } from './helpers'

const LONG_WAIT_SECONDS = 60
const EN_DASH = '–'
const rows = (page: Page) => page.getByTestId('step-timeline-row')

async function runWith(page: Page, text: string, duration: number) {
  await showTab(page, 'build')
  await page.getByTestId('build-order-text').fill(text)
  await page.getByTestId('duration-seconds').fill(String(duration))
  return (await (await runSimulation(page)).json()) as SimulationResult
}

function mmss(seconds: number): string {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

test.describe('AoE4 build order timeline and compare display', () => {
  test('data-long-wait is set on exactly the steps that waited at least 60 s', async ({ page }) => {
    await openPage(page)
    await page.getByTestId('build-order-text').fill(['start 6 sheep -> sheep', 'build barracks with 9 from sheep', 'produce villager from capital-town-center x1'].join('\n'))
    const result = (await (await runSimulation(page)).json()) as SimulationResult
    const long = result.steps.filter((s) => s.waitSeconds >= LONG_WAIT_SECONDS)
    const short = result.steps.filter((s) => s.waitSeconds < LONG_WAIT_SECONDS)
    expect(long.length).toBeGreaterThan(0)
    expect(short.length).toBeGreaterThan(0)
    for (const s of long) await expect(rows(page).nth(s.step)).toHaveAttribute('data-long-wait', 'true')
    for (const s of short) {
      await expect(rows(page).nth(s.step)).not.toHaveAttribute('data-long-wait', /.*/)
      if (s.status === 'completed') await expect(rows(page).nth(s.step)).not.toHaveClass(/table-warning/)
    }
  })

  test('a not-reached step reads not reached with its cause and an en dash in Started and Finished', async ({ page }) => {
    await openPage(page)
    const result = (await (await runSimulation(page)).json()) as SimulationResult
    const timing = result.steps.find((s) => s.status === 'not-reached')!
    expect(timing).toBeDefined()
    const cells = rows(page).nth(timing.step).locator('td')
    await expect(cells.nth(0)).toHaveText(EN_DASH)
    await expect(cells.nth(1)).toHaveText(EN_DASH)
    await expect(cells.nth(4)).toHaveText(`not reached (${timing.waitingOn})`)
  })

  test('a completed step with no wait has an empty Blocked by cell', async ({ page }) => {
    await openPage(page)
    const result = (await (await runSimulation(page)).json()) as SimulationResult
    const timing = result.steps.find((s) => s.status === 'completed' && s.waitSeconds === 0)!
    expect(timing).toBeDefined()
    await expect(rows(page).nth(timing.step).locator('td').nth(4)).toHaveText('')
  })

  test('a pinned run that ends earlier shows run ends at on the pinned side of a military row the current run has', async ({ page }) => {
    await openPage(page)
    const text = formatBuildOrderText(listBuilds()[0])
    const short = await runWith(page, text, 300)
    await page.getByTestId('pin-run').click()
    await runWith(page, text, 1200)
    expect(short.times).not.toContain(900)
    const cells = page.locator('[data-testid="compare-row"][data-key="military-900"] td')
    await expect(cells.nth(1)).toHaveText('run ends at 5:00')
    await expect(cells.nth(2)).not.toHaveText(/run ends|not reached|—/)
    await expect(cells.nth(3)).toHaveText('—')
    await expect(page.locator('[data-testid="compare-row"][data-key="military-900"]')).not.toHaveAttribute('data-direction', /.*/)
  })

  test('age deltas read m:ss earlier or later with matching direction and colour', async ({ page }) => {
    await openPage(page)
    const builds = listBuilds()
    const first = await runWith(page, formatBuildOrderText(builds[0]), 1200)
    await page.getByTestId('pin-run').click()
    let checked = 0
    for (const build of builds.slice(1)) {
      const second = await runWith(page, formatBuildOrderText(build), 1200)
      for (const age of second.ages) {
        const other = first.ages.find((a) => a.age === age.age)
        if (!other || other.reachedAt === age.reachedAt) continue
        const delta = age.reachedAt - other.reachedAt
        const row = page.locator(`[data-testid="compare-row"][data-key="age-${age.age}"]`)
        await expect(row.locator('td').nth(1)).toHaveText(mmss(other.reachedAt))
        await expect(row.locator('td').nth(2)).toHaveText(mmss(age.reachedAt))
        await expect(row.locator('td').nth(3)).toHaveText(`${mmss(Math.abs(delta))} ${delta < 0 ? 'earlier' : 'later'}`)
        await expect(row).toHaveAttribute('data-direction', delta < 0 ? 'better' : 'worse')
        await expect(row.locator('td').nth(3)).toHaveClass(delta < 0 ? /text-success/ : /text-danger/)
        checked++
      }
      if (checked > 0) break
    }
    expect(checked).toBeGreaterThan(0)
  })
})
