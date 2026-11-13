import { test, expect, type Page } from '@playwright/test'
import { SPLIT_VIEWPORT, TABS_VIEWPORT, openPage, showView } from './helpers'

const PHONE = { width: 390, height: 844 }
const COMPACT_BELOW_PX = 768
const TYPICAL_LINE_CHARS = 48

interface EditorMetrics {
  rem: number
  editorWidth: number
  textareaClientWidth: number
  textareaContentWidth: number
  probeWidth: number
  gutterFont: number
  annotationsFont: number
  textareaFont: number
  annotationsWidth: number
  oneChWidth: number
  spanFonts: number[]
  startedVisible: boolean
  finishedDisplays: string[]
  clipped: number
  misaligned: number
  rows: number
}

function readEditor(page: Page): Promise<EditorMetrics> {
  return page.evaluate((typicalChars) => {
    const byId = (id: string) => document.querySelector(`[data-testid="${id}"]`) as HTMLElement
    const all = (id: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`))
    const editor = byId('build-order-editor')
    const textarea = byId('build-order-text') as HTMLTextAreaElement
    const annotations = byId('build-order-annotations')
    const gutter = byId('build-order-gutter')
    const textareaStyle = getComputedStyle(textarea)
    const probe = (chars: number, font: string, family: string) => {
      const span = document.createElement('span')
      span.textContent = '0'.repeat(chars)
      span.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${font};font-family:${family}`
      document.body.append(span)
      const width = span.getBoundingClientRect().width
      span.remove()
      return width
    }
    const annotationRows = all('build-order-line-annotation')
    const lineRows = all('build-order-line-number')
    const stepRows = annotationRows.filter((row) => row.querySelector('[data-testid="step-started"]') !== null)
    const visible = (el: Element) => getComputedStyle(el).display !== 'none'
    return {
      rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
      editorWidth: editor.getBoundingClientRect().width,
      textareaClientWidth: textarea.clientWidth,
      textareaContentWidth: textarea.clientWidth - parseFloat(textareaStyle.paddingLeft) - parseFloat(textareaStyle.paddingRight),
      probeWidth: probe(typicalChars, textareaStyle.font, textareaStyle.fontFamily),
      gutterFont: parseFloat(getComputedStyle(gutter).fontSize),
      annotationsFont: parseFloat(getComputedStyle(annotations).fontSize),
      textareaFont: parseFloat(textareaStyle.fontSize),
      annotationsWidth: annotations.getBoundingClientRect().width,
      oneChWidth: probe(1, getComputedStyle(annotations).font, getComputedStyle(annotations).fontFamily),
      spanFonts: stepRows.flatMap((row) => Array.from(row.querySelectorAll(':scope > span'), (span) => parseFloat(getComputedStyle(span).fontSize))),
      startedVisible: stepRows.every((row) => visible(row.querySelector('[data-testid="step-started"]') as Element)),
      finishedDisplays: stepRows.map((row) => getComputedStyle(row.querySelector('[data-testid="step-finished"]') as Element).display),
      clipped: annotationRows.filter((row) => row.scrollWidth > row.clientWidth).length,
      misaligned: annotationRows.filter((row, i) => row.getBoundingClientRect().top !== lineRows[i].getBoundingClientRect().top).length,
      rows: stepRows.length,
    }
  }, TYPICAL_LINE_CHARS)
}


function expectFonts(m: EditorMetrics, editorRem: number) {
  expect([m.gutterFont, m.annotationsFont, m.textareaFont]).toEqual([editorRem * m.rem, editorRem * m.rem, editorRem * m.rem])
  expect(m.spanFonts.length).toBeGreaterThan(0)
  for (const span of m.spanFonts) expect(span).toBeCloseTo(0.8 * editorRem * m.rem, 5)
}

test.describe('AoE4 text editor width, compact mode', () => {
  test('at 390 px the textarea keeps half of the editor', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openPage(page)
    const m = await readEditor(page)
    expect(m.editorWidth).toBeLessThan(COMPACT_BELOW_PX)
    expect(m.textareaClientWidth).toBeGreaterThanOrEqual(0.5 * m.editorWidth)
  })

  test('at 1280x800 the textarea content fits a typical build line', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    const m = await readEditor(page)
    expect(m.editorWidth).toBeLessThan(COMPACT_BELOW_PX)
    expect(m.textareaContentWidth).toBeGreaterThanOrEqual(m.probeWidth)
  })

  for (const viewport of [PHONE, SPLIT_VIEWPORT]) {
    test(`at ${viewport.width} px the gutter drops the finish time and scales its text`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openPage(page)
      const m = await readEditor(page)
      expect(m.editorWidth).toBeLessThan(COMPACT_BELOW_PX)
      expect(m.rows).toBeGreaterThan(2)
      expect(m.finishedDisplays.every((display) => display === 'none')).toBe(true)
      expect(m.startedVisible).toBe(true)
      expectFonts(m, 0.875)
      expect(m.annotationsWidth).toBeLessThanOrEqual(8 * m.oneChWidth + 0.5)
      expect(m.clipped).toBe(0)
      expect(m.misaligned).toBe(0)
    })
  }

  test('the step table and the table view keep the finish time in compact mode', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openPage(page)
    const gutterTexts = await page.getByTestId('build-order-annotations').getByTestId('step-finished').allTextContents()
    expect(gutterTexts.length).toBeGreaterThan(2)
    await showView(page, 'table')
    const rows = page.getByTestId('step-run')
    const tableFinished = rows.getByTestId('step-finished')
    await expect(tableFinished.first()).toBeVisible()
    const finishedTexts = await tableFinished.allTextContents()
    expect(finishedTexts).toEqual(gutterTexts)
    for (const finished of await tableFinished.all()) await expect(finished).toBeVisible()
  })

  test('hovering an annotation still marks the active step in compact mode', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openPage(page)
    const row = page.getByTestId('build-order-line-annotation').and(page.locator('[data-status]')).first()
    await expect(row).not.toHaveAttribute('data-gutter-active', 'true')
    await row.hover()
    await expect(row).toHaveAttribute('data-gutter-active', 'true')
    expect(await row.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none')
  })
})

test.describe('AoE4 text editor at 768 px and wider', () => {
  test('keeps the M8 layout', async ({ page }) => {
    await page.setViewportSize(TABS_VIEWPORT)
    await openPage(page)
    const m = await readEditor(page)
    expect(m.editorWidth).toBeGreaterThanOrEqual(COMPACT_BELOW_PX)
    expect(m.rows).toBeGreaterThan(2)
    expect(m.finishedDisplays.every((display) => display !== 'none')).toBe(true)
    expectFonts(m, 1)
    expect(m.annotationsWidth).toBeCloseTo(17 * m.oneChWidth, 0)
  })
})

test.describe('AoE4 text editor compact boundary', () => {
  const widths = [
    { width: 767, compact: true },
    { width: 768, compact: false },
    { width: 850, compact: false },
  ]
  for (const { width, compact } of widths) {
    test(`an editor ${width} px wide is ${compact ? 'compact' : 'not compact'}`, async ({ page }) => {
      await page.setViewportSize(SPLIT_VIEWPORT)
      await openPage(page)
      await page.getByTestId('build-order-editor').evaluate((el, px) => {
        el.style.flex = 'none'
        el.style.width = `${px}px`
      }, width)
      await expect.poll(async () => (await readEditor(page)).editorWidth).toBe(width)
      const m = await readEditor(page)
      expect(m.rows).toBeGreaterThan(2)
      expect(m.finishedDisplays.every((display) => (display === 'none') === compact)).toBe(true)
      expectFonts(m, compact ? 0.875 : 1)
    })
  }
})
