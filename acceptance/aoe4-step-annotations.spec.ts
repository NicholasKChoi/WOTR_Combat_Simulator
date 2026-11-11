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
    await expect(row.getByTestId('step-waited')).toHaveText('still waiting')
    expect(await row.getByTestId('step-run').innerText()).not.toContain('Waited')
    await expect(row).toHaveAttribute('data-flagged', 'true')
    const background = (step: number) => rows(page).nth(step).getByTestId('step-run').evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await background(timing.step)).not.toBe(await background(calm.step))
  })

  test('a completed step labels its started, finished and waited times', async ({ page, request }) => {
    await openTable(page)
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(DEFAULT_TEXT), DURATION)
    const timing = result.steps.find((s) => s.status === 'completed')!
    expect(timing).toBeDefined()
    const text = await rows(page).nth(timing.step).getByTestId('step-run').innerText()
    for (const label of ['Started', 'Finished', 'Waited']) expect(text).toContain(label)
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

test.describe('AoE4 step annotations in the text view', () => {
  test('the gutter title reads Still waiting for a step that has not started, and the gutter has no labels', async ({ page, request }) => {
    await openPage(page)
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(DEFAULT_TEXT), DURATION)
    const unreached = result.steps.find((s) => s.status === 'not-reached')!
    const calm = result.steps.find((s) => s.status === 'completed' && s.waitSeconds === 0)!
    expect(unreached).toBeDefined()
    expect(calm).toBeDefined()
    await showTab(page, 'build')
    await showView(page, 'text')
    const gutter = page.getByTestId('build-order-line-annotation')
    await expect(gutter.first()).toBeVisible()
    const read = () =>
      gutter.evaluateAll((els) =>
        els.map((el) => ({ step: el.getAttribute('data-line'), status: el.getAttribute('data-status'), title: el.getAttribute('title'), text: el.textContent })),
      )
    await expect.poll(async () => (await read()).some((a) => a.status === 'not-reached')).toBe(true)
    const annotations = (await read()).filter((a) => a.status !== null)
    const reached = annotations.filter((a) => a.status === 'not-reached')
    expect(reached.length).toBeGreaterThan(0)
    for (const a of reached) expect(a.title).toMatch(/^Still waiting\. Blocked by: not reached \(/)
    for (const a of annotations.filter((a) => a.status === 'waiting' || a.status === 'not-reached')) expect(a.title!.startsWith('Waited')).toBe(false)
    expect(annotations.some((a) => a.title === 'Waited 0:00. Blocked by: nothing')).toBe(true)
    for (const a of annotations) {
      expect(a.text).not.toContain('Started')
      expect(a.text).not.toContain('Finished')
    }
  })

  const LONG_LINE = `# ${'x'.repeat(600)}`
  const longText = `${LONG_LINE}\n${DEFAULT_TEXT}`

  async function scrolledLongText(page: Page) {
    await openPage(page)
    await showView(page, 'text')
    const textarea = page.getByTestId('build-order-text')
    await textarea.fill(longText)
    const metrics = await textarea.evaluate((el: HTMLTextAreaElement) => {
      el.scrollLeft = 200
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, scrollLeft: el.scrollLeft }
    })
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)
    expect(metrics.scrollLeft).toBeGreaterThan(0)
    return textarea
  }

  test('choosing another build in the select scrolls the text back to the left', async ({ page }) => {
    const textarea = await scrolledLongText(page)
    await page.getByTestId('build-order-select').selectOption({ label: listBuilds()[1].name })
    await expect(textarea).toHaveValue(formatBuildOrderText(listBuilds()[1]))
    await expect.poll(() => textarea.evaluate((el: HTMLTextAreaElement) => el.scrollLeft)).toBe(0)
  })

  test('typing on a long line with the caret in view keeps the sideways scroll', async ({ page }) => {
    const textarea = await scrolledLongText(page)
    await textarea.focus()
    const before = await textarea.evaluate((el: HTMLTextAreaElement, length: number) => {
      const charWidth = el.scrollWidth / length
      const caret = Math.round((el.scrollLeft + el.clientWidth / 2) / charWidth)
      el.setSelectionRange(caret, caret)
      return el.scrollLeft
    }, LONG_LINE.length)
    expect(before).toBeGreaterThan(0)
    await page.keyboard.type('y')
    await expect(textarea).toHaveValue(/^# x+yx+\n/)
    expect(await textarea.evaluate((el: HTMLTextAreaElement) => el.scrollLeft)).toBe(before)
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
            panelFits: panel.scrollWidth <= panel.clientWidth,
            deletesInside: [...document.querySelectorAll('[data-testid="step-delete"]')].every((el) => el.getBoundingClientRect().right <= right),
          }
        }),
      )
      .toEqual({ panelFits: true, deletesInside: true })

    await showView(page, 'text')
    await expect
      .poll(() =>
        page.evaluate(() => {
          const byId = (id: string) => document.querySelector(`[data-testid="${id}"]`)!
          return byId('build-order-text').getBoundingClientRect().right <= byId('panel-build').getBoundingClientRect().right
        }),
      )
      .toBe(true)
    await expect(page.getByTestId('panel-build')).toHaveCSS('overflow-x', 'visible')
  })

  test('badges stay on one line and each select is wide enough for its selected option', async ({ page }) => {
    const longest = listBuilds().reduce((best, build) => (build.steps.length > best.steps.length ? build : best))
    await openPage(page)
    await page.getByTestId('build-order-select').selectOption({ label: longest.name })
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await showView(page, 'table')
    await expect(page.getByTestId('step-run').first()).toBeVisible()
    const measured = await page.evaluate(() => {
      const px = (value: string) => parseFloat(value) || 0
      const badges = [...document.querySelectorAll('[data-testid="step-kind-badge"]')].map((el) => {
        const style = getComputedStyle(el)
        const lineHeight = style.lineHeight === 'normal' ? px(style.fontSize) * 1.5 : px(style.lineHeight)
        return { whiteSpace: style.whiteSpace, wrapped: el.getBoundingClientRect().height >= lineHeight * 2 }
      })
      const probe = document.body.appendChild(document.createElement('span'))
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap'
      const selects = [...document.querySelectorAll<HTMLSelectElement>('[data-testid="step-table-scroll"] select')].map((select) => {
        const style = getComputedStyle(select)
        probe.style.font = style.font
        probe.textContent = select.selectedOptions[0].textContent
        const chrome = px(style.paddingLeft) + px(style.paddingRight) + px(style.borderLeftWidth) + px(style.borderRightWidth)
        return { text: probe.textContent, needed: probe.getBoundingClientRect().width + chrome, width: select.getBoundingClientRect().width }
      })
      probe.remove()
      return { badges, selects }
    })
    expect(measured.badges.length).toBeGreaterThan(0)
    for (const badge of measured.badges) {
      expect(badge.whiteSpace).toBe('nowrap')
      expect(badge.wrapped).toBe(false)
    }
    expect(measured.selects.some((s) => s.text === 'Capital Town Center')).toBe(true)
    for (const select of measured.selects) expect(select.needed, select.text!).toBeLessThanOrEqual(select.width)
  })
})

test.describe('AoE4 step run cells in the narrow card layout', () => {
  test.use({ viewport: { width: 390, height: 760 } })

  test('every run cell keeps a 4px kind border in its legend colour', async ({ page }) => {
    await openTable(page)
    const legend = await page
      .getByTestId('step-kind-legend')
      .locator('[data-kind]')
      .evaluateAll((els) => els.map((el) => [el.getAttribute('data-kind'), getComputedStyle(el).borderLeftColor]))
    const cells = await rows(page).evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el.querySelector('[data-testid="step-run"]')!)
        return { kind: el.getAttribute('data-kind'), width: style.borderLeftWidth, color: style.borderLeftColor }
      }),
    )
    const colorOf = new Map(legend as [string, string][])
    const colored = cells.filter((c) => c.kind !== 'other')
    expect(colored.length).toBeGreaterThan(0)
    for (const cell of colored) {
      expect(cell.width).toBe('4px')
      expect(cell.color).toBe(colorOf.get(cell.kind!))
    }
  })
})
