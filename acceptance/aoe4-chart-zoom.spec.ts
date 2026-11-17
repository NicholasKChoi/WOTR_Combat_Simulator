import { test, expect, type Page } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_LAYOUT_STORAGE_KEY } from '../components/apps/aoe4-build-order/chart-layout'
import { CHART_IDS, INVALID_PASTE, MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT, expectInvalidNoRun, openPage, plotPoint, setDurationInPlace, showView, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const TWO_BARRACKS = ['start 6 sheep -> sheep', 'move 4 sheep to wood', '@1:00 build barracks with 1 from sheep', '@2:30 build barracks with 1 from sheep'].join('\n')
const RATES = 'chart-gather-rates'
const UNITS = 'chart-units-produced'
const GATHERED = 'chart-gathered-resources'
const MIN_SPAN = 30
// The Knight/Longbow build runs 1200 s with a sample every 5 s; its chart end is 1200 s.
const END = 1200

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: WIDE_VIEWPORT })

interface Window {
  from: number
  to: number
}

const chart = (page: Page, id: string) => page.getByTestId(id)
const plot = (page: Page, id: string) => chart(page, id).getByTestId('chart-plot')
const selection = (page: Page, id: string) => chart(page, id).getByTestId('chart-zoom-selection')
const bar = (page: Page, id: string) => chart(page, id).getByTestId('chart-zoom-bar')
const caret = (page: Page, id: string) => chart(page, id).getByTestId('chart-collapse')
const handle = (page: Page, id: string) => chart(page, id).getByTestId('chart-drag-handle')
const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? null)

async function setup(page: Page, label = BUILD_LABEL): Promise<SimulationResult> {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label }))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  expect(result.times.at(-1), 'the chart end is the API duration').toBe(result.durationSeconds)
  return result
}

async function setupKnightLongbow(page: Page): Promise<SimulationResult> {
  const result = await setup(page)
  expect(result.durationSeconds).toBe(END)
  return result
}

const zoomOf = (page: Page, id: string): Promise<Window | null> =>
  chart(page, id).evaluate((el) => {
    const from = el.getAttribute('data-zoom-from')
    const to = el.getAttribute('data-zoom-to')
    return from === null || to === null ? null : { from: Number(from), to: Number(to) }
  })

async function zoomed(page: Page, id: string): Promise<Window> {
  await expect.poll(() => zoomOf(page, id)).not.toBeNull()
  return (await zoomOf(page, id))!
}

const gridBox = (page: Page, id: string) =>
  chart(page, id)
    .locator('.recharts-cartesian-grid')
    .evaluate((el) => {
      const { left, top, width, height } = el.getBoundingClientRect()
      return { left, top, width, height }
    })

// Seconds per pointer pixel at the chart's current plot width, plus one second for the window's whole-second rounding.
async function tolerance(page: Page, id: string, shown: Window): Promise<number> {
  return (shown.to - shown.from) / (await gridBox(page, id)).width + 1
}

function expectNear(actual: number, expected: number, within: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(within)
}

async function press(page: Page, id: string, fraction: number) {
  const point = await plotPoint(page, id, fraction)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  return point
}

async function dragTo(page: Page, id: string, fraction: number) {
  const point = await plotPoint(page, id, fraction)
  await page.mouse.move(point.x, point.y, { steps: 8 })
  return point
}

async function select(page: Page, id: string, from: number, to: number) {
  await press(page, id, from)
  await dragTo(page, id, to)
  await page.mouse.up()
}

async function expectUnzoomed(page: Page, id: string) {
  await expect.poll(() => zoomOf(page, id)).toBeNull()
  await expect(bar(page, id)).toHaveCount(0)
  await expect(selection(page, id)).toHaveCount(0)
}

const xTickLabels = (page: Page, id: string) => chart(page, id).locator('.recharts-cartesian-axis-tick-value:not([text-anchor="end"])').allTextContents()
const yTickTop = async (page: Page, id: string) => Math.max(...(await chart(page, id).locator('.recharts-cartesian-axis-tick-value[text-anchor="end"]').allTextContents()).map(Number))

test.describe('AoE4 chart zoom select', () => {
  for (const viewport of [MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]) {
    test(`a drag zooms to the dragged fractions of the plot, and the selection shows only while the button is down at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await setupKnightLongbow(page)
      await expectUnzoomed(page, RATES)
      const start = await press(page, RATES, 0.3)
      await page.mouse.move(start.x + 2, start.y)
      await expect(selection(page, RATES)).toHaveCount(0)
      await dragTo(page, RATES, 0.6)
      await expect(selection(page, RATES)).toHaveCount(1)
      await page.mouse.up()
      await expect(selection(page, RATES)).toHaveCount(0)
      await expect(bar(page, RATES)).toBeVisible()
      const shown = await zoomed(page, RATES)
      expect(Number.isInteger(shown.from) && Number.isInteger(shown.to)).toBe(true)
      const within = END / (await gridBox(page, RATES)).width + 1
      expectNear(shown.from, 0.3 * END, within)
      expectNear(shown.to, 0.6 * END, within)
    })
  }

  test('a drag that is short, spans the full game, starts outside the plot box, uses another button or is under 4 px leaves the chart unzoomed', async ({ page }) => {
    await setupKnightLongbow(page)
    await expect(chart(page, RATES)).not.toHaveAttribute('data-label-rows', '0')
    const box = await gridBox(page, RATES)
    const middle = box.top + box.height / 2
    const attempts: [string, () => Promise<void>][] = [
      ['under 30 s', () => select(page, RATES, 0.5, 0.5 + (MIN_SPAN - 6) / END)],
      ['the full game', () => select(page, RATES, 0, 1)],
      ['from the axis', async () => {
        await page.mouse.move(box.left + box.width * 0.3, box.top + box.height + 12)
        await page.mouse.down()
        await dragTo(page, RATES, 0.7)
        await page.mouse.up()
      }],
      ['from the label rows above the grid', async () => {
        await page.mouse.move(box.left + box.width * 0.3, box.top - 6)
        await page.mouse.down()
        await dragTo(page, RATES, 0.7)
        await page.mouse.up()
      }],
      ['from the legend', async () => {
        const legend = await chart(page, RATES).getByTestId('chart-series-legend-item').first().boundingBox()
        await page.mouse.move(legend!.x + 2, legend!.y + 2)
        await page.mouse.down()
        await dragTo(page, RATES, 0.7)
        await page.mouse.up()
      }],
      ['with the middle button', async () => {
        await page.mouse.move(box.left + box.width * 0.3, middle)
        await page.mouse.down({ button: 'middle' })
        await dragTo(page, RATES, 0.7)
        await page.mouse.up({ button: 'middle' })
      }],
      ['under 4 px', async () => {
        await page.mouse.move(box.left + box.width * 0.3, middle)
        await page.mouse.down()
        await page.mouse.move(box.left + box.width * 0.3 + 3, middle, { steps: 3 })
        await expect(selection(page, RATES)).toHaveCount(0)
        await page.mouse.up()
      }],
    ]
    for (const [name, attempt] of attempts) {
      await attempt()
      await expect(selection(page, RATES), name).toHaveCount(0)
      expect(await zoomOf(page, RATES), name).toBeNull()
      await expect(bar(page, RATES), name).toHaveCount(0)
    }
  })

  test('a drag across a collapsed chart leaves it unzoomed after it is expanded', async ({ page }) => {
    await setupKnightLongbow(page)
    await caret(page, RATES).click()
    await expect(chart(page, RATES)).toHaveAttribute('data-collapsed', 'true')
    await page.mouse.move(400, 300)
    await page.mouse.down()
    await page.mouse.move(700, 300, { steps: 6 })
    await page.mouse.up()
    await caret(page, RATES).click()
    await expect(plot(page, RATES)).toBeVisible()
    await expectUnzoomed(page, RATES)
  })

  test('a second selection narrows the window and Reset returns to the full game with focus on the caret', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.2, 0.8)
    const first = await zoomed(page, RATES)
    await select(page, RATES, 0.25, 0.75)
    await expect.poll(async () => (await zoomOf(page, RATES))!.from).toBeGreaterThan(first.from)
    const second = (await zoomOf(page, RATES))!
    const within = await tolerance(page, RATES, first)
    expectNear(second.from, first.from + 0.25 * (first.to - first.from), within)
    expectNear(second.to, first.from + 0.75 * (first.to - first.from), within)
    expect(second.to - second.from).toBeLessThan(first.to - first.from)

    await chart(page, RATES).getByTestId('chart-zoom-reset').click()
    await expectUnzoomed(page, RATES)
    await expect(chart(page, RATES)).not.toHaveAttribute('data-zoom-from', /.*/)
    await expect(chart(page, RATES)).not.toHaveAttribute('data-zoom-to', /.*/)
    await expect(caret(page, RATES)).toBeFocused()
  })

  for (const key of ['Enter', 'Space']) {
    test(`${key} on Reset zoom returns the chart to the full game and focuses its caret`, async ({ page }) => {
      await setupKnightLongbow(page)
      await select(page, UNITS, 0.2, 0.5)
      await zoomed(page, UNITS)
      await chart(page, UNITS).getByTestId('chart-zoom-reset').focus()
      await page.keyboard.press(key)
      await expectUnzoomed(page, UNITS)
      await expect(caret(page, UNITS)).toBeFocused()
    })
  }
})

test.describe('AoE4 chart zoom cancel and listeners', () => {
  test('Escape and pointercancel end a selection without zooming, and the release afterwards changes nothing', async ({ page }) => {
    await setupKnightLongbow(page)
    for (const cancel of [() => page.keyboard.press('Escape'), () => plot(page, RATES).dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true })]) {
      await press(page, RATES, 0.2)
      await dragTo(page, RATES, 0.7)
      await expect(selection(page, RATES)).toHaveCount(1)
      await cancel()
      await expect(selection(page, RATES)).toHaveCount(0)
      await page.mouse.up()
      await expectUnzoomed(page, RATES)
    }
    await select(page, RATES, 0.2, 0.7)
    await zoomed(page, RATES)
  })

  test('Escape during a selection in a zoomed chart keeps the window, and Escape with no drag does nothing', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.2, 0.8)
    const before = await zoomed(page, RATES)
    await page.keyboard.press('Escape')
    expect(await zoomOf(page, RATES)).toEqual(before)
    await press(page, RATES, 0.3)
    await dragTo(page, RATES, 0.6)
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expect(selection(page, RATES)).toHaveCount(0)
    expect(await zoomOf(page, RATES)).toEqual(before)
  })

  test('no listener outlives a finished selection, a finished pan or a cancelled selection', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.2, 0.8)
    const zoom = await zoomed(page, RATES)
    await dragTo(page, RATES, 0.4)
    await page.keyboard.press('Escape')
    await expect(selection(page, RATES)).toHaveCount(0)
    expect(await zoomOf(page, RATES)).toEqual(zoom)

    await page.keyboard.down('Shift')
    await press(page, RATES, 0.5)
    await dragTo(page, RATES, 0.3)
    await page.mouse.up()
    await page.keyboard.up('Shift')
    const panned = await zoomed(page, RATES)
    expect(panned.from).not.toBe(zoom.from)
    await dragTo(page, RATES, 0.8)
    await page.keyboard.press('Escape')
    expect(await zoomOf(page, RATES)).toEqual(panned)

    await press(page, RATES, 0.3)
    await dragTo(page, RATES, 0.7)
    await page.keyboard.press('Escape')
    await page.mouse.up()
    await dragTo(page, RATES, 0.9)
    await expect(selection(page, RATES)).toHaveCount(0)
    expect(await zoomOf(page, RATES)).toEqual(panned)

    await select(page, RATES, 0.3, 0.7)
    await expect.poll(async () => (await zoomOf(page, RATES))!.to - (await zoomOf(page, RATES))!.from).toBeLessThan(panned.to - panned.from)
  })

  test('collapsing the chart while a selection is held ends it, and the next drag zooms after expanding', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.2, 0.8)
    const before = await zoomed(page, RATES)
    await press(page, RATES, 0.3)
    await dragTo(page, RATES, 0.6)
    await expect(selection(page, RATES)).toHaveCount(1)
    await caret(page, RATES).focus()
    await page.keyboard.press('Enter')
    await expect(chart(page, RATES)).toHaveAttribute('data-collapsed', 'true')
    await page.mouse.up()
    await page.keyboard.press('Enter')
    await expect(plot(page, RATES)).toBeVisible()
    await expect(selection(page, RATES)).toHaveCount(0)
    expect(await zoomOf(page, RATES)).toEqual(before)
    await page.keyboard.press('Escape')
    await dragTo(page, RATES, 0.5)
    await expect(selection(page, RATES)).toHaveCount(0)
    expect(await zoomOf(page, RATES)).toEqual(before)

    await select(page, RATES, 0.25, 0.75)
    await expect.poll(async () => (await zoomOf(page, RATES))!.from).toBeGreaterThan(before.from)
  })
})

test.describe('AoE4 chart zoom shown range', () => {
  test('the x axis spans the window with m:ss ticks and nothing is drawn outside the plot box', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, GATHERED, 0.3, 0.6)
    const shown = await zoomed(page, GATHERED)
    const seconds = (label: string) => Number(label.split(':')[0]) * 60 + Number(label.split(':')[1])
    await expect.poll(async () => (await xTickLabels(page, GATHERED)).length).toBeGreaterThan(1)
    const labels = await xTickLabels(page, GATHERED)
    for (const label of labels) expect(label).toMatch(/^\d+:\d{2}$/)
    expect(Math.min(...labels.map(seconds))).toBeGreaterThanOrEqual(shown.from)
    expect(Math.max(...labels.map(seconds))).toBeLessThanOrEqual(shown.to)
    await expect(async () => {
      const { grid, paths } = await chart(page, GATHERED).evaluate((el) => {
        const g = el.querySelector('.recharts-cartesian-grid')!.getBoundingClientRect()
        const found = [...el.querySelectorAll('path.recharts-line-curve')].map((p) => p.getBoundingClientRect())
        return { grid: { left: g.left, right: g.right, top: g.top, bottom: g.bottom }, paths: found.map((r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })) }
      })
      expect(paths.length).toBeGreaterThan(0)
      for (const path of paths) {
        expect(path.left).toBeGreaterThanOrEqual(grid.left - 1)
        expect(path.right).toBeLessThanOrEqual(grid.right + 1)
        expect(path.top).toBeGreaterThanOrEqual(grid.top - 1)
        expect(path.bottom).toBeLessThanOrEqual(grid.bottom + 1)
      }
    }).toPass()
  })

  test('the Buildings y axis is fitted to the rows the window returns, including the edge row after it', async ({ page }) => {
    const result = await setup(page, BUILD_LABEL)
    const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill(TWO_BARRACKS))
    const run = (await response.json()) as SimulationResult
    const topCount = (i: number) => Math.max(...run.productionBuildings.map((b) => b.counts[i]))
    const edge = run.times.findIndex((_, i) => topCount(i) === 2)
    expect(edge, 'a second barracks completes in the run').toBeGreaterThan(1)
    expect(Math.max(...run.times.slice(0, edge).map((_, i) => topCount(i)))).toBe(1)
    expect(run.times[edge] - MIN_SPAN).toBeGreaterThan(0)
    expect(result.durationSeconds).toBe(END)
    await chart(page, UNITS).locator('[data-testid="chart-view-option"][data-view="buildings"]').click()

    const to = run.times[edge] - 2.5
    await select(page, UNITS, 0, to / run.durationSeconds)
    const shown = await zoomed(page, UNITS)
    expect(shown.from, 'the window starts at the chart start').toBe(0)
    expect(shown.to, 'the window ends between the last row inside and the edge row').toBeGreaterThan(run.times[edge - 1])
    expect(shown.to).toBeLessThan(run.times[edge])
    // The lifted second line adds a fraction, so a top fitted to the inside rows alone is 2 and one that reaches the edge row is 3.
    await expect.poll(() => yTickTop(page, UNITS)).toBeGreaterThan(2)
  })
})

test.describe('AoE4 chart zoom markers, pinned age-ups and the step band', () => {
  test('markers, pinned age-ups and the legend follow the window, and labels do not overlap', async ({ page }) => {
    const result = await setupKnightLongbow(page)
    await page.getByTestId('pin-run').click()
    await expect(chart(page, RATES).getByTestId('chart-pinned-marker')).not.toHaveCount(0)
    await select(page, RATES, 0.15, 0.5)
    const shown = await zoomed(page, RATES)
    const inside = (at: number) => at >= shown.from && at <= shown.to
    expect(result.markers.some((m) => inside(m.at))).toBe(true)
    expect(result.markers.some((m) => !inside(m.at))).toBe(true)
    const ageUps = result.markers.filter((m) => m.kind === 'age-up')
    expect(ageUps.some((m) => inside(m.at))).toBe(true)
    expect(ageUps.some((m) => !inside(m.at))).toBe(true)

    const read = () =>
      chart(page, RATES).evaluate((el) => {
        const ats = (id: string) => [...el.querySelectorAll(`[data-testid="${id}"]`)].map((n) => Number(n.getAttribute('data-at'))).sort((a, b) => a - b)
        const labels = [...el.querySelectorAll('svg text.recharts-label')].filter((t) => !t.getAttribute('transform')?.includes('rotate')).map((t) => t.getBoundingClientRect())
        const overlap = labels.some((a, i) => labels.some((b, j) => i < j && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom))
        const tops = new Set(labels.map((l) => Math.round(l.top)))
        return { markers: ats('chart-marker'), pinned: ats('chart-pinned-marker'), overlap, rows: Number(el.getAttribute('data-label-rows')), labelRows: tops.size }
      })
    await expect
      .poll(async () => {
        const got = await read()
        return [got.markers, got.pinned, got.overlap, got.rows === got.labelRows]
      })
      .toEqual([result.markers.filter((m) => inside(m.at)).map((m) => m.at).sort((a, b) => a - b), ageUps.filter((m) => inside(m.at)).map((m) => m.at).sort((a, b) => a - b), false, true])
    await expect(chart(page, RATES).getByTestId('chart-pinned-legend')).toHaveCount(1)
  })

  test('a step band is shown for a step inside the window with its own times and absent for a step wholly outside it', async ({ page }) => {
    const result = await setupKnightLongbow(page)
    await showView(page, 'table')
    await expect(chart(page, UNITS)).toBeVisible()
    const spans = result.steps.filter((s) => s.startedAt !== null && s.completedAt !== null && s.startedAt < s.completedAt)
    const target = spans.find((s) => s.startedAt! >= 200 && s.completedAt! - s.startedAt! <= 150)!
    expect(target, 'the build has a step of 150 s or less after 200 s').toBeDefined()
    await select(page, UNITS, (target.startedAt! - 40) / END, (target.completedAt! + 40) / END)
    const shown = await zoomed(page, UNITS)
    const outside = spans.find((s) => s.completedAt! < shown.from)
    expect(outside, 'a step ends before the window starts').toBeDefined()
    expect(target.startedAt!).toBeGreaterThanOrEqual(shown.from)
    expect(target.completedAt!).toBeLessThanOrEqual(shown.to)

    const row = (step: number) => page.getByTestId('step-row').nth(step)
    const bands = chart(page, UNITS).getByTestId('chart-step-band')
    await row(target.step).hover()
    await expect(bands).toHaveCount(1)
    await expect(bands).toHaveAttribute('data-from', String(target.startedAt))
    await expect(bands).toHaveAttribute('data-to', String(target.completedAt))
    await row(outside!.step).hover()
    await expect(bands).toHaveCount(0)
    await expect(chart(page, RATES).getByTestId('chart-step-band')).toHaveCount(1)
  })
})

test.describe('AoE4 chart zoom pan', () => {
  test('the pan buttons move the window by panStepSeconds keeping its span, clamped and disabled at the edges', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.4, 0.6)
    const start = await zoomed(page, RATES)
    const span = start.to - start.from
    const step = Math.round(span / 2)
    expect(step).toBeGreaterThan(0)
    const earlier = chart(page, RATES).getByTestId('chart-zoom-pan-earlier')
    const later = chart(page, RATES).getByTestId('chart-zoom-pan-later')
    await expect(earlier).not.toHaveAttribute('aria-disabled', 'true')
    await later.click()
    await expect.poll(() => zoomOf(page, RATES)).toEqual({ from: start.from + step, to: start.to + step })
    await earlier.click()
    await expect.poll(() => zoomOf(page, RATES)).toEqual(start)

    for (let i = 0; i < 10; i++) await later.click({ force: true })
    await expect.poll(() => zoomOf(page, RATES)).toEqual({ from: END - span, to: END })
    await expect(later).toHaveAttribute('aria-disabled', 'true')
    await expect.poll(() => later.evaluate((el) => getComputedStyle(el).opacity)).not.toBe(await earlier.evaluate((el) => getComputedStyle(el).opacity))
    await later.click({ force: true })
    await expect(later).toBeFocused()
    expect(await zoomOf(page, RATES)).toEqual({ from: END - span, to: END })

    for (let i = 0; i < 10; i++) await earlier.click({ force: true })
    await expect.poll(() => zoomOf(page, RATES)).toEqual({ from: 0, to: span })
    await expect(earlier).toHaveAttribute('aria-disabled', 'true')
    await earlier.click({ force: true })
    await expect(earlier).toBeFocused()
    expect(await zoomOf(page, RATES)).toEqual({ from: 0, to: span })
  })

  for (const key of ['Enter', 'Space']) {
    test(`${key} activates a pan button`, async ({ page }) => {
      await setupKnightLongbow(page)
      await select(page, RATES, 0.4, 0.6)
      const start = await zoomed(page, RATES)
      const later = chart(page, RATES).getByTestId('chart-zoom-pan-later')
      await later.focus()
      await page.keyboard.press(key)
      await expect.poll(async () => (await zoomOf(page, RATES))!.from).toBeGreaterThan(start.from)
    })
  }

  test('Shift+drag pans a zoomed chart live from the window at pointer down, Escape restores it, and Releasing Shift does not select', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.3, 0.5)
    const start = await zoomed(page, RATES)
    const span = start.to - start.from
    const box = await gridBox(page, RATES)
    const dx = box.width * 0.25
    const expectedFrom = Math.round(start.from - 0.25 * span)
    const within = span / box.width + 1

    await page.keyboard.down('Shift')
    const origin = await press(page, RATES, 0.5)
    await page.mouse.move(origin.x + dx, origin.y, { steps: 8 })
    await expect.poll(async () => (await zoomOf(page, RATES))!.from).toBeLessThan(start.from)
    const live = (await zoomOf(page, RATES))!
    expectNear(live.from, expectedFrom, within)
    expect(live.to - live.from).toBe(span)
    await page.keyboard.up('Shift')
    await page.mouse.move(origin.x + dx * 1.2, origin.y, { steps: 4 })
    await expect(selection(page, RATES)).toHaveCount(0)
    await page.mouse.up()
    const kept = (await zoomOf(page, RATES))!
    expect(kept.to - kept.from).toBe(span)
    expect(kept.from).toBeLessThan(start.from)

    await page.keyboard.down('Shift')
    await press(page, RATES, 0.5)
    await dragTo(page, RATES, 0.2)
    await expect.poll(async () => (await zoomOf(page, RATES))!.from).not.toBe(kept.from)
    await page.keyboard.press('Escape')
    await expect.poll(() => zoomOf(page, RATES)).toEqual(kept)
    await page.mouse.up()
    await page.keyboard.up('Shift')
    expect(await zoomOf(page, RATES)).toEqual(kept)
  })

  test('Shift+drag on an unzoomed chart does nothing', async ({ page }) => {
    await setupKnightLongbow(page)
    await page.keyboard.down('Shift')
    await press(page, RATES, 0.2)
    await dragTo(page, RATES, 0.7)
    await expect(selection(page, RATES)).toHaveCount(0)
    await page.mouse.up()
    await page.keyboard.up('Shift')
    await expectUnzoomed(page, RATES)
  })
})

test.describe('AoE4 chart zoom independence and persistence', () => {
  test('zooming one chart changes no other chart, line, hidden series, marker or step band', async ({ page }) => {
    await setupKnightLongbow(page)
    const others = CHART_IDS.filter((id) => id !== RATES)
    const snapshot = () =>
      page.evaluate((ids) => {
        return ids.map((id) => {
          const el = document.querySelector(`[data-testid="${id}"]`)!
          return {
            zoom: [el.getAttribute('data-zoom-from'), el.getAttribute('data-zoom-to')],
            lines: [...el.querySelectorAll('path[data-series]')].map((p) => p.getAttribute('d')),
            markers: [...el.querySelectorAll('[data-testid="chart-marker"]')].map((m) => m.getAttribute('data-at')),
            bands: el.querySelectorAll('[data-testid="chart-step-band"]').length,
            legend: [...el.querySelectorAll('[data-testid="chart-series-legend-item"]')].map((l) => l.textContent),
          }
        })
      }, others)
    const before = await snapshot()
    expect(before.every((c) => c.lines.length > 0 && c.markers.length > 0)).toBe(true)
    await select(page, RATES, 0.3, 0.6)
    await zoomed(page, RATES)
    expect(await snapshot()).toEqual(before)
  })

  test('the window survives collapse, reorder, a view toggle and a pin or unpin', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.3, 0.6)
    const shown = await zoomed(page, RATES)
    const stays = async () => {
      await expect(bar(page, RATES)).toBeVisible()
      expect(await zoomOf(page, RATES)).toEqual(shown)
    }

    await caret(page, RATES).click()
    await caret(page, RATES).click()
    await stays()
    await handle(page, RATES).focus()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => page.evaluate((id) => document.querySelector(`[data-testid="${id}"]`)!.previousElementSibling?.getAttribute('data-testid') ?? null, RATES)).not.toBeNull()
    await stays()
    await chart(page, RATES).locator('[data-testid="chart-view-option"][data-view="villagers"]').click()
    await stays()
    await page.getByTestId('pin-run').click()
    await expect(chart(page, RATES).getByTestId('chart-pinned-legend')).toHaveCount(1)
    await stays()
    await page.getByTestId('unpin-run').click()
    await expect(chart(page, RATES).getByTestId('chart-pinned-legend')).toHaveCount(0)
    await stays()
  })

  test('a shorter run caps the window at the new end, a longer one keeps the cap, and an end before the window start unzooms it', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.3, 0.6)
    const shown = await zoomed(page, RATES)
    const shorter = 600
    expect(shorter).toBeGreaterThan(shown.from + MIN_SPAN)
    expect(shorter).toBeLessThan(shown.to)
    const short = (await (await waitForRun(page, () => setDurationInPlace(page, String(shorter)))).json()) as SimulationResult
    expect(short.times.at(-1)).toBe(shorter)
    await expect.poll(() => zoomOf(page, RATES)).toEqual({ from: shown.from, to: shorter })

    await waitForRun(page, () => setDurationInPlace(page, String(END)))
    await expect.poll(() => zoomOf(page, RATES)).toEqual({ from: shown.from, to: shorter })

    const tooShort = 300
    expect(tooShort).toBeLessThanOrEqual(shown.from)
    const run = (await (await waitForRun(page, () => setDurationInPlace(page, String(tooShort)))).json()) as SimulationResult
    expect(run.times.at(-1)).toBe(tooShort)
    await expectUnzoomed(page, RATES)
    await waitForRun(page, () => setDurationInPlace(page, String(END)))
    await expectUnzoomed(page, RATES)
  })

  test('a reload shows every chart in full and zooming writes nothing to storage', async ({ page }) => {
    await setupKnightLongbow(page)
    const stored = () => page.evaluate((key) => localStorage.getItem(key), CHART_LAYOUT_STORAGE_KEY)
    const before = await stored()
    await select(page, RATES, 0.3, 0.6)
    await select(page, UNITS, 0.2, 0.5)
    await zoomed(page, RATES)
    await zoomed(page, UNITS)
    expect(await stored()).toBe(before)
    await page.reload()
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
    for (const id of CHART_IDS) await expectUnzoomed(page, id)
  })
})

test.describe('AoE4 chart zoom keyboard and dimmed results', () => {
  test('Tab reaches the handle, caret, view toggle, Show earlier, Show later and Reset zoom in order and skips the range text', async ({ page }) => {
    await setupKnightLongbow(page)
    await select(page, RATES, 0.3, 0.6)
    await zoomed(page, RATES)
    await handle(page, RATES).focus()
    const stops: (string | null)[] = [await activeTestId(page)]
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab')
      stops.push(await activeTestId(page))
    }
    const at = (id: string) => stops.indexOf(id)
    expect(stops).not.toContain('chart-zoom-range')
    expect(stops[0]).toBe('chart-drag-handle')
    expect(at('chart-collapse')).toBe(1)
    expect(at('chart-view-option')).toBe(2)
    const earlier = at('chart-zoom-pan-earlier')
    expect(earlier).toBeGreaterThan(at('chart-view-option'))
    expect(at('chart-zoom-pan-later')).toBe(earlier + 1)
    expect(at('chart-zoom-reset')).toBe(earlier + 2)
    expect(stops[earlier + 3]).not.toBe('chart-zoom-reset')
  })

  test('zoom, pan and reset work while the results are dimmed by an invalid edit', async ({ page }) => {
    await setupKnightLongbow(page)
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    await expectInvalidNoRun(page)
    await expect.poll(() => page.getByTestId('results-last-good').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5')
    await select(page, RATES, 0.3, 0.6)
    const start = await zoomed(page, RATES)
    await chart(page, RATES).getByTestId('chart-zoom-pan-later').click()
    await expect.poll(async () => (await zoomOf(page, RATES))!.from).toBeGreaterThan(start.from)
    await chart(page, RATES).getByTestId('chart-zoom-reset').click()
    await expectUnzoomed(page, RATES)
  })
})
