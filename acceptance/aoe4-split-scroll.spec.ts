import { test, expect, type Page } from '@playwright/test'
import { CHART_IDS, SPLIT_MIN_WIDTH, SPLIT_VIEWPORT, TABS_VIEWPORT, WIDE_VIEWPORT, expectNoRun, openPage, showTab, showView, waitForRun } from './helpers'

const LONG_BUILD = ['start 6 sheep -> sheep', ...Array.from({ length: 40 }, (_, i) => `# note ${i + 1}`), ...Array.from({ length: 6 }, () => 'produce villager from capital-town-center x1')].join('\n')
const RUN_BAR_HEIGHT = '--aoe4-run-bar-height'

const column = (page: Page, id: 'build-column' | 'results-column') => page.getByTestId(id)

async function openLongBuild(page: Page) {
  await openPage(page)
  await showTab(page, 'build')
  const response = await waitForRun(page, () => page.getByTestId('build-order-text').fill(LONG_BUILD))
  expect(response.status()).toBe(200)
}

const scrollTops = (page: Page) =>
  page.evaluate(() => {
    const top = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.scrollTop
    return { build: top('build-column'), results: top('results-column'), page: window.scrollY }
  })

async function scrollColumn(page: Page, id: 'build-column' | 'results-column') {
  await column(page, id).evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
}

test.describe('AoE4 split layout scrolls the columns separately', () => {
  for (const [name, viewport] of [
    ['split', SPLIT_VIEWPORT],
    ['wide', WIDE_VIEWPORT],
  ] as const) {
    test(`the workbench fills the viewport below the stuck run bar at the ${name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openPage(page)
      await expect(page.getByTestId('saved-build-error')).toHaveCount(0)
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
      await expect
        .poll(() =>
          page.evaluate(() => {
            const bar = document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect()
            const margin = parseFloat(getComputedStyle(document.querySelector('[data-testid="run-bar"]')!).marginBottom)
            const split = document.querySelector('[data-testid="workbench-split"]')!.getBoundingClientRect()
            return {
              marginIsReal: margin > 0,
              top: Math.abs(split.top - (bar.bottom + margin)) <= 1,
              bottom: Math.abs(split.bottom - window.innerHeight) <= 1,
            }
          }),
        )
        .toEqual({ marginIsReal: true, top: true, bottom: true })
    })
  }

  test('each column scrolls on its own', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openLongBuild(page)
    for (const [id, other] of [
      ['build-column', 'results'],
      ['results-column', 'build'],
    ] as const) {
      await expect
        .poll(() => column(page, id).evaluate((el) => el.scrollHeight > el.clientHeight))
        .toBe(true)
      await scrollColumn(page, id)
      await expect.poll(async () => (await scrollTops(page))[id === 'build-column' ? 'build' : 'results']).toBeGreaterThan(0)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true)
      const before = await scrollTops(page)
      const box = (await column(page, id).boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.wheel(0, 200)
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const after = await scrollTops(page)
      expect(after.page).toBe(before.page)
      expect(after[other]).toBe(before[other])
      await column(page, id).evaluate((el) => {
        el.scrollTop = 0
      })
    }
  })

  test('hovering the last step annotation shades a chart that is on screen', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openLongBuild(page)
    await expect.poll(() => column(page, 'build-column').evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
    const last = page.locator('[data-testid="build-order-line-annotation"][data-status]').last()
    await expect(last).toHaveAttribute('data-status', 'completed')
    await last.scrollIntoViewIfNeeded()
    await last.hover()
    await expect
      .poll(() =>
        page.evaluate((charts) => {
          const shown = charts.filter((id) => {
            const chart = document.querySelector(`[data-testid="${id}"]`)!
            const rect = chart.getBoundingClientRect()
            const onScreen = rect.bottom > 0 && rect.top < window.innerHeight
            return onScreen && [...chart.querySelectorAll('[data-testid="chart-step-band"]')].some((band) => getComputedStyle(band).visibility !== 'hidden')
          })
          return shown.length > 0
        }, CHART_IDS),
      )
      .toBe(true)
  })

  test('the run bar height property follows the bar when it grows', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    const read = () =>
      page.evaluate((property) => {
        const bar = document.querySelector('[data-testid="run-bar"]')!
        const margin = parseFloat(getComputedStyle(bar).marginBottom)
        const value = parseFloat(getComputedStyle(document.querySelector('[data-testid="workbench-split"]')!).getPropertyValue(property))
        return { height: bar.getBoundingClientRect().height, space: bar.getBoundingClientRect().height + margin, value }
      }, RUN_BAR_HEIGHT)
    const before = await read()
    expect(Math.abs(before.space - before.value)).toBeLessThanOrEqual(1)
    await expectNoRun(page, () => page.getByTestId('duration-seconds').fill('59'))
    await expect(page.getByTestId('duration-error')).toBeVisible()
    await expect
      .poll(async () => {
        const after = await read()
        return { grew: after.height !== before.height, agrees: Math.abs(after.space - after.value) <= 1 }
      })
      .toEqual({ grew: true, agrees: true })
  })

  test('both columns clip sideways overflow and the table view does not overflow the Build column', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openLongBuild(page)
    await showView(page, 'table')
    await expect(page.getByTestId('step-row').first()).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const build = document.querySelector('[data-testid="build-column"]')!
          const results = document.querySelector('[data-testid="results-column"]')!
          return {
            build: getComputedStyle(build).overflowX,
            results: getComputedStyle(results).overflowX,
            clipped: build.scrollWidth > build.clientWidth,
          }
        }),
      )
      .toEqual({ build: 'hidden', results: 'hidden', clipped: false })
  })

  test('below 1200 px there are no columns and the page scrolls', async ({ page }) => {
    await page.setViewportSize(TABS_VIEWPORT)
    expect(TABS_VIEWPORT.width).toBeLessThan(SPLIT_MIN_WIDTH)
    await openLongBuild(page)
    await expect(column(page, 'build-column')).toHaveCount(0)
    await expect(column(page, 'results-column')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true)
  })
})

test.describe('AoE4 workbench headings', () => {
  for (const [name, viewport] of [
    ['split', SPLIT_VIEWPORT],
    ['tabs', TABS_VIEWPORT],
  ] as const) {
    test(`the headings share a size and lead their panels in the ${name} layout`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openPage(page)
      for (const view of ['text', 'table'] as const) {
        await showTab(page, 'build')
        await showView(page, view)
        await expect(page.getByTestId('build-order-heading')).toHaveText('Build order')
        await expect(page.getByText('Build order', { exact: true })).toHaveCount(1)
        await expect(page.getByRole('textbox', { name: 'Build order' })).toHaveCount(view === 'text' ? 1 : 0)
        expect(await page.getByTestId('panel-build').evaluate((el) => el.firstElementChild?.getAttribute('data-testid'))).toBe('build-order-heading')
      }
      await showTab(page, 'results')
      expect(await page.getByTestId('panel-results').evaluate((el) => el.firstElementChild?.firstElementChild?.getAttribute('data-testid'))).toBe('results-heading')
      await expect(page.getByTestId('chart-units-produced')).toBeVisible()
      const sizes = await page.evaluate(() => {
        const size = (el: Element) => getComputedStyle(el).fontSize
        return {
          build: size(document.querySelector('[data-testid="build-order-heading"]') ?? document.body),
          results: size(document.querySelector('[data-testid="results-heading"]')!),
          charts: [...new Set([...document.querySelectorAll('h3')].map(size))],
        }
      })
      expect(sizes.build).toBe(sizes.results)
      expect(sizes.charts).toHaveLength(1)
    })
  }

  test('the Build heading leads the panel when the table view has no parsed build', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openPage(page)
    await showView(page, 'text')
    await page.getByTestId('build-order-text').fill('start -> sheep\nthis is not a step')
    await showView(page, 'table')
    await expect(page.getByTestId('step-table-unavailable')).toBeVisible()
    expect(await page.getByTestId('panel-build').evaluate((el) => el.firstElementChild?.getAttribute('data-testid'))).toBe('build-order-heading')
  })
})
