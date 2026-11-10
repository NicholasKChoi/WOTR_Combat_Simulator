import { test, expect, type Locator, type Page } from '@playwright/test'
import type { SimulationResult, StepTiming } from '../lib/aoe4-build-order/model'
import { AOE4_PAGE, SIMULATE_PATH, openPage, showTab, showView, waitForRun } from './helpers'

const CHARTS = ['chart-units-produced', 'chart-gather-rates', 'chart-gathered-resources', 'chart-floating-resources'] as const
const WIDE = { width: 1280, height: 800 }
const EDGE_TOLERANCE_PX = 1

const INSTANT_STEP_BUILD = ['start 6 sheep -> sheep', 'produce villager from capital-town-center x2', 'pause capital-town-center', 'produce villager from capital-town-center x1'].join('\n')
const NO_START_BUILD = ['start 6 sheep -> sheep', 'produce villager from capital-town-center x1', 'research bloomery', 'research admiralty'].join('\n')

const row = (page: Page, step: number) => page.getByTestId('step-row').nth(step)
const bands = (page: Page) => page.getByTestId('chart-step-band')
const activeRows = (page: Page) => page.locator('[data-active="true"]')
const STALE_BUILD = ['start 6 sheep -> sheep', 'build house with 1 from sheep', 'build house with 1 from sheep', 'build house with 1 from sheep'].join('\n')

interface Band {
  from: number
  to: number
  height: number
  stroke: string
  fill: string
  visibility: string
}

// One evaluate per read so a redraw cannot land between two reads.
const bandsPerChart = (page: Page) =>
  page.evaluate((charts) => {
    return charts.map((chart) => {
      const found = [...document.querySelectorAll(`[data-testid="${chart}"] [data-testid="chart-step-band"]`)]
      return found.map((el) => {
        const style = getComputedStyle(el)
        return {
          from: Number(el.getAttribute('data-from')),
          to: Number(el.getAttribute('data-to')),
          height: el.getBoundingClientRect().height,
          stroke: style.stroke,
          fill: style.fill,
          visibility: style.visibility,
        }
      })
    })
  }, CHARTS) as Promise<Band[][]>

async function expectBandEverywhere(page: Page, from: number, to: number) {
  await expect.poll(async () => (await bandsPerChart(page)).map((found) => found.map((b) => [b.from, b.to]))).toEqual(CHARTS.map(() => [[from, to]]))
}

async function runPasted(page: Page, text: string, duration: number) {
  await openPage(page)
  await showTab(page, 'build')
  const response = await waitForRun(page, async () => {
    await page.getByTestId('build-order-text').fill(text)
    await page.getByTestId('duration-seconds').fill(String(duration))
  })
  const result = (await response.json()) as SimulationResult
  await showView(page, 'table')
  await showTab(page, 'results')
  await expect(page.getByTestId('chart-units-produced')).toBeVisible()
  return result
}

async function runDefault(page: Page) {
  const result = (await (await waitForRun(page, () => page.goto(AOE4_PAGE))).json()) as SimulationResult
  await showView(page, 'table')
  await showTab(page, 'results')
  await expect(page.getByTestId('chart-units-produced')).toBeVisible()
  return result
}

const spanEnd = (timing: StepTiming, result: SimulationResult) => timing.completedAt ?? result.durationSeconds

test.describe('AoE4 step span band on the charts', () => {
  test.use({ viewport: WIDE })

  test('no band is drawn before a row is hovered', async ({ page }) => {
    await runDefault(page)
    await expect(bands(page)).toHaveCount(0)
  })

  test('hovering a step shades exactly its span on each of the four charts, to the run end when in progress', async ({ page }) => {
    const result = await runDefault(page)
    const completed = result.steps.find((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)!
    const inProgress = result.steps.find((s) => s.status === 'in-progress' && s.startedAt! > 0)!
    expect(completed).toBeDefined()
    expect(inProgress).toBeDefined()
    for (const timing of [completed, inProgress]) {
      await row(page, timing.step).hover()
      await expectBandEverywhere(page, timing.startedAt!, spanEnd(timing, result))
      for (const [found] of await bandsPerChart(page)) {
        expect(found.height).toBeGreaterThan(0)
        expect(found.fill).not.toBe('none')
      }
    }
  })

  test('moving the pointer off the row removes the band from every chart', async ({ page }) => {
    const result = await runDefault(page)
    const timing = result.steps.find((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)!
    await row(page, timing.step).hover()
    await expect(bands(page)).toHaveCount(CHARTS.length)
    await page.mouse.move(0, 0)
    await expect(bands(page)).toHaveCount(0)
  })

  test('keyboard focus in a row shows the band, Tab moves it to the next row, and blur removes it', async ({ page }) => {
    const result = await runDefault(page)
    const [first, second] = result.steps.filter((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)
    expect(second.step).toBe(first.step + 1)
    await row(page, first.step).getByTestId('step-delete').focus()
    await expectBandEverywhere(page, first.startedAt!, first.completedAt!)
    await expect(row(page, first.step)).toHaveAttribute('data-active', 'true')
    await page.keyboard.press('Tab')
    await expect(row(page, second.step).getByTestId('step-trigger-kind')).toBeFocused()
    await expectBandEverywhere(page, second.startedAt!, second.completedAt!)
    await row(page, second.step).getByTestId('step-trigger-kind').blur()
    await expect(bands(page)).toHaveCount(0)
  })

  test('moving focus between controls of one row never removes the band, and leaving the row does', async ({ page }) => {
    const result = await runDefault(page)
    const timing = result.steps.find((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)!
    await page.evaluate((id) => {
      const w = window as unknown as { bandRemovals: number }
      w.bandRemovals = 0
      const isBand = (n: Node) => n instanceof Element && (n.matches(`[data-testid="${id}"]`) || n.querySelector(`[data-testid="${id}"]`) !== null)
      new MutationObserver((records) => {
        for (const r of records) for (const n of r.removedNodes) if (isBand(n)) w.bandRemovals++
      }).observe(document.body, { childList: true, subtree: true })
    }, 'chart-step-band')
    const target = row(page, timing.step)
    await target.getByTestId('step-trigger-kind').focus()
    await expectBandEverywhere(page, timing.startedAt!, timing.completedAt!)
    await page.keyboard.press('Tab')
    await expect(target.locator(':focus')).toHaveCount(1)
    await expect(target.getByTestId('step-trigger-kind')).not.toBeFocused()
    await expectBandEverywhere(page, timing.startedAt!, timing.completedAt!)
    expect(await page.evaluate(() => (window as unknown as { bandRemovals: number }).bandRemovals)).toBe(0)
    await page.getByTestId('duration-seconds').focus()
    await expect(bands(page)).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { bandRemovals: number }).bandRemovals)).toBeGreaterThan(0)
  })

  test('the start row clears the band, for hover and for focus', async ({ page }) => {
    const result = await runDefault(page)
    const timing = result.steps.find((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)!
    const start = page.getByTestId('step-start-row')
    await row(page, timing.step).hover()
    await expect(bands(page)).toHaveCount(CHARTS.length)
    await start.hover()
    await expect(bands(page)).toHaveCount(0)
    await expect(activeRows(page)).toHaveCount(0)
    await page.mouse.move(0, 0)
    await row(page, timing.step).getByTestId('step-delete').focus()
    await expect(bands(page)).toHaveCount(CHARTS.length)
    await start.locator('button, select, input').first().focus()
    await expect(bands(page)).toHaveCount(0)
    await expect(activeRows(page)).toHaveCount(0)
  })

  test('a zero-length step draws one visible vertical line per chart at its second', async ({ page }) => {
    const result = await runPasted(page, INSTANT_STEP_BUILD, 300)
    const instant = result.steps.find((s) => s.status === 'completed' && s.completedAt === s.startedAt)!
    expect(instant).toBeDefined()
    await row(page, instant.step).hover()
    await expectBandEverywhere(page, instant.startedAt!, instant.startedAt!)
    for (const [found] of await bandsPerChart(page)) {
      expect(found.height).toBeGreaterThan(0)
      expect(found.visibility).toBe('visible')
      expect(found.stroke).not.toBe('none')
    }
  })

  test('an age-up step band ends at its chart marker, inside the plot area, on every chart', async ({ page }) => {
    const result = await runDefault(page)
    const ageUp = result.markers.find((m) => m.kind === 'age-up')!
    const timing = result.steps.find((s) => s.completedAt === ageUp.at && s.startedAt! < s.completedAt!)!
    expect(timing).toBeDefined()
    await row(page, timing.step).hover()
    await expectBandEverywhere(page, timing.startedAt!, timing.completedAt!)
    const geometry = await page.evaluate(
      ({ charts, at }) =>
        charts.map((chart) => {
          const root = document.querySelector(`[data-testid="${chart}"]`)!
          const band = root.querySelector('[data-testid="chart-step-band"]')!.getBoundingClientRect()
          const marker = root.querySelector(`[data-testid="chart-marker"][data-kind="age-up"][data-at="${at}"]`)!.getBoundingClientRect()
          const grid = root.querySelector('.recharts-cartesian-grid')!.getBoundingClientRect()
          return { bandLeft: band.left, bandRight: band.right, markerX: marker.left, gridLeft: grid.left, gridRight: grid.right }
        }),
      { charts: [...CHARTS], at: ageUp.at }
    )
    for (const g of geometry) {
      expect(Math.abs(g.bandRight - g.markerX)).toBeLessThanOrEqual(EDGE_TOLERANCE_PX)
      expect(g.bandLeft).toBeGreaterThanOrEqual(g.gridLeft - EDGE_TOLERANCE_PX)
      expect(g.bandRight).toBeLessThanOrEqual(g.gridRight + EDGE_TOLERANCE_PX)
      expect(g.bandRight).toBeGreaterThan(g.bandLeft)
    }
  })

  test('rows with no start show no band, for waiting and for not-reached steps', async ({ page }) => {
    const result = await runPasted(page, NO_START_BUILD, 600)
    for (const status of ['waiting', 'not-reached'] as const) {
      const timing = result.steps.find((s) => s.status === status)!
      expect(timing, status).toBeDefined()
      expect(timing.startedAt).toBeNull()
      await row(page, timing.step).hover()
      await expect(row(page, timing.step)).toHaveAttribute('data-active', 'true')
      await expect(bands(page)).toHaveCount(0)
    }
  })

  test('the hovered row looks active, on an unflagged row and on a flagged row that table-warning tints', async ({ page }) => {
    const result = await runPasted(page, NO_START_BUILD, 600)
    const plain = result.steps.find((s) => s.status === 'completed')!
    const flagged = result.steps.find((s) => s.status === 'waiting')!
    const shadow = (target: Locator) => target.locator('td').first().evaluate((td) => getComputedStyle(td).boxShadow)
    for (const timing of [plain, flagged]) {
      const target = row(page, timing.step)
      await page.mouse.move(0, 0)
      await expect(target).not.toHaveAttribute('data-active', /.*/)
      const before = await shadow(target)
      await target.hover()
      await expect(target).toHaveAttribute('data-active', 'true')
      await expect.poll(() => shadow(target)).not.toBe(before)
    }
    await expect(row(page, flagged.step)).toHaveAttribute('data-flagged', 'true')
    await expect(page.locator('[data-active="true"]')).toHaveCount(1)
  })

  test('a new run clears the band and the active row although the pointer stays over the row', async ({ page }) => {
    const result = await runDefault(page)
    const timing = result.steps.find((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)!
    const target = row(page, timing.step)
    await target.hover()
    await expect(bands(page)).toHaveCount(CHARTS.length)
    await expect(target).toHaveAttribute('data-active', 'true')

    await waitForRun(page, () => page.getByTestId('duration-seconds').fill('900'))

    await expect(bands(page)).toHaveCount(0)
    await expect(page.locator('[data-active="true"]')).toHaveCount(0)
    expect(await target.evaluate((el) => el.matches(':hover'))).toBe(true)
  })

  test.describe('while a new result is pending', () => {
    async function holdSimulate(page: Page) {
      let release!: () => void
      const gate = new Promise<void>((resolve) => (release = resolve))
      let hit!: () => void
      const hitOnce = new Promise<void>((resolve) => (hit = resolve))
      await page.route(
        (url) => url.pathname === SIMULATE_PATH,
        async (route) => {
          hit()
          await gate
          await route.continue()
        }
      )
      return { release, hitOnce }
    }

    async function runStale(page: Page) {
      const result = await runPasted(page, STALE_BUILD, 300)
      expect(result.steps).toHaveLength(3)
      for (const timing of result.steps) expect(timing.startedAt!).toBeLessThan(timing.completedAt!)
      return result
    }

    test('hovering a row with no run while stale draws no band, and an unchanged earlier row still does', async ({ page }) => {
      const result = await runStale(page)
      const { release, hitOnce } = await holdSimulate(page)
      await row(page, 2).getByTestId('step-field-builders').fill('3')
      await hitOnce
      await expect(row(page, 2).getByTestId('step-run')).toHaveAttribute('data-stale', 'true')
      await expect(row(page, 2)).not.toHaveAttribute('data-run-step', /.*/)
      await row(page, 2).hover()
      await expect(bands(page)).toHaveCount(0)
      await expect(activeRows(page)).toHaveCount(0)
      await row(page, 0).hover()
      await expectBandEverywhere(page, result.steps[0].startedAt!, result.steps[0].completedAt!)
      await expect.poll(() => page.getByTestId('results-last-good').evaluate((el) => getComputedStyle(el).opacity)).toBe('0.5')
      release()
      await page.unroute((url) => url.pathname === SIMULATE_PATH)
    })

    test('an edit that unaligns the active row removes the band at once', async ({ page }) => {
      const result = await runStale(page)
      const { release, hitOnce } = await holdSimulate(page)
      const builders = row(page, 1).getByTestId('step-field-builders')
      await builders.focus()
      await expectBandEverywhere(page, result.steps[1].startedAt!, result.steps[1].completedAt!)
      await page.keyboard.type('3')
      await hitOnce
      await expect.poll(() => bands(page).count()).toBe(0)
      await expect(activeRows(page)).toHaveCount(0)
      await expect(builders).toBeFocused()
      release()
      await page.unroute((url) => url.pathname === SIMULATE_PATH)
    })
  })
})
