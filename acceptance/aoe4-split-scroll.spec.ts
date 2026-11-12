import { expect, type Page } from '@playwright/test'
import { CHART_IDS, SPLIT_MIN_WIDTH, SPLIT_VIEWPORT, TABS_VIEWPORT, WIDE_VIEWPORT, blockStorageWrites, copyButton, REFUSED_CLIPBOARDS, expectNoRun, gatedTest, openPage, saveCopy, scrollInstantly, setDurationInPlace, showTab, showView, waitForRun } from './helpers'

const test = gatedTest('aoe4-split-scroll')

const LONG_BUILD = ['start 6 sheep -> sheep', ...Array.from({ length: 40 }, (_, i) => `# note ${i + 1}`), ...Array.from({ length: 6 }, () => 'produce villager from capital-town-center x1')].join('\n')
const RUN_BAR_HEIGHT = '--aoe4-run-bar-height'
const SHORT_VIEWPORT = { width: 1280, height: 720 }
const NARROW_VIEWPORT = { width: 700, height: 900 }
const CAP_FRACTION = 0.4

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
      await scrollInstantly(page, 0)
      await expect
        .poll(() => page.evaluate(() => ({ room: window.scrollY < document.documentElement.scrollHeight - window.innerHeight, scrollable: document.documentElement.scrollHeight - window.innerHeight > 0 })))
        .toEqual({ room: true, scrollable: true })
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

const barSnapshot = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ scrollY: number; barTop: number; barHeight: number; build: number; results: number }>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const top = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.scrollTop
            const bar = document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect()
            resolve({ scrollY: window.scrollY, barTop: bar.top, barHeight: bar.height, build: top('build-column'), results: top('results-column') })
          }),
        ),
      ),
  )

async function openCappedState(page: Page) {
  await page.setViewportSize(SHORT_VIEWPORT)
  await blockStorageWrites(page)
  await page.addInitScript(REFUSED_CLIPBOARDS[0].script)
  await openPage(page)
  await saveCopy(page, 'Capped')
  await page.getByTestId('copy-saved-link').click()
  await expect(page.getByTestId('copy-saved-link-hint')).toBeVisible()
  await copyButton(page).click()
  await expect(page.getByTestId('save-copy-form')).toBeVisible()
  await page.getByTestId('save-copy-name').fill('')
  await expect(page.getByTestId('save-copy-name-error')).toBeVisible()
}

const cappedPrecondition = (page: Page) =>
  page.evaluate(() => {
    const el = (id: string) => document.querySelector(`[data-testid="${id}"]`)
    const shown = (id: string) => {
      const node = el(id)
      return node !== null && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.getBoundingClientRect().height > 0
    }
    const bar = el('run-bar')!
    bar.scrollTop = 0
    return {
      shown: ['saved-build-link', 'save-copy-form', 'my-builds-unavailable', 'copy-saved-link-hint'].filter((id) => !shown(id)),
      overflows: bar.scrollHeight > bar.clientHeight,
      height: bar.getBoundingClientRect().height,
    }
  })

test.describe('AoE4 run bar does not move the page and stays capped', () => {
  test('clearing the duration error at the end of the page keeps the scroll position and the columns', async ({ page }) => {
    await page.setViewportSize(SPLIT_VIEWPORT)
    await openLongBuild(page)
    await scrollColumn(page, 'build-column')
    await scrollColumn(page, 'results-column')
    await expectNoRun(page, () => page.getByTestId('duration-seconds').fill('59'))
    await expect(page.getByTestId('duration-error')).toBeVisible()
    await page.mouse.move(10, 300)
    await page.mouse.wheel(0, 5000)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - window.scrollY)).toBeLessThanOrEqual(1)
    const before = await barSnapshot(page)
    expect(before.scrollY).toBeGreaterThan(0)
    expect(before.build).toBeGreaterThan(0)
    expect(before.results).toBeGreaterThan(0)

    await waitForRun(page, () => setDurationInPlace(page, '600'))
    await expect(page.getByTestId('duration-error')).toHaveCount(0)
    const after = await barSnapshot(page)
    expect(after.barHeight).toBeLessThan(before.barHeight)
    expect(Math.abs(after.scrollY - before.scrollY)).toBeLessThanOrEqual(1)
    expect(Math.abs(before.barTop)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.barTop - before.barTop)).toBeLessThanOrEqual(1)
    expect(after.build).toBe(before.build)
    expect(after.results).toBe(before.results)
  })

  test('with the link, the copy form and the storage warning open the bar is capped and scrolls inside', async ({ page }) => {
    await openCappedState(page)
    const state = await cappedPrecondition(page)
    expect(state.shown).toEqual([])
    expect(state.overflows).toBe(true)
    expect(state.height).toBeLessThanOrEqual(SHORT_VIEWPORT.height * CAP_FRACTION)

    await scrollInstantly(page, 100_000)
    await expect
      .poll(() =>
        page.evaluate((property) => {
          const bar = document.querySelector('[data-testid="run-bar"]')!
          const rect = bar.getBoundingClientRect()
          const split = document.querySelector('[data-testid="workbench-split"]')!.getBoundingClientRect()
          const value = parseFloat(getComputedStyle(bar.closest('section')!).getPropertyValue(property))
          return {
            propertyFollowsBar: Math.abs(value - (rect.height + parseFloat(getComputedStyle(bar).marginBottom))) <= 1,
            splitEndsAtViewport: Math.abs(split.bottom - window.innerHeight) <= 1,
          }
        }, RUN_BAR_HEIGHT),
      )
      .toEqual({ propertyFollowsBar: true, splitEndsAtViewport: true })

    const content = await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="run-bar"]')!
      const notice = document.querySelector('[data-testid="my-builds-unavailable"]')!
      bar.scrollTop = 0
      const belowAtTop = notice.getBoundingClientRect().bottom > bar.getBoundingClientRect().bottom
      bar.scrollTop = bar.scrollHeight - bar.clientHeight
      const rect = notice.getBoundingClientRect()
      const barRect = bar.getBoundingClientRect()
      return { belowAtTop, insideAtMax: rect.top >= barRect.top - 1 && rect.bottom <= barRect.bottom + 1 }
    })
    expect(content).toEqual({ belowAtTop: true, insideAtMax: true })
  })

  test('a control scrolled out of the capped bar scrolls back into it on focus', async ({ page }) => {
    await openCappedState(page)
    const aboveAtMax = await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="run-bar"]')!
      bar.scrollTop = bar.scrollHeight - bar.clientHeight
      return document.querySelector('[data-testid="build-order-select"]')!.getBoundingClientRect().top < bar.getBoundingClientRect().top
    })
    expect(aboveAtMax).toBe(true)
    await page.getByTestId('build-order-select').focus()
    const inside = await page.evaluate(() => {
      const rect = document.querySelector('[data-testid="build-order-select"]')!.getBoundingClientRect()
      const barRect = document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect()
      return rect.top >= barRect.top - 1 && rect.bottom <= barRect.bottom + 1
    })
    expect(inside).toBe(true)
  })

  const focusRingFits = async (page: Page) => {
    await page.getByTestId('build-order-select').focus()
    return page.evaluate(() => {
      const bar = document.querySelector('[data-testid="run-bar"]')!
      const select = document.querySelector('[data-testid="build-order-select"]') as HTMLSelectElement
      const [, , , spread] = (getComputedStyle(select).boxShadow.match(/-?[\d.]+px/g) ?? []).map(parseFloat)
      const rect = select.getBoundingClientRect()
      const barRect = bar.getBoundingClientRect()
      const left = barRect.left + bar.clientLeft
      const top = barRect.top + bar.clientTop
      return {
        ringIsDrawn: spread > 0,
        noSidewaysScroll: bar.scrollWidth <= bar.clientWidth,
        ringInside: rect.left - spread >= left && rect.right + spread <= left + bar.clientWidth && rect.top - spread >= top && rect.bottom + spread <= top + bar.clientHeight,
      }
    })
  }

  test('the bar has no sideways scroll and keeps the focus ring of the build select at 768 px wide', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await openPage(page)
    await expect.poll(() => focusRingFits(page)).toEqual({ ringIsDrawn: true, noSidewaysScroll: true, ringInside: true })
  })

  test('the bar has no sideways scroll and keeps the focus ring of the build select when capped', async ({ page }) => {
    await openCappedState(page)
    expect((await cappedPrecondition(page)).overflows).toBe(true)
    await expect.poll(() => focusRingFits(page)).toEqual({ ringIsDrawn: true, noSidewaysScroll: true, ringInside: true })
  })

  test('below 768 px the bar is static and has no cap', async ({ page }) => {
    await page.setViewportSize(NARROW_VIEWPORT)
    await openPage(page)
    const style = await page.getByTestId('run-bar').evaluate((el) => ({ position: getComputedStyle(el).position, maxHeight: getComputedStyle(el).maxHeight }))
    expect(style).toEqual({ position: 'static', maxHeight: 'none' })
  })
})
