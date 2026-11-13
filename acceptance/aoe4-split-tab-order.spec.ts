import { expect, type Page } from '@playwright/test'
import { CHART_IDS, SPLIT_VIEWPORT, editedCopy, gatedTest, openPage, saveCopy } from './helpers'

const test = gatedTest('aoe4-split-tab-order')

const MAX_PRESSES = 150

interface Stop {
  id: string | null
  column: 'build-column' | 'results-column' | null
  chart: string | null
  position: number
}

const byId = (page: Page, id: string) => page.getByTestId(id)

// One evaluate per step reads the focused element and its document position together.
const readFocus = (page: Page, charts: readonly string[]): Promise<Stop> =>
  page.evaluate((chartIds) => {
    const active = document.activeElement as HTMLElement
    const owner = (ids: readonly string[]) => ids.find((id) => active.closest(`[data-testid="${id}"]`) !== null) ?? null
    const section = active.closest(chartIds.map((id) => `[data-testid="${id}"]`).join(','))
    return {
      id: active.dataset.testid ?? null,
      column: owner(['build-column', 'results-column']) as Stop['column'],
      chart: section?.getAttribute('data-testid') ?? null,
      position: Array.from(document.querySelectorAll('*')).indexOf(active),
    }
  }, charts)

const renderedCharts = (page: Page): Promise<string[]> =>
  page.evaluate((ids) => Array.from(document.querySelectorAll('[data-testid]')).map((el) => el.getAttribute('data-testid') ?? '').filter((id) => (ids as readonly string[]).includes(id)), CHART_IDS)

async function expectChartsRendered(page: Page) {
  expect(await renderedCharts(page), 'every chart section is rendered').toHaveLength(CHART_IDS.length)
}

// Ends on the first of: both of the last chart's stops seen, focus leaving that chart after being inside it, or
// MAX_PRESSES. A missing stop is reported by the assertions on the returned stops, never thrown here.
async function walk(page: Page): Promise<Stop[]> {
  const last = (await renderedCharts(page)).at(-1) ?? null
  await byId(page, 'build-order-select').focus()
  const stops: Stop[] = []
  let handleSeen = false
  let caretSeen = false
  let entered = false
  for (let press = 0; press < MAX_PRESSES; press++) {
    await page.keyboard.press('Tab')
    const stop = await readFocus(page, CHART_IDS)
    stops.push(stop)
    if (stop.chart !== last) {
      if (entered) break
      continue
    }
    entered = true
    handleSeen ||= stop.id === 'chart-drag-handle'
    caretSeen ||= stop.id === 'chart-collapse'
    if (handleSeen && caretSeen) break
  }
  return stops
}

type Step = string | ((stop: Stop) => boolean)

// Each step matches a later stop than the one before it, and document position rises with it.
function expectInOrder(stops: Stop[], steps: Step[]) {
  let from = 0
  let previous = -1
  for (const step of steps) {
    const matches = (stop: Stop) => (typeof step === 'string' ? stop.id === step : step(stop))
    const found = stops.findIndex((stop, i) => i >= from && matches(stop))
    expect(found, `${String(step)} is reached after the previous stop; stops: ${stops.map((s) => s.id).join(', ')}`).toBeGreaterThanOrEqual(0)
    expect(stops[found].position, `${String(step)} comes later in the document`).toBeGreaterThan(previous)
    previous = stops[found].position
    from = found + 1
  }
}

const inBuildColumn = (stop: Stop) => stop.column === 'build-column'
const inResultsColumn = (stop: Stop) => stop.column === 'results-column'

const positionOf = (page: Page, id: string) => page.evaluate((testId) => Array.from(document.querySelectorAll('*')).indexOf(document.querySelector(`[data-testid="${testId}"]`)!), id)

async function expectChartControlsOrder(page: Page, stops: Stop[]) {
  const caret = stops.findIndex((stop) => stop.id === 'compare-collapse')
  expect(caret, 'the key-results caret is a stop').toBeGreaterThanOrEqual(0)
  const handles = stops.map((stop, i) => ({ stop, i })).filter(({ stop }) => stop.id === 'chart-drag-handle')
  for (const { i } of handles) expect(i, 'compare-collapse comes before every handle').toBeGreaterThan(caret)
  const indexOf = (id: string, chart: string) => stops.findIndex((stop) => stop.id === id && stop.chart === chart)
  for (const chart of CHART_IDS) {
    const handle = indexOf('chart-drag-handle', chart)
    const collapse = indexOf('chart-collapse', chart)
    if (handle >= 0 && collapse >= 0) expect(handle, `${chart} handle comes before its caret`).toBeLessThan(collapse)
  }
  await expectChartsRendered(page)
  expect(handles.map(({ stop }) => stop.chart).sort(), 'every chart section has a handle stop').toEqual([...CHART_IDS].sort())
  for (const chart of CHART_IDS) expect(indexOf('chart-collapse', chart), `${chart} has a caret stop`).toBeGreaterThanOrEqual(0)
}

async function expectNoPositiveTabindex(page: Page) {
  const positive = await page.evaluate(() => Array.from(document.querySelectorAll('[tabindex]')).filter((el) => (el as HTMLElement).tabIndex > 0).length)
  expect(positive).toBe(0)
}

test.describe('AoE4 split layout Tab order', () => {
  test.use({ viewport: SPLIT_VIEWPORT })

  test('edited saved build: the save button is a stop between the editor view buttons and Save as copy', async ({ page }) => {
    await editedCopy(page)
    await expect(byId(page, 'saved-build-link')).toHaveCount(0)
    await expect(byId(page, 'save-build')).toBeVisible()
    await expect(byId(page, 'save-build')).toBeEnabled()
    const stops = await walk(page)
    expectInOrder(stops, ['duration-seconds', 'editor-view-text', 'save-build', 'save-build-copy', inBuildColumn, inResultsColumn])
    await expectChartsRendered(page)
    await expectNoPositiveTabindex(page)
  })

  test('saved link shown: the save row, then the Build column, then the Results column', async ({ page }) => {
    await openPage(page)
    await saveCopy(page)
    await expect(byId(page, 'saved-build-link')).toBeVisible()
    await expect(byId(page, 'save-build')).toBeDisabled()
    const stops = await walk(page)
    expectInOrder(stops, ['duration-seconds', 'editor-view-text', 'save-build-copy', 'saved-build-link', 'copy-saved-link', inBuildColumn, inResultsColumn])
    expect(stops.map((stop) => stop.id)).not.toContain('save-build')
    expect(await positionOf(page, 'save-build')).toBeLessThan(await positionOf(page, 'save-build-copy'))
    await expectChartControlsOrder(page, stops)
    await expectNoPositiveTabindex(page)
  })
})
