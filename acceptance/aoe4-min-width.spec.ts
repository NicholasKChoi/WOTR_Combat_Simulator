import { test, expect, type Page } from '@playwright/test'
import { CHART_IDS, MIN_SUPPORTED_VIEWPORT, isSimulatePost, openPage, waitForRun } from './helpers'

const PHONE = { width: 390, height: 844 }
const BELOW_MINIMUM = [
  { width: 1199, height: 800 },
  PHONE,
]
const SIDE_BY_SIDE = ['workbench-split', 'panel-build', 'panel-results']
const EDITED = 'start 6 sheep -> sheep'

const sectionWidth = (page: Page) =>
  page.evaluate(() => document.querySelector('[data-testid="workbench-split"]')!.closest('section')!.getBoundingClientRect().width)

async function widthAtMinimum(page: Page): Promise<number> {
  await page.setViewportSize(MIN_SUPPORTED_VIEWPORT)
  await openPage(page)
  await expect.poll(() => sectionWidth(page)).toBeGreaterThan(0)
  return sectionWidth(page)
}

test.describe('AoE4 page below the minimum supported width', () => {
  for (const viewport of BELOW_MINIMUM) {
    test(`at ${viewport.width} px the section keeps its 1200 px width, the columns stay side by side and the document scrolls sideways`, async ({ page }) => {
      const reference = await widthAtMinimum(page)
      await page.setViewportSize(viewport)
      await expect
        .poll(() =>
          page.evaluate(
            ([ids, ref]) => {
              const shown = (id: string) => {
                const r = document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect()
                return r.width > 0 && r.height > 0
              }
              const width = document.querySelector('[data-testid="workbench-split"]')!.closest('section')!.getBoundingClientRect().width
              return {
                sameWidth: Math.abs(width - (ref as number)) <= 1,
                scrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
                shown: (ids as string[]).map(shown),
              }
            },
            [SIDE_BY_SIDE, reference] as const,
          ),
        )
        .toEqual({ sameWidth: true, scrollsSideways: true, shown: [true, true, true] })
    })
  }

  test('at 390x844 nothing overlaps: bar above the columns, columns apart, editor keeps half its width, charts have width', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openPage(page)
    await expect
      .poll(() =>
        page.evaluate((chartIds) => {
          const rect = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect()
          const el = (id: string) => document.querySelector(`[data-testid="${id}"]`)!
          return {
            barAboveColumns: rect('run-bar').bottom <= rect('workbench-split').top,
            columnsApart: rect('build-column').right <= rect('results-column').left,
            editorKeepsHalf: el('build-order-text').clientWidth >= 0.5 * el('build-order-editor').clientWidth,
            chartsHaveWidth: chartIds.every((id) => rect(id).width > 0),
            barPosition: getComputedStyle(el('run-bar')).position,
          }
        }, [...CHART_IDS]),
      )
      .toEqual({ barAboveColumns: true, columnsApart: true, editorKeepsHalf: true, chartsHaveWidth: true, barPosition: 'sticky' })
  })

  test('resizing across 1200 and back keeps the focused editor and its text and runs nothing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await openPage(page)
    const textarea = page.getByTestId('build-order-text')
    await waitForRun(page, () => textarea.fill(EDITED))
    await textarea.focus()
    const posts: string[] = []
    page.on('request', (r) => {
      if (isSimulatePost(r)) posts.push(r.url())
    })
    const state = () =>
      page.evaluate(() => ({
        focused: document.activeElement?.getAttribute('data-testid'),
        value: (document.activeElement as HTMLTextAreaElement).value,
        columns: ['build-column', 'results-column'].map((id) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().width > 0),
        scrollsSideways: document.documentElement.scrollWidth > window.innerWidth,
      }))
    for (const [viewport, scrollsSideways] of [
      [PHONE, true],
      [{ width: 1280, height: 800 }, false],
    ] as const) {
      await page.setViewportSize(viewport)
      await expect.poll(state).toEqual({ focused: 'build-order-text', value: EDITED, columns: [true, true], scrollsSideways })
    }
    await page.waitForTimeout(500)
    expect(posts).toEqual([])
  })
})
