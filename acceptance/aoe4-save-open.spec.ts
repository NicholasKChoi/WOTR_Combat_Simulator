import { randomUUID } from 'crypto'
import { test as base, expect, type Browser, type Locator, type Page, type Request, type Response, type Route } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { AUTO_RUN_DEBOUNCE_MS } from '../components/apps/aoe4-build-order/auto-run'
import {
  AOE4_PAGE,
  BUILDS_PATH,
  SIMULATE_PATH,
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
import { expectValid } from './openapi-schemas'

// next dev compiles each route on its first request, which can take longer than a save.
const WARM_UP_TIMEOUT_MS = 60_000

const PHONE = { width: 390, height: 844 }
const BUILDS = listBuilds().map((b) => ({ name: b.name, text: formatBuildOrderText(b) }))
const DEFAULT = BUILDS[0]
const VALID_A = ['start -> sheep', 'produce knight from stable'].join('\n')
const VALID_B = ['start -> sheep', 'produce spearman from barracks'].join('\n')
const UNKNOWN_ID = ['start -> sheep', 'produce knigt from stable'].join('\n')
const ABSENT_ID = 'AAAAAAAAAAA'
const ID_LINK = new RegExp(`^http://localhost:\\d+${AOE4_PAGE.replaceAll('/', '\\/')}\\?b=[A-Za-z0-9_-]{11}$`)

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
const saveButton = (page: Page) => page.getByTestId('save-build')
const link = (page: Page) => page.getByTestId('saved-build-link')
const copyButton = (page: Page) => page.getByTestId('copy-saved-link')
const saveError = (page: Page) => page.getByTestId('save-build-error')
const loadError = (page: Page) => page.getByTestId('saved-build-error')
const opacity = (locator: Locator) => locator.evaluate((el) => Number(getComputedStyle(el).opacity))

const isBuildsPost = (r: Request) => new URL(r.url()).pathname === BUILDS_PATH && r.method() === 'POST'
const isBuildGet = (r: Request) => new URL(r.url()).pathname.startsWith(`${BUILDS_PATH}/`) && r.method() === 'GET'
const isBuildsUrl = (url: URL) => url.pathname === BUILDS_PATH
const isSimulateUrl = (url: URL) => url.pathname === SIMULATE_PATH
const isBuildGetUrl = (url: URL) => url.pathname.startsWith(`${BUILDS_PATH}/`)

const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value))
const withoutName = (order: unknown) => ({ ...(json(order) as object), name: undefined })
const postedOrder = (r: Request) => (r.postDataJSON() as { buildOrder: unknown }).buildOrder
const uniqueName = () => `Saved ${randomUUID()}`
const savedBody = (name: string, durationSeconds = 1200) => ({ buildOrder: { ...buildOrderFrom(DEFAULT.text), name }, durationSeconds })
const hasQuery = (page: Page) => page.url().includes('?')

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

async function freshPage(browser: Browser, baseURL: string | undefined, viewport?: { width: number; height: number }) {
  const context = await browser.newContext({
    baseURL,
    viewport,
    extraHTTPHeaders: { 'x-forwarded-for': uniqueClient('aoe4-save-open-fresh') },
  })
  return { context, page: await context.newPage() }
}

// Registers the wait for the save response before the click, and returns the posted body with the response.
async function clickSave(page: Page): Promise<{ response: Response; body: { buildOrder: { name: string }; durationSeconds: number } }> {
  const responded = page.waitForResponse((r) => isBuildsPost(r.request()))
  await saveButton(page).click()
  const response = await responded
  return { response, body: response.request().postDataJSON() }
}

async function saveThroughUi(page: Page) {
  const saved = await clickSave(page)
  await expect(link(page)).toBeVisible()
  return { ...saved, id: ((await saved.response.json()) as { id: string }).id }
}

// Real time on purpose: the paused page clock does not run timers or frames.
async function afterFrames(page: Page) {
  await page.waitForTimeout(500)
}

async function openPausedPage(page: Page) {
  await page.clock.install()
  await openPage(page)
  await page.clock.pauseAt(Date.now() + 60_000)
}

const settle = (page: Page) => page.clock.runFor(AUTO_RUN_DEBOUNCE_MS + 1)

async function expectLinkId(page: Page, id: string) {
  await expect(link(page)).toHaveValue(new RegExp(`\\?b=${id}$`))
  expect(page.url()).toMatch(new RegExp(`\\?b=${id}$`))
}

test.beforeAll(async ({ request }) => {
  await postBuild(request, savedBody(`warm-up ${randomUUID()}`), uniqueClient('aoe4-save-open-warm-up'), WARM_UP_TIMEOUT_MS)
  await request.get(buildPath('warmupwarm'), { timeout: WARM_UP_TIMEOUT_MS })
})

test.describe('saving a build and opening it by link', () => {
  test('save, copy and open the link in a fresh context', async ({ page, request, client, browser, baseURL }) => {
    const sameContent = await postBuild(request, savedBody(DEFAULT.name), client)
    expect(sameContent.status()).toBeLessThan(300)
    expect((await request.delete(buildPath((await sameContent.json()).id), { timeout: 10_000 })).status()).toBe(204)

    await openPage(page)
    await expect(saveButton(page)).toBeEnabled()
    const { response, body, id } = await saveThroughUi(page)
    expect(response.status()).toBe(201)
    expectValid('SaveBuildResponse', await response.json())
    expect(body.durationSeconds).toBe(1200)
    expect(body.buildOrder.name).toBe(DEFAULT.name)
    expect(id).toMatch(/^[A-Za-z0-9_-]{11}$/)

    await expect(link(page)).toHaveValue(ID_LINK)
    await expect(link(page)).toBeFocused()
    const selection = await link(page).evaluate((el) => {
      const input = el as HTMLInputElement
      return { start: input.selectionStart, end: input.selectionEnd, length: input.value.length }
    })
    expect([selection.start, selection.end]).toEqual([0, selection.length])
    await expectLinkId(page, id)

    const fresh = await freshPage(browser, baseURL)
    try {
      const posts = trackSimulatePosts(fresh.page)
      await fresh.page.goto(`${AOE4_PAGE}?b=${id}`)
      await expect(status(fresh.page)).toHaveAttribute('data-status', 'current')
      await expect(select(fresh.page).locator('option:checked')).toHaveText(`${DEFAULT.name} (${id})`)
      await expect(textarea(fresh.page)).toHaveValue(DEFAULT.text)
      await expect(duration(fresh.page)).toHaveValue('1200')
      expect(fresh.page.url()).toMatch(new RegExp(`\\?b=${id}$`))
      await fresh.page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 500)
      expect(posts).toHaveLength(1)
      expect((postedOrder(posts[0]) as { steps: unknown }).steps).toEqual(json(buildOrderFrom(DEFAULT.text).steps))
      expect((posts[0].postDataJSON() as { inputs: unknown }).inputs).toEqual({ durationSeconds: 1200 })
    } finally {
      await fresh.context.close()
    }
  })

  test('an unchanged opened build re-saves to the same id and an edit saves as edited', async ({ page, request, client }) => {
    const { id, name } = await apiSave(request, client)
    await openSavedBuild(page, id)
    const again = await clickSave(page)
    expect(again.body.buildOrder.name).toBe(name)
    expect(again.response.status()).toBe(200)
    await expectLinkId(page, id)

    await showTab(page, 'build')
    await waitForRun(page, () => textarea(page).fill(VALID_A))
    const edited = await clickSave(page)
    expect(edited.body.buildOrder.name).toBe(`${name} (edited)`)
  })

  test('an edited build round trips through a fresh context', async ({ page, browser, baseURL }) => {
    await openPage(page)
    await waitForRun(page, async () => {
      await textarea(page).fill(VALID_A)
      await duration(page).fill('900')
    })
    const { body, id } = await saveThroughUi(page)
    expect(body.durationSeconds).toBe(900)

    const fresh = await freshPage(browser, baseURL)
    try {
      const posts = trackSimulatePosts(fresh.page)
      await openSavedBuild(fresh.page, id)
      await expect(duration(fresh.page)).toHaveValue('900')
      await expect(select(fresh.page).locator('option:checked')).toHaveText(new RegExp(`^.+ \\(edited\\) \\(${id}\\)$`))
      expect(posts).toHaveLength(1)
      expect(withoutName(postedOrder(posts[0]))).toEqual(withoutName(body.buildOrder))
    } finally {
      await fresh.context.close()
    }
  })

  test('the same content gives the same link', async ({ page }) => {
    await openPage(page)
    const first = await saveThroughUi(page)
    const firstLink = await link(page).inputValue()
    const second = await clickSave(page)
    expect([first.response.status(), second.response.status()]).toEqual([expect.any(Number), 200])
    expect(await link(page).inputValue()).toBe(firstLink)
    expect(((await second.response.json()) as { id: string }).id).toBe(first.id)
  })

  test('Enter in the duration field runs the build and never saves, Enter and Space on Save save', async ({ page }) => {
    await openPage(page)
    const buildsPosts = trackRequests(page, isBuildsPost)
    const byEnter = await waitForRun(page, async () => {
      await duration(page).fill('900')
      await duration(page).press('Enter')
    })
    expect((byEnter.request().postDataJSON() as { inputs: unknown }).inputs).toEqual({ durationSeconds: 900 })
    await page.waitForTimeout(300)
    expect(buildsPosts).toHaveLength(0)

    await saveButton(page).focus()
    const responded = page.waitForResponse((r) => isBuildsPost(r.request()))
    await page.keyboard.press('Enter')
    await responded
    await expect(link(page)).toBeVisible()

    await saveButton(page).focus()
    const again = page.waitForResponse((r) => isBuildsPost(r.request()))
    await page.keyboard.press('Space')
    expect((await again).status()).toBe(200)
    expect(buildsPosts).toHaveLength(2)
  })

  test('Escape in the link input hides the panel and returns focus to Save', async ({ page }) => {
    await openPage(page)
    await saveThroughUi(page)
    await expect(link(page)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(link(page)).toHaveCount(0)
    await expect(copyButton(page)).toHaveCount(0)
    await expect(saveButton(page)).toBeFocused()
  })
})

test.describe('Save is enabled only while the shown result is current', () => {
  type Respond = (route: Route) => Promise<void>
  interface Row {
    name: string
    drive: (page: Page, sim: { respond: Respond }, gate: Gate) => Promise<void>
    expected: string | RegExp
    restore: (page: Page) => Promise<void>
  }
  const restoreText = (page: Page) => textarea(page).fill(VALID_B)
  const rows: Row[] = [
    { name: 'text with an unknown unit id', drive: (page) => textarea(page).fill(UNKNOWN_ID), expected: 'invalid', restore: restoreText },
    { name: 'a duration below the minimum', drive: (page) => duration(page).fill('59'), expected: 'invalid', restore: (page) => duration(page).fill('900') },
    {
      name: 'a simulate response still pending',
      drive: async (page, sim, gate) => {
        sim.respond = async (route) => {
          await gate.opened
          await route.continue().catch(() => {})
        }
        await textarea(page).fill(VALID_A)
      },
      expected: /^(running|updating)$/,
      restore: restoreText,
    },
    {
      name: 'a failed run',
      drive: async (page, sim) => {
        sim.respond = (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
        await textarea(page).fill(VALID_A)
      },
      expected: 'failed',
      restore: restoreText,
    },
    {
      name: 'a rejected run',
      drive: async (page, sim) => {
        sim.respond = (route) =>
          route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'bad', issues: [{ code: 'syntax', message: 'first problem' }] }) })
        await textarea(page).fill(VALID_A)
      },
      expected: 'rejected',
      restore: restoreText,
    },
  ]

  test('a current result enables Save at full opacity', async ({ page }) => {
    await openPage(page)
    await expect(saveButton(page)).toBeEnabled()
    expect(await opacity(saveButton(page))).toBe(1)
  })

  for (const row of rows) {
    test(`${row.name} disables Save and a restored input enables it again`, async ({ page, gate }) => {
      await openPage(page)
      const sim: { respond: Respond } = { respond: (route) => route.continue() }
      await page.route(isSimulateUrl, (route) => sim.respond(route))
      const buildsPosts = trackRequests(page, isBuildsPost)

      await row.drive(page, sim, gate)
      await expect(status(page)).toHaveAttribute('data-status', row.expected)
      await expect(saveButton(page)).toBeDisabled()
      expect(await opacity(saveButton(page))).toBeLessThan(1)
      await saveButton(page).click({ force: true })
      await page.waitForTimeout(300)
      expect(buildsPosts).toHaveLength(0)

      sim.respond = (route) => route.continue()
      gate.open()
      await waitForRun(page, () => row.restore(page))
      await expect(saveButton(page)).toBeEnabled()
      expect(await opacity(saveButton(page))).toBe(1)
    })
  }
})

test.describe('after a save', () => {
  type Edit = (page: Page) => Promise<unknown>
  const edits: { name: string; edit: Edit; keepsB: boolean }[] = [
    { name: 'a text edit', edit: (page) => textarea(page).fill(VALID_A), keepsB: true },
    { name: 'a duration edit', edit: (page) => duration(page).fill('900'), keepsB: true },
    { name: 'a build selection', edit: (page) => select(page).selectOption({ label: BUILDS[1].name }), keepsB: false },
  ]

  for (const { name, edit, keepsB } of edits) {
    test(`${name} drops the link only once the pause ends, ${keepsB ? 'keeps' : 'drops'} b, and a new save puts the new b`, async ({ page }) => {
      await openPausedPage(page)
      const { id } = await saveThroughUi(page)
      await expectLinkId(page, id)

      await edit(page)
      if (name !== 'a build selection') {
        await expect(link(page)).toBeVisible()
        expect(page.url()).toContain(`?b=${id}`)
      }
      await waitForRun(page, () => settle(page))
      await expect(link(page)).toHaveCount(0)
      await expect(saveError(page)).toHaveCount(0)
      if (keepsB) expect(page.url()).toContain(`?b=${id}`)
      else await expect.poll(() => hasQuery(page)).toBe(false)

      const again = await saveThroughUi(page)
      expect(again.id).not.toBe(id)
      await expectLinkId(page, again.id)
    })
  }

  test('an edit and an undo inside the pause keeps the link and b', async ({ page }) => {
    await openPausedPage(page)
    const { id } = await saveThroughUi(page)
    const original = await textarea(page).inputValue()

    await textarea(page).fill(VALID_A)
    await page.clock.runFor(AUTO_RUN_DEBOUNCE_MS / 2)
    await textarea(page).fill(original)
    await settle(page)
    await afterFrames(page)

    await expect(link(page)).toBeVisible()
    await expectLinkId(page, id)
  })

  test('a save error disappears when the settled input changes', async ({ page }) => {
    await openPausedPage(page)
    await page.route(isBuildsUrl, (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'down' }) }))
    await saveButton(page).click()
    await expect(saveError(page)).toBeVisible()
    await textarea(page).fill(VALID_A)
    await expect(saveError(page)).toBeVisible()
    await waitForRun(page, () => settle(page))
    await expect(saveError(page)).toHaveCount(0)
  })

  test('a save response that lands after the settled input changed shows no link and puts no b in the URL', async ({ page, gate }) => {
    await openPage(page)
    await page.route(isBuildsUrl, async (route) => {
      await gate.opened
      await route.continue().catch(() => {})
    })
    const buildsPosts = trackRequests(page, isBuildsPost)
    await saveButton(page).click()
    await expect.poll(() => buildsPosts.length).toBe(1)

    await waitForRun(page, () => textarea(page).fill(VALID_A))
    expect(hasQuery(page)).toBe(false)

    const responded = page.waitForResponse((r) => isBuildsPost(r.request()))
    gate.open()
    expect((await responded).status()).toBeLessThan(300)
    await afterFrames(page)
    await expect(link(page)).toHaveCount(0)
    expect(hasQuery(page)).toBe(false)
  })

  test('a late save for a changed build selection shows no link and puts no b in the URL', async ({ page, gate }) => {
    await openPage(page)
    await page.route(isBuildsUrl, async (route) => {
      await gate.opened
      await route.continue().catch(() => {})
    })
    const buildsPosts = trackRequests(page, isBuildsPost)
    await saveButton(page).click()
    await expect.poll(() => buildsPosts.length).toBe(1)

    await waitForRun(page, () => select(page).selectOption({ label: BUILDS[1].name }))
    const responded = page.waitForResponse((r) => isBuildsPost(r.request()))
    gate.open()
    await responded
    await afterFrames(page)
    await expect(link(page)).toHaveCount(0)
    expect(hasQuery(page)).toBe(false)
  })
})

test.describe('Copy', () => {
  test('with clipboard permission the link is copied and the button reads Copied until the input changes', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin })
    await openPage(page)
    await saveThroughUi(page)
    await expect(copyButton(page)).toHaveText('Copy link')
    await copyButton(page).click()
    await expect(copyButton(page)).toHaveText('Copied')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await link(page).inputValue())

    await waitForRun(page, () => textarea(page).fill(VALID_A))
    await expect(link(page)).toHaveCount(0)
    await saveThroughUi(page)
    await expect(copyButton(page)).toHaveText('Copy link')
  })

  const refused = [
    {
      name: 'a rejecting writeText',
      script: () => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true })
      },
    },
    {
      name: 'a missing clipboard',
      script: () => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
      },
    },
  ]

  for (const { name, script } of refused) {
    test(`${name} shows the hand-copy hint and selects the link`, async ({ page }) => {
      await page.addInitScript(script)
      await openPage(page)
      await saveThroughUi(page)
      await page.getByTestId('save-build').focus()
      await copyButton(page).click()
      await expect(page.getByTestId('copy-saved-link-hint')).toHaveText('Could not copy. Select the link and copy it by hand.')
      await expect(copyButton(page)).toHaveText('Copy link')
      await expect(link(page)).toBeFocused()
      const selection = await link(page).evaluate((el) => {
        const input = el as HTMLInputElement
        return { start: input.selectionStart, end: input.selectionEnd, length: input.value.length }
      })
      expect([selection.start, selection.end]).toEqual([0, selection.length])
      expect(selection.length).toBeGreaterThan(0)
    })
  }
})

test.describe('save errors', () => {
  interface Row {
    name: string
    respond: (route: Route) => Promise<void>
    text: string
  }
  const fulfill = (status: number, body: unknown, headers: Record<string, string> = {}) => (route: Route) =>
    route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) })
  const rows: Row[] = [
    { name: '429 with Retry-After 5', respond: fulfill(429, { error: 'rate' }, { 'Retry-After': '5' }), text: 'Too many saves. Try again in 5 seconds.' },
    { name: '429 with Retry-After 90', respond: fulfill(429, { error: 'rate' }, { 'Retry-After': '90' }), text: 'Too many saves. Try again in 2 minutes.' },
    { name: '429 with no Retry-After', respond: fulfill(429, { error: 'rate' }), text: 'Too many saves. Try again later.' },
    {
      name: '400 with an issue',
      respond: fulfill(400, { error: 'bad', issues: [{ code: 'out-of-range', message: 'name: 117 characters, more than 100' }] }),
      text: 'The build could not be saved: name: 117 characters, more than 100',
    },
    { name: '413', respond: fulfill(413, { error: 'big' }), text: 'The build is too large to save.' },
    { name: '503', respond: fulfill(503, { error: 'down' }), text: 'Saving is unavailable right now. Try again later.' },
    { name: 'an aborted request', respond: (route) => route.abort(), text: 'The build could not be saved. Try again.' },
  ]

  for (const row of rows) {
    test(`${row.name} shows its message, keeps Save enabled and a later save clears it`, async ({ page }) => {
      await openPage(page)
      let respond = row.respond
      await page.route(isBuildsUrl, (route) => respond(route))
      await saveButton(page).click()
      await expect(saveError(page)).toHaveText(row.text)
      await expect(link(page)).toHaveCount(0)
      await expect(saveButton(page)).toBeEnabled()

      respond = (route) => route.continue()
      await saveButton(page).click()
      await expect(link(page)).toBeVisible()
      await expect(saveError(page)).toHaveCount(0)
    })
  }
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

  test('a snapshot save keeps the other query keys and adds the new b', async ({ page }) => {
    await page.goto(`${AOE4_PAGE}?utm=1`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    const { id } = await saveThroughUi(page)
    await expect.poll(() => new URL(page.url()).searchParams.get('b')).toBe(id)
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
    await saveThroughUi(page)
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
    for (const locator of [select(page), duration(page), textarea(page), saveButton(page)]) {
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
    for (const locator of [select(page), duration(page), textarea(page), saveButton(page)]) {
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
    await expect(saveButton(page)).toBeDisabled()
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

test.describe('layout with the link shown', () => {
  test('the link panel neither widens the page at 390 px nor lets the run bar cover the editor', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openPage(page)
    await saveThroughUi(page)

    const measure = () =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        runBarHeight: document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
        linkVisible: document.querySelector('[data-testid="saved-build-link"]') !== null,
      }))

    await expect.poll(async () => (await measure()).scrollWidth).toBeLessThanOrEqual(PHONE.width)
    expect((await measure()).linkVisible).toBe(true)
    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport)
      await expect.poll(async () => (await measure()).runBarHeight / viewport.height).toBeLessThanOrEqual(0.4)
      expect((await measure()).linkVisible).toBe(true)
    }
  })
})
