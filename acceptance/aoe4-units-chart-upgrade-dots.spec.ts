import { test, expect, type Locator, type Page } from '@playwright/test'
import type { ChartMarker, SimulationResult } from '../lib/aoe4-build-order/model'
import { formatMinSec } from '../lib/aoe4-build-order/format-time'
import { markerLabel } from '../components/apps/aoe4-build-order/chart-markers'
import { CHART_IDS, WIDE_VIEWPORT, openPage, plotPoint, waitForRun } from './helpers'

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const PREFIXED_BUILD_LABEL = 'ENG Spear/Longbow into MAA/Crossbow'
const UNITS = 'chart-units-produced'
const LINE = 'longbowman'
const PINNED_LINE = `pinned:${LINE}`
const DOT = '[data-testid="chart-upgrade-dot"]'
const PINNED_DOT = '[data-testid="chart-pinned-upgrade-dot"]'
// The Knight/Longbow build runs 1200 s with its only longbowman upgrade near 838 s.
const FULL_DURATION = 1200
const SHORT_DURATION = 900
const NEAR_FULL_DURATION = 1190
const ON_LINE_PX = 1.5
const WHITE = 'rgb(255, 255, 255)'
// Six extra longbowmen queued before this research push its upgrade to ~904 s, between two samples where the line rises by one.
const RISING_ANCHOR = 'research iron-undermesh'
const RISING_EXTRA = 'produce longbowman from archery-range\n'.repeat(6).trimEnd()

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: WIDE_VIEWPORT })

const chart = (page: Page, id = UNITS) => page.getByTestId(id)
const legendItem = (page: Page, key: string) => chart(page).locator(`[data-testid="chart-series-legend-item"][data-series="${key}"]`)
const markerItem = (page: Page, kind: string) => page.locator(`[data-testid="chart-marker-legend-item"][data-kind="${kind}"]`)
const lineOf = (page: Page, key: string) => chart(page).locator(`path[data-series="${key}"]`)
const dotsOf = (page: Page, selector: string) => chart(page).locator(selector)
const yLabel = (page: Page) => chart(page).locator('text.recharts-label[transform^="rotate(-90"]')
const viewOption = (page: Page, view: string) => chart(page).locator(`[data-testid="chart-view-option"][data-view="${view}"]`)

const upgradesOf = (result: SimulationResult): ChartMarker[] => result.markers.filter((m) => m.unit === LINE)
const dotMarkers = (result: SimulationResult): ChartMarker[] => {
  const lines = new Set(result.unitsProduced.map((u) => u.baseId))
  return result.markers.filter((m) => m.unit !== undefined && lines.has(m.unit))
}

async function load(page: Page): Promise<SimulationResult> {
  await openPage(page)
  const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  expect(result.durationSeconds).toBe(FULL_DURATION)
  expect(result.unitsProduced.filter((u) => u.baseId === LINE).length, 'longbowman is produced in two or more tiers').toBeGreaterThanOrEqual(2)
  expect(upgradesOf(result).length, 'the build has a longbowman upgrade marker').toBeGreaterThanOrEqual(1)
  return result
}

async function rerun(page: Page, durationSeconds: number): Promise<SimulationResult> {
  const response = await waitForRun(page, () => page.getByTestId('duration-seconds').fill(String(durationSeconds)))
  expect(response.status()).toBe(200)
  const result = (await response.json()) as SimulationResult
  expect(result.durationSeconds).toBe(durationSeconds)
  return result
}

async function loadPinned(page: Page): Promise<{ full: SimulationResult; short: SimulationResult }> {
  const full = await load(page)
  await page.getByTestId('pin-run').click()
  const short = await rerun(page, SHORT_DURATION)
  expect(upgradesOf(full).at(0)!.at, 'the short run ends past the first upgrade').toBeLessThan(SHORT_DURATION)
  expect(upgradesOf(short).map((m) => m.at)).toEqual(upgradesOf(full).map((m) => m.at))
  return { full, short }
}

interface DotReading {
  at: string | null
  label: string | null
  title: string | null
  fill: string
  stroke: string
  dash: string
  r: number
  cx: number
  cy: number
  distance: number
  lineStroke: string
  order: number
}

// Every dot matching `dotSelector` is read with the path it should lie on in one evaluate: the dot's centre and the
// path are compared in the same user-space units, so a redraw between reads cannot split them.
function readDots(root: Locator, dotSelector: string, lineKey: string): Promise<DotReading[]> {
  return root.evaluate(
    (el, found) => {
      const line = el.querySelector(`path[data-series="${found.lineKey}"]`)
      const runs: [number, number][][] = []
      for (const [, command, x, y] of (line?.getAttribute('d') ?? '').matchAll(/([ML])\s*(-?[\d.e+-]+)[ ,](-?[\d.e+-]+)/g)) {
        if (command === 'M') runs.push([])
        runs.at(-1)?.push([Number(x), Number(y)])
      }
      const distanceTo = (px: number, py: number) => {
        let best = Infinity
        for (const run of runs) {
          for (let i = 0; i < run.length; i++) {
            const [ax, ay] = run[i]
            const [bx, by] = run[i + 1] ?? run[i]
            const length = (bx - ax) ** 2 + (by - ay) ** 2
            const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / length))
            best = Math.min(best, Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))))
          }
        }
        return best
      }
      const all = [...el.querySelectorAll('[data-testid="chart-upgrade-dot"], [data-testid="chart-pinned-upgrade-dot"]')]
      return [...el.querySelectorAll(found.dotSelector)].map((dot) => {
        const style = getComputedStyle(dot)
        const cx = Number(dot.getAttribute('cx'))
        const cy = Number(dot.getAttribute('cy'))
        return {
          at: dot.getAttribute('data-at'),
          label: dot.getAttribute('data-label'),
          title: dot.parentElement?.querySelector(':scope > title')?.textContent ?? null,
          fill: style.fill,
          stroke: style.stroke,
          dash: style.strokeDasharray,
          r: Number(dot.getAttribute('r')),
          cx,
          cy,
          distance: distanceTo(cx, cy),
          lineStroke: line ? getComputedStyle(line).stroke : '',
          order: all.indexOf(dot),
        }
      })
    },
    { dotSelector, lineKey },
  )
}

async function expectOnLine(page: Page, selector: string, lineKey: string, count: number): Promise<DotReading[]> {
  let dots: DotReading[] = []
  await expect
    .poll(async () => {
      dots = await readDots(chart(page), selector, lineKey)
      return dots.length === count && dots.every((d) => d.distance <= ON_LINE_PX)
    })
    .toBe(true)
  return dots
}

async function expectNoDots(page: Page) {
  await expect(dotsOf(page, DOT)).toHaveCount(0)
  await expect(dotsOf(page, PINNED_DOT)).toHaveCount(0)
}

async function expectNoDotsElsewhere(page: Page) {
  for (const id of CHART_IDS.filter((c) => c !== UNITS)) await expect(chart(page, id).locator(`${DOT}, ${PINNED_DOT}`)).toHaveCount(0)
}

async function dragZoom(page: Page, from: number, to: number) {
  const start = await plotPoint(page, UNITS, from)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  const end = await plotPoint(page, UNITS, to)
  await page.mouse.move(end.x, end.y, { steps: 8 })
  await page.mouse.up()
}

// The Longbowman tooltip reading when hovering `fraction` of the plot, with the sample the label names.
async function hoverLongbowman(page: Page, fraction: number): Promise<{ label: string; value: number }> {
  let reading = { label: '', value: NaN }
  await expect(async () => {
    const point = await plotPoint(page, UNITS, fraction)
    await page.mouse.move(point.x - 3, point.y)
    await page.mouse.move(point.x, point.y)
    reading = await chart(page).locator('.recharts-tooltip-wrapper').evaluate((el) => {
      const item = [...el.querySelectorAll('.recharts-tooltip-item')].find((i) => i.querySelector('.recharts-tooltip-item-name')?.textContent === 'Longbowman')
      return { label: el.querySelector('.recharts-tooltip-label')?.textContent ?? '', value: Number(item?.querySelector('.recharts-tooltip-item-value')?.textContent) }
    })
    expect(Number.isFinite(reading.value)).toBe(true)
  }).toPass()
  return reading
}

const zoomWindow = (page: Page) =>
  chart(page).evaluate((el) => {
    const from = el.getAttribute('data-zoom-from')
    const to = el.getAttribute('data-zoom-to')
    return from === null || to === null ? null : { from: Number(from), to: Number(to) }
  })

test.describe('AoE4 Units chart unit lines and upgrade dots', () => {
  test('the Units chart draws one line per unit line, named by its line name, with the Count label', async ({ page }) => {
    const result = await load(page)
    const lines = new Map(result.unitsProduced.map((u) => [u.baseId, u.lineName]))

    await expect(lineOf(page, LINE)).toHaveCount(1)
    for (const { unitId } of result.unitsProduced.filter((u) => u.unitId !== u.baseId)) await expect(lineOf(page, unitId)).toHaveCount(0)
    await expect(chart(page).locator('path[data-series]')).toHaveCount(lines.size)
    await expect(chart(page).getByTestId('chart-series-legend-item')).toHaveText([...lines.values()])
    await expect(yLabel(page)).toHaveText('Count')
  })

  test('a unit line whose tier names carry a prefix is named by its line name in the legend', async ({ page }) => {
    await openPage(page)
    const response = await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: PREFIXED_BUILD_LABEL }))
    const result = (await response.json()) as SimulationResult
    expect(result.unitsProduced.some((u) => u.name !== u.lineName), 'a tier name differs from its line name').toBe(true)

    const names = new Map(result.unitsProduced.map((u) => [u.baseId, u.lineName]))
    await expect(chart(page).getByTestId('chart-series-legend-item')).toHaveText([...names.values()])
  })

  test('the Longbowman line adds the counts of its tiers at every sample', async ({ page }) => {
    const result = await load(page)
    const tiers = result.unitsProduced.filter((u) => u.baseId === LINE)
    for (const fraction of [0.5, 0.95]) {
      const { label, value } = await hoverLongbowman(page, fraction)
      const i = result.times.findIndex((t) => formatMinSec(t) === label)
      expect(i, `a sample is labelled ${label}`).toBeGreaterThanOrEqual(0)
      const counts = tiers.map((u) => u.counts[i])
      expect(counts.filter((c) => c > 0), 'one tier holds every longbowman here, so a line drawn from the other tier misses the sum').toHaveLength(1)
      expect(value).toBe(counts.reduce((a, b) => a + b, 0))
    }
  })

  test('each longbowman upgrade is a dot on the longbowman line, in the line colour with a white stroke and a time title', async ({ page }) => {
    const result = await load(page)
    const upgrades = upgradesOf(result)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(result).length)

    const dots = await expectOnLine(page, `${DOT}[data-series="${LINE}"]`, LINE, upgrades.length)
    expect(dots.map((d) => Number(d.at))).toEqual(upgrades.map((m) => m.at))
    expect(dots.map((d) => d.label)).toEqual(upgrades.map((m) => m.label))
    expect(dots.map((d) => d.title)).toEqual(upgrades.map(markerLabel))
    for (const dot of dots) {
      expect(dot.fill).toBe(dot.lineStroke)
      expect(dot.stroke).toBe(WHITE)
      expect(dot.r).toBe(4)
    }
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(0)
  })

  test('an upgrade between two samples where the line rises is drawn on the line for the current and the pinned run', async ({ page }) => {
    const base = await load(page)
    const text = await page.getByTestId('build-order-text').inputValue()
    expect(text).toContain(RISING_ANCHOR)
    const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill(text.replace(RISING_ANCHOR, `${RISING_ANCHOR}\n${RISING_EXTRA}`)))
    const result = (await response.json()) as SimulationResult
    const [upgrade] = upgradesOf(result)
    const after = result.times.findIndex((t) => t > upgrade.at)
    const lineAt = (i: number) => result.unitsProduced.filter((u) => u.baseId === LINE).reduce((sum, u) => sum + u.counts[i], 0)
    expect(upgradesOf(result)).toHaveLength(1)
    expect(upgrade.at, 'the upgrade moved off the template').not.toBe(upgradesOf(base)[0].at)
    expect(result.times[after - 1], 'the upgrade lies between two samples').toBeLessThan(upgrade.at)
    expect(lineAt(after) - lineAt(after - 1), 'the line rises across the upgrade').toBeGreaterThanOrEqual(1)
    await expectOnLine(page, `${DOT}[data-series="${LINE}"]`, LINE, 1)

    await page.getByTestId('pin-run').click()
    await rerun(page, NEAR_FULL_DURATION)
    await expectOnLine(page, `${PINNED_DOT}[data-series="${PINNED_LINE}"]`, PINNED_LINE, 1)
    await expectOnLine(page, `${DOT}[data-series="${LINE}"]`, LINE, 1)

    const before = await rerun(page, Math.floor(upgrade.at / 5) * 5 - 20)
    expect(upgradesOf(before)).toHaveLength(0)
    await expectOnLine(page, `${PINNED_DOT}[data-series="${PINNED_LINE}"]`, PINNED_LINE, 1)
    await expect(dotsOf(page, DOT)).toHaveCount(0)
  })

  test('with a pin, each pinned upgrade is a dashed white ring on the pinned line and the current run draws only its own dots; unpinning removes them and a rerun recomputes both', async ({ page }) => {
    const { full, short } = await loadPinned(page)
    await expect(lineOf(page, PINNED_LINE)).toHaveCount(1)

    const pinnedDots = await expectOnLine(page, `${PINNED_DOT}[data-series="${PINNED_LINE}"]`, PINNED_LINE, upgradesOf(full).length)
    expect(pinnedDots.map((d) => Number(d.at))).toEqual(upgradesOf(full).map((m) => m.at))
    expect(pinnedDots.map((d) => d.title)).toEqual(upgradesOf(full).map((m) => `${m.label} (pinned) ${formatMinSec(m.at)}`))
    for (const dot of pinnedDots) {
      expect(dot.fill).toBe(WHITE)
      expect(dot.stroke).toBe(dot.lineStroke)
      expect(dot.dash).not.toBe('none')
      expect(dot.r).toBe(5)
    }
    await expectOnLine(page, `${DOT}[data-series="${LINE}"]`, LINE, upgradesOf(short).length)

    await page.getByTestId('unpin-run').click()
    await expect(lineOf(page, PINNED_LINE)).toHaveCount(0)
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(0)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)

    await rerun(page, FULL_DURATION)
    await page.getByTestId('pin-run').click()
    await rerun(page, SHORT_DURATION)
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(upgradesOf(full).length)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)
  })

  test('a pinned run keeps its own upgrade dot while a current run that ends before the upgrade draws none', async ({ page }) => {
    const { full } = await loadPinned(page)
    const early = Math.floor(upgradesOf(full).at(0)!.at / 5) * 5 - 5
    const result = await rerun(page, early)
    expect(upgradesOf(result)).toHaveLength(0)

    await expect(dotsOf(page, `${DOT}[data-series="${LINE}"]`)).toHaveCount(0)
    await expect(dotsOf(page, `${PINNED_DOT}[data-series="${PINNED_LINE}"]`)).toHaveCount(upgradesOf(full).length)
  })

  test('hiding Longbowman in the series legend removes both kinds of dot and both lines, and showing it brings them back', async ({ page }) => {
    const { full, short } = await loadPinned(page)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(upgradesOf(full).length)

    await legendItem(page, LINE).click()
    await expect(legendItem(page, LINE)).toHaveAttribute('aria-pressed', 'false')
    await expect(lineOf(page, LINE)).toHaveCount(0)
    await expect(lineOf(page, PINNED_LINE)).toHaveCount(0)
    await expect(dotsOf(page, `${DOT}[data-series="${LINE}"]`)).toHaveCount(0)
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(0)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length - upgradesOf(short).length)

    await legendItem(page, LINE).click()
    await expect(lineOf(page, LINE)).toHaveCount(1)
    await expect(lineOf(page, PINNED_LINE)).toHaveCount(1)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(upgradesOf(full).length)
  })

  test('hiding the unit-tier markers removes their vertical lines and leaves every dot drawn', async ({ page }) => {
    const { full, short } = await loadPinned(page)
    const tierLines = chart(page).locator('[data-testid="chart-marker"][data-kind="unit-tier"]')
    await expect(tierLines).toHaveCount(upgradesOf(short).length)

    await markerItem(page, 'unit-tier').click()
    await expect(tierLines).toHaveCount(0)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)
    await expect(dotsOf(page, PINNED_DOT)).toHaveCount(upgradesOf(full).length)
  })

  test('the Buildings view and the other charts draw no upgrade dots, and Units brings them back', async ({ page }) => {
    const { short } = await loadPinned(page)
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)
    await expectNoDotsElsewhere(page)

    await viewOption(page, 'buildings').click()
    await expect(yLabel(page)).toHaveText('Buildings')
    await expectNoDots(page)
    await expectNoDotsElsewhere(page)

    await viewOption(page, 'units').click()
    await expect(dotsOf(page, DOT)).toHaveCount(dotMarkers(short).length)
  })

  test('a zoom window that excludes the upgrade drops its current and pinned dots, and a window that includes it brings them back', async ({ page }) => {
    const { full } = await loadPinned(page)
    const at = upgradesOf(full).at(0)!.at

    await dragZoom(page, 0.1, 0.4)
    await expect.poll(() => zoomWindow(page)).not.toBeNull()
    const early = (await zoomWindow(page))!
    expect(at, 'the upgrade lies after the early window').toBeGreaterThan(early.to)
    await expectNoDots(page)

    await page.getByTestId('chart-zoom-reset').click()
    await expect.poll(() => zoomWindow(page)).toBeNull()
    await dragZoom(page, 0.6, 0.8)
    await expect.poll(() => zoomWindow(page)).not.toBeNull()
    const around = (await zoomWindow(page))!
    expect(at, 'the upgrade lies inside the later window').toBeGreaterThanOrEqual(around.from)
    expect(at).toBeLessThanOrEqual(around.to)
    await expect(dotsOf(page, `${DOT}[data-series="${LINE}"]`)).toHaveCount(upgradesOf(full).length)
    await expect(dotsOf(page, `${PINNED_DOT}[data-series="${PINNED_LINE}"]`)).toHaveCount(upgradesOf(full).length)
  })

  test('with the same build pinned and shown again, a current and a pinned dot share each point with the pinned ring before it and larger', async ({ page }) => {
    const full = await load(page)
    await page.getByTestId('pin-run').click()
    await rerun(page, NEAR_FULL_DURATION)
    const count = upgradesOf(full).length

    let both: { pinned: DotReading[]; current: DotReading[] } | undefined
    await expect
      .poll(async () => {
        const pinned = await readDots(chart(page), `${PINNED_DOT}[data-series="${PINNED_LINE}"]`, PINNED_LINE)
        const current = await readDots(chart(page), `${DOT}[data-series="${LINE}"]`, LINE)
        both = { pinned, current }
        return pinned.length === count && current.length === count && pinned.every((p, i) => Math.hypot(p.cx - current[i].cx, p.cy - current[i].cy) < 0.5)
      })
      .toBe(true)
    both!.pinned.forEach((pinned, i) => {
      const current = both!.current[i]
      expect(pinned.order, 'the pinned dot precedes the current dot in the document').toBeLessThan(current.order)
      expect(pinned.r).toBeGreaterThan(current.r)
    })
  })
})
