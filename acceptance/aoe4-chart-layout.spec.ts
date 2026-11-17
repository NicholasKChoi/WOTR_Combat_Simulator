import { test, expect, type Page } from '@playwright/test'
import { CHART_LAYOUT_STORAGE_KEY, type ChartId } from '../components/apps/aoe4-build-order/chart-layout'
import { markerLabel } from '../components/apps/aoe4-build-order/chart-markers'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { CHART_IDS, MIN_SUPPORTED_VIEWPORT, SPLIT_VIEWPORT, WIDE_VIEWPORT, openPage, showView, waitForRun } from './helpers'

const [UNITS, RATES, GATHERED, FLOATING] = CHART_IDS
const DEFAULT_ORDER: readonly string[] = CHART_IDS

const chart = (page: Page, id: string) => page.getByTestId(id)
const control = (page: Page, id: string, name: 'chart-collapse' | 'chart-drag-handle') => chart(page, id).getByTestId(name)
const status = (page: Page) => page.getByTestId('chart-order-status')
const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), CHART_LAYOUT_STORAGE_KEY)

// One evaluate so a redraw cannot land between reads.
const readLayout = (page: Page) =>
  page.evaluate(() => {
    const charts = [...document.querySelectorAll('[data-testid="chart-table"] > tbody[data-collapsed]')]
    return {
      order: charts.map((el) => el.getAttribute('data-testid')),
      collapsed: charts.filter((el) => el.getAttribute('data-collapsed') === 'true').map((el) => el.getAttribute('data-testid')),
    }
  })

async function expectLayout(page: Page, order: readonly string[], collapsed: readonly string[] = []) {
  await expect.poll(async () => {
    const layout = await readLayout(page)
    return { order: layout.order, collapsed: [...layout.collapsed].sort() }
  }).toEqual({ order, collapsed: [...collapsed].sort() })
}

const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName)
const activeChart = (page: Page) => page.evaluate(() => document.activeElement?.closest('[data-collapsed]')?.getAttribute('data-testid') ?? null)

async function openResults(page: Page) {
  await openPage(page)
  await expect(chart(page, UNITS)).toBeVisible()
}

async function expectNoAlert(page: Page, errors: string[]) {
  await expect(page.locator('[role="alert"]').filter({ hasText: /\S/ })).toHaveCount(0)
  expect(errors).toEqual([])
}

const collectErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test.describe('AoE4 chart collapse and reorder', () => {
  test('with no stored layout the charts are in default order, expanded, and loading writes nothing', async ({ page }) => {
    await openResults(page)
    await expectLayout(page, DEFAULT_ORDER)
    expect(await stored(page)).toBeNull()
  })

  test('collapse hides the body and keeps the title, handle and header control; expanding restores it with its state', async ({ page }) => {
    await openResults(page)
    const body = chart(page, RATES).getByTestId('chart-body')
    const villagers = chart(page, RATES).locator('[data-testid="chart-view-option"][data-view="villagers"]')
    await villagers.click()
    const legendItem = chart(page, RATES).getByTestId('chart-series-legend-item').first()
    await legendItem.click()
    await expect(legendItem).toHaveAttribute('aria-pressed', 'true')
    const hiddenKey = await legendItem.getAttribute('data-series')

    await control(page, RATES, 'chart-collapse').click()
    await expect(body).toBeHidden()
    await expect(control(page, RATES, 'chart-collapse')).toHaveAttribute('aria-expanded', 'false')
    await expect(chart(page, RATES)).toHaveAttribute('data-collapsed', 'true')
    await expect(chart(page, RATES).getByRole('heading', { name: 'Gather rates' })).toBeVisible()
    for (const name of ['chart-collapse', 'chart-drag-handle'] as const) await expect(control(page, RATES, name)).toBeVisible()
    await expect(villagers).toBeVisible()
    await expectLayout(page, DEFAULT_ORDER, [RATES])
    for (const id of [UNITS, GATHERED, FLOATING]) await expect(chart(page, id).getByTestId('chart-body')).toBeVisible()

    await control(page, RATES, 'chart-collapse').click()
    await expect(body).toBeVisible()
    await expect(control(page, RATES, 'chart-collapse')).toHaveAttribute('aria-expanded', 'true')
    await expect(villagers).toHaveAttribute('aria-pressed', 'true')
    await expect(chart(page, RATES).locator('.recharts-label', { hasText: 'Villagers' })).toBeVisible()
    await expect(chart(page, RATES).locator(`[data-testid="chart-series-legend-item"][data-series="${hiddenKey}"]`)).toHaveAttribute('aria-pressed', 'true')
  })

  test('the view toggle works while Gather rates is collapsed and its choice survives expanding', async ({ page }) => {
    await openResults(page)
    const villagers = chart(page, RATES).locator('[data-testid="chart-view-option"][data-view="villagers"]')
    await control(page, RATES, 'chart-collapse').click()
    await expect(chart(page, RATES)).toHaveAttribute('data-collapsed', 'true')
    await expect(villagers).toHaveAttribute('aria-pressed', 'false')
    await villagers.click()
    await expect(villagers).toHaveAttribute('aria-pressed', 'true')
    await control(page, RATES, 'chart-collapse').click()
    await expect(villagers).toHaveAttribute('aria-pressed', 'true')
    await expect(chart(page, RATES).locator('.recharts-label', { hasText: 'Villagers' })).toBeVisible()
  })

  test('the caret toggles by click, Enter and Space and keeps focus', async ({ page }) => {
    await openResults(page)
    const caret = control(page, UNITS, 'chart-collapse')
    const body = chart(page, UNITS).getByTestId('chart-body')
    const states = [
      { expanded: 'true', label: 'Collapse Units produced chart' },
      { expanded: 'false', label: 'Expand Units produced chart' },
    ]
    const expectState = async (state: (typeof states)[number]) => {
      await expect(caret).toHaveAttribute('aria-expanded', state.expanded)
      await expect(caret).toHaveAttribute('aria-label', state.label)
      await expect(chart(page, UNITS)).toHaveAttribute('data-collapsed', state.expanded === 'true' ? 'false' : 'true')
      await expect(caret).toBeFocused()
    }
    await expect(caret).toHaveAttribute('aria-expanded', 'true')
    await caret.click()
    await expectState(states[1])
    await expect(body).toBeHidden()
    await caret.press('Enter')
    await expectState(states[0])
    await expect(body).toBeVisible()
    await caret.press(' ')
    await expectState(states[1])
    await expect(body).toBeHidden()
  })

  test('there is one help text and one status, and the handle points at the help that mentions drag and arrow keys', async ({ page }) => {
    await openResults(page)
    await expect(page.getByTestId('chart-reorder-help')).toHaveCount(1)
    await expect(status(page)).toHaveCount(1)
    await expect(status(page)).toHaveAttribute('role', 'status')
    const helpId = await page.getByTestId('chart-reorder-help').getAttribute('id')
    for (const id of CHART_IDS) await expect(control(page, id, 'chart-drag-handle')).toHaveAttribute('aria-describedby', helpId!)
    await expect(page.getByTestId('chart-reorder-help')).toHaveText(/drag/i)
    await expect(page.getByTestId('chart-reorder-help')).toHaveText(/arrow keys/i)
  })

  test('ArrowDown on a handle moves the chart one place, announces it and keeps focus; repeats each move one place', async ({ page }) => {
    await openResults(page)
    await expect(status(page)).toHaveText('')
    await control(page, UNITS, 'chart-drag-handle').focus()
    const positions = [
      [[RATES, UNITS, GATHERED, FLOATING], '2'],
      [[RATES, GATHERED, UNITS, FLOATING], '3'],
      [[RATES, GATHERED, FLOATING, UNITS], '4'],
    ] as const
    for (const [order, position] of positions) {
      await page.keyboard.press('ArrowDown')
      await expectLayout(page, order)
      await expect(status(page)).toHaveText(new RegExp(`Units produced.*\\b${position}\\b`))
      await expect.poll(async () => [await activeTestId(page), await activeChart(page)]).toEqual(['chart-drag-handle', UNITS])
    }
  })

  test('ArrowUp moves a chart up and the handle keeps focus', async ({ page }) => {
    await openResults(page)
    await control(page, GATHERED, 'chart-drag-handle').focus()
    await page.keyboard.press('ArrowUp')
    await expectLayout(page, [UNITS, GATHERED, RATES, FLOATING])
    await expect(status(page)).toHaveText(/Gathered resources.*\b2\b/)
    await expect.poll(async () => [await activeTestId(page), await activeChart(page)]).toEqual(['chart-drag-handle', GATHERED])
  })

  for (const [id, key] of [[UNITS, 'ArrowUp'], [FLOATING, 'ArrowDown']] as const) {
    test(`${key} on the ${id === UNITS ? 'first' : 'last'} chart changes nothing, keeps focus and does not scroll the page`, async ({ page }) => {
      await openResults(page)
      const handle = control(page, id, 'chart-drag-handle')
      await handle.evaluate((el) => {
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
        const column = document.querySelector('[data-testid="results-column"]')!
        column.scrollTop = Math.min(column.scrollTop, column.scrollHeight - column.clientHeight - 40)
      })
      await expect(handle).toBeInViewport()
      await handle.focus()
      const readScroll = () => page.getByTestId('results-column').evaluate((el) => ({
        top: el.scrollTop,
        max: el.scrollHeight - el.clientHeight,
        windowY: window.scrollY,
      }))
      const before = await readScroll()
      expect(before.top).toBeGreaterThan(0)
      expect(before.top).toBeLessThan(before.max)
      await page.keyboard.press(key)
      await page.waitForTimeout(500)
      const after = await readScroll()
      expect(after.top).toBe(before.top)
      expect(after.windowY).toBe(before.windowY)
      await expectLayout(page, DEFAULT_ORDER)
      await expect(status(page)).toHaveText('')
      expect([await activeTestId(page), await activeChart(page)]).toEqual(['chart-drag-handle', id])
      expect(await stored(page)).toBeNull()
    })
  }

  test('ArrowUp on the first chart leaves the announcement of the last real move unchanged', async ({ page }) => {
    await openResults(page)
    await control(page, UNITS, 'chart-drag-handle').focus()
    await page.keyboard.press('ArrowDown')
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING])
    await expect(status(page)).toHaveText(/Units produced/)
    const announced = await status(page).textContent()
    await control(page, RATES, 'chart-drag-handle').focus()
    await page.keyboard.press('ArrowUp')
    await expect(status(page)).toHaveText(announced!)
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING])
  })

  for (const key of ['Enter', 'Home', 'End', ' ']) {
    test(`${JSON.stringify(key)} on a handle changes nothing`, async ({ page }) => {
      await openResults(page)
      await control(page, RATES, 'chart-drag-handle').focus()
      await page.keyboard.press(key)
      await expectLayout(page, DEFAULT_ORDER)
      await expect(status(page)).toHaveText('')
      expect(await stored(page)).toBeNull()
    })
  }

  test('the layout survives two reloads without interaction and a reload does not rewrite it', async ({ page }) => {
    await openResults(page)
    await control(page, FLOATING, 'chart-collapse').click()
    await control(page, RATES, 'chart-drag-handle').press('ArrowUp')
    const order = [RATES, UNITS, GATHERED, FLOATING]
    await expectLayout(page, order, [FLOATING])
    const written = await stored(page)
    expect(JSON.parse(written!)).toEqual({ version: 1, order, collapsed: [FLOATING] })

    for (let reload = 0; reload < 2; reload++) {
      await openResults(page)
      await expectLayout(page, order, [FLOATING])
      expect(await stored(page)).toBe(written)
    }
  })

  const setStored = (value: string) => ({ value, key: CHART_LAYOUT_STORAGE_KEY })
  const storedCases: Array<[string, string, readonly string[]]> = [
    ['unknown ids only', JSON.stringify({ version: 1, order: ['a', 'b'], collapsed: ['c'] }), DEFAULT_ORDER],
    ['not JSON', '{nope', DEFAULT_ORDER],
    ['a layout missing one id', JSON.stringify({ version: 1, order: [FLOATING, RATES, UNITS], collapsed: [] }), [FLOATING, RATES, UNITS, GATHERED]],
  ]
  for (const [label, value, order] of storedCases) {
    test(`a stored value of ${label} normalises with no error`, async ({ page }) => {
      const errors = collectErrors(page)
      await page.addInitScript(({ value, key }) => localStorage.setItem(key, value), setStored(value))
      await openResults(page)
      await expectLayout(page, order)
      await expectNoAlert(page, errors)
    })
  }

  test('blocked localStorage still lets the page load, collapse and move for the session', async ({ page }) => {
    const errors = collectErrors(page)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await openResults(page)
    await control(page, RATES, 'chart-collapse').click()
    await control(page, RATES, 'chart-drag-handle').press('ArrowUp')
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING], [RATES])
    await expectNoAlert(page, errors)
  })
})

test.describe('AoE4 chart table alignment', () => {
  for (const [name, viewport] of [
    ['minimum supported', MIN_SUPPORTED_VIEWPORT],
    ['wide', WIDE_VIEWPORT],
  ] as const) {
    test(`at the ${name} viewport every chart header shares four column positions and nothing overflows sideways`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openResults(page)
      await control(page, RATES, 'chart-collapse').click()
      await control(page, FLOATING, 'chart-collapse').click()
      await expectLayout(page, DEFAULT_ORDER, [RATES, FLOATING])

      const read = () =>
        page.evaluate(() => {
          const table = document.querySelector('[data-testid="chart-table"]')!
          const groups = [...table.querySelectorAll(':scope > tbody')]
          const headers = groups.map((group) => {
            const header = group.querySelector('[data-testid="chart-header-row"]')!
            const cells = [...header.children] as HTMLElement[]
            return {
              id: group.getAttribute('data-testid'),
              lefts: cells.map((cell) => cell.getBoundingClientRect().left),
              cells: cells.length,
              overflow: cells.filter((cell) => cell.scrollWidth > cell.clientWidth).length,
              collapsed: group.getAttribute('data-collapsed') === 'true',
              groupHeight: group.getBoundingClientRect().height,
              headerHeight: header.getBoundingClientRect().height,
            }
          })
          const column = document.querySelector('[data-testid="results-column"]')!
          return {
            headers,
            tableScroll: table.scrollWidth - table.clientWidth,
            columnScroll: column.scrollWidth - column.clientWidth,
            pageScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          }
        })

      await expect.poll(async () => {
        const { headers, tableScroll, columnScroll, pageScroll } = await read()
        const [first, ...rest] = headers
        return {
          count: headers.length,
          cells: headers.map((h) => h.cells),
          aligned: rest.every((h) => h.lefts.every((left, i) => Math.abs(left - first.lefts[i]) <= 1)),
          overflowing: headers.map((h) => h.overflow),
          collapsedHeightsMatch: headers.filter((h) => h.collapsed).every((h) => Math.abs(h.groupHeight - h.headerHeight) <= 1),
          scrolls: [tableScroll, columnScroll, pageScroll].map((extra) => extra <= 0),
        }
      }).toEqual({ count: 4, cells: [4, 4, 4, 4], aligned: true, overflowing: [0, 0, 0, 0], collapsedHeightsMatch: true, scrolls: [true, true, true] })
    })
  }
})

test.describe('AoE4 chart drag reorder', () => {
  test.use({ viewport: { width: 1280, height: 2800 } })

  // The point just under a chart's bottom edge lies between that chart's vertical midpoint and the next one's.
  const sectionBoxes = (page: Page) =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('[data-testid="chart-table"] > tbody[data-collapsed]')].map((el) => {
          const rect = el.getBoundingClientRect()
          return [el.getAttribute('data-testid'), { top: rect.top, bottom: rect.bottom }]
        }),
      ) as Record<string, { top: number; bottom: number }>,
    )

  async function startDrag(page: Page, id: string, below: string, steps = 10) {
    const boxes = await sectionBoxes(page)
    const handle = await control(page, id, 'chart-drag-handle').boundingBox()
    expect(handle).not.toBeNull()
    const x = handle!.x + handle!.width / 2
    await page.mouse.move(x, handle!.y + handle!.height / 2)
    await page.mouse.down()
    await page.mouse.move(x, boxes[below].bottom + 2, { steps })
    return x
  }

  test('dragging the first chart below the third gives second, third, first, fourth, with the order unchanged until the drop', async ({ page }) => {
    await openResults(page)
    await startDrag(page, UNITS, GATHERED)
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    await expectLayout(page, DEFAULT_ORDER)
    await page.mouse.up()
    await expectLayout(page, [RATES, GATHERED, UNITS, FLOATING])
    await expect(chart(page, UNITS)).not.toHaveAttribute('data-dragging', 'true')
    await expect(status(page)).toHaveText(/Units produced.*\b3\b/)
    await expect(control(page, UNITS, 'chart-drag-handle')).toBeFocused()
    expect(JSON.parse((await stored(page))!).order).toEqual([RATES, GATHERED, UNITS, FLOATING])
  })

  test('arrow keys pressed while the pointer is held, before and after the 4px threshold, change nothing and the drop lands by pointer height', async ({ page }) => {
    await openResults(page)
    const boxes = await sectionBoxes(page)
    const handle = await control(page, UNITS, 'chart-drag-handle').boundingBox()
    const x = handle!.x + handle!.width / 2
    const y = handle!.y + handle!.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.keyboard.press('ArrowDown')
    await expectLayout(page, DEFAULT_ORDER)
    await expect(status(page)).toHaveText('')
    await page.mouse.move(x, y + 10, { steps: 3 })
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    await page.keyboard.press('ArrowDown')
    await expectLayout(page, DEFAULT_ORDER)
    await expect(status(page)).toHaveText('')
    await page.mouse.move(x, boxes[GATHERED].bottom + 2, { steps: 10 })
    await page.mouse.up()
    await expectLayout(page, [RATES, GATHERED, UNITS, FLOATING])
    await expect(status(page)).toHaveText(/Units produced.*\b3\b/)
    await page.keyboard.press('ArrowUp')
    await expectLayout(page, [RATES, UNITS, GATHERED, FLOATING])
  })

  test('a press and release with under 4px of movement changes nothing', async ({ page }) => {
    await openResults(page)
    const handle = await control(page, UNITS, 'chart-drag-handle').boundingBox()
    const x = handle!.x + handle!.width / 2
    const y = handle!.y + handle!.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 1, y + 2)
    await expect(chart(page, UNITS)).not.toHaveAttribute('data-dragging', 'true')
    await page.mouse.up()
    await expectLayout(page, DEFAULT_ORDER)
    await expect(status(page)).toHaveText('')
    expect(await stored(page)).toBeNull()
  })

  test('Escape during a drag cancels it and the release afterwards changes nothing', async ({ page }) => {
    await openResults(page)
    await startDrag(page, UNITS, GATHERED)
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    await page.keyboard.press('Escape')
    await expect(chart(page, UNITS)).not.toHaveAttribute('data-dragging', 'true')
    await page.mouse.up()
    await expectLayout(page, DEFAULT_ORDER)
    await expect(status(page)).toHaveText('')
    expect(await stored(page)).toBeNull()
  })

  test('dropping back at the start position changes nothing', async ({ page }) => {
    await openResults(page)
    const boxes = await sectionBoxes(page)
    const handle = await control(page, RATES, 'chart-drag-handle').boundingBox()
    const x = handle!.x + handle!.width / 2
    await page.mouse.move(x, handle!.y + handle!.height / 2)
    await page.mouse.down()
    await page.mouse.move(x, boxes[GATHERED].top + 4, { steps: 6 })
    await expect(chart(page, RATES)).toHaveAttribute('data-dragging', 'true')
    await page.mouse.up()
    await expectLayout(page, DEFAULT_ORDER)
    await expect(status(page)).toHaveText('')
    expect(await stored(page)).toBeNull()
  })

  test('while dragging, the moved group is at 60% opacity once: the tbody carries it and its rows read 1', async ({ page }) => {
    await openResults(page)
    const opacities = () =>
      page.evaluate((id) => {
        const group = document.querySelector(`[data-testid="${id}"]`)!
        const opacity = (el: Element) => Number(getComputedStyle(el).opacity)
        return { group: opacity(group), rows: [...group.querySelectorAll(':scope > tr')].map(opacity) }
      }, UNITS)
    await expect.poll(opacities).toEqual({ group: 1, rows: [1, 1] })
    await startDrag(page, UNITS, GATHERED)
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    await expect.poll(opacities).toEqual({ group: 0.6, rows: [1, 1] })
    await page.mouse.up()
    await expect.poll(opacities).toEqual({ group: 1, rows: [1, 1] })
  })

  test('the drop position follows the whole row group midpoint, not the header row midpoint', async ({ page }) => {
    await openResults(page)
    const boxes = await page.evaluate(() => {
      const rect = (id: string) => {
        const group = document.querySelector(`[data-testid="${id}"]`)!
        const header = group.querySelector('[data-testid="chart-header-row"]')!.getBoundingClientRect()
        const whole = group.getBoundingClientRect()
        return { headerMid: header.top + header.height / 2, groupMid: whole.top + whole.height / 2 }
      }
      return rect('chart-gather-rates')
    })
    expect(boxes.groupMid - boxes.headerMid).toBeGreaterThan(100)
    const handle = await control(page, UNITS, 'chart-drag-handle').boundingBox()
    const x = handle!.x + handle!.width / 2
    await page.mouse.move(x, handle!.y + handle!.height / 2)
    await page.mouse.down()
    await page.mouse.move(x, (boxes.headerMid + boxes.groupMid) / 2, { steps: 10 })
    await page.mouse.up()
    await expectLayout(page, DEFAULT_ORDER)
  })

  test('a collapsed chart drags like an expanded one', async ({ page }) => {
    await openResults(page)
    await control(page, UNITS, 'chart-collapse').click()
    await expectLayout(page, DEFAULT_ORDER, [UNITS])
    await startDrag(page, UNITS, GATHERED)
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    await page.mouse.up()
    await expectLayout(page, [RATES, GATHERED, UNITS, FLOATING], [UNITS])
  })
})

test.describe('AoE4 chart marker labels after collapse', () => {
  test.use({ viewport: { width: 1280, height: 2800 } })

  const ABBEY_LINE = 'at 9 vils build abbey-of-kings with 3 from sheep then sheep'

  const labelPlacements = (page: Page, text: string) =>
    page.evaluate(
      ({ ids, text }) =>
        Object.fromEntries(
          ids.map((id) => {
            const chartEl = document.querySelector(`[data-testid="${id}"]`)!
            const label = [...chartEl.querySelectorAll('text.recharts-label')].find((el) => el.textContent === text)
            const plotRight = chartEl.querySelector('.recharts-cartesian-grid')?.getBoundingClientRect().right
            if (!label || plotRight === undefined) return [id, null]
            return [id, { anchor: label.getAttribute('text-anchor'), fits: label.getBoundingClientRect().right <= plotRight + 0.5 }]
          }),
        ),
      { ids: [GATHERED, FLOATING], text },
    )

  test('a chart whose markers change while collapsed places its labels like an always-expanded chart once expanded', async ({ page }) => {
    await openResults(page)
    await control(page, GATHERED, 'chart-collapse').click()
    await expectLayout(page, DEFAULT_ORDER, [GATHERED])

    const text = await page.getByTestId('build-order-text').inputValue()
    expect(text).toContain(ABBEY_LINE)
    const response = await waitForRun(page, () =>
      page.getByTestId('build-order-text').fill(text.replace(ABBEY_LINE, '@6:00 build abbey-of-kings with 3 from sheep then sheep')),
    )
    const result = (await response.json()) as SimulationResult
    const feudal = result.markers.find((m) => m.kind === 'age-up' && m.label.startsWith('Feudal'))
    expect(feudal, 'the run reaches Feudal').toBeDefined()
    await waitForRun(page, () => page.getByTestId('duration-seconds').fill(String(Math.ceil(feudal!.at) + 12)))

    const feudalLabel = markerLabel(feudal!)
    await expect.poll(async () => (await labelPlacements(page, feudalLabel))[FLOATING]).toEqual({ anchor: 'end', fits: true })

    await control(page, GATHERED, 'chart-collapse').click()
    await expect(chart(page, GATHERED).getByTestId('chart-body')).toBeVisible()
    await expect
      .poll(() => labelPlacements(page, feudalLabel))
      .toEqual({ [GATHERED]: { anchor: 'end', fits: true }, [FLOATING]: { anchor: 'end', fits: true } })
  })
})

test.describe('AoE4 chart layout with the build view', () => {
  test.use({ viewport: SPLIT_VIEWPORT })

  test('after a reorder the step band and pinned lines show on expanded charts and not on a collapsed one', async ({ page }) => {
    await openPage(page)
    await showView(page, 'table')
    await page.getByTestId('pin-run').click()
    const expanded: ChartId[] = [UNITS, RATES, FLOATING]
    for (const id of expanded) await expect(chart(page, id).locator('path[data-series^="pinned:"]').first()).toBeAttached()

    await control(page, GATHERED, 'chart-collapse').click()
    await control(page, UNITS, 'chart-drag-handle').press('ArrowDown')
    await control(page, FLOATING, 'chart-drag-handle').press('ArrowUp')
    await expectLayout(page, [RATES, UNITS, FLOATING, GATHERED], [GATHERED])
    await expect(chart(page, GATHERED).getByTestId('chart-body')).toBeHidden()
    await expect(page.getByTestId('step-row').first()).toBeVisible()

    await page.getByTestId('step-row').nth(1).hover()
    for (const id of expanded) {
      await expect(chart(page, id).getByTestId('chart-step-band').first()).toBeVisible()
      await expect(chart(page, id).locator('path[data-series^="pinned:"]').first()).toBeAttached()
    }
    await expect(chart(page, GATHERED).getByTestId('chart-step-band')).toHaveCount(0)
  })
})
