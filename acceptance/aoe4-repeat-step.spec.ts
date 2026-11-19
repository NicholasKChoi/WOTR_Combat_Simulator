import { test, expect, type Locator, type Page } from '@playwright/test'
import type { SimulationResult, StepTiming } from '../lib/aoe4-build-order/model'
import { CHART_IDS, openPage, showView, waitForRun } from './helpers'

const WIDE = { width: 1280, height: 800 }
const DURATION = 600
const REPEATED_STEP = 0
const REPEATED_LINE = 2

const START = 'start 4 sheep 2 wood -> sheep'
const REPEATED = [START, 'build house from wood x3', 'produce villager from capital-town-center'].join('\n')
const EVERY_ACTION = [
  START,
  'build house from wood x3',
  'build house from wood',
  'move 1 sheep to wood',
  'produce villager from capital-town-center',
  'research bloomery',
  'rally capital-town-center -> wood',
  'pause capital-town-center',
].join('\n')
const REPEATABLE_ROWS = [1, 2]
const OTHER_ROWS = [3, 4, 5, 6]
const COPY_TEST_IDS = ['step-started', 'step-finished', 'step-waited', 'step-blocked-by', 'step-run']

const row = (page: Page, step: number) => page.getByTestId('step-row').nth(step)
const field = (page: Page, step: number) => row(page, step).getByTestId('step-field-repeat')
const copyItems = (page: Page, step = REPEATED_STEP) => row(page, step).getByTestId('step-copy')
const textarea = (page: Page) => page.getByTestId('build-order-text')
const bands = (page: Page) => page.getByTestId('chart-step-band')
const issues = (page: Page) => page.getByTestId('build-order-issue')

async function runPasted(page: Page, text: string) {
  await openPage(page)
  const response = await waitForRun(page, async () => {
    await textarea(page).fill(text)
    await page.getByTestId('duration-seconds').fill(String(DURATION))
  })
  const result = (await response.json()) as SimulationResult
  await showView(page, 'table')
  await expect(row(page, REPEATED_STEP)).toBeVisible()
  return result
}

async function lineOf(page: Page, line: number) {
  await showView(page, 'text')
  const text = await textarea(page).inputValue()
  await showView(page, 'table')
  return text.split('\n')[line - 1]
}

const copiesOf = (result: SimulationResult, source = REPEATED_STEP) => result.steps.filter((timing) => timing.source === source)
const done = (copies: StepTiming[]) => copies.filter((timing) => timing.status === 'completed').length

// The band the page must draw: the first copy's start to the last started copy's end, from the run response.
function expectedSpan(result: SimulationResult) {
  const started = copiesOf(result).filter((timing) => timing.startedAt !== null)
  const last = started[started.length - 1]
  return { from: started[0].startedAt!, to: last.completedAt ?? result.durationSeconds }
}

// One evaluate per read so a redraw cannot land between two reads.
const bandsPerChart = (page: Page) =>
  page.evaluate(
    (charts) =>
      charts.map((chart) =>
        [...document.querySelectorAll(`[data-testid="${chart}"] [data-testid="chart-step-band"]`)].map((el) => [Number(el.getAttribute('data-from')), Number(el.getAttribute('data-to'))])
      ),
    CHART_IDS
  )

async function expectOneSpanEverywhere(page: Page, span: { from: number; to: number }) {
  await expect.poll(() => bandsPerChart(page)).toEqual(CHART_IDS.map(() => [[span.from, span.to]]))
}

async function openMore(target: Locator) {
  const more = target.getByTestId('step-more')
  if ((await more.getAttribute('aria-expanded')) === 'false') await more.click()
  await expect(more).toHaveAttribute('aria-expanded', 'true')
}

test.describe('AoE4 repeated step', () => {
  test.use({ viewport: WIDE })

  test('a typed x3 step runs once: one row per written step, a closed copy list of three items, and distinct test ids', async ({ page }) => {
    const result = await runPasted(page, REPEATED)
    const copies = copiesOf(result)
    expect(copies).toHaveLength(3)
    expect(result.steps).toHaveLength(copies.length + 1)
    await expect(page.getByTestId('step-row')).toHaveCount(REPEATED.split('\n').length - 1)

    const target = row(page, REPEATED_STEP)
    await expect(target.getByTestId('step-copies')).toHaveText(`${done(copies)} of 3 done`)
    await expect(row(page, 1).getByTestId('step-copies')).toHaveCount(0)
    await expect(copyItems(page)).toHaveCount(3)
    expect(await copyItems(page).evaluateAll((items) => items.map((el) => el.getAttribute('data-copy')))).toEqual(['1', '2', '3'])
    for (const item of await copyItems(page).all()) await expect(item).toBeHidden()
    await expect(target.getByText(/Copy 1: started/)).toBeHidden()

    for (const id of COPY_TEST_IDS) await expect(target.getByTestId(id), id).toHaveCount(1)
    await target.locator('summary').click()
    await expect(target.getByText(/Copy 1: started/)).toBeVisible()
    for (const item of await copyItems(page).all()) await expect(item).toBeVisible()
    for (const id of COPY_TEST_IDS) await expect(target.getByTestId(id), id).toHaveCount(1)
  })

  test('the copy list opens and closes from the keyboard and is next to the row controls in the Tab order', async ({ page }) => {
    await runPasted(page, REPEATED)
    const target = row(page, REPEATED_STEP)
    const summary = target.locator('summary')
    const list = target.getByTestId('step-copy-list')
    await expect(summary).toHaveText('Each copy')
    await expect(list).not.toHaveAttribute('open', /.*/)
    await expect(copyItems(page).first()).toBeHidden()

    await target.getByTestId('step-trigger-kind').focus()
    await page.keyboard.press('Shift+Tab')
    await expect(summary).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(target.getByTestId('step-trigger-kind')).toBeFocused()
    await summary.focus()

    for (const key of ['Enter', 'Space']) {
      await page.keyboard.press(key)
      await expect(list).toHaveAttribute('open', '')
      for (const item of await copyItems(page).all()) await expect(item).toBeVisible()
      await page.keyboard.press(key)
      await expect(list).not.toHaveAttribute('open', /.*/)
      for (const item of await copyItems(page).all()) await expect(item).toBeHidden()
    }
  })

  test('the row of a pasted xN line starts open, and a row without one starts closed', async ({ page }) => {
    await runPasted(page, EVERY_ACTION)
    await expect(field(page, 0)).toBeVisible()
    await expect(row(page, 0).getByTestId('step-more')).toHaveAttribute('aria-expanded', 'true')
    await expect(row(page, 1).getByTestId('step-more')).toHaveAttribute('aria-expanded', 'false')
    await expect(field(page, 1)).toHaveCount(0)
  })

  test('only build and move rows offer the Repeat field under More options', async ({ page }) => {
    await runPasted(page, EVERY_ACTION)
    for (const step of REPEATABLE_ROWS) {
      await openMore(row(page, step))
      await expect(field(page, step), `row ${step}`).toBeVisible()
    }
    for (const step of OTHER_ROWS) {
      await openMore(row(page, step))
      await expect(field(page, step), `row ${step}`).toHaveCount(0)
    }
  })

  test('Repeat set in the table reformats the line, reruns, and clearing, letters, 0 and an action change behave', async ({ page }) => {
    await runPasted(page, REPEATED)
    expect(await lineOf(page, REPEATED_LINE)).toBe('build house from wood x3')
    const target = row(page, REPEATED_STEP)
    await expect(field(page, REPEATED_STEP)).toBeVisible()

    const twice = await waitForRun(page, () => field(page, REPEATED_STEP).fill('2'))
    const twiceCopies = copiesOf((await twice.json()) as SimulationResult)
    expect(twiceCopies).toHaveLength(2)
    await expect(target.getByTestId('step-copies')).toHaveText(`${done(twiceCopies)} of 2 done`)
    await expect(copyItems(page)).toHaveCount(2)
    expect(await lineOf(page, REPEATED_LINE)).toBe('build house from wood x2')

    await field(page, REPEATED_STEP).fill('abc')
    expect(await lineOf(page, REPEATED_LINE)).toBe('build house from wood x2')
    await expect(issues(page)).toHaveCount(0)

    await field(page, REPEATED_STEP).fill('0')
    await expect(issues(page)).toHaveCount(1)
    await expect(issues(page).first()).toHaveAttribute('data-code', 'out-of-range')
    await expect(issues(page).first()).toHaveAttribute('data-line', String(REPEATED_LINE))
    expect(await lineOf(page, REPEATED_LINE)).toBe('build house from wood x0')

    const once = await waitForRun(page, () => field(page, REPEATED_STEP).fill(''))
    expect(copiesOf((await once.json()) as SimulationResult)).toHaveLength(1)
    await expect(issues(page)).toHaveCount(0)
    await expect(target.getByTestId('step-copies')).toHaveCount(0)
    expect(await lineOf(page, REPEATED_LINE)).toBe('build house from wood')

    await waitForRun(page, () => field(page, REPEATED_STEP).fill('2'))
    await expect(target.getByTestId('step-copies')).toBeVisible()
    await waitForRun(page, () => target.getByTestId('step-action').selectOption('research'))
    expect(await lineOf(page, REPEATED_LINE)).toMatch(/^research \S+$/)
    await expect(target.getByTestId('step-copies')).toHaveCount(0)
  })

  test('hovering the repeated row, or its text line, shades one span from the first copy to the last started copy on every chart', async ({ page }) => {
    const result = await runPasted(page, REPEATED)
    const span = expectedSpan(result)
    const [first] = copiesOf(result)
    expect(span.to).toBeGreaterThan(first.completedAt!)

    await expect(bands(page)).toHaveCount(0)
    await row(page, REPEATED_STEP).hover()
    await expectOneSpanEverywhere(page, span)

    await page.mouse.move(0, 0)
    await expect(bands(page)).toHaveCount(0)
    await showView(page, 'text')
    await page.locator(`[data-testid="build-order-line-annotation"][data-line="${REPEATED_LINE}"]`).hover()
    await expectOneSpanEverywhere(page, span)
  })
})
