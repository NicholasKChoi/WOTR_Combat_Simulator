import { expect, type Locator, type Page, type Request, type Route } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../lib/aoe4-build-order/parse-text'
import { AUTO_RUN_DEBOUNCE_MS } from '../components/apps/aoe4-build-order/auto-run'
import { MY_BUILDS_STORAGE_KEY } from '../components/apps/aoe4-build-order/my-builds-storage'
import {
  AOE4_PAGE,
  BUILDS_PATH,
  NAMED_BUILDS_PATH,
  SIMULATE_PATH,
  acceptBeforeUnload,
  blockStorageWrites,
  buildOrderFrom,
  copyButton,
  copyForm,
  copyName,
  copySubmit,
  type Created,
  editedCopy,
  gatedTest,
  type Gate,
  holdNextSimulate,
  holdRequests,
  isNamedPath,
  isNamedPost,
  isNamedPut,
  isSimulatePost,
  namedBuildUrl,
  openPage,
  REFUSED_CLIPBOARDS,
  reply,
  saveCopy,
  showTab,
  submitCopy,
  stubNamed,
  uniqueClient,
  waitForRun,
} from './helpers'

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

const test = gatedTest('aoe4-my-builds')

const status = (page: Page) => page.getByTestId('auto-run-status')
const textarea = (page: Page) => page.getByTestId('build-order-text')
const duration = (page: Page) => page.getByTestId('duration-seconds')
const select = (page: Page) => page.getByTestId('build-order-select')
const saveButton = (page: Page) => page.getByTestId('save-build')
const loadError = (page: Page) => page.getByTestId('saved-build-error')
const checkedOption = (page: Page) => select(page).locator('option:checked')
const groupOptions = (page: Page, group: string) => select(page).locator(`optgroup[label="${group}"] option`)
const groupLabels = (page: Page) => select(page).locator('optgroup').evaluateAll((groups) => groups.map((g) => g.getAttribute('label')))

async function expectLockedWithoutRun(page: Page, posts: Request[]) {
  for (const locator of [select(page), duration(page), textarea(page), copyButton(page)]) {
    await expect(locator).toBeDisabled()
    await expect(locator).toHaveAttribute('aria-busy', 'true')
  }
  await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
  expect(posts).toHaveLength(0)
}

const isNamedGet = (r: Request) => new URL(r.url()).pathname.startsWith(`${NAMED_BUILDS_PATH}/`) && r.method() === 'GET'
const isNamedUrl = (url: URL) => url.pathname.startsWith(`${NAMED_BUILDS_PATH}/`)
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
    await expectLockedWithoutRun(page, posts)

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
    await expect.poll(() => failed.map((r) => r.url())).toEqual([expect.stringContaining(`${NAMED_BUILDS_PATH}/${SHARED_ID}`)])
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
    await expectLockedWithoutRun(page, posts)

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

const PHONE = { width: 390, height: 844 }
const VALID_A = REMOTE_TEXT
const VALID_B = ['start -> sheep', 'produce spearman from barracks'].join('\n')
const UNKNOWN_UNIT = ['start -> sheep', 'produce knigt from stable'].join('\n')
const N_LINK = new RegExp(`^http://localhost:\\d+${AOE4_PAGE.replaceAll('/', '\\/')}\\?n=[A-Za-z0-9_-]{22}$`)
const NAME_ERROR = 'Enter a name of 1 to 100 characters.'
const UNSTORED = 'This browser could not store the edit key, so you can edit this build only until you close the page.'
const CONFLICT = 'This build changed somewhere else. Choose it again to get the latest version, or save a copy.'
const FORBIDDEN = 'You cannot edit this build here. Save a copy instead.'
const GONE = 'This build no longer exists. Save a copy instead.'
const GENERIC = 'The build could not be saved. Try again.'

const copyCancel = (page: Page) => page.getByTestId('save-copy-cancel')
const nameError = (page: Page) => page.getByTestId('save-copy-name-error')
const savedLink = (page: Page) => page.getByTestId('saved-build-link')
const copyLink = (page: Page) => page.getByTestId('copy-saved-link')
const saveError = (page: Page) => page.getByTestId('save-build-error')
const unstored = (page: Page) => page.getByTestId('my-builds-unavailable')
const opacity = (locator: Locator) => locator.evaluate((el) => Number(getComputedStyle(el).opacity))

const isSnapshotPost = (r: Request) => new URL(r.url()).pathname.startsWith(BUILDS_PATH) && r.method() === 'POST'
const isSimulateUrl = (url: URL) => url.pathname === SIMULATE_PATH
const json = (value: unknown): unknown => JSON.parse(JSON.stringify(value))
const stepsOf = (text: string) => json(buildOrderFrom(text).steps)
const nQuery = (page: Page) => new URL(page.url()).searchParams.get('n')

interface Stored {
  id: string
  name: string
  editSecret: string
  revision: number
  updatedAt: string
}

const storedRaw = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), MY_BUILDS_STORAGE_KEY)

async function storedBuild(page: Page, id: string): Promise<Stored | undefined> {
  const raw = await storedRaw(page)
  return raw === null ? undefined : (JSON.parse(raw) as { builds: Stored[] }).builds.find((build) => build.id === id)
}

async function saveVersion(page: Page) {
  const responded = page.waitForResponse((r) => isNamedPut(r.request()))
  await saveButton(page).click()
  const response = await responded
  return { request: response.request(), status: response.status(), body: (await response.json()) as Created }
}

async function holdCopy(page: Page, name: string): Promise<{ release: () => void; posts: Request[] }> {
  const release = await holdRequests(page, NAMED_BUILDS_PATH, 'POST')
  const posts = track(page, isNamedPost)
  await submitCopy(page, name)
  await expect.poll(() => posts.length).toBe(1)
  return { release, posts }
}

// `beforeClick` runs with the hold already active, so a copy saved there must pass the PUT-only hold.
async function holdVersion(page: Page, beforeClick?: () => Promise<unknown>): Promise<{ release: () => void }> {
  const release = await holdRequests(page, namedBuildUrl('*'), 'PUT')
  await beforeClick?.()
  const puts = track(page, isNamedPut)
  await saveButton(page).click()
  await expect.poll(() => puts.length).toBe(1)
  return { release }
}

async function releaseAndAwait(page: Page, release: () => void, matches: (r: Request) => boolean) {
  const responded = page.waitForResponse((r) => matches(r.request()))
  release()
  return responded
}

async function expectSelectedText(locator: Locator) {
  const selection = await locator.evaluate((el) => {
    const input = el as HTMLInputElement
    return { start: input.selectionStart, end: input.selectionEnd, length: input.value.length }
  })
  expect(selection.length).toBeGreaterThan(0)
  expect([selection.start, selection.end]).toEqual([0, selection.length])
}

const settle = (page: Page) => page.clock.runFor(AUTO_RUN_DEBOUNCE_MS + 1)

test.describe('Save as copy', () => {
  test('from a template it creates a named build, selects it, keeps other query keys and never posts a snapshot', async ({ page }) => {
    const snapshots = track(page, isSnapshotPost)
    await page.goto(`${AOE4_PAGE}?utm=1`)
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(copyButton(page)).toBeEnabled()
    await expect(copyButton(page)).toHaveText('Save as copy')
    await expect(saveButton(page)).toHaveCount(0)

    await copyButton(page).click()
    await expect(copyForm(page)).toHaveAttribute('role', 'group')
    await expect(copyName(page)).toHaveValue(`${DEFAULT.name} (copy)`)
    expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid)).toBe('save-copy-name')
    await expectSelectedText(copyName(page))
    await expect(copySubmit(page)).toHaveText('Save copy')
    await expect(copyCancel(page)).toHaveText('Cancel')

    await copyName(page).fill('First copy')
    const responded = page.waitForResponse((r) => isNamedPost(r.request()))
    await copySubmit(page).click()
    const response = await responded
    expect(response.status()).toBe(201)
    const body = response.request().postDataJSON() as { buildOrder: { name: string }; durationSeconds: number }
    expect([body.buildOrder.name, body.durationSeconds]).toEqual(['First copy', 1200])
    const created = (await response.json()) as Created

    await expect(copyForm(page)).toHaveCount(0)
    await expect(checkedOption(page)).toHaveText('First copy')
    await expect(groupOptions(page, 'My builds')).toHaveText(['First copy'])
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
    await expect(savedLink(page)).toHaveValue(N_LINK)
    await expect(savedLink(page)).toBeFocused()
    await expect.poll(() => nQuery(page)).toBe(created.id)
    const query = new URL(page.url()).searchParams
    expect([query.get('utm'), query.has('b')]).toEqual(['1', false])
    expect(created.id).toMatch(/^[A-Za-z0-9_-]{22}$/)
    const stored = await storedBuild(page, created.id)
    expect(stored?.revision).toBe(1)
    expect(stored?.editSecret).toHaveLength(43)
    expect(snapshots).toHaveLength(0)
  })

  test('name rules: empty, blank and 101 characters are refused with the error', async ({ page }) => {
    await openPage(page)
    await copyButton(page).click()
    for (const name of ['', '   ', 'x'.repeat(101)]) {
      await copyName(page).fill(name)
      await expect(copySubmit(page)).toBeDisabled()
      await expect(nameError(page)).toHaveText(NAME_ERROR)
      await expect(copyName(page)).toHaveAttribute('aria-invalid', 'true')
      await expect(copyName(page)).toHaveAttribute('aria-describedby', 'save-copy-name-error')
    }
    await copyName(page).fill('x'.repeat(100))
    await expect(copySubmit(page)).toBeEnabled()
    await expect(nameError(page)).toHaveCount(0)
    await expect(copyName(page)).not.toHaveAttribute('aria-invalid')
  })

  test('a 100-character name is posted as is', async ({ page }) => {
    await openPage(page)
    const { request } = await saveCopy(page, 'y'.repeat(100))
    expect((request.postDataJSON() as { buildOrder: { name: string } }).buildOrder.name).toBe('y'.repeat(100))
  })

  test('Enter submits a padded name trimmed, with no run and no page load', async ({ page }) => {
    await openPage(page)
    const runs = track(page, isSimulatePost)
    let loads = 0
    page.on('load', () => (loads += 1))
    await copyButton(page).click()
    await copyName(page).fill('  Padded name  ')
    const responded = page.waitForResponse((r) => isNamedPost(r.request()))
    await copyName(page).press('Enter')
    const response = await responded
    expect((response.request().postDataJSON() as { buildOrder: { name: string } }).buildOrder.name).toBe('Padded name')
    await expect(checkedOption(page)).toHaveText('Padded name')
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    expect(runs).toHaveLength(0)
    expect(loads).toBe(0)
    expect(new URL(page.url()).pathname).toBe(AOE4_PAGE)
  })

  test('Escape closes the form and focuses Save as copy, and Tab goes name, submit, cancel', async ({ page }) => {
    await openPage(page)
    await copyButton(page).click()
    await expect(copyName(page)).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(copySubmit(page)).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(copyCancel(page)).toBeFocused()
    await copyName(page).focus()
    await page.keyboard.press('Escape')
    await expect(copyForm(page)).toHaveCount(0)
    await expect(copyButton(page)).toBeFocused()
  })

  test('Enter in the duration field runs the build and never saves; Enter and Space on Save as copy open the form', async ({ page }) => {
    await openPage(page)
    const posts = track(page, isNamedPost)
    const byEnter = await waitForRun(page, async () => {
      await duration(page).fill('900')
      await duration(page).press('Enter')
    })
    expect((byEnter.request().postDataJSON() as { inputs: unknown }).inputs).toEqual({ durationSeconds: 900 })
    await expect(copyForm(page)).toHaveCount(0)

    await copyButton(page).focus()
    await page.keyboard.press('Enter')
    await expect(copyForm(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(copyForm(page)).toHaveCount(0)
    await page.keyboard.press('Space')
    await expect(copyForm(page)).toBeVisible()
    await page.waitForTimeout(300)
    expect(posts).toHaveLength(0)
  })

  test('the open form follows the input: an invalid build disables submit, a restored one posts its order', async ({ page }) => {
    await openPage(page)
    page.on('dialog', (dialog) => dialog.accept())
    await copyButton(page).click()
    await copyName(page).fill('Typed name')
    await expect(copySubmit(page)).toBeEnabled()

    await textarea(page).fill(UNKNOWN_UNIT)
    await expect(status(page)).toHaveAttribute('data-status', 'invalid')
    await expect(copySubmit(page)).toBeDisabled()
    await expect(copyForm(page)).toBeVisible()
    await expect(copyName(page)).toHaveValue('Typed name')

    await waitForRun(page, () => textarea(page).fill(VALID_A))
    await expect(copySubmit(page)).toBeEnabled()
    const responded = page.waitForResponse((r) => isNamedPost(r.request()))
    await copySubmit(page).click()
    const posted = (await responded).request().postDataJSON() as { buildOrder: { name: string; steps: unknown } }
    expect(posted.buildOrder.name).toBe('Typed name')
    expect(posted.buildOrder.steps).toEqual(stepsOf(VALID_A))

    await copyButton(page).click()
    await expect(copyForm(page)).toBeVisible()
    await select(page).selectOption({ label: OTHER.name })
    await expect(textarea(page)).toHaveValue(OTHER.text)
    await expect(copyForm(page)).toHaveCount(0)
  })

  test('a failed copy closes the form, shows the error and the next open prefills the entry name again', async ({ page }) => {
    await openPage(page)
    await stubNamed(page, 'POST', reply(503))
    await submitCopy(page, 'Typed before')
    await expect(saveError(page)).toHaveText('Saving is unavailable right now. Try again later.')
    await expect(saveError(page)).toHaveAttribute('role', 'alert')
    await expect(copyForm(page)).toHaveCount(0)
    await page.waitForTimeout(300)
    await expect(copyForm(page)).toHaveCount(0)
    await copyButton(page).click()
    await expect(copyName(page)).toHaveValue(`${DEFAULT.name} (copy)`)
  })
})

test.describe('Save as copy needs a current result', () => {
  interface Row {
    name: string
    drive: (page: Page) => Promise<(() => unknown) | undefined>
    expected: string | RegExp
    restore: (page: Page) => Promise<unknown>
  }
  const restoreText = (page: Page) => textarea(page).fill(VALID_B)
  const stubRun = async (page: Page, respond: (route: Route) => Promise<void>) => {
    await page.route(isSimulateUrl, respond)
    await textarea(page).fill(VALID_A)
    return () => page.unroute(isSimulateUrl, respond)
  }
  const rows: Row[] = [
    {
      name: 'text with an unknown unit id',
      drive: async (page) => {
        await textarea(page).fill(UNKNOWN_UNIT)
        return undefined
      },
      expected: 'invalid',
      restore: restoreText,
    },
    {
      name: 'a duration below the minimum',
      drive: async (page) => {
        await duration(page).fill('59')
        return undefined
      },
      expected: 'invalid',
      restore: (page) => duration(page).fill('900'),
    },
    {
      name: 'a simulate response still pending',
      drive: async (page) => {
        const release = await holdNextSimulate(page)
        await textarea(page).fill(VALID_A)
        return release
      },
      expected: /^(running|updating)$/,
      restore: restoreText,
    },
    { name: 'a failed run', drive: (page) => stubRun(page, reply(500, { error: 'boom' })), expected: 'failed', restore: restoreText },
    {
      name: 'a rejected run',
      drive: (page) => stubRun(page, reply(400, { error: 'bad', issues: [{ code: 'syntax', message: 'first problem' }] })),
      expected: 'rejected',
      restore: restoreText,
    },
  ]

  for (const row of rows) {
    test(`${row.name} disables Save as copy and a restored input enables it again`, async ({ page }) => {
      await openPage(page)
      await expect(copyButton(page)).toBeEnabled()
      expect(await opacity(copyButton(page))).toBe(1)
      const posts = track(page, isNamedPost)

      const undo = await row.drive(page)
      await expect(status(page)).toHaveAttribute('data-status', row.expected)
      await expect(copyButton(page)).toBeDisabled()
      expect(await opacity(copyButton(page))).toBeLessThan(1)
      await copyButton(page).click({ force: true })
      await expect(copyForm(page)).toHaveCount(0)

      await undo?.()
      await waitForRun(page, () => row.restore(page))
      await expect(copyButton(page)).toBeEnabled()
      expect(await opacity(copyButton(page))).toBe(1)
      expect(posts).toHaveLength(0)
    })
  }
})

test.describe('reopening and new versions', () => {
  test('after a reload the copy is under My builds and choosing it offers Save a new version once edited', async ({ page }) => {
    await openPage(page)
    const { created } = await saveCopy(page, 'Reload me')
    await expect(savedLink(page)).toBeVisible()
    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(groupOptions(page, 'My builds')).toHaveText(['Reload me'])

    await waitForRun(page, () => select(page).selectOption({ label: OTHER.name }))
    const gets = track(page, isNamedGet)
    await waitForRun(page, () => select(page).selectOption({ label: 'Reload me' }))
    await expect(textarea(page)).toHaveValue(DEFAULT.text)
    expect(gets.map((r) => new URL(r.url()).pathname)).toEqual([namedBuildUrl(created.id)])
    await expect(saveButton(page)).toHaveText('Save a new version')
    await expect(saveButton(page)).toBeDisabled()
    await textarea(page).fill(VALID_A)
    await expect(saveButton(page)).toBeEnabled()
  })

  test('Save a new version sends the secret only as the header, bumps the revision and never posts a snapshot', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))
    page.on('pageerror', (e) => messages.push(e.message))
    const snapshots = track(page, isSnapshotPost)
    const created = await editedCopy(page, 'Versioned')
    await expect(select(page)).toHaveAttribute('data-edited', 'true')
    const secret = (await storedBuild(page, created.id))!.editSecret

    const first = await saveVersion(page)
    expect(first.status).toBe(200)
    const headers = await first.request.allHeaders()
    expect([headers.authorization, headers['if-match']]).toEqual([`Bearer ${secret}`, '"1"'])
    expect((first.request.postDataJSON() as { buildOrder: { name: string } }).buildOrder.name).toBe('Versioned')
    await expect(checkedOption(page)).toHaveText('Versioned')
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
    await expect(saveButton(page)).toBeDisabled()
    await expect(savedLink(page)).toHaveValue(N_LINK)
    const stored = await storedBuild(page, created.id)
    expect([stored?.revision, stored?.updatedAt]).toEqual([2, first.body.updatedAt])
    expect(new URL(page.url()).search).toBe(`?n=${created.id}`)

    await waitForRun(page, () => textarea(page).fill(VALID_B))
    const second = await saveVersion(page)
    expect(second.status).toBe(200)
    expect((await second.request.allHeaders())['if-match']).toBe('"2"')

    expect(page.url()).not.toContain(secret)
    expect(await page.content()).not.toContain(secret)
    expect(messages.filter((m) => m.includes(secret))).toEqual([])
    expect(snapshots).toHaveLength(0)
  })

  test('a fresh context opens the n link read-only as shared, and its copy leaves the original unchanged', async ({ page, browser, baseURL, request }) => {
    await openPage(page)
    const { created } = await saveCopy(page, 'Made elsewhere')
    const context = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': uniqueClient('aoe4-my-builds-fresh') } })
    try {
      const fresh = await context.newPage()
      await fresh.goto(`${AOE4_PAGE}?n=${created.id}`)
      await expect(status(fresh)).toHaveAttribute('data-status', 'current')
      await expect(checkedOption(fresh)).toHaveText('Made elsewhere (shared)')
      await expect(groupOptions(fresh, 'Opened links')).toHaveText(['Made elsewhere (shared)'])
      await expect(saveButton(fresh)).toHaveCount(0)
      await expect(copyButton(fresh)).toBeEnabled()

      await waitForRun(fresh, () => textarea(fresh).fill(VALID_A))
      const { created: copy } = await saveCopy(fresh, 'Copy elsewhere')
      expect(copy.id).not.toBe(created.id)
      expect((await storedBuild(fresh, copy.id))?.editSecret).toHaveLength(43)
      const original = (await (await request.get(namedBuildUrl(created.id))).json()) as { buildOrder: { steps: unknown } }
      expect(original.buildOrder.steps).toEqual(stepsOf(DEFAULT.text))
    } finally {
      await context.close()
    }
  })

  test('a second tab that saved first makes the update fail with the conflict and locks Save a new version', async ({ page, context, request }) => {
    const created = await editedCopy(page, 'Two tabs')
    const other = await context.newPage()
    await other.goto(`${AOE4_PAGE}?n=${created.id}`)
    await expect(status(other)).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(other)).toHaveText('Two tabs')

    expect((await saveVersion(page)).status).toBe(200)
    await waitForRun(other, () => textarea(other).fill(VALID_B))
    await expect(saveButton(other)).toBeEnabled()
    expect((await saveVersion(other)).status).toBe(412)
    await expect(saveError(other)).toHaveText(CONFLICT)
    await expect(saveButton(other)).toBeDisabled()
    await expect(copyButton(other)).toBeEnabled()
    const kept = (await (await request.get(namedBuildUrl(created.id))).json()) as { buildOrder: { steps: unknown } }
    expect(kept.buildOrder.steps).toEqual(stepsOf(VALID_A))

    other.once('dialog', (dialog) => dialog.accept())
    await waitForRun(other, () => select(other).selectOption({ label: OTHER.name }))
    await select(other).selectOption({ label: 'Two tabs' })
    await expect(textarea(other)).toHaveValue(REMOTE_FORMATTED)
    await expect(saveButton(other)).toBeDisabled()
    await textarea(other).fill(VALID_B)
    await expect(saveButton(other)).toBeEnabled()
  })

  test('a copy saved in one tab appears under My builds in another without changing its selection', async ({ page, context }) => {
    await openPage(page)
    await saveCopy(page, 'Tab B build')
    await waitForRun(page, () => textarea(page).fill(VALID_A))
    await expect(checkedOption(page)).toHaveText('Tab B build (edited)')

    const other = await context.newPage()
    await openPage(other)
    await saveCopy(other, 'From tab A')
    await expect(groupOptions(page, 'My builds')).toHaveText(['From tab A', 'Tab B build (edited)'])
    await expect(checkedOption(page)).toHaveText('Tab B build (edited)')
    await expect(textarea(page)).toHaveValue(VALID_A)
  })

  test('another tab changing an unrelated key leaves My builds, and clearing storage there removes them', async ({ page, context }) => {
    await seedTwo(page)
    await openPage(page)
    await expect(groupOptions(page, 'My builds')).toHaveText([NEWER.name, OLDER.name])

    const other = await context.newPage()
    await openPage(other)
    await other.evaluate(() => window.localStorage.setItem('unrelated-key', 'x'))
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)))
    await expect(groupOptions(page, 'My builds')).toHaveText([NEWER.name, OLDER.name])

    await other.evaluate(() => window.localStorage.clear())
    await expect(groupOptions(page, 'My builds')).toHaveCount(0)
    await expect(groupOptions(page, 'Templates')).toHaveText(BUILDS.map((b) => b.name))
  })
})

test.describe('save failures', () => {
  interface Row {
    method: 'POST' | 'PUT'
    name: string
    respond: (route: Route) => Promise<void>
    text: string
  }
  const issue = { error: 'bad', issues: [{ code: 'out-of-range', message: 'name: 117 characters, more than 100' }] }
  const rows: Row[] = [
    { method: 'PUT', name: '403', respond: reply(403), text: FORBIDDEN },
    { method: 'PUT', name: '404', respond: reply(404), text: GONE },
    { method: 'PUT', name: '400 with an issue', respond: reply(400, issue), text: 'The build could not be saved: name: 117 characters, more than 100' },
    { method: 'PUT', name: '413', respond: reply(413), text: 'The build is too large to save.' },
    { method: 'PUT', name: '429 with Retry-After 90', respond: reply(429, { error: 'rate' }, { 'Retry-After': '90' }), text: 'Too many saves. Try again in 2 minutes.' },
    { method: 'PUT', name: '503', respond: reply(503), text: 'Saving is unavailable right now. Try again later.' },
    { method: 'PUT', name: '500', respond: reply(500), text: GENERIC },
    { method: 'PUT', name: 'an aborted request', respond: (route) => route.abort(), text: GENERIC },
    { method: 'POST', name: '400 with an issue', respond: reply(400, issue), text: 'The build could not be saved: name: 117 characters, more than 100' },
    { method: 'POST', name: '429 with Retry-After 5', respond: reply(429, { error: 'rate' }, { 'Retry-After': '5' }), text: 'Too many saves. Try again in 5 seconds.' },
    { method: 'POST', name: '503', respond: reply(503), text: 'Saving is unavailable right now. Try again later.' },
  ]

  for (const row of rows) {
    test(`a ${row.method} answered by ${row.name} shows its message and changes nothing`, async ({ page }) => {
      await editedCopy(page, 'Failing build')
      const attempt = () => (row.method === 'PUT' ? saveButton(page).click() : submitCopy(page, 'Failing copy'))
      const before = { text: await textarea(page).inputValue(), option: await checkedOption(page).textContent(), stored: await storedRaw(page) }

      let unroute = await stubNamed(page, row.method, row.respond)
      await attempt()
      await expect(saveError(page)).toHaveText(row.text)
      await expect(copyButton(page)).toBeEnabled()
      expect({ text: await textarea(page).inputValue(), option: await checkedOption(page).textContent(), stored: await storedRaw(page) }).toEqual(before)

      await unroute()
      if (row.method === 'PUT') expect((await saveVersion(page)).status).toBe(200)
      else await saveCopy(page)
      await expect(saveError(page)).toHaveCount(0)

      await waitForRun(page, () => textarea(page).fill(VALID_B))
      unroute = await stubNamed(page, row.method, row.respond)
      await attempt()
      await expect(saveError(page)).toHaveText(row.text)
      await waitForRun(page, () => textarea(page).fill(VALID_A))
      await expect(saveError(page)).toHaveCount(0)
      await unroute()
    })
  }
})

test.describe('storage unavailable', () => {
  test('a copy still saves, warns, and can be versioned in this page, but is gone after a reload', async ({ page }) => {
    await blockStorageWrites(page)
    await openPage(page)
    const { created } = await saveCopy(page, 'Unstored')
    await expect(checkedOption(page)).toHaveText('Unstored')
    await expect(savedLink(page)).toBeVisible()
    await expect(unstored(page)).toHaveText(UNSTORED)

    await waitForRun(page, () => textarea(page).fill(VALID_A))
    const version = await saveVersion(page)
    expect(version.status).toBe(200)
    expect((await version.request.allHeaders()).authorization).toBe(`Bearer ${created.editSecret}`)

    await page.reload()
    await expect(status(page)).toHaveAttribute('data-status', 'current')
    await expect(groupOptions(page, 'My builds')).toHaveCount(0)
  })

  test('a late create still warns although no link shows, until the next settled change', async ({ page }) => {
    await blockStorageWrites(page)
    await openPage(page)
    const { release } = await holdCopy(page, 'Late unstored')
    await waitForRun(page, () => textarea(page).fill(VALID_A))

    expect((await releaseAndAwait(page, release, isNamedPost)).status()).toBe(201)
    await expect(unstored(page)).toHaveText(UNSTORED)
    await expect(savedLink(page)).toHaveCount(0)
    await expect(checkedOption(page)).toHaveText(`${DEFAULT.name} (edited)`)
    await waitForRun(page, () => textarea(page).fill(VALID_B))
    await expect(unstored(page)).toHaveCount(0)
  })
})

test.describe('in flight and late answers', () => {
  test('while a create is held both buttons are disabled, and leaving aborts it without an error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))
    await editedCopy(page, 'In flight')
    const puts = track(page, isNamedPut)
    const failed = track(page, isNamedPost, 'requestfailed')
    const { release, posts } = await holdCopy(page, 'Held copy')
    await expect(saveButton(page)).toBeDisabled()
    await expect(copyButton(page)).toBeDisabled()
    await saveButton(page).click({ force: true })
    await copyButton(page).click({ force: true })
    await page.waitForTimeout(300)
    expect([posts.length, puts.length]).toEqual([1, 0])

    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => failed.length).toBe(1)
    release()
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })

  test('a create released after a settled edit is stored and listed but selects nothing', async ({ page }) => {
    await openPage(page)
    const { release } = await holdCopy(page, 'Late copy')
    await waitForRun(page, () => textarea(page).fill(VALID_A))

    const created = (await (await releaseAndAwait(page, release, isNamedPost)).json()) as Created
    await expect(groupOptions(page, 'My builds')).toHaveText(['Late copy'])
    await expect.poll(async () => (await storedBuild(page, created.id))?.revision).toBe(1)
    await expect(checkedOption(page)).toHaveText(`${DEFAULT.name} (edited)`)
    await expect(textarea(page)).toHaveValue(VALID_A)
    await expect(savedLink(page)).toHaveCount(0)
    expect(nQuery(page)).toBeNull()
  })

  test('a create released with no edit selects the build and shows the link', async ({ page }) => {
    await openPage(page)
    const { release } = await holdCopy(page, 'Prompt copy')
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 300)
    release()
    await expect(checkedOption(page)).toHaveText('Prompt copy')
    await expect(savedLink(page)).toHaveValue(N_LINK)
  })

  test('a new version released after a settled edit keeps the text and stores revision 2', async ({ page }) => {
    const created = await editedCopy(page, 'Late version')
    const { release } = await holdVersion(page)
    await waitForRun(page, () => textarea(page).fill(VALID_B))

    expect((await releaseAndAwait(page, release, isNamedPut)).status()).toBe(200)
    await expect.poll(async () => (await storedBuild(page, created.id))?.revision).toBe(2)
    await expect(textarea(page)).toHaveValue(VALID_B)
    await expect(checkedOption(page)).toHaveText('Late version (edited)')
    await expect(savedLink(page)).toHaveCount(0)
    await expect(select(page)).toHaveAttribute('data-edited', 'true')
    await expect(saveButton(page)).toBeEnabled()

    await textarea(page).fill(VALID_A)
    await expect(select(page)).toHaveAttribute('data-edited', 'false')
    await expect(saveButton(page)).toBeDisabled()
  })

  const lateFailures = [
    { code: 503, versionEnabled: true },
    { code: 412, versionEnabled: false },
  ]
  for (const { code, versionEnabled } of lateFailures) {
    test(`a late ${code} shows no message and leaves Save a new version ${versionEnabled ? 'enabled' : 'locked'}`, async ({ page }) => {
      await editedCopy(page, `Late ${code}`)
      await stubNamed(page, 'PUT', reply(code))
      const { release } = await holdVersion(page)
      await waitForRun(page, () => textarea(page).fill(VALID_B))

      expect((await releaseAndAwait(page, release, isNamedPut)).status()).toBe(code)
      await page.waitForTimeout(300)
      await expect(saveError(page)).toHaveCount(0)
      await expect(select(page)).toHaveAttribute('data-edited', 'true')
      if (versionEnabled) await expect(saveButton(page)).toBeEnabled()
      else await expect(saveButton(page)).toBeDisabled()
      await expect(copyButton(page)).toBeEnabled()
    })
  }

  test('a held new version waits for release while a copy goes through', async ({ page }) => {
    const answered: number[] = []
    page.on('response', (r) => {
      if (isNamedPut(r.request())) answered.push(r.status())
    })
    const { release } = await holdVersion(page, () => editedCopy(page, 'Held version'))
    await page.waitForTimeout(500)
    expect(answered).toEqual([])
    release()
    await expect.poll(() => answered).toEqual([200])
  })
})

test.describe('link panel', () => {
  test('Escape hides the link and focuses Save as copy after a copy', async ({ page }) => {
    await openPage(page)
    await saveCopy(page, 'Escape copy')
    await expect(savedLink(page)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(savedLink(page)).toHaveCount(0)
    await expect(copyLink(page)).toHaveCount(0)
    await expect(copyButton(page)).toBeFocused()
  })

  test('Escape after a new version focuses Save as copy, since Save a new version is disabled then', async ({ page }) => {
    await editedCopy(page, 'Escape version')
    await saveVersion(page)
    await expect(savedLink(page)).toBeFocused()
    await expect(saveButton(page)).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(savedLink(page)).toHaveCount(0)
    await expect(copyButton(page)).toBeFocused()
  })

  const edits: { name: string; edit: (page: Page) => Promise<unknown>; keepsN: boolean }[] = [
    { name: 'a text edit', edit: (page) => textarea(page).fill(VALID_A), keepsN: true },
    { name: 'a duration edit', edit: (page) => duration(page).fill('900'), keepsN: true },
    { name: 'a build selection', edit: (page) => select(page).selectOption({ label: OTHER.name }), keepsN: false },
  ]
  for (const { name, edit, keepsN } of edits) {
    test(`${name} drops the link only once the pause ends and ${keepsN ? 'keeps' : 'drops'} n`, async ({ page }) => {
      await openPausedPage(page)
      const { created } = await saveCopy(page, 'Paused copy')
      await expect(savedLink(page)).toBeVisible()
      await expect.poll(() => nQuery(page)).toBe(created.id)

      await edit(page)
      if (keepsN) {
        await expect(savedLink(page)).toBeVisible()
        expect(nQuery(page)).toBe(created.id)
      }
      await waitForRun(page, () => settle(page))
      await expect(savedLink(page)).toHaveCount(0)
      if (keepsN) expect(nQuery(page)).toBe(created.id)
      else await expect.poll(() => nQuery(page)).toBeNull()
    })
  }

  test('an edit and an undo inside the pause keeps the link and n', async ({ page }) => {
    await openPausedPage(page)
    const { created } = await saveCopy(page, 'Undo copy')
    await expect(savedLink(page)).toBeVisible()
    await textarea(page).fill(VALID_A)
    await page.clock.runFor(AUTO_RUN_DEBOUNCE_MS / 2)
    await textarea(page).fill(DEFAULT.text)
    await settle(page)
    await page.waitForTimeout(500)
    await expect(savedLink(page)).toBeVisible()
    expect(nQuery(page)).toBe(created.id)
  })

  test('with clipboard permission Copy link reads Copied until the settled input changes', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin })
    await openPage(page)
    await saveCopy(page, 'Clipboard copy')
    await expect(copyLink(page)).toHaveText('Copy link')
    await copyLink(page).click()
    await expect(copyLink(page)).toHaveText('Copied')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await savedLink(page).inputValue())

    await waitForRun(page, () => textarea(page).fill(VALID_A))
    await expect(savedLink(page)).toHaveCount(0)
    await saveCopy(page, 'Second clipboard copy')
    await expect(copyLink(page)).toHaveText('Copy link')
  })

  for (const { name, script } of REFUSED_CLIPBOARDS) {
    test(`${name} shows the hand-copy hint and selects the link`, async ({ page }) => {
      await page.addInitScript(script)
      await openPage(page)
      await saveCopy(page, 'Hand copy')
      await copyButton(page).focus()
      await copyLink(page).click()
      await expect(page.getByTestId('copy-saved-link-hint')).toHaveText('Could not copy. Select the link and copy it by hand.')
      await expect(copyLink(page)).toHaveText('Copy link')
      await expect(savedLink(page)).toBeFocused()
      await expectSelectedText(savedLink(page))
    })
  }
})

test.describe('layout of the save panel', () => {
  const measure = (page: Page) =>
    page.evaluate(() => {
      const runBar = document.querySelector('[data-testid="run-bar"]')!.getBoundingClientRect()
      const editor = document.querySelector('[data-testid="build-order-text"]')!.getBoundingClientRect()
      return { scrollWidth: document.documentElement.scrollWidth, runBarBottom: runBar.bottom, runBarHeight: runBar.height, editorTop: editor.top }
    })

  async function expectFits(page: Page) {
    await expect.poll(async () => (await measure(page)).scrollWidth).toBeLessThanOrEqual(PHONE.width)
    const phone = await measure(page)
    expect(phone.editorTop).toBeGreaterThanOrEqual(phone.runBarBottom)
    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport)
      await expect.poll(async () => (await measure(page)).runBarHeight / viewport.height).toBeLessThanOrEqual(0.4)
    }
    await page.setViewportSize(PHONE)
  }

  test('at 390 px neither the open copy form nor the link panel widens the page or lets the run bar cover the editor', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await openPage(page)
    await copyButton(page).click()
    await expect(copyForm(page)).toBeVisible()
    await expectFits(page)
    await expect(copyForm(page)).toBeVisible()

    await copySubmit(page).click()
    await expect(savedLink(page)).toBeVisible()
    await expectFits(page)
    await expect(savedLink(page)).toBeVisible()
  })
})
