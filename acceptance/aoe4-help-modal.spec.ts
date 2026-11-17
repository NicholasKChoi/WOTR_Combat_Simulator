import { expect, type Locator, type Page, type Request } from '@playwright/test'
import type { SimulationResult } from '../lib/aoe4-build-order/model'
import { STEP_KINDS } from '../components/apps/aoe4-build-order/step-annotations'
import {
  AOE4_PAGE,
  INVALID_PASTE,
  MIN_SUPPORTED_VIEWPORT,
  REFUSED_CLIPBOARDS,
  WIDE_VIEWPORT,
  buildOrderFrom,
  expectInvalidNoRun,
  gatedTest,
  holdNextSimulate,
  isSimulatePost,
  legendOutsideHelp,
  openHelp,
  openPage,
  plotPoint,
  saveCopy,
  showView,
  simulateOk,
  waitForRun,
} from './helpers'

const test = gatedTest('aoe4-help-modal')

const BUILD_LABEL = "ENG Knight/Longbow (King's Palace)"
const WAITING_TEXT = ['start 6 sheep -> sheep', 'produce villager from capital-town-center x1', 'research textiles'].join('\n')
const SHORT_VIEWPORT = { width: 1280, height: 400 }
const SECTION_COUNT = 7
const RATES = 'chart-gather-rates'
const UNITS = 'chart-units-produced'
const LEGEND_KINDS = Object.entries(STEP_KINDS).filter(([, label]) => label !== null).map(([kind]) => kind)
const NO_CAVEAT = /coming soon|not yet (available|supported|shipped)|incomplete|unavailable/i

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: WIDE_VIEWPORT })

const modal = (page: Page) => page.getByTestId('help-modal')
const sections = (page: Page) => modal(page).getByTestId('help-section')
const helpOpen = (page: Page) => page.getByTestId('help-open')
const activeTestId = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? null)
const normalized = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
const sectionText = async (page: Page, position: number) => normalized(await sections(page).nth(position - 1).textContent())

const headingTexts = (page: Page) => sections(page).evaluateAll((els) => els.map((el) => el.querySelector(`#${el.getAttribute('aria-labelledby')}`)?.textContent ?? null))

interface PageState {
  text: string
  selected: string
  status: string | null
  charts: string[]
}

// Text, build selection, run status and each chart's collapse, zoom and hidden-series state, read in one evaluate.
const readState = (page: Page): Promise<PageState> =>
  page.evaluate(() => ({
    text: (document.querySelector('[data-testid="build-order-text"]') as HTMLTextAreaElement | null)?.value ?? '',
    selected: (document.querySelector('[data-testid="build-order-select"]') as HTMLSelectElement).value,
    status: document.querySelector('[data-testid="auto-run-status"]')?.getAttribute('data-status') ?? null,
    charts: [...document.querySelectorAll('[data-testid^="chart-"][data-collapsed]')].map(
      (el) =>
        `${el.getAttribute('data-testid')}:${el.getAttribute('data-collapsed')}:${el.getAttribute('data-zoom-from')}:${[...el.querySelectorAll('[data-testid="chart-series-legend-item"]')].map((item) => item.getAttribute('aria-pressed')).join(',')}`,
    ),
  }))

const contentScroll = (page: Page) =>
  page.getByTestId('help-content').evaluate((el) => ({ scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, overflowY: getComputedStyle(el).overflowY }))

const setContentScrollTop = (page: Page, top: number) => page.getByTestId('help-content').evaluate((el, y) => (el.scrollTop = y), top)

async function expectClosedWithFocusOnOpen(page: Page) {
  await expect(modal(page)).toBeHidden()
  expect(await helpOpen(page).evaluate((el) => el === document.activeElement)).toBe(true)
}

test.describe('AoE4 page help modal', () => {
  test('click, Enter and Space open it, the page behind is inert, focus is on Close and the content scrolls inside a short dialog from the top each time', async ({ page }) => {
    await page.setViewportSize(SHORT_VIEWPORT)
    await openPage(page)
    const posts: string[] = []
    page.on('request', (r: Request) => {
      if (isSimulatePost(r)) posts.push(r.url())
    })
    const before = await readState(page)
    expect(before.status).toBe('current')

    const activations: [string, () => Promise<void>][] = [
      ['click', () => helpOpen(page).click()],
      ['Enter', async () => (await helpOpen(page).focus(), page.keyboard.press('Enter'))],
      ['Space', async () => (await helpOpen(page).focus(), page.keyboard.press('Space'))],
    ]
    for (const [name, activate] of activations) {
      await expect(modal(page), `closed before ${name}`).toBeHidden()
      await activate()
      await expect(modal(page), name).toBeVisible()
      expect(await activeTestId(page), `${name} focuses Close`).toBe('help-close')

      const behind = await page.evaluate(() => {
        const select = document.querySelector('[data-testid="build-order-select"]') as HTMLElement
        const box = select.getBoundingClientRect()
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
        return { reachable: hit === select || select.contains(hit) }
      })
      expect(behind.reachable, `${name}: the select behind the modal takes no clicks`).toBe(false)

      const scroll = await contentScroll(page)
      expect(scroll.scrollHeight, 'the content is taller than the dialog').toBeGreaterThan(scroll.clientHeight)
      const dialog = await modal(page).evaluate((el) => ({ height: el.getBoundingClientRect().height, viewport: innerHeight }))
      expect(dialog.height).toBeLessThanOrEqual(0.8 * dialog.viewport + 1)
      expect(['auto', 'scroll']).toContain(scroll.overflowY)
      await setContentScrollTop(page, 200)
      await expect.poll(async () => (await contentScroll(page)).scrollTop).toBeGreaterThan(0)

      await page.getByTestId('help-close').click()
      await expectClosedWithFocusOnOpen(page)
      await helpOpen(page).click()
      await expect(modal(page)).toBeVisible()
      expect((await contentScroll(page)).scrollTop, `${name}: reopened at the top`).toBe(0)
      await page.keyboard.press('Escape')
      await expectClosedWithFocusOnOpen(page)
    }
    expect(posts, 'opening sends no simulate request').toEqual([])
    expect(await readState(page)).toEqual(before)
  })

  test('Close, Escape and a backdrop click close it and return focus; clicks inside its box, padding included, leave it open', async ({ page }) => {
    await openPage(page)
    await openHelp(page)
    await page.getByTestId('help-close').click()
    await expectClosedWithFocusOnOpen(page)

    await openHelp(page)
    await page.keyboard.press('Escape')
    await expectClosedWithFocusOnOpen(page)

    await openHelp(page)
    const rect = await modal(page).evaluate((el) => {
      const { left, top, right, bottom } = el.getBoundingClientRect()
      return { left, top, right, bottom }
    })
    expect(rect.left, 'the backdrop point (5, 5) is outside the dialog').toBeGreaterThan(5)
    expect(rect.top).toBeGreaterThan(5)
    await page.mouse.click(5, 5)
    await expectClosedWithFocusOnOpen(page)

    await openHelp(page)
    await sections(page).first().locator('p').first().click()
    await expect(modal(page)).toBeVisible()
    const edge = await modal(page).evaluate((el) => {
      const { left, top, bottom } = el.getBoundingClientRect()
      const point = { x: left + 2, y: (top + bottom) / 2 }
      return { ...point, targetIsDialog: document.elementFromPoint(point.x, point.y) === el }
    })
    expect(edge.targetIsDialog, 'a point just inside the rect edge targets the dialog itself').toBe(true)
    await page.mouse.click(edge.x, edge.y)
    await expect(modal(page)).toBeVisible()
    expect(await activeTestId(page)).not.toBe('help-open')
  })

  test('opening twice shows the same content and keeps no scroll position', async ({ page }) => {
    await page.setViewportSize(SHORT_VIEWPORT)
    await openPage(page)
    await openHelp(page)
    const first = await modal(page).textContent()
    await setContentScrollTop(page, 300)
    await expect.poll(async () => (await contentScroll(page)).scrollTop).toBeGreaterThan(0)
    await page.keyboard.press('Escape')
    await expect(modal(page)).toBeHidden()
    await openHelp(page)
    expect(await modal(page).textContent()).toBe(first)
    expect((await contentScroll(page)).scrollTop).toBe(0)
  })

  test('Tab and Shift+Tab only land inside the open dialog and wrap within it', async ({ page }) => {
    await openPage(page)
    await openHelp(page)
    expect(await activeTestId(page)).toBe('help-close')
    const visited = async (key: string, presses: number) => {
      const ids: (string | null)[] = []
      for (let press = 0; press < presses; press++) {
        await page.keyboard.press(key)
        expect(await page.evaluate(() => document.querySelector('[data-testid="help-modal"]')!.contains(document.activeElement)), `${key} press ${press + 1}`).toBe(true)
        ids.push(await activeTestId(page))
      }
      return ids
    }
    expect(await visited('Tab', 5)).toEqual(['help-content', 'help-close', 'help-content', 'help-close', 'help-content'])
    expect(await visited('Shift+Tab', 3)).toEqual(['help-close', 'help-content', 'help-close'])
  })

  test('the button is enabled and opens seven sections with no result, with a syntax error and while a run loads', async ({ page }) => {
    await openPage(page)
    await openHelp(page)
    const baseline = await headingTexts(page)
    expect(baseline).toHaveLength(SECTION_COUNT)
    expect(baseline.every((text) => (text ?? '').length > 0)).toBe(true)
    await page.keyboard.press('Escape')

    async function expectAvailable(name: string) {
      await expect(helpOpen(page), name).toBeEnabled()
      await openHelp(page)
      await expect(sections(page), name).toHaveCount(SECTION_COUNT)
      expect(await headingTexts(page), name).toEqual(baseline)
      await page.keyboard.press('Escape')
      await expect(modal(page)).toBeHidden()
    }

    const release = await holdNextSimulate(page)
    try {
      await page.goto(AOE4_PAGE)
      await expect(page.getByTestId('build-order-text')).toBeVisible()
      await expect(page.getByTestId('chart-table')).toHaveCount(0)
      await expectAvailable('no result, run loading')
    } finally {
      release()
    }
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')

    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    await expectInvalidNoRun(page)
    await expect(page.getByTestId('build-order-issue')).toHaveCount(1)
    await expectAvailable('syntax error')

    const releaseNext = await holdNextSimulate(page)
    try {
      await page.getByTestId('build-order-text').fill('start 6 sheep -> sheep')
      await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', /loading|running|updating/)
      await expectAvailable('run loading')
    } finally {
      releaseNext()
    }
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
  })

  test('seven labelled sections; the legend in the third matches the run cells border colours', async ({ page }) => {
    await openPage(page)
    await showView(page, 'table')
    await expect(page.getByTestId('step-run').first()).toBeVisible()
    const cellColors = await page.getByTestId('step-row').evaluateAll((rows) =>
      rows.map((row) => [row.getAttribute('data-kind'), getComputedStyle(row.querySelector('[data-testid="step-run"]')!).borderLeftColor]),
    )
    const cellColorOf = new Map(cellColors as [string, string][])

    await openHelp(page)
    await expect(sections(page)).toHaveCount(SECTION_COUNT)
    const labelled = await sections(page).evaluateAll((els) =>
      els.map((el) => {
        const heading = document.getElementById(el.getAttribute('aria-labelledby') ?? '')
        return { tag: heading?.tagName, inside: heading !== null && el.contains(heading), text: heading?.textContent ?? '' }
      }),
    )
    for (const heading of labelled) expect(heading).toMatchObject({ tag: 'H3', inside: true })
    expect(labelled.every((heading) => heading.text.length > 0)).toBe(true)

    const legend = sections(page).nth(2).getByTestId('step-kind-legend')
    await expect(legend).toBeVisible()
    const legendKinds = await legend.locator('[data-kind]').evaluateAll((els) => els.map((el) => [el.getAttribute('data-kind'), el.textContent, getComputedStyle(el).borderLeftColor]))
    expect(legendKinds.map(([kind]) => kind)).toEqual(LEGEND_KINDS)
    expect(legendKinds.map(([, label]) => label)).toEqual(LEGEND_KINDS.map((kind) => STEP_KINDS[kind as keyof typeof STEP_KINDS]))
    const compared = legendKinds.filter(([kind]) => cellColorOf.has(kind as string))
    expect(compared.length, 'the table shows at least two legend kinds').toBeGreaterThanOrEqual(2)
    for (const [kind, , color] of compared) expect(color, `${kind}`).toBe(cellColorOf.get(kind as string))
  })

  test('the warn swatch matches a still-waiting run cell and the fourth section names the wait forms', async ({ page, request }) => {
    const result = await simulateOk<SimulationResult>(request, buildOrderFrom(WAITING_TEXT), 1200)
    const waitingStep = result.steps.findIndex((timing) => timing.status === 'waiting')
    expect(waitingStep, 'the build has a waiting step').toBeGreaterThanOrEqual(0)

    await openPage(page)
    await waitForRun(page, () => page.getByTestId('build-order-text').fill(WAITING_TEXT))
    await showView(page, 'table')
    const cell = page.getByTestId('step-row').nth(waitingStep).getByTestId('step-run')
    await expect(cell.getByTestId('step-blocked-by')).toHaveText(/(^|, )still waiting for \S/)
    const cellBackground = await cell.evaluate((el) => getComputedStyle(el).backgroundColor)

    await openHelp(page)
    const swatch = sections(page).nth(3).getByTestId('help-warn-tint')
    await expect(swatch).toBeVisible()
    const swatchBackground = await swatch.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(swatchBackground).not.toBe('rgba(0, 0, 0, 0)')
    expect(swatchBackground).toBe(cellBackground)

    const text = await sectionText(page, 4)
    for (const term of ['still waiting for', 'waiting', 'never reached|not reached', '60', 'blocked by']) {
      expect(text, term).toMatch(new RegExp(term))
    }
  })

  test('the charts section names each live chart feature, and the modal carries no caveat', async ({ page }) => {
    await openPage(page)
    await waitForRun(page, () => page.getByTestId('build-order-select').selectOption({ label: BUILD_LABEL }))
    await page.getByTestId('pin-run').click()
    await waitForRun(page, () => page.getByTestId('duration-seconds').fill('900'))
    const rates = page.getByTestId(RATES)
    const press = await plotPoint(page, RATES, 0.15)
    await page.mouse.move(press.x, press.y)
    await page.mouse.down()
    const release = await plotPoint(page, RATES, 0.5)
    await page.mouse.move(release.x, release.y, { steps: 8 })
    await page.mouse.up()
    await expect(rates.getByTestId('chart-zoom-bar')).toBeVisible()

    const title = (await rates.locator('h3').first().textContent())!.trim()
    const named = async (locator: Locator) => (await locator.first().getAttribute('aria-label'))!
    const earlier = await named(rates.getByTestId('chart-zoom-pan-earlier'))
    const later = await named(rates.getByTestId('chart-zoom-pan-later'))
    const handle = await named(rates.getByTestId('chart-drag-handle'))
    const caret = await named(rates.getByTestId('chart-collapse'))
    expect(earlier).toBe(`Show earlier in ${title} chart`)
    expect(later).toBe(`Show later in ${title} chart`)
    expect(handle).toBe(`Reorder ${title} chart`)
    expect(caret).toBe(`Collapse ${title} chart`)
    const withoutTitle = (name: string) => name.replace(`${title} `, '')

    await expect(page.getByTestId(UNITS).getByTestId('chart-upgrade-dot').first()).toBeAttached()
    await expect(page.getByTestId(UNITS).getByTestId('chart-pinned-upgrade-dot').first()).toBeAttached()
    await expect(page.getByTestId('chart-pinned-legend').first()).toBeAttached()
    const terms: [string, string][] = [
      ['series legend heading', (await rates.getByTestId('chart-series-legend').locator('h4').first().textContent())!],
      ['dashed', 'dashed'],
      ['marker control heading', (await page.getByTestId('chart-marker-legend').locator('h3').first().textContent())!],
      ['reset zoom text', (await rates.getByTestId('chart-zoom-reset').first().innerText()).trim()],
      ['pan earlier', earlier.replace(` in ${title} chart`, '')],
      ['pan later', later.replace(` in ${title} chart`, '')],
      ['drag handle', withoutTitle(handle)],
      ['caret', withoutTitle(caret)],
      ['upgrade dot', 'upgrade dot'],
      ['unit line', 'unit line'],
    ]
    await openHelp(page)
    const section = await sectionText(page, 5)
    for (const [feature, term] of terms) expect(section, `${feature}: ${term}`).toContain(normalized(term))
    expect(section).toMatch(/collapse|expand/)
    expect(normalized(await modal(page).textContent())).not.toMatch(NO_CAVEAT)
  })

  test('the legend lives only in the modal in every page state, and the other page help text stays', async ({ page }) => {
    await page.addInitScript(REFUSED_CLIPBOARDS[0].script)
    const expectOnlyInModal = async () => {
      await expect(legendOutsideHelp(page)).toHaveCount(0)
      await expect(page.getByTestId('step-kind-legend')).toHaveCount(1)
      await expect(modal(page).getByTestId('step-kind-legend')).toHaveCount(1)
    }

    const release = await holdNextSimulate(page)
    try {
      await page.goto(AOE4_PAGE)
      await expect(page.getByTestId('build-order-text')).toBeVisible()
      await expectOnlyInModal()
    } finally {
      release()
    }
    await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
    await expect(page.getByTestId('chart-table')).toBeVisible()
    await expectOnlyInModal()
    await showView(page, 'table')
    await expect(page.getByTestId('step-run').first()).toBeVisible()
    await expectOnlyInModal()
    await showView(page, 'text')

    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('chart-pinned-legend').first()).toBeAttached()
    await expect(page.getByTestId('chart-marker-legend')).toHaveCount(1)
    await expect(page.getByTestId('chart-reorder-help').first()).toBeAttached()

    await waitForRun(page, () => page.getByTestId('build-order-text').fill('start 6 sheep -> sheep'))
    await expectOnlyInModal()
    await saveCopy(page)
    await page.getByTestId('copy-saved-link').click()
    await expect(page.getByTestId('copy-saved-link-hint')).toBeVisible()
    await page.getByTestId('build-order-text').fill(INVALID_PASTE)
    await expect(page.getByTestId('build-order-issue')).toHaveCount(1)
    await expectOnlyInModal()
  })

  for (const viewport of [MIN_SUPPORTED_VIEWPORT, WIDE_VIEWPORT]) {
    test(`at ${viewport.width} px the button sits beside the title inside the page section, before the run bar`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openPage(page)
      await expect(async () => {
        const read = await page.evaluate(() => {
          const open = document.querySelector('[data-testid="help-open"]')!
          const h1 = document.querySelector('h1')!
          const select = document.querySelector('[data-testid="build-order-select"]')!
          const o = open.getBoundingClientRect()
          const h = h1.getBoundingClientRect()
          const centre = o.top + o.height / 2
          return {
            insideSection: open.closest('section') !== null && open.closest('section') === h1.closest('section'),
            centreInTitle: centre >= h.top && centre <= h.bottom,
            rightOfTitle: o.left >= h.right,
            beforeRunBar: !!(open.compareDocumentPosition(select) & Node.DOCUMENT_POSITION_FOLLOWING),
          }
        })
        expect(read).toEqual({ insideSection: true, centreInTitle: true, rightOfTitle: true, beforeRunBar: true })
      }).toPass()
    })
  }

  test('below 1200 px the button scrolls sideways with the page', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 })
    await openPage(page)
    await expect(async () => {
      const read = await page.evaluate(() => {
        const open = document.querySelector('[data-testid="help-open"]')!
        const x0 = open.getBoundingClientRect().left
        const room = document.documentElement.scrollWidth - innerWidth
        window.scrollTo({ left: 100, top: 0, behavior: 'instant' })
        return { room, moved: x0 - open.getBoundingClientRect().left, scrollX: window.scrollX }
      })
      expect(read.room, 'the page is wider than the viewport').toBeGreaterThan(100)
      expect(read.scrollX).toBe(100)
      expect(read.moved).toBe(100)
    }).toPass()
  })

  test('Tab from the top of the page reaches the help button before the build select', async ({ page }) => {
    await openPage(page)
    const stops: { id: string | null; inPage: boolean }[] = []
    for (let press = 0; press < 30; press++) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement
        return { id: active.getAttribute('data-testid'), inPage: active.closest('section') !== null }
      })
      stops.push(stop)
      if (stop.id === 'build-order-select') break
    }
    const ids = stops.map((stop) => stop.id)
    expect(ids).toContain('build-order-select')
    expect(ids).toContain('help-open')
    expect(ids.indexOf('help-open')).toBeLessThan(ids.indexOf('build-order-select'))
    expect(stops.slice(0, ids.indexOf('help-open')).every((stop) => !stop.inPage), 'only the site layout precedes the help button').toBe(true)
  })

  test('the server HTML holds the dialog closed and nothing shows before a click', async ({ page, request }) => {
    const html = await (await request.get(AOE4_PAGE)).text()
    const tag = /<dialog[^>]*data-testid="help-modal"[^>]*>/.exec(html)?.[0]
    expect(tag, 'the dialog is in the server render').toBeDefined()
    expect(tag).not.toMatch(/\sopen[\s=>]/)
    await page.goto(AOE4_PAGE)
    await expect(helpOpen(page)).toBeVisible()
    await expect(modal(page)).toBeHidden()
    expect(await modal(page).evaluate((el: HTMLDialogElement) => el.open)).toBe(false)
  })
})
