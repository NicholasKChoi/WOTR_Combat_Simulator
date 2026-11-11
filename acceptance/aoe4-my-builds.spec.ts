import { test as base, expect, type Page, type Request, type Route } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { AUTO_RUN_DEBOUNCE_MS } from '../components/apps/aoe4-build-order/auto-run'
import { MY_BUILDS_STORAGE_KEY } from '../components/apps/aoe4-build-order/my-builds-storage'
import { AOE4_PAGE, BUILDS_PATH, acceptBeforeUnload, buildOrderFrom, isSimulatePost, openPage, showTab, waitForRun } from './helpers'

const NAMED_PATH = '/api/aoe4-build-order/named-builds'
const BUILDS = listBuilds().map((b) => ({ name: b.name, text: formatBuildOrderText(b) }))
const DEFAULT = BUILDS[0]
const OTHER = BUILDS[1]
const NEWER_ID = 'NNNNNNNNNNNNNNNNNNNNNN'
const OLDER_ID = 'OOOOOOOOOOOOOOOOOOOOOO'
const SHARED_ID = 'SSSSSSSSSSSSSSSSSSSSSS'
const LINK_ID = 'LLLLLLLLLLL'
const SECRET = 'e'.repeat(43)
const OLDER = { id: OLDER_ID, name: 'Older stored build', editSecret: SECRET, revision: 1, updatedAt: '2026-01-01T00:00:00.000Z' }
const NEWER = { id: NEWER_ID, name: 'Newer stored build', editSecret: SECRET, revision: 2, updatedAt: '2026-02-01T00:00:00.000Z' }
const REMOTE_TEXT = ['start -> sheep', 'produce knight from stable'].join('\n')
const REMOTE_ORDER = (name: string) => ({ ...JSON.parse(JSON.stringify(buildOrderFrom(REMOTE_TEXT))), name })
const REMOTE_FORMATTED = formatBuildOrderText(buildOrderFrom(REMOTE_TEXT))

interface Gate {
  opened: Promise<void>
  open: () => void
}

// `gate` is released in fixture teardown, so a route handler that waits on it never outlives the test.
const test = base.extend<{ gate: Gate }>({
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
const loadError = (page: Page) => page.getByTestId('saved-build-error')
const checkedOption = (page: Page) => select(page).locator('option:checked')
const groupOptions = (page: Page, group: string) => select(page).locator(`optgroup[label="${group}"] option`)
const groupLabels = (page: Page) => select(page).locator('optgroup').evaluateAll((groups) => groups.map((g) => g.getAttribute('label')))

const isNamedGet = (r: Request) => new URL(r.url()).pathname.startsWith(`${NAMED_PATH}/`) && r.method() === 'GET'
const isNamedUrl = (url: URL) => url.pathname.startsWith(`${NAMED_PATH}/`)
const isBuildGet = (r: Request) => new URL(r.url()).pathname.startsWith(`${BUILDS_PATH}/`) && r.method() === 'GET'
const isBuildUrl = (url: URL) => url.pathname.startsWith(`${BUILDS_PATH}/`)

function track(page: Page, matches: (r: Request) => boolean, event: 'request' | 'requestfailed' = 'request'): Request[] {
  const seen: Request[] = []
  const onEvent = (r: Request) => {
    if (matches(r)) seen.push(r)
  }
  if (event === 'request') page.on('request', onEvent)
  else page.on('requestfailed', onEvent)
  return seen
}

const namedBody = (id: string, name: string, durationSeconds = 900, revision = 7) => ({
  version: 1,
  id,
  buildOrder: REMOTE_ORDER(name),
  durationSeconds,
  revision,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
})

const fulfillJson = (route: Route, status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

const seedMyBuilds = (page: Page, value: string) =>
  page.addInitScript(([key, raw]) => window.localStorage.setItem(key, raw), [MY_BUILDS_STORAGE_KEY, value])

// The seed is written oldest first, so only a newest-first sort puts NEWER on top.
const seedTwo = (page: Page) => seedMyBuilds(page, JSON.stringify({ version: 1, builds: [OLDER, NEWER] }))

async function openPausedPage(page: Page) {
  await page.clock.install()
  await openPage(page)
  await page.clock.pauseAt(Date.now() + 60_000)
}

test.describe('select structure', () => {
  test('the label reads Build and the only group holds the templates in order with entry-key values', async ({ page }) => {
    expect(BUILDS.length).toBeGreaterThan(1)
    await openPage(page)
    await expect(page.locator('label[for="build-order-select"]')).toHaveText('Build')
    expect(await groupLabels(page)).toEqual(['Templates'])
    await expect(groupOptions(page, 'Templates')).toHaveText(BUILDS.map((b) => b.name))
    const values = await groupOptions(page, 'Templates').evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))
    expect(values).toEqual(BUILDS.map((b) => `template:${b.name}`))
  })

  test('a stored list shows My builds newest first above Templates', async ({ page }) => {
    await seedTwo(page)
    await openPage(page)
    await expect.poll(() => groupLabels(page)).toEqual(['My builds', 'Templates'])
    await expect(groupOptions(page, 'My builds')).toHaveText([NEWER.name, OLDER.name])
    await expect(groupOptions(page, 'Templates')).toHaveText(BUILDS.map((b) => b.name))
  })

  test('a stored value that is not JSON shows no My builds group and no alert', async ({ page }) => {
    await seedMyBuilds(page, 'this is not json')
    await openPage(page)
    await page.waitForTimeout(500)
    expect(await groupLabels(page)).toEqual(['Templates'])
    await expect(loadError(page)).toHaveCount(0)
    await expect(page.getByTestId('save-build-error')).toHaveCount(0)
  })
})

test.describe('edited marker', () => {
  test('typing marks the selected option edited before the pause ends and restoring clears it', async ({ page }) => {
    await openPausedPage(page)
    await expect(checkedOption(page)).toHaveText(DEFAULT.name)
    await expect(select(page)).toHaveAttribute('data-edited', 'false')

    await textarea(page).fill(`${DEFAULT.text}\n`)
    await expect(checkedOption(page)).toHaveText(`${DEFAULT.name} (edited)`)
    await expect(select(page)).toHaveAttribute('data-edited', 'true')

    await textarea(page).fill(DEFAULT.text)
    await expect(checkedOption(page)).toHaveText(DEFAULT.name)
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
  })

  test('a duration change leaves a template unedited', async ({ page }) => {
    await openPausedPage(page)
    await duration(page).fill('900')
    await expect(duration(page)).toHaveValue('900')
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
    await expect(checkedOption(page)).toHaveText(DEFAULT.name)
  })

  test('a duration change marks an opened link edited and restoring it clears the marker', async ({ page }) => {
    await page.route(isBuildUrl, (route) =>
      fulfillJson(route, 200, { version: 1, id: LINK_ID, buildOrder: REMOTE_ORDER('Opened link'), durationSeconds: 1200 }),
    )
    await page.clock.install()
    await page.goto(`${AOE4_PAGE}?b=${LINK_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await page.clock.pauseAt(Date.now() + 60_000)
    await expect(checkedOption(page)).toHaveText(`Opened link (${LINK_ID})`)
    await expect(duration(page)).toHaveValue('1200')
    await expect(select(page)).toHaveAttribute('data-edited', 'false')

    await duration(page).fill('900')
    await expect(checkedOption(page)).toHaveText(`Opened link (${LINK_ID}) (edited)`)
    await expect(select(page)).toHaveAttribute('data-edited', 'true')

    await duration(page).fill('1200')
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
  })
})

test.describe('discard confirm', () => {
  test('cancelling keeps the edits, the selection and focus on the select, and sends no run', async ({ page }) => {
    await openPausedPage(page)
    const posts = track(page, isSimulatePost)
    const dialogs: { type: string; message: string }[] = []
    page.once('dialog', async (dialog) => {
      dialogs.push({ type: dialog.type(), message: dialog.message() })
      await dialog.dismiss()
    })
    const edited = `${DEFAULT.text}\n`
    await textarea(page).fill(edited)
    await duration(page).fill('900')
    await expect(select(page)).toHaveAttribute('data-edited', 'true')

    await select(page).selectOption({ label: OTHER.name })
    await expect.poll(() => dialogs).toEqual([{ type: 'confirm', message: `Discard your edits to "${DEFAULT.name}"?` }])
    await expect(select(page)).toHaveValue(`template:${DEFAULT.name}`)
    await expect(checkedOption(page)).toHaveText(`${DEFAULT.name} (edited)`)
    await expect(textarea(page)).toHaveValue(edited)
    await expect(duration(page)).toHaveValue('900')
    await expect(select(page)).toBeFocused()
    await page.waitForTimeout(500)
    expect(posts).toHaveLength(0)
  })

  test('accepting replaces the text with the other build and clears the marker', async ({ page }) => {
    await openPausedPage(page)
    expect(OTHER.text).not.toBe(DEFAULT.text)
    page.once('dialog', (dialog) => dialog.accept())
    await textarea(page).fill(`${DEFAULT.text}\n`)
    await select(page).selectOption({ label: OTHER.name })
    await expect(textarea(page)).toHaveValue(OTHER.text)
    await expect(checkedOption(page)).toHaveText(OTHER.name)
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
  })

  test('choosing another entry while unedited raises no dialog', async ({ page }) => {
    await openPage(page)
    const dialogs: string[] = []
    page.on('dialog', async (dialog) => {
      dialogs.push(`${dialog.type()}: ${dialog.message()}`)
      await dialog.accept()
    })
    await waitForRun(page, () => select(page).selectOption({ label: OTHER.name }))
    await expect(textarea(page)).toHaveValue(OTHER.text)
    expect(dialogs).toEqual([])
  })
})

test.describe('unload guard', () => {
  const trackDialogs = (page: Page) => {
    const types: string[] = []
    page.on('dialog', (dialog) => types.push(dialog.type()))
    return types
  }

  test('reloading an edited page raises beforeunload and the page comes back with the template text', async ({ page }) => {
    await openPage(page)
    const dialogs = trackDialogs(page)
    await textarea(page).fill(`${DEFAULT.text}\n`)
    await expect(select(page)).toHaveAttribute('data-edited', 'true')
    acceptBeforeUnload(page)
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(textarea(page)).toHaveValue(DEFAULT.text)
    expect(dialogs).toEqual(['beforeunload'])
  })

  test('reloading an unedited page raises no dialog', async ({ page }) => {
    await openPage(page)
    const dialogs = trackDialogs(page)
    acceptBeforeUnload(page)
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    expect(dialogs).toEqual([])
  })

  test('reloading after editing and restoring the text raises no dialog', async ({ page }) => {
    await openPage(page)
    const dialogs = trackDialogs(page)
    await textarea(page).fill(`${DEFAULT.text}\n`)
    await expect(select(page)).toHaveAttribute('data-edited', 'true')
    await textarea(page).fill(DEFAULT.text)
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
    acceptBeforeUnload(page)
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    expect(dialogs).toEqual([])
  })
})

test.describe('opening ?n=', () => {
  test('an id that is not in My builds opens as a shared build under Opened links and runs once', async ({ page }) => {
    expect(REMOTE_FORMATTED).not.toBe(DEFAULT.text)
    await page.route(isNamedUrl, (route) => fulfillJson(route, 200, namedBody(SHARED_ID, 'Shared one')))
    const posts = track(page, isSimulatePost)
    await page.goto(`${AOE4_PAGE}?n=${SHARED_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(page)).toHaveText('Shared one (shared)')
    await expect(groupOptions(page, 'Opened links')).toHaveText(['Shared one (shared)'])
    await expect(textarea(page)).toHaveValue(REMOTE_FORMATTED)
    await expect(duration(page)).toHaveValue('900')
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 500)
    expect(posts).toHaveLength(1)
    expect(page.url()).toMatch(new RegExp(`\\?n=${SHARED_ID}$`))
  })

  test('an id in My builds opens under My builds with its stored name', async ({ page }) => {
    await seedTwo(page)
    await page.route(isNamedUrl, (route) => fulfillJson(route, 200, namedBody(NEWER_ID, 'Name on the server')))
    await page.goto(`${AOE4_PAGE}?n=${NEWER_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(page)).toHaveText(NEWER.name)
    await expect(groupOptions(page, 'My builds')).toHaveText([NEWER.name, OLDER.name])
    await expect(groupOptions(page, 'Opened links')).toHaveCount(0)
    await expect(textarea(page)).toHaveValue(REMOTE_FORMATTED)
  })

  test('n wins over b: the b build is never requested and the address ends with n only', async ({ page }) => {
    await page.route(isNamedUrl, (route) => fulfillJson(route, 200, namedBody(SHARED_ID, 'Shared one')))
    const buildGets = track(page, isBuildGet)
    await page.goto(`${AOE4_PAGE}?n=${SHARED_ID}&b=${LINK_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(page)).toHaveText('Shared one (shared)')
    await expect.poll(() => page.url()).toMatch(new RegExp(`\\?n=${SHARED_ID}$`))
    expect(buildGets).toHaveLength(0)
  })

  const failures = [
    { name: 'a 404', reply: 404, message: 'That saved build was not found. Showing the default build.' },
    { name: 'a 500', reply: 500, message: 'That saved build could not be loaded. Showing the default build.' },
  ]
  for (const { name, reply, message } of failures) {
    test(`${name} shows the load message, keeps the default template and leaves the address as typed`, async ({ page }) => {
      await page.route(isNamedUrl, (route) => fulfillJson(route, reply, { error: 'nope' }))
      const posts = track(page, isSimulatePost)
      await page.goto(`${AOE4_PAGE}?n=${SHARED_ID}`)
      await expect(status(page)).toHaveAttribute('data-status', 'current')
      await expect(loadError(page)).toHaveText(message)
      await expect(select(page)).toHaveValue(`template:${DEFAULT.name}`)
      expect(await groupLabels(page)).toEqual(['Templates'])
      await expect(textarea(page)).toHaveValue(DEFAULT.text)
      await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
      expect(posts).toHaveLength(1)
      expect(page.url()).toMatch(new RegExp(`\\?n=${SHARED_ID}$`))
    })
  }

  test('the load holds the first run and disables the controls until the response lands, then runs once', async ({ page, gate }) => {
    await page.route(isNamedUrl, async (route) => {
      await gate.opened
      await fulfillJson(route, 200, namedBody(SHARED_ID, 'Shared one')).catch(() => {})
    })
    const posts = track(page, isSimulatePost)
    await page.goto(`${AOE4_PAGE}?n=${SHARED_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'loading')
    for (const locator of [select(page), duration(page), textarea(page), saveButton(page)]) {
      await expect(locator).toBeDisabled()
      await expect(locator).toHaveAttribute('aria-busy', 'true')
    }
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(posts).toHaveLength(0)

    gate.open()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(posts).toHaveLength(1)
    await expect(select(page)).toBeEnabled()
  })

  test('leaving during the load aborts the request without a console error', async ({ page, gate }) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route(isNamedUrl, async (route) => {
      await gate.opened
      await fulfillJson(route, 200, namedBody(SHARED_ID, 'Shared one')).catch(() => {})
    })
    const gets = track(page, isNamedGet)
    const failed = track(page, isNamedGet, 'requestfailed')
    await page.goto(`${AOE4_PAGE}?n=${SHARED_ID}`)
    await expect.poll(() => gets.length).toBe(1)
    await expect(status(page)).toHaveAttribute('data-status', 'loading')

    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => failed.map((r) => r.url())).toEqual([expect.stringContaining(`${NAMED_PATH}/${SHARED_ID}`)])
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })
})

test.describe('entry list merge', () => {
  test('a load result that lands after the My builds read keeps both stored names and adds the shared build', async ({ page, gate }) => {
    await seedTwo(page)
    await page.route(isNamedUrl, async (route) => {
      await gate.opened
      await fulfillJson(route, 200, namedBody(SHARED_ID, 'Shared one')).catch(() => {})
    })
    await page.goto(`${AOE4_PAGE}?n=${SHARED_ID}`)
    await expect(groupOptions(page, 'My builds')).toHaveCount(2)
    await expect(status(page)).toHaveAttribute('data-status', 'loading')

    gate.open()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(groupOptions(page, 'My builds')).toHaveText([NEWER.name, OLDER.name])
    await expect(groupOptions(page, 'Opened links')).toHaveText(['Shared one (shared)'])
    await expect(checkedOption(page)).toHaveText('Shared one (shared)')
  })
})

test.describe('not busy before the router is ready', () => {
  test('the select is never aria-busy or disabled from DOMContentLoaded until the first run ends', async ({ page }) => {
    await page.addInitScript(() => {
      const records: { busy: string | null; disabled: boolean }[] = []
      ;(window as unknown as { __selectRecords: typeof records }).__selectRecords = records
      document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('build-order-select') as HTMLSelectElement
        const snap = () => records.push({ busy: el.getAttribute('aria-busy'), disabled: el.disabled })
        snap()
        new MutationObserver(snap).observe(el, { attributes: true, attributeFilter: ['aria-busy', 'disabled'] })
      })
    })
    await page.goto(AOE4_PAGE)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    const records = await page.evaluate(() => (window as unknown as { __selectRecords: unknown[] }).__selectRecords)
    expect(records.length).toBeGreaterThanOrEqual(1)
    expect(records.filter((record) => (record as { busy: string | null }).busy === 'true' || (record as { disabled: boolean }).disabled)).toEqual([])
  })
})

test.describe('choosing a My builds entry', () => {
  type Reply = { status: number; body: unknown }
  const CHOSEN_NAME = 'Name on the server'

  async function openWithStub(page: Page, gate: Gate) {
    await seedTwo(page)
    const sim: { reply: Reply } = { reply: { status: 200, body: namedBody(OLDER_ID, CHOSEN_NAME) } }
    await page.route(isNamedUrl, async (route) => {
      await gate.opened
      await fulfillJson(route, sim.reply.status, sim.reply.body).catch(() => {})
    })
    await openPage(page)
    await expect(groupOptions(page, 'My builds')).toHaveCount(2)
    return sim
  }

  test('the page is busy while the response is held, then shows the fetched text and runs once', async ({ page, gate }) => {
    await openWithStub(page, gate)
    const before = await textarea(page).inputValue()
    expect(before).not.toBe(REMOTE_FORMATTED)
    const posts = track(page, isSimulatePost)

    await select(page).selectOption({ label: OLDER.name })
    for (const locator of [select(page), duration(page), textarea(page), saveButton(page)]) {
      await expect(locator).toBeDisabled()
      await expect(locator).toHaveAttribute('aria-busy', 'true')
    }
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(posts).toHaveLength(0)

    gate.open()
    await expect(textarea(page)).toHaveValue(REMOTE_FORMATTED)
    await expect(checkedOption(page)).toHaveText(OLDER.name)
    await expect(duration(page)).toHaveValue('900')
    await expect(select(page)).toBeEnabled()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(posts).toHaveLength(1)
    expect(page.url()).toMatch(new RegExp(`\\?n=${OLDER_ID}$`))
  })

  const failures = [
    { name: 'a 404', reply: 404, message: 'That build was not found. The current build is unchanged.' },
    { name: 'a 500', reply: 500, message: 'That build could not be loaded. The current build is unchanged.' },
  ]
  for (const { name, reply, message } of failures) {
    test(`${name} shows its message, keeps the current build and the next successful choose clears it`, async ({ page, gate }) => {
      const sim = await openWithStub(page, gate)
      gate.open()
      sim.reply = { status: reply, body: { error: 'nope' } }
      await select(page).selectOption({ label: OLDER.name })
      await expect(loadError(page)).toHaveText(message)
      await expect(textarea(page)).toHaveValue(DEFAULT.text)
      await expect(checkedOption(page)).toHaveText(DEFAULT.name)
      await expect(select(page)).toBeEnabled()

      sim.reply = { status: 200, body: namedBody(OLDER_ID, CHOSEN_NAME) }
      await select(page).selectOption({ label: OLDER.name })
      await expect(textarea(page)).toHaveValue(REMOTE_FORMATTED)
      await expect(loadError(page)).toHaveCount(0)
    })
  }
})

test.describe('the pinned label for an opened link', () => {
  test('pinning a run opened through ?b= reads the stored name without the id', async ({ page }) => {
    await page.route(isBuildUrl, (route) =>
      fulfillJson(route, 200, { version: 1, id: LINK_ID, buildOrder: REMOTE_ORDER('Opened link'), durationSeconds: 1200 }),
    )
    await page.goto(`${AOE4_PAGE}?b=${LINK_ID}`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(page)).toHaveText(`Opened link (${LINK_ID})`)
    await showTab(page, 'results')
    await page.getByTestId('pin-run').click()
    await expect(page.getByTestId('pinned-label')).toHaveText('Pinned: Opened link, 20:00')
  })
})
