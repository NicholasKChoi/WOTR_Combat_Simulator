import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult, StepTiming } from '../lib/aoe4-build-order/model'
import { parseBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { SIMULATE_PATH, SPLIT_VIEWPORT, openPage, showView, waitForRun } from './helpers'

const CHARTS = ['chart-units-produced', 'chart-gather-rates', 'chart-gathered-resources', 'chart-floating-resources'] as const
const EN_DASH = '–'
const VILLAGER = 'produce villager from capital-town-center'

const MIXED_BUILD = [
  '# opening',
  'start 6 sheep -> sheep',
  '',
  `${VILLAGER} x1`,
  `${VILLAGER} x2`,
  'research textiles',
  `${VILLAGER} x1`,
  '',
  '# tail',
  'build barracks with 9 from sheep',
  `${VILLAGER} x1`,
].join('\n')
const WAITING_BUILD = ['start 6 sheep -> sheep', `${VILLAGER} x1`, 'research textiles'].join('\n')
const NOT_REACHED_BUILD = MIXED_BUILD
const START_ONLY_BUILD = 'start 6 sheep -> sheep'

function stepLinesOf(text: string): number[] {
  const parsed = parseBuildOrderText(text)
  if (!parsed.ok) throw new Error('fixture must parse')
  return parsed.lines.steps
}

const STEP_LINES = stepLinesOf(MIXED_BUILD)
const LINE_OF = { instant: 4, spanning: 5, waiting: 6, notReached: 10, blank: 8 }

const gutter = (page: Page, line: number) => page.locator(`[data-testid="build-order-line-annotation"][data-line="${line}"]`)
const annotations = (page: Page) => page.getByTestId('build-order-annotations')
const legend = (page: Page) => page.getByTestId('step-kind-legend')
const bands = (page: Page, chart: string) => page.getByTestId(chart).getByTestId('chart-step-band')
const textarea = (page: Page) => page.getByTestId('build-order-text')

async function clickLine(page: Page, line: number) {
  const box = await page.locator(`[data-testid="build-order-line-number"][data-line="${line}"]`).evaluate((el) => {
    const { top, height } = el.getBoundingClientRect()
    return { y: top + height / 2 }
  })
  const textBox = (await textarea(page).boundingBox())!
  await page.mouse.click(textBox.x + 60, box.y)
}

async function openText(page: Page, text: string): Promise<SimulationResult> {
  await openPage(page)
  await showView(page, 'text')
  const response = await waitForRun(page, () => textarea(page).fill(text))
  await expect(annotations(page)).toBeVisible()
  return (await response.json()) as SimulationResult
}

function expectStatus(result: SimulationResult, step: number, status: StepTiming['status']) {
  expect(result.steps[step].status).toBe(status)
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

const bandsPerChart = (page: Page) =>
  page.evaluate((charts) => charts.map((chart) => [...document.querySelectorAll(`[data-testid="${chart}"] [data-testid="chart-step-band"]`)].map((el) => [Number(el.getAttribute('data-from')), Number(el.getAttribute('data-to'))])), CHARTS)

const expectBandEverywhere = (page: Page, timing: StepTiming) =>
  expect.poll(() => bandsPerChart(page)).toEqual(CHARTS.map(() => [[timing.startedAt, timing.completedAt]]))

const expectNoBands = (page: Page) => expect.poll(() => bandsPerChart(page)).toEqual(CHARTS.map(() => []))

test.describe('AoE4 compact view in the Text tab', () => {
  test.use({ viewport: SPLIT_VIEWPORT })

  test('step lines read the same kind and times as the table rows, and other lines are empty', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    expect(STEP_LINES).toHaveLength(result.steps.length)
    const textView = await page.evaluate((stepLines) => {
      const li = (line: number) => document.querySelector(`[data-testid="build-order-line-annotation"][data-line="${line}"]`)!
      const text = (el: Element, id: string) => el.querySelector(`[data-testid="${id}"]`)?.textContent ?? null
      return stepLines.map((line) => ({ kind: li(line).getAttribute('data-kind'), started: text(li(line), 'step-started'), finished: text(li(line), 'step-finished') }))
    }, STEP_LINES)
    const otherLines = await page.evaluate((stepLines) => {
      return [...document.querySelectorAll('[data-testid="build-order-line-annotation"]')]
        .filter((el) => !stepLines.includes(Number(el.getAttribute('data-line'))))
        .map((el) => ({ kind: el.getAttribute('data-kind'), started: el.querySelector('[data-testid="step-started"]') !== null }))
    }, STEP_LINES)
    expect(otherLines).toHaveLength(MIXED_BUILD.split('\n').length - STEP_LINES.length)
    for (const other of otherLines) expect(other).toEqual({ kind: null, started: false })

    await expect(legend(page)).toHaveCount(1)
    await showView(page, 'table')
    await expect(legend(page)).toHaveCount(1)
    const rows = page.getByTestId('step-row')
    await expect(rows).toHaveCount(result.steps.length)
    for (const [i, view] of textView.entries()) {
      await expect(rows.nth(i)).toHaveAttribute('data-kind', view.kind!)
      await expect(rows.nth(i).getByTestId('step-started')).toHaveText(view.started!)
      await expect(rows.nth(i).getByTestId('step-finished')).toHaveText(view.finished!)
    }
    expect(new Set(textView.map((v) => v.kind)).size).toBeGreaterThanOrEqual(3)
  })

  for (const [status, build, step] of [
    ['waiting', WAITING_BUILD, 1],
    ['not-reached', NOT_REACHED_BUILD, 3],
  ] as const) {
    test(`a ${status} step reads an en dash for both times, is flagged and is tinted`, async ({ page }) => {
      const result = await openText(page, build)
      expectStatus(result, step, status)
      expect(result.steps[0]).toMatchObject({ status: 'completed', waitSeconds: 0 })
      const lines = stepLinesOf(build)
      const calmLine = lines[0]
      const flagged = gutter(page, lines[step])
      await expect(flagged.getByTestId('step-started')).toHaveText(EN_DASH)
      await expect(flagged.getByTestId('step-finished')).toHaveText(EN_DASH)
      await expect(flagged).toHaveAttribute('data-flagged', 'true')
      const background = (locator: ReturnType<typeof gutter>) => locator.evaluate((el) => getComputedStyle(el).backgroundColor)
      await expect(gutter(page, calmLine)).not.toHaveAttribute('data-flagged', /.*/)
      expect(await background(flagged)).not.toBe(await background(gutter(page, calmLine)))
    })
  }

  test('annotation rows line up with the line numbers and the Build panel does not scroll sideways', async ({ page }) => {
    await openText(page, MIXED_BUILD)
    await expect
      .poll(() =>
        page.evaluate(() => {
          const rect = (selector: string) => [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect())
          const numbers = rect('[data-testid="build-order-line-number"]')
          const notes = rect('[data-testid="build-order-line-annotation"]')
          const byId = (id: string) => document.querySelector(`[data-testid="${id}"]`)!
          const panel = byId('panel-build')
          return {
            sameCount: numbers.length === notes.length && numbers.length > 0,
            aligned: numbers.every((n, i) => n.top === notes[i]?.top && n.height === notes[i]?.height),
            panelFits: panel.scrollWidth <= panel.clientWidth,
            textareaInside: byId('build-order-text').getBoundingClientRect().right <= panel.getBoundingClientRect().right,
          }
        }),
      )
      .toEqual({ sameCount: true, aligned: true, panelFits: true, textareaInside: true })
  })

  test('the annotation column and the legend are absent before a result and the legend follows the parsed steps', async ({ page }) => {
    const release = await holdSimulate(page)
    try {
      await page.goto('/apps/aoe4-build-order')
      await showView(page, 'text')
      await expect(textarea(page)).toBeVisible()
      await expect(annotations(page)).toHaveCount(0)
      await expect(legend(page)).toHaveCount(0)
    } finally {
      release()
    }
    await expect(annotations(page)).toBeVisible()
    await expect(legend(page)).toBeVisible()
    await expect(legend(page)).toHaveCount(1)
    const legendBottom = await legend(page).evaluate((el) => el.getBoundingClientRect().bottom)
    expect(legendBottom).toBeLessThanOrEqual(await textarea(page).evaluate((el) => el.getBoundingClientRect().top))
    await showView(page, 'table')
    await expect(legend(page)).toHaveCount(1)
    await showView(page, 'text')

    await waitForRun(page, () => textarea(page).fill(START_ONLY_BUILD))
    await expect(annotations(page)).toBeVisible()
    await expect(legend(page)).toHaveCount(0)

    await waitForRun(page, () => textarea(page).fill(MIXED_BUILD))
    await expect(legend(page)).toHaveCount(1)
    await textarea(page).fill(MIXED_BUILD.replace(`${VILLAGER} x2`, 'frobnicate'))
    await expect(page.getByTestId('build-order-issue').first()).toBeVisible()
    await expect(legend(page)).toBeVisible()
  })

  test('a changed step loses its times and the others dim until the held result lands', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    expectStatus(result, 1, 'completed')
    const kept = gutter(page, LINE_OF.spanning)
    await expect(kept).not.toHaveAttribute('data-stale', /.*/)
    await expect(kept).toHaveCSS('opacity', '1')
    const release = await holdSimulate(page)
    try {
      await textarea(page).fill(MIXED_BUILD.replace(`${VILLAGER} x1`, `${VILLAGER} x3`))
      await expect(kept).toHaveAttribute('data-stale', 'true')
      await expect(kept).toHaveCSS('opacity', '0.5')
      await expect(gutter(page, LINE_OF.instant).getByTestId('step-started')).toHaveCount(0)
      await gutter(page, LINE_OF.instant).hover()
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      expect(await page.locator('[data-gutter-active="true"]').count()).toBe(0)
    } finally {
      release()
    }
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
    await expect(kept).toHaveCSS('opacity', '1')
    await expect(kept).not.toHaveAttribute('data-stale', /.*/)
  })

  test('a changed step that was flagged keeps only its kind: no times, status, flags or warning background', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    expectStatus(result, 4, 'not-reached')
    const changed = gutter(page, LINE_OF.notReached)
    const calm = gutter(page, LINE_OF.instant)
    const background = (locator: ReturnType<typeof gutter>) => locator.evaluate((el) => getComputedStyle(el).backgroundColor)
    await expect(changed).toHaveAttribute('data-status', 'not-reached')
    await expect(changed).toHaveAttribute('data-flagged', 'true')
    const warning = await background(changed)
    expect(warning).not.toBe(await background(calm))

    const release = await holdSimulate(page)
    try {
      await textarea(page).fill(MIXED_BUILD.replace('with 9 from sheep', 'with 8 from sheep'))
      await expect(changed).toHaveAttribute('data-stale', 'true')
      await expect(changed).toHaveAttribute('data-kind', /.+/)
      for (const id of ['step-started', 'step-finished']) await expect(changed.getByTestId(id)).toHaveCount(0)
      for (const attribute of ['data-status', 'data-flagged', 'data-long-wait']) await expect(changed).not.toHaveAttribute(attribute, /.*/)
      await expect(calm).toHaveAttribute('data-stale', 'true')
      expect(await background(changed)).toBe(await background(calm))
      expect(await background(changed)).not.toBe(warning)
    } finally {
      release()
    }
  })

  test('a syntax error keeps the other lines annotated and dimmed and leaves its own line empty', async ({ page }) => {
    await openText(page, MIXED_BUILD)
    await textarea(page).fill(MIXED_BUILD.replace(`${VILLAGER} x2`, 'frobnicate'))
    await expect(gutter(page, LINE_OF.spanning)).not.toHaveAttribute('data-kind', /.*/)
    await expect(gutter(page, LINE_OF.spanning).getByTestId('step-started')).toHaveCount(0)
    for (const line of [LINE_OF.instant, LINE_OF.waiting, LINE_OF.notReached]) {
      await expect(gutter(page, line)).toHaveAttribute('data-kind', /.+/)
      await expect(gutter(page, line)).toHaveAttribute('data-stale', 'true')
      await expect(gutter(page, line)).toHaveCSS('opacity', '0.5')
    }
  })

  test('hovering a gutter line shades that step on every chart and sets only data-gutter-active', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    expectStatus(result, 1, 'completed')
    expectStatus(result, 4, 'not-reached')
    expect(result.steps[1].completedAt).toBeGreaterThan(result.steps[1].startedAt!)
    await expectNoBands(page)

    await gutter(page, LINE_OF.spanning).hover()
    await expectBandEverywhere(page, result.steps[1])
    await expect(page.locator('[data-gutter-active="true"]')).toHaveCount(1)
    await expect(gutter(page, LINE_OF.spanning)).toHaveAttribute('data-gutter-active', 'true')
    await expect(page.locator('[data-active="true"]')).toHaveCount(0)
    const shadow = (line: number) => gutter(page, line).evaluate((el) => getComputedStyle(el).boxShadow)
    expect(await shadow(LINE_OF.spanning)).not.toBe(await shadow(LINE_OF.instant))

    await page.mouse.move(0, 0)
    await expectNoBands(page)
    await expect(page.locator('[data-gutter-active="true"]')).toHaveCount(0)

    await gutter(page, LINE_OF.notReached).hover()
    await expect(gutter(page, LINE_OF.notReached)).toHaveAttribute('data-gutter-active', 'true')
    await expectNoBands(page)
  })

  test('the caret shades the step it is on, and a blank line, a comment line or a blur clears it', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    await textarea(page).focus()
    await clickLine(page, LINE_OF.instant)
    await expectBandEverywhere(page, result.steps[0])
    await page.keyboard.press('ArrowDown')
    await expectBandEverywhere(page, result.steps[1])
    for (let line = LINE_OF.spanning; line < LINE_OF.blank; line++) await page.keyboard.press('ArrowDown')
    await expectNoBands(page)
    await page.keyboard.press('ArrowDown')
    await expectNoBands(page)

    await clickLine(page, LINE_OF.spanning)
    await expectBandEverywhere(page, result.steps[1])
    await textarea(page).blur()
    await expectNoBands(page)
  })

  test('the last event wins between the caret and the gutter hover', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    await textarea(page).focus()
    await clickLine(page, LINE_OF.spanning)
    await expectBandEverywhere(page, result.steps[1])

    await gutter(page, LINE_OF.instant).hover()
    await expectBandEverywhere(page, result.steps[0])
    await page.mouse.move(0, 0)
    await expectNoBands(page)

    await page.keyboard.press('ArrowRight')
    await expectBandEverywhere(page, result.steps[1])
  })

  test('a key release that leaves the caret in place re-shades the caret line after a hover left', async ({ page }) => {
    const result = await openText(page, MIXED_BUILD)
    await textarea(page).focus()
    await clickLine(page, LINE_OF.spanning)
    await expectBandEverywhere(page, result.steps[1])
    await gutter(page, LINE_OF.instant).hover()
    await expectBandEverywhere(page, result.steps[0])
    await page.mouse.move(0, 0)
    await expectNoBands(page)

    await page.keyboard.press('Shift')
    await expectBandEverywhere(page, result.steps[1])
  })
})
