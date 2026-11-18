import { test, expect, type Locator, type Page } from '@playwright/test'
import { CHART_LAYOUT_STORAGE_KEY } from '../components/apps/aoe4-build-order/chart-layout'
import { CHART_IDS, openPage } from './helpers'

const [UNITS, RATES, GATHERED, FLOATING] = CHART_IDS
const TITLES: Record<string, string> = {
  [UNITS]: 'Units produced',
  [RATES]: 'Gather rates',
  [GATHERED]: 'Gathered resources',
  [FLOATING]: 'Floating resources',
}

const TINT_FLOOR = 1.1
const TEXT_FLOOR = 4.5
const OFF_TABLE = { x: 5, y: 5 }

const chart = (page: Page, id: string) => page.getByTestId(id)
const handle = (page: Page, id: string) => chart(page, id).getByTestId('chart-drag-handle')
const caret = (page: Page, id: string) => chart(page, id).getByTestId('chart-collapse')
const toggleOption = (page: Page, id: string, view: string) => chart(page, id).locator(`[data-testid="chart-view-option"][data-view="${view}"]`)
const headerTitle = (page: Page, id: string) => chart(page, id).getByTestId('chart-header-row').getByRole('heading')
const indicator = (page: Page) => page.getByTestId('chart-drop-indicator')
const status = (page: Page) => page.getByTestId('chart-order-status')

type Rgb = [number, number, number]
interface Paint {
  row: Rgb
  body: Rgb
  texts: { name: string; color: Rgb; backdrop: Rgb }[]
}

// Composites each element's own and its ancestors' computed backgrounds over the white page canvas, in one evaluate.
const readPaint = (page: Page, id: string): Promise<Paint> =>
  page.evaluate((chartId) => {
    const parse = (css: string) => {
      const numbers = css.match(/[\d.]+/g)
      if (!css.startsWith('rgb') || !numbers) throw new Error(`unexpected colour ${css}`)
      const [r, g, b, a] = numbers.map(Number)
      return { r, g, b, a: a ?? 1 }
    }
    const mix = (over: { r: number; g: number; b: number; a: number }, under: Rgb): Rgb => [
      over.r * over.a + under[0] * (1 - over.a),
      over.g * over.a + under[1] * (1 - over.a),
      over.b * over.a + under[2] * (1 - over.a),
    ]
    const backdrop = (el: Element): Rgb => {
      const chain: Element[] = []
      for (let node: Element | null = el; node; node = node.parentElement) chain.push(node)
      return chain.reverse().reduce<Rgb>((under, node) => mix(parse(getComputedStyle(node).backgroundColor), under), [255, 255, 255])
    }
    const root = document.querySelector(`[data-testid="${chartId}"]`)!
    const header = root.querySelector('[data-testid="chart-header-row"]')!
    const text = (name: string, el: Element) => {
      const behind = backdrop(el)
      return { name, color: mix(parse(getComputedStyle(el).color), behind), backdrop: behind }
    }
    const texts = [
      text('title', header.querySelector('h3')!),
      text('grip', header.querySelector('[data-testid="chart-drag-handle"] span')!),
      text('caret', header.querySelector('[data-testid="chart-collapse"]')!),
      ...[...header.querySelectorAll('[data-testid="chart-view-option"]')].map((el, i) => text(`toggle ${i}`, el)),
    ]
    return { row: backdrop(header), body: backdrop(root.querySelector('[data-testid="chart-body-row"]')!), texts }
  }, id)

const channel = (v: number) => {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const same = (a: Rgb, b: Rgb) => a.every((v, i) => Math.abs(v - b[i]) < 0.5)

const rowPaint = async (page: Page, id: string) => (await readPaint(page, id)).row
const restingRows = async (page: Page) => Object.fromEntries(await Promise.all(CHART_IDS.map(async (id) => [id, await rowPaint(page, id)]))) as Record<string, Rgb>

const expectTinted = async (page: Page, id: string, resting: Record<string, Rgb>) => {
  await expect.poll(async () => contrast(await rowPaint(page, id), resting[id])).toBeGreaterThanOrEqual(TINT_FLOOR)
  const ratio = contrast(await rowPaint(page, id), resting[id])
  test.info().annotations.push({ type: 'tint ratio', description: `${id}: ${ratio.toFixed(3)}` })
}
// Button colours transition over 150 ms, so the ratio is polled until it settles.
async function expectTextContrast(page: Page, id: string, label: string, only = '') {
  const lowest = async () => {
    const texts = (await readPaint(page, id)).texts.filter((text) => text.name.startsWith(only))
    expect(texts.length).toBeGreaterThan(0)
    return texts.map((text) => ({ name: text.name, ratio: contrast(text.color, text.backdrop) })).reduce((a, b) => (b.ratio < a.ratio ? b : a))
  }
  await expect.poll(async () => (await lowest()).ratio, { message: `lowest text contrast, ${label}` }).toBeGreaterThanOrEqual(TEXT_FLOOR)
  const { name, ratio } = await lowest()
  test.info().annotations.push({ type: 'lowest text ratio', description: `${label}: ${name} ${ratio.toFixed(3)}` })
}
const tintedRows = async (page: Page, resting: Record<string, Rgb>) => {
  const rows = await restingRows(page)
  return CHART_IDS.filter((id) => !same(rows[id], resting[id]))
}

// Focus by script, then Shift+Tab and Tab, so the focus comes from a key press and shows its focus ring.
async function keyboardFocus(page: Page, target: Locator) {
  await target.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(target).toBeFocused()
  expect(await target.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
}

async function openResults(page: Page) {
  await openPage(page)
  await expect(chart(page, UNITS)).toBeVisible()
  await page.mouse.move(OFF_TABLE.x, OFF_TABLE.y)
}

interface Boxes {
  table: { left: number; right: number; top: number; bottom: number }
  groups: Record<string, { top: number; bottom: number }>
  indicator: { left: number; right: number; top: number; bottom: number } | null
}

// One evaluate so a redraw cannot land between reads.
const readBoxes = (page: Page): Promise<Boxes> =>
  page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    }
    const marker = document.querySelector('[data-testid="chart-drop-indicator"]')
    return {
      table: box(document.querySelector('[data-testid="chart-table"]')!),
      groups: Object.fromEntries([...document.querySelectorAll('[data-testid="chart-table"] > tbody[data-collapsed]')].map((el) => [el.getAttribute('data-testid')!, box(el)])),
      indicator: marker ? box(marker) : null,
    }
  })

const readOrder = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('[data-testid="chart-table"] > tbody[data-collapsed]')].map((el) => el.getAttribute('data-testid')))

const readDragState = (page: Page, id: string) =>
  page.evaluate((chartId) => {
    const group = document.querySelector(`[data-testid="${chartId}"]`)!
    return {
      indicators: document.querySelectorAll('[data-testid="chart-drop-indicator"]').length,
      transform: getComputedStyle(group).transform,
      dragging: group.getAttribute('data-dragging'),
      rowDragging: group.querySelector('[data-testid="chart-header-row"]')!.getAttribute('data-dragging'),
    }
  }, id)

// The slot spans between the other charts, in display order: slot k runs from the bottom of the other above it
// to the top of the other below it; the first and last slots are the first top and the last bottom.
function slotSpans(boxes: Boxes, dragged: string) {
  const others = Object.entries(boxes.groups).filter(([id]) => id !== dragged).map(([, rect]) => rect)
  return Array.from({ length: others.length + 1 }, (_, k) => ({
    top: k === 0 ? others[0].top : others[k - 1].bottom,
    bottom: k === others.length ? others[k - 1].bottom : others[k].top,
  }))
}

const SLOT_EPSILON = 0.75

function slotsMet(boxes: Boxes, dragged: string): number[] {
  const marker = boxes.indicator
  if (!marker) return []
  return slotSpans(boxes, dragged).flatMap((span, k) => (marker.top <= span.bottom + SLOT_EPSILON && marker.bottom >= span.top - SLOT_EPSILON ? [k] : []))
}

async function pressHandle(page: Page, id: string) {
  const box = await handle(page, id).boundingBox()
  expect(box).not.toBeNull()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  return { x, y }
}

test.describe('AoE4 chart header row highlight', () => {
  test.use({ viewport: { width: 1280, height: 3400 } })

  test('hovering a header row tints it by at least 1.1:1, leaves the other rows and the body row alone, and moving off restores it', async ({ page }) => {
    await openResults(page)
    const resting = await restingRows(page)
    const body = (await readPaint(page, UNITS)).body
    expect(await tintedRows(page, resting)).toEqual([])

    await headerTitle(page, UNITS).hover()
    await expectTinted(page, UNITS, resting)
    expect(await tintedRows(page, resting)).toEqual([UNITS])
    expect(same((await readPaint(page, UNITS)).body, body)).toBe(true)

    await page.mouse.move(OFF_TABLE.x, OFF_TABLE.y)
    await expect.poll(() => tintedRows(page, resting)).toEqual([])
  })

  test('hovering a cell that holds no text, the handle cell, tints the row too', async ({ page }) => {
    await openResults(page)
    const resting = await restingRows(page)
    await handle(page, RATES).hover()
    await expectTinted(page, RATES, resting)
    expect(await tintedRows(page, resting)).toEqual([RATES])
  })

  test('Tab focus on a handle tints its row, Tab to the next chart moves the tint, and the body row stays plain', async ({ page }) => {
    await openResults(page)
    const resting = await restingRows(page)
    const body = (await readPaint(page, UNITS)).body
    await keyboardFocus(page, handle(page, UNITS))
    await expectTinted(page, UNITS, resting)
    expect(await tintedRows(page, resting)).toEqual([UNITS])
    expect(same((await readPaint(page, UNITS)).body, body)).toBe(true)

    for (let i = 0; i < 12 && !(await handle(page, RATES).evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab')
    await expect(handle(page, RATES)).toBeFocused()
    await expect.poll(() => tintedRows(page, resting)).toEqual([RATES])
    await expectTinted(page, RATES, resting)
  })

  for (const [name, target] of [
    ['the collapse caret', (page: Page) => caret(page, RATES)],
    ['a view toggle button', (page: Page) => toggleOption(page, RATES, 'villagers')],
  ] as const) {
    test(`keyboard focus on ${name} tints that chart's header row only`, async ({ page }) => {
      await openResults(page)
      const resting = await restingRows(page)
      await keyboardFocus(page, target(page))
      await expectTinted(page, RATES, resting)
      expect(await tintedRows(page, resting)).toEqual([RATES])
    })

    test(`a mouse click on ${name} from a fresh load leaves no row tinted once the pointer is off the table`, async ({ page }) => {
      await openResults(page)
      const resting = await restingRows(page)
      await target(page).click()
      await expectTinted(page, RATES, resting)
      await page.mouse.move(OFF_TABLE.x, OFF_TABLE.y)
      await expect(target(page)).toBeFocused()
      expect(await target(page).evaluate((el) => el.matches(':focus-within'))).toBe(true)
      expect(await target(page).evaluate((el) => el.matches(':focus-visible'))).toBe(false)
      await expect.poll(() => tintedRows(page, resting)).toEqual([])
    })
  }

  for (const state of ['hover', 'keyboard focus'] as const) {
    for (const id of [UNITS, RATES]) {
      test(`in a header row tinted by ${state}, ${TITLES[id]}'s title, grip, caret and toggle labels keep a 4.5:1 contrast`, async ({ page }) => {
        await openResults(page)
        const resting = await restingRows(page)
        if (state === 'hover') await headerTitle(page, id).hover()
        else await keyboardFocus(page, handle(page, id))
        await expectTinted(page, id, resting)

        const names = (await readPaint(page, id)).texts.map((text) => text.name)
        expect(names).toEqual(expect.arrayContaining(['title', 'grip', 'caret', 'toggle 0', 'toggle 1']))
        await expectTextContrast(page, id, `${id} ${state}`)
      })
    }
  }

  test('after the other view toggle is pressed, both toggle labels still keep 4.5:1 under the hover tint', async ({ page }) => {
    await openResults(page)
    const resting = await restingRows(page)
    await expect(toggleOption(page, RATES, 'rate')).toHaveAttribute('aria-pressed', 'true')
    await toggleOption(page, RATES, 'villagers').click()
    await expect(toggleOption(page, RATES, 'villagers')).toHaveAttribute('aria-pressed', 'true')
    await headerTitle(page, RATES).hover()
    await expectTinted(page, RATES, resting)
    await expectTextContrast(page, RATES, 'both toggles pressed in turn', 'toggle')
  })

  test("the compare panel's caret keeps the transparent background of btn-outline-secondary", async ({ page }) => {
    await openResults(page)
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('pinned-label')).toBeVisible()
    await page.mouse.move(OFF_TABLE.x, OFF_TABLE.y)
    const compareCaret = page.getByTestId('compare-collapse')
    await expect(compareCaret).not.toBeFocused()
    await expect(compareCaret).toHaveClass(/btn-outline-secondary/)
    await expect(compareCaret).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(caret(page, UNITS)).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })
})

test.describe('AoE4 chart drag feedback', () => {
  test.use({ viewport: { width: 1280, height: 3400 } })

  test('the dragged chart follows the pointer vertically at 60% opacity while the other charts stay put', async ({ page }) => {
    await openResults(page)
    const before = await readBoxes(page)
    const { x, y } = await pressHandle(page, UNITS)
    const rowOpacities = () =>
      page.evaluate((id) => [...document.querySelectorAll(`[data-testid="${id}"] > tr`)].map((row) => getComputedStyle(row).opacity), UNITS)
    const groupOpacity = () => page.evaluate((id) => getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!).opacity, UNITS)

    for (const travel of [30, 200, -20]) {
      await page.mouse.move(x, y + travel, { steps: 4 })
      await expect
        .poll(async () => {
          const now = await readBoxes(page)
          return {
            moved: Math.round(now.groups[UNITS].top - before.groups[UNITS].top),
            others: Object.entries(now.groups).filter(([id]) => id !== UNITS).every(([id, rect]) => rect.top === before.groups[id].top && rect.bottom === before.groups[id].bottom),
          }
        })
        .toEqual({ moved: travel, others: true })
    }
    expect(await groupOpacity()).toBe('0.6')
    const rows = await rowOpacities()
    expect(rows.length).toBeGreaterThan(1)
    expect(rows.every((opacity) => opacity === '1')).toBe(true)
    await page.mouse.up()
  })

  test('the drop indicator is absent with no drag and below the 4px threshold, and the group has no transform or data-dragging', async ({ page }) => {
    await openResults(page)
    const idle = { indicators: 0, transform: 'none', dragging: null, rowDragging: null }
    expect(await readDragState(page, UNITS)).toEqual(idle)
    const { x, y } = await pressHandle(page, UNITS)
    await page.mouse.move(x + 1, y + 2)
    expect(await readDragState(page, UNITS)).toEqual(idle)
    await page.mouse.move(x, y + 10, { steps: 3 })
    await expect.poll(() => readDragState(page, UNITS)).toMatchObject({ indicators: 1, dragging: 'true', rowDragging: 'true' })
    expect((await readDragState(page, UNITS)).transform).not.toBe('none')
    await page.mouse.up()
  })

  const END_WAYS = [
    ['a drop', async (page: Page) => page.mouse.up()],
    ['Escape', async (page: Page) => page.keyboard.press('Escape')],
    ['a cancelled pointer', async (page: Page) => handle(page, UNITS).dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true })],
    ['a lost pointer capture', async (page: Page) => handle(page, UNITS).dispatchEvent('lostpointercapture', { pointerId: 1, isPrimary: true })],
  ] as const
  for (const [way, end] of END_WAYS) {
    test(`${way} removes the indicator, the transform and data-dragging`, async ({ page }) => {
      await openResults(page)
      const before = await readBoxes(page)
      const { x, y } = await pressHandle(page, UNITS)
      await page.mouse.move(x, y + 40, { steps: 4 })
      await expect.poll(() => readDragState(page, UNITS)).toMatchObject({ indicators: 1, dragging: 'true', rowDragging: 'true' })
      expect((await readDragState(page, UNITS)).transform).not.toBe('none')

      await end(page)
      await expect.poll(() => readDragState(page, UNITS)).toEqual({ indicators: 0, transform: 'none', dragging: null, rowDragging: null })
      await page.mouse.up()
      expect(await readOrder(page)).toEqual([...CHART_IDS])
      expect((await readBoxes(page)).groups).toEqual(before.groups)
    })
  }

  test('the indicator and the drag add no layout shift: the other charts and the table keep their boxes during the drag and after Escape', async ({ page }) => {
    await openResults(page)
    const before = await readBoxes(page)
    const { x, y } = await pressHandle(page, UNITS)
    await page.mouse.move(x, before.groups[GATHERED].bottom + 2, { steps: 8 })
    await expect
      .poll(async () => {
        const now = await readBoxes(page)
        return { indicator: now.indicator !== null, table: now.table, others: [RATES, GATHERED, FLOATING].map((id) => now.groups[id]) }
      })
      .toEqual({ indicator: true, table: before.table, others: [RATES, GATHERED, FLOATING].map((id) => before.groups[id]) })
    await page.keyboard.press('Escape')
    await expect
      .poll(async () => {
        const now = await readBoxes(page)
        return { indicator: now.indicator, groups: now.groups, table: now.table }
      })
      .toEqual({ indicator: null, groups: before.groups, table: before.table })
    await page.mouse.move(x, y)
    await page.mouse.up()
  })
})

test.describe('AoE4 chart drop indicator', () => {
  test.use({ viewport: { width: 1280, height: 3400 } })

  test('the indicator spans the table width and sits on the slot a release would drop into, and follows the pointer back up', async ({ page }) => {
    await openResults(page)
    const before = await readBoxes(page)
    const { x } = await pressHandle(page, UNITS)

    // Slots among the three other charts: 0 above Gather rates, 1 between Gather rates and Gathered, 2 between Gathered and Floating, 3 below Floating.
    for (const [pointerY, slot] of [
      [before.groups[GATHERED].bottom + 2, 2],
      [before.groups[GATHERED].top + 3, 1],
      [before.groups[RATES].top + 5, 0],
      [before.groups[FLOATING].bottom + 4, 3],
    ] as const) {
      await page.mouse.move(x, pointerY, { steps: 6 })
      await expect
        .poll(async () => {
          const now = await readBoxes(page)
          return {
            slots: slotsMet(now, UNITS),
            left: now.indicator ? Math.abs(now.indicator.left - now.table.left) <= 1 : false,
            right: now.indicator ? Math.abs(now.indicator.right - now.table.right) <= 1 : false,
          }
        })
        .toEqual({ slots: [slot], left: true, right: true })
    }
    await page.mouse.up()
  })

  test('with the pointer inside the chart that is dragged, the indicator shows at the chart own slot', async ({ page }) => {
    await openResults(page)
    const { x, y } = await pressHandle(page, UNITS)
    await page.mouse.move(x, y + 20, { steps: 4 })
    await expect.poll(async () => slotsMet(await readBoxes(page), UNITS)).toEqual([0])
    await page.mouse.up()
    expect(await readOrder(page)).toEqual([...CHART_IDS])
  })

  const DROP_CASES: { name: string; dragged: string; collapse?: string[]; pointerY: (boxes: Boxes, startY: number) => number; slot: number }[] = [
    { name: 'past the middle of the third chart', dragged: UNITS, pointerY: (b) => b.groups[GATHERED].bottom + 2, slot: 2 },
    { name: 'above the first chart', dragged: GATHERED, pointerY: (b) => b.groups[UNITS].top - 4, slot: 0 },
    { name: 'below the last chart', dragged: UNITS, pointerY: (b) => b.groups[FLOATING].bottom + 4, slot: 3 },
    { name: 'inside the chart own rows', dragged: UNITS, pointerY: (_b, startY) => startY + 20, slot: 0 },
    { name: 'between two collapsed charts', dragged: UNITS, collapse: [RATES, GATHERED], pointerY: (b) => b.groups[RATES].bottom + 1, slot: 1 },
  ]
  for (const { name, dragged, collapse = [], pointerY, slot } of DROP_CASES) {
    test(`releasing ${name} drops where the indicator showed, with the stored layout and the status of a drop`, async ({ page }) => {
      await openResults(page)
      for (const id of collapse) await caret(page, id).click()
      for (const id of collapse) await expect(chart(page, id)).toHaveAttribute('data-collapsed', 'true')
      const before = await readBoxes(page)
      const startIndex = CHART_IDS.indexOf(dragged as (typeof CHART_IDS)[number])
      const { x, y } = await pressHandle(page, dragged)
      await page.mouse.move(x, pointerY(before, y), { steps: 8 })

      let shown: number[] = []
      await expect
        .poll(async () => {
          shown = slotsMet(await readBoxes(page), dragged)
          return shown
        })
        .toEqual([slot])
      const expected = CHART_IDS.filter((id) => id !== dragged)
      expected.splice(shown[0], 0, dragged as (typeof CHART_IDS)[number])
      expect(expected.indexOf(dragged as (typeof CHART_IDS)[number])).toBe(slot)

      await page.mouse.up()
      await expect.poll(() => readOrder(page)).toEqual(expected)
      if (slot === startIndex) {
        await expect(status(page)).toHaveText('')
      } else {
        await expect(status(page)).toHaveText(`${TITLES[dragged]} moved to position ${slot + 1} of 4`)
        const layout = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!) as { order: string[] }, CHART_LAYOUT_STORAGE_KEY)
        expect(layout.order).toEqual(expected)
      }
    })
  }
})

test.describe('AoE4 chart header tint during and after a drag', () => {
  test.use({ viewport: { width: 1280, height: 3400 } })

  test('a Tab-focused handle that is then dragged leaves no header row tinted for the whole drag, and the tint returns after Escape', async ({ page }) => {
    await openResults(page)
    const resting = await restingRows(page)
    await keyboardFocus(page, handle(page, UNITS))
    await expectTinted(page, UNITS, resting)

    const { x, y } = await pressHandle(page, UNITS)
    const rates = await headerTitle(page, RATES).boundingBox()
    await page.mouse.move(x, y + 10, { steps: 3 })
    await page.mouse.move(x, rates!.y + rates!.height / 2, { steps: 6 })
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    expect(await handle(page, UNITS).evaluate((el) => el.matches(':focus-visible'))).toBe(true)
    await expect.poll(() => tintedRows(page, resting)).toEqual([])

    await page.keyboard.press('Escape')
    await expect(chart(page, UNITS)).not.toHaveAttribute('data-dragging', 'true')
    await page.mouse.up()
    await expectTinted(page, UNITS, resting)
  })

  test('a drop from a fresh load leaves no tint once the pointer is off the table, and the tint follows the pointer afterwards', async ({ page }) => {
    await openResults(page)
    const resting = await restingRows(page)
    const before = await readBoxes(page)
    const { x } = await pressHandle(page, UNITS)
    await page.mouse.move(x, before.groups[GATHERED].bottom + 2, { steps: 8 })
    await expect(chart(page, UNITS)).toHaveAttribute('data-dragging', 'true')
    await expect.poll(() => tintedRows(page, resting)).toEqual([])
    await page.mouse.up()
    await expect.poll(() => readOrder(page)).toEqual([RATES, GATHERED, UNITS, FLOATING])
    await expect(handle(page, UNITS)).toBeFocused()
    await page.mouse.move(OFF_TABLE.x, OFF_TABLE.y)
    await expect.poll(() => tintedRows(page, resting)).toEqual([])

    await headerTitle(page, FLOATING).hover()
    await expectTinted(page, FLOATING, resting)
    expect(await tintedRows(page, resting)).toEqual([FLOATING])
  })
})
