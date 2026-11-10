import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { formatBuildOrderText, parseBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { STEP_KINDS, formatStepTime } from '../components/apps/aoe4-build-order/step-annotations'
import { SIMULATE_PATH, SPLIT_VIEWPORT, buildOrderFrom, openPage, showTab, showView, simulateOk, waitForRun } from './helpers'

const LONG_WAIT_SECONDS = 60
const EN_DASH = '–'
const DURATION = 1200
const DEFAULT_TEXT = formatBuildOrderText(listBuilds()[0])
const LONG_WAIT_TEXT = ['start 6 sheep -> sheep', 'build barracks with 9 from sheep', 'produce villager from capital-town-center x1'].join('\n')
const LEGEND_KINDS = Object.entries(STEP_KINDS).filter(([, label]) => label !== null).map(([kind]) => kind)

const rows = (page: Page) => page.getByTestId('step-row')
const status = (page: Page) => page.getByTestId('auto-run-status')
const lastGood = (page: Page) => page.getByTestId('results-last-good')
const lastGoodOpacity = (page: Page) => lastGood(page).evaluate((el) => Number(getComputedStyle(el).opacity))

async function setText(page: Page, text: string) {
  await showTab(page, 'build')
  await showView(page, 'text')
  return waitForRun(page, () => page.getByTestId('build-order-text').fill(text))
}

async function openTable(page: Page, text?: string) {
  await openPage(page)
  if (text !== undefined) await setText(page, text)
  await showView(page, 'table')
  await expect(page.getByTestId('step-run').first()).toBeVisible()
}

async function holdSimulate(page: Page) {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**${SIMULATE_PATH}`, async (route) => {
    await gate
    await route.continue().catch(() => {})
  })
  return release
}

test.describe('AoE4 step run cells', () => {
  test('every row carries its kind and the run timing the API reports, under one legend', async ({ page, request }) => {
    await openTable(page)
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(DEFAULT_TEXT), DURATION)
    await expect(rows(page)).toHaveCount(result.steps.length)
    for (const timing of result.steps) {
      const row = rows(page).nth(timing.step)
      await expect(row).toHaveAttribute('data-kind', /.+/)
      await expect(row.getByTestId('step-started')).toHaveText(formatStepTime(timing.startedAt))
      await expect(row.getByTestId('step-finished')).toHaveText(timing.status === 'in-progress' ? 'ongoing' : formatStepTime(timing.completedAt))
    }
    const legend = page.getByTestId('step-kind-legend')
    await expect(legend).toHaveCount(1)
    await expect(legend).toBeVisible()
    expect(await legend.locator('[data-kind]').evaluateAll((els) => els.map((e) => e.getAttribute('data-kind')))).toEqual(LEGEND_KINDS)
  })

  test('a run cell shares its kind colour with the legend item, and the badge is absent only for the other kind', async ({ page }) => {
    await openTable(page)
    const legend = await page
      .getByTestId('step-kind-legend')
      .locator('[data-kind]')
      .evaluateAll((els) => els.map((el) => [el.getAttribute('data-kind'), getComputedStyle(el).borderLeftColor]))
    const cells = await rows(page).evaluateAll((els) =>
      els.map((el) => ({
        kind: el.getAttribute('data-kind'),
        color: getComputedStyle(el.querySelector('[data-testid="step-run"]')!).borderLeftColor,
        badges: el.querySelectorAll('[data-testid="step-kind-badge"]').length,
      })),
    )
    const colorOf = new Map(legend as [string, string][])
    for (const cell of cells) {
      expect(cell.badges).toBe(cell.kind === 'other' ? 0 : 1)
      if (cell.kind !== 'other') expect(cell.color).toBe(colorOf.get(cell.kind!))
    }
    expect(new Set(cells.map((c) => c.kind)).size).toBeGreaterThanOrEqual(2)
    expect(new Set(cells.map((c) => c.color)).size).toBeGreaterThanOrEqual(2)
  })

  test('data-long-wait is set on exactly the steps that waited at least 60 s', async ({ page, request }) => {
    await openTable(page, LONG_WAIT_TEXT)
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(LONG_WAIT_TEXT), DURATION)
    const long = result.steps.filter((s) => s.waitSeconds >= LONG_WAIT_SECONDS)
    const short = result.steps.filter((s) => s.waitSeconds < LONG_WAIT_SECONDS)
    expect(long.length).toBeGreaterThan(0)
    expect(short.length).toBeGreaterThan(0)
    for (const s of long) await expect(rows(page).nth(s.step)).toHaveAttribute('data-long-wait', 'true')
    for (const s of short) await expect(rows(page).nth(s.step)).not.toHaveAttribute('data-long-wait', /.*/)
  })

  test('a not-reached step reads an en dash for its times and its cause, and its cell is tinted', async ({ page, request }) => {
    await openTable(page)
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(DEFAULT_TEXT), DURATION)
    const timing = result.steps.find((s) => s.status === 'not-reached')!
    const calm = result.steps.find((s) => s.status === 'completed' && s.waitSeconds === 0)!
    expect(timing).toBeDefined()
    expect(calm).toBeDefined()
    const row = rows(page).nth(timing.step)
    await expect(row.getByTestId('step-started')).toHaveText(EN_DASH)
    await expect(row.getByTestId('step-finished')).toHaveText(EN_DASH)
    await expect(row.getByTestId('step-blocked-by')).toHaveText(`not reached (${timing.waitingOn})`)
    await expect(row).toHaveAttribute('data-flagged', 'true')
    const background = (step: number) => rows(page).nth(step).getByTestId('step-run').evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await background(timing.step)).not.toBe(await background(calm.step))
  })

  test('a completed step with no wait has an empty Blocked by', async ({ page, request }) => {
    await openTable(page)
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(DEFAULT_TEXT), DURATION)
    const timing = result.steps.find((s) => s.status === 'completed' && s.waitSeconds === 0)!
    expect(timing).toBeDefined()
    const row = rows(page).nth(timing.step)
    await expect(row.getByTestId('step-blocked-by')).toHaveText('')
    await expect(row.getByTestId('step-waited')).toHaveText(formatMinSec(0))
  })
})

test.describe('AoE4 step run cells while the result is stale', () => {
  test('deleting a row keeps the other rows aligned to their own times and dims the cells and charts together until the result lands', async ({ page }) => {
    await openTable(page)
    const oldStarted = await rows(page).evaluateAll((els) => els.slice(0, 2).map((el) => el.querySelector('[data-testid="step-started"]')?.textContent))
    expect(oldStarted[0]).not.toBe(oldStarted[1])
    await expect(rows(page).nth(0)).toHaveAttribute('data-run-step', '0')
    await expect(rows(page).nth(1)).toHaveAttribute('data-run-step', '1')

    const release = await holdSimulate(page)
    await rows(page).nth(0).getByTestId('step-delete').click()
    await expect(status(page)).toHaveAttribute('data-status', 'updating')
    await expect(rows(page).nth(0)).toHaveAttribute('data-run-step', '1')
    await expect(rows(page).nth(0).getByTestId('step-started')).toHaveText(oldStarted[1]!)
    const cell = rows(page).nth(0).getByTestId('step-run')
    await expect(cell).toHaveAttribute('data-stale', 'true')
    await expect(cell).toHaveCSS('opacity', '0.5')
    await expect(lastGood(page)).toHaveCSS('opacity', '0.5')
    await expect(rows(page).nth(0).getByTestId('step-delete')).toHaveCSS('opacity', '1')
    await expect(status(page)).toHaveText('Updating the results.')
    await expect(lastGood(page)).toHaveAttribute('aria-describedby', 'auto-run-status')

    release()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(lastGood(page)).toHaveCSS('opacity', '1')
    await expect(cell).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-testid="step-run"][data-stale]')).toHaveCount(0)
    await expect(lastGood(page)).not.toHaveAttribute('aria-describedby', /.*/)
  })

  test('choosing another prebuilt build while the result is stale shows no previous times', async ({ page }) => {
    await openTable(page)
    await expect(rows(page).first().getByTestId('step-started')).toBeVisible()
    const release = await holdSimulate(page)
    await page.getByTestId('build-order-select').selectOption({ label: listBuilds()[1].name })
    await expect(status(page)).toHaveAttribute('data-status', 'updating')
    const total = await rows(page).count()
    expect(total).toBeGreaterThan(0)
    await expect(page.locator('[data-testid="step-row"][data-status]')).toHaveCount(0)
    await expect(page.getByTestId('step-started')).toHaveCount(0)
    await expect(page.locator('[data-testid="step-row"][data-kind]')).toHaveCount(total)
    release()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(page.getByTestId('step-started').first()).toBeVisible()
  })

  test('an invalid edit dims the cells and charts and drops the times of only the changed step', async ({ page }) => {
    await openPage(page)
    const parsed = parseBuildOrderText(DEFAULT_TEXT)
    if (!parsed.ok) throw new Error('default build must parse')
    const steps = parsed.order.steps
    const changed = steps.findIndex((step, i) => i > 0 && i < steps.length - 1 && step.action === 'produce')
    expect(changed).toBeGreaterThan(0)
    const lines = DEFAULT_TEXT.split('\n')
    const line = parsed.lines.steps[changed] - 1
    expect(lines[line]).toMatch(/produce \S+/)
    lines[line] = lines[line].replace(/produce \S+/, 'produce knigt')

    await showTab(page, 'build')
    await showView(page, 'text')
    await page.getByTestId('build-order-text').fill(lines.join('\n'))
    await showView(page, 'table')
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect(rows(page)).toHaveCount(steps.length)
    for (let i = 0; i < steps.length; i++) {
      const row = rows(page).nth(i)
      await expect(row.getByTestId('step-started')).toHaveCount(i === changed ? 0 : 1)
      await expect(row.getByTestId('step-run')).toHaveCSS('opacity', '0.5')
    }
    await expect(lastGood(page)).toHaveCSS('opacity', '0.5')
    await expect(lastGood(page)).toHaveAttribute('aria-describedby', 'auto-run-status')
  })

  test('the charts dim from the edit until its result lands, and choosing the selected build does not dim them', async ({ page }) => {
    await openPage(page)
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)
    await page.getByTestId('build-order-select').selectOption({ label: listBuilds()[0].name })
    expect(await lastGoodOpacity(page)).toBe(1)

    await showView(page, 'text')
    await page.getByTestId('build-order-text').fill(`${DEFAULT_TEXT}\nproduce villager from capital-town-center x1`)
    await expect.poll(() => lastGoodOpacity(page)).toBe(0.5)
    await expect(lastGood(page)).not.toHaveAttribute('aria-describedby', /.*/)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect.poll(() => lastGoodOpacity(page)).toBe(1)
  })
})

test.describe('AoE4 step table layout beside Results', () => {
  test.use({ viewport: SPLIT_VIEWPORT })

  test('the longest prebuilt step table fits the Build panel and the editor is not clipped', async ({ page }) => {
    const longest = listBuilds().reduce((best, build) => (build.steps.length > best.steps.length ? build : best))
    await openPage(page)
    await page.getByTestId('build-order-select').selectOption({ label: longest.name })
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await showView(page, 'table')
    await expect(page.getByTestId('step-run').first()).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const byId = (id: string) => document.querySelector(`[data-testid="${id}"]`)!
          const box = byId('step-table-scroll')
          const panel = byId('panel-build')
          const right = panel.getBoundingClientRect().right
          return {
            tableFits: box.querySelector('table')!.scrollWidth <= box.clientWidth,
            panelFits: panel.scrollWidth <= panel.clientWidth,
            deletesInside: [...document.querySelectorAll('[data-testid="step-delete"]')].every((el) => el.getBoundingClientRect().right <= right),
          }
        }),
      )
      .toEqual({ tableFits: true, panelFits: true, deletesInside: true })

    await showView(page, 'text')
    await expect
      .poll(() =>
        page.evaluate(() => {
          const byId = (id: string) => document.querySelector(`[data-testid="${id}"]`)!
          return byId('build-order-text').getBoundingClientRect().right <= byId('panel-build').getBoundingClientRect().right
        }),
      )
      .toBe(true)
  })
})
