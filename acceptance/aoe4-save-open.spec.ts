import { randomUUID } from 'crypto'
import { test as base, expect, type Page, type Request, type Route } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { AUTO_RUN_DEBOUNCE_MS } from '../components/apps/aoe4-build-order/auto-run'
import {
  AOE4_PAGE,
  BUILDS_PATH,
  buildOrderFrom,
  buildPath,
  isSimulatePost,
  openPage,
  openSavedBuild,
  postBuild,
  showTab,
  showView,
  uniqueClient,
  waitForRun,
} from './helpers'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000

const PHONE = { width: 390, height: 844 }
const BUILDS = listBuilds().map((b) => ({ name: b.name, text: formatBuildOrderText(b) }))
const DEFAULT = BUILDS[0]
const VALID_A = ['start -> sheep', 'produce knight from stable'].join('\n')
const ABSENT_ID = 'AAAAAAAAAAA'

interface Gate {
  opened: Promise<void>
  open: () => void
}

// `gate` is released in fixture teardown, so a route handler that waits on it never outlives the test.
const test = base.extend<{ client: string; gate: Gate }>({
  client: async ({}, use) => {
    await use(uniqueClient('aoe4-save-open'))
  },
  extraHTTPHeaders: async ({ client }, use) => {
    await use({ 'x-forwarded-for': client })
  },
  gate: async ({ page: _page }, use) => {
    let open!: () => void
    const opened = new Promise<void>((resolve) => {
      open = resolve
    })
    await use({ opened, open })
    open()
  },
})

const status = (page: Page) => page.getByTestId('auto-run-status')
const textarea = (page: Page) => page.getByTestId('build-order-text')
const duration = (page: Page) => page.getByTestId('duration-seconds')
const select = (page: Page) => page.getByTestId('build-order-select')
const copyButton = (page: Page) => page.getByTestId('save-build-copy')
const loadError = (page: Page) => page.getByTestId('saved-build-error')

const isBuildGet = (r: Request) => new URL(r.url()).pathname.startsWith(`${BUILDS_PATH}/`) && r.method() === 'GET'
const isBuildGetUrl = (url: URL) => url.pathname.startsWith(`${BUILDS_PATH}/`)

const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value))
const withoutName = (order: unknown) => ({ ...(json(order) as object), name: undefined })
const postedOrder = (r: Request) => (r.postDataJSON() as { buildOrder: unknown }).buildOrder
const uniqueName = () => `Saved ${randomUUID()}`
const savedBody = (name: string, durationSeconds = 1200) => ({ buildOrder: { ...buildOrderFrom(DEFAULT.text), name }, durationSeconds })

function trackSimulatePosts(page: Page): Request[] {
  const posts: Request[] = []
  page.on('request', (r) => {
    if (isSimulatePost(r)) posts.push(r)
  })
  return posts
}

function trackRequests(page: Page, matches: (r: Request) => boolean): Request[] {
  const seen: Request[] = []
  page.on('request', (r) => {
    if (matches(r)) seen.push(r)
  })
  return seen
}

async function apiSave(request: Parameters<typeof postBuild>[0], client: string, name = uniqueName(), durationSeconds = 1200) {
  const response = await postBuild(request, savedBody(name, durationSeconds), client)
  expect(response.status(), await response.text()).toBeLessThan(300)
  return { id: (await response.json()).id as string, name }
}

async function afterFrames(page: Page) {
  await page.waitForTimeout(500)
}

test.beforeAll(async ({ request }) => {
  await postBuild(request, savedBody(`warm-up ${randomUUID()}`), uniqueClient('aoe4-save-open-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(buildPath('warmupwarm'), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe('opening a link', () => {
  test('the load does not drop b: no replaceState removes it after the first run', async ({ page, request, client }) => {
    const { id } = await apiSave(request, client)
    await page.addInitScript(() => {
      const urls: string[] = []
      ;(window as unknown as { __replaced: string[] }).__replaced = urls
      for (const method of ['replaceState', 'pushState'] as const) {
        const original = history[method]
        history[method] = function (this: History, ...args: Parameters<History['replaceState']>) {
          urls.push(String(args[2]))
          return original.apply(this, args)
        }
      }
    })
    await openSavedBuild(page, id)
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 500)
    expect(page.url()).toMatch(new RegExp(`\\?b=${id}$`))
    const urls = await page.evaluate(() => (window as unknown as { __replaced: string[] }).__replaced)
    expect(urls.filter((url) => !url.includes(`b=${id}`))).toEqual([])
  })

  test('other query keys survive the load and a template choice, which drops only b', async ({ page, request, client }) => {
    const { id } = await apiSave(request, client)
    await page.goto(`${AOE4_PAGE}?b=${id}&utm=1`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(select(page).locator('option:checked')).toHaveText(new RegExp(`\\(${id}\\)$`))
    await afterFrames(page)
    const loaded = new URL(page.url()).searchParams
    expect([loaded.get('utm'), loaded.get('b')]).toEqual(['1', id])

    await waitForRun(page, () => select(page).selectOption({ label: BUILDS[1].name }))
    await expect.poll(() => new URL(page.url()).searchParams.has('b')).toBe(false)
    expect(new URL(page.url()).searchParams.get('utm')).toBe('1')
  })

  test('a first b wins over a later one, and a later change of b loads nothing', async ({ page, request, client }) => {
    const first = await apiSave(request, client)
    const second = await apiSave(request, client)
    const gets = trackRequests(page, isBuildGet)
    await page.goto(`${AOE4_PAGE}?b=${first.id}&b=${ABSENT_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(loadError(page)).toHaveCount(0)
    await expect(select(page).locator('option:checked')).toHaveText(`${first.name} (${first.id})`)
    expect(gets).toHaveLength(1)

    await showTab(page, 'build')
    await waitForRun(page, () => textarea(page).fill(VALID_A))
    const edited = await textarea(page).inputValue()

    await page.evaluate((to) => (window as unknown as { next: { router: { push: (url: string, as?: string, options?: object) => unknown } } }).next.router.push(to, undefined, { shallow: true }), `${AOE4_PAGE}?b=${second.id}`)
    await expect.poll(() => page.url()).toContain(`?b=${second.id}`)
    await page.goBack()
    await expect.poll(() => page.url()).not.toContain(`?b=${second.id}`)
    await afterFrames(page)
    expect(gets).toHaveLength(1)
    await expect(textarea(page)).toHaveValue(edited)
  })

  test('the load holds the first run, disables editing, then runs the saved build once', async ({ page, request, client, gate }) => {
    const { id } = await apiSave(request, client)
    await page.route(isBuildGetUrl, async (route) => {
      await gate.opened
      await route.continue().catch(() => {})
    })
    const posts = trackSimulatePosts(page)
    await page.goto(`${AOE4_PAGE}?b=${id}`)

    await expect(status(page)).toHaveAttribute('data-status', 'loading')
    for (const locator of [select(page), duration(page), textarea(page), copyButton(page)]) {
      await expect(locator).toBeDisabled()
      await expect(locator).toHaveAttribute('aria-busy', 'true')
    }
    await showView(page, 'table')
    await expect(page.getByTestId('step-table')).toHaveAttribute('disabled', '')
    await expect(page.getByTestId('step-table')).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByTestId('step-add')).toBeDisabled()
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(posts).toHaveLength(0)

    gate.open()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(posts).toHaveLength(1)
    expect(withoutName(postedOrder(posts[0]))).toEqual(withoutName(buildOrderFrom(DEFAULT.text)))
    await showTab(page, 'build')
    await expect(page.getByTestId('step-table')).not.toHaveAttribute('disabled')
    await expect(page.getByTestId('step-table')).not.toHaveAttribute('aria-busy')
    await showView(page, 'text')
    for (const locator of [select(page), duration(page), textarea(page), copyButton(page)]) {
      await expect(locator).toBeEnabled()
      await expect(locator).not.toHaveAttribute('aria-busy')
    }
  })

  test('leaving during a load aborts the request without a console error', async ({ page, request, client, gate }) => {
    const { id } = await apiSave(request, client)
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route(isBuildGetUrl, async (route) => {
      await gate.opened
      await route.continue().catch(() => {})
    })
    const gets = trackRequests(page, isBuildGet)
    const failed = page.waitForEvent('requestfailed', { predicate: isBuildGet, timeout: 10_000 })
    await page.goto(`${AOE4_PAGE}?b=${id}`)
    await expect.poll(() => gets.length).toBe(1)
    await expect(status(page)).toHaveAttribute('data-status', 'loading')

    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL(/\/$/)
    expect((await failed).url()).toContain(`${BUILDS_PATH}/${id}`)
    await afterFrames(page)
    expect(errors).toEqual([])
  })

  interface LoadRow {
    name: string
    query: string
    route?: (route: Route) => Promise<void>
    gets: number
    message: string
  }
  const NOT_FOUND = 'That saved build was not found. Showing the default build.'
  const FAILED = 'That saved build could not be loaded. Showing the default build.'
  const loadRows: LoadRow[] = [
    { name: 'a malformed id', query: 'abc', gets: 0, message: NOT_FOUND },
    { name: 'an id that is not stored', query: ABSENT_ID, gets: 1, message: NOT_FOUND },
    {
      name: 'a 500 answer',
      query: ABSENT_ID,
      route: (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) }),
      gets: 1,
      message: FAILED,
    },
    { name: 'an aborted request', query: ABSENT_ID, route: (route) => route.abort(), gets: 1, message: FAILED },
  ]

  for (const row of loadRows) {
    test(`${row.name} shows the message, runs the default build once and keeps b after a settled edit`, async ({ page }) => {
      if (row.route) await page.route(isBuildGetUrl, row.route)
      const gets = trackRequests(page, isBuildGet)
      const posts = trackSimulatePosts(page)
      const responses: number[] = []
      page.on('response', (r) => {
        if (isBuildGet(r.request())) responses.push(r.status())
      })
      await page.goto(`${AOE4_PAGE}?b=${row.query}`)
      await expect(status(page)).toHaveAttribute('data-status', 'current')
      await expect(loadError(page)).toHaveText(row.message)
      await expect(select(page)).toHaveValue(`template:${DEFAULT.name}`)
      await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
      expect(gets).toHaveLength(row.gets)
      if (row.name === 'an id that is not stored') expect(responses).toEqual([404])
      expect(posts).toHaveLength(1)
      expect((postedOrder(posts[0]) as { steps: unknown }).steps).toEqual(json(buildOrderFrom(DEFAULT.text).steps))
      expect(page.url()).toContain(`?b=${row.query}`)

      await waitForRun(page, () => textarea(page).fill(VALID_A))
      expect(page.url()).toContain(`?b=${row.query}`)
    })
  }

  test('a saved build whose text no longer converts opens as text with the issues and no run', async ({ page }) => {
    const order = json(buildOrderFrom(DEFAULT.text)) as { steps: { unit?: string }[] }
    const broken = { ...order, name: 'Broken', steps: order.steps.map((step) => (step.unit === undefined ? step : { ...step, unit: 'knigt' })) }
    expect(broken.steps.some((step) => step.unit === 'knigt')).toBe(true)
    await page.route(isBuildGetUrl, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 1, id: 'BBBBBBBBBBB', buildOrder: broken, durationSeconds: 1200 }) }),
    )
    const posts = trackSimulatePosts(page)
    await page.setViewportSize(PHONE)
    await page.goto(`${AOE4_PAGE}?b=BBBBBBBBBBB`)
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect(textarea(page)).toHaveValue(/knigt/)
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
    await expect(loadError(page)).toHaveCount(0)
    await expect(copyButton(page)).toBeDisabled()
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 500)
    expect(posts).toHaveLength(0)
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
  })
})

test.describe('the tab after a load at 390 px', () => {
  test.use({ viewport: PHONE })

  test('a successful load selects Results', async ({ page, request, client }) => {
    const { id } = await apiSave(request, client)
    await openSavedBuild(page, id)
    await expect(page.getByTestId('tab-results')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-results')).toBeVisible()
  })

  test('a load with no b stays on Build', async ({ page }) => {
    await openPage(page)
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tab-results')).toHaveAttribute('aria-selected', 'false')
  })

  test('a b that falls back to the default build stays on Build', async ({ page }) => {
    await page.goto(`${AOE4_PAGE}?b=${ABSENT_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(loadError(page)).toBeVisible()
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('tab-results')).toHaveAttribute('aria-selected', 'false')
  })

  test('a later run does not switch the tab back to Results', async ({ page, request, client }) => {
    const { id } = await apiSave(request, client)
    await openSavedBuild(page, id)
    await page.getByTestId('tab-build').click()
    await waitForRun(page, () => textarea(page).fill(VALID_A))
    await afterFrames(page)
    await expect(page.getByTestId('tab-build')).toHaveAttribute('aria-selected', 'true')
  })
})

