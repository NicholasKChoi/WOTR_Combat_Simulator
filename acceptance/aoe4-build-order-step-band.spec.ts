import { test, expect, type Locator, type Page } from '@playwright/test'
import type { SimulationResult, StepTiming } from '../lib/aoe4-build-order/model'
import { SIMULATE_PATH, openPage, runSimulation, showTab } from './helpers'

const CHARTS = ['chart-units-produced', 'chart-gather-rates', 'chart-gathered-resources', 'chart-floating-resources'] as const
const WIDE = { width: 1280, height: 800 }
const EDGE_TOLERANCE_PX = 1

const INSTANT_STEP_BUILD = ['start 6 sheep -> sheep', 'produce villager from capital-town-center x2', 'pause capital-town-center', 'produce villager from capital-town-center x1'].join('\n')
const NO_START_BUILD = ['start 6 sheep -> sheep', 'produce villager from capital-town-center x1', 'research bloomery', 'research admiralty'].join('\n')

const row = (page: Page, step: number) => page.getByTestId('step-timeline-row').nth(step)
const bands = (page: Page) => page.getByTestId('chart-step-band')

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
  await page.getByTestId('build-order-text').fill(text)
  await page.getByTestId('duration-seconds').fill(String(duration))
  const result = (await (await runSimulation(page)).json()) as SimulationResult
  await showTab(page, 'results')
  await expect(page.getByTestId('step-timeline-scroll')).toBeVisible()
  return result
}

async function runDefault(page: Page) {
  await openPage(page)
  const result = (await (await runSimulation(page)).json()) as SimulationResult
  await showTab(page, 'results')
  await expect(page.getByTestId('step-timeline-scroll')).toBeVisible()
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

  test('keyboard focus shows the band, Tab moves it to the next row, and blur removes it', async ({ page }) => {
    const result = await runDefault(page)
    const [first, second] = result.steps.filter((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)
    expect(second.step).toBe(first.step + 1)
    await row(page, first.step).focus()
    await expectBandEverywhere(page, first.startedAt!, first.completedAt!)
    await page.keyboard.press('Tab')
    await expect(row(page, second.step)).toBeFocused()
    await expectBandEverywhere(page, second.startedAt!, second.completedAt!)
    await row(page, second.step).blur()
    await expect(bands(page)).toHaveCount(0)
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

  test('a new Run clears the band and the active row although the pointer stays over the row', async ({ page }) => {
    const result = await runDefault(page)
    const timing = result.steps.find((s) => s.status === 'completed' && s.startedAt! < s.completedAt!)!
    const target = row(page, timing.step)
    await target.hover()
    await expect(bands(page)).toHaveCount(CHARTS.length)
    await expect(target).toHaveAttribute('data-active', 'true')

    const run = page.getByTestId('run-simulation')
    await run.focus()
    const response = page.waitForResponse((r) => r.url().endsWith(SIMULATE_PATH) && r.request().method() === 'POST')
    await page.keyboard.press('Enter')
    await response

    await expect(bands(page)).toHaveCount(0)
    await expect(page.locator('[data-active="true"]')).toHaveCount(0)
    expect(await target.evaluate((el) => el.matches(':hover'))).toBe(true)
  })
})
