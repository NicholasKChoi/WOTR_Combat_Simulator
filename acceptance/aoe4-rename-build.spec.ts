import { expect, type Locator, type Page, type Request, type Route } from '@playwright/test'
import { MY_BUILDS_STORAGE_KEY } from '../components/apps/aoe4-build-order/my-builds-storage'
import {
  AOE4_PAGE,
  blockStorageWrites,
  type Created,
  editedCopy,
  gatedTest,
  holdRequests,
  isNamedPath,
  isNamedPut,
  NAMED_BUILDS_PATH,
  openPage,
  putNamedBuild,
  reply,
  saveBody,
  saveCopy,
  stubNamed,
  uniqueClient,
  waitForRun,
} from './helpers'

const test = gatedTest('aoe4-rename-build')

const byId = (page: Page, id: string) => page.getByTestId(id)
const renameButton = (page: Page) => byId(page, 'rename-build')
const renameForm = (page: Page) => byId(page, 'rename-form')
const renameName = (page: Page) => byId(page, 'rename-name')
const renameSubmit = (page: Page) => renameForm(page).getByRole('button', { name: 'Save name', exact: true })
const checkedOption = (page: Page) => byId(page, 'build-order-select').locator('option:checked')
const status = (page: Page) => byId(page, 'save-status')
const saveError = (page: Page) => byId(page, 'save-build-error')
const link = (page: Page) => byId(page, 'saved-build-link')
const textarea = (page: Page) => byId(page, 'build-order-text')
const focusedId = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid)

const isNamedPatch = (r: Request) => isNamedPath(new URL(r.url())) && r.method() === 'PATCH'
const EDIT_TEXT = ['start -> sheep', 'produce knight from stable'].join('\n')
const UNCONVERTIBLE_TEXT = ['start -> sheep', 'at 8 vils fly capital-town-center'].join('\n')

async function submitRename(page: Page, name: string) {
  await renameButton(page).click()
  await renameName(page).fill(name)
  const responded = page.waitForResponse((r) => isNamedPatch(r.request()))
  await renameSubmit(page).click()
  return responded
}

async function renamed(page: Page, name: string) {
  const response = await submitRename(page, name)
  expect(response.status(), await response.text()).toBe(200)
  return response
}

const storedNames = (page: Page) =>
  page.evaluate((key) => (JSON.parse(window.localStorage.getItem(key) ?? '{"builds":[]}').builds as { name: string }[]).map((b) => b.name), MY_BUILDS_STORAGE_KEY)

async function savedCopy(page: Page, name: string): Promise<Created> {
  await openPage(page)
  const { created } = await saveCopy(page, name)
  await expect(link(page)).toBeVisible()
  return created
}

test.describe('shown and disabled', () => {
  test('is not shown for a template and is shown for a build saved in this browser', async ({ page }) => {
    await openPage(page)
    await expect(renameButton(page)).toHaveCount(0)
    await saveCopy(page, 'Shown build')
    await expect(renameButton(page)).toBeVisible()
    await expect(renameButton(page)).toBeEnabled()
  })

  test('is not shown for a build opened from its n link in a browser without its secret', async ({ page, browser, baseURL }) => {
    const created = await savedCopy(page, 'Made elsewhere')
    await expect(renameButton(page)).toBeVisible()
    const context = await browser.newContext({ baseURL, extraHTTPHeaders: { 'x-forwarded-for': uniqueClient('aoe4-rename-fresh') } })
    try {
      const fresh = await context.newPage()
      await fresh.goto(`${AOE4_PAGE}?n=${created.id}`)
      await expect(byId(fresh, 'auto-run-status')).toHaveAttribute('data-status', 'current')
      await expect(checkedOption(fresh)).toHaveText('Made elsewhere (shared)')
      await expect(renameButton(fresh)).toHaveCount(0)
    } finally {
      await context.close()
    }
  })

  test('is disabled while another of My builds is loading, and enabled once it has loaded', async ({ page }) => {
    const created = await savedCopy(page, 'Loading first')
    await saveCopy(page, 'Loading second')
    await expect(checkedOption(page)).toHaveText('Loading second')
    const release = await holdRequests(page, `${NAMED_BUILDS_PATH}/${created.id}`, 'GET')
    await byId(page, 'build-order-select').selectOption({ label: 'Loading first' })
    await expect(renameButton(page)).toBeDisabled()
    release()
    await expect(renameButton(page)).toBeEnabled()
    await expect(checkedOption(page)).toHaveText('Loading first')
  })

  test('stays enabled for a stale run, an unconvertible text and an edited build', async ({ page }) => {
    await savedCopy(page, 'Always enabled')

    await waitForRun(page, () => textarea(page).fill(EDIT_TEXT))
    await expect(byId(page, 'save-build')).toBeEnabled()
    await expect(renameButton(page)).toBeEnabled()

    await textarea(page).fill(UNCONVERTIBLE_TEXT)
    await expect(byId(page, 'auto-run-status')).toHaveAttribute('data-status', 'invalid')
    await expect(byId(page, 'save-build-copy')).toBeDisabled()
    await expect(renameButton(page)).toBeEnabled()
    await renameButton(page).click()
    await renameName(page).fill('Renamed while unconvertible')
    await expect(renameSubmit(page)).toBeEnabled()
  })

  test('stays enabled while the run is stale, and its submit renames', async ({ page }) => {
    await savedCopy(page, 'Stale run')
    const release = await holdRequests(page, '/api/aoe4-build-order/simulate', 'POST')
    await textarea(page).fill(EDIT_TEXT)
    await expect(byId(page, 'save-build-copy')).toBeDisabled()
    await expect(renameButton(page)).toBeEnabled()
    await renamed(page, 'Renamed on a stale run')
    await expect(checkedOption(page)).toHaveText('Renamed on a stale run (edited)')
    release()
  })
})

test.describe('the form', () => {
  test('opens prefilled, focused with its text selected, and its submit is named Save name', async ({ page }) => {
    await savedCopy(page, 'Form build')
    await renameButton(page).click()
    await expect(renameForm(page)).toBeVisible()
    await expect(renameName(page)).toHaveValue('Form build')
    expect(await focusedId(page)).toBe('rename-name')
    expect(await renameName(page).evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])).toEqual([0, 'Form build'.length])
    await expect(page.getByRole('group', { name: 'Rename', exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'New name' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rename', exact: true })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Save name', exact: true })).toHaveCount(1)
  })

  test('disables submit without an error while the trimmed name equals the current name', async ({ page }) => {
    await savedCopy(page, 'Same name')
    await renameButton(page).click()
    await expect(renameSubmit(page)).toBeDisabled()
    await renameName(page).fill('  Same name  ')
    await expect(renameSubmit(page)).toBeDisabled()
    await expect(byId(page, 'rename-name-error')).toHaveCount(0)
    await renameName(page).fill('Same name!')
    await expect(renameSubmit(page)).toBeEnabled()
  })

  for (const [label, value] of [
    ['empty', ''],
    ['whitespace only', '   '],
    ['101 characters', 'a'.repeat(101)],
  ]) {
    test(`shows the range message and aria-invalid for a name that is ${label}`, async ({ page }) => {
      await savedCopy(page, 'Invalid names')
      await renameButton(page).click()
      await renameName(page).fill(value)
      await expect(byId(page, 'rename-name-error')).toHaveText('Enter a name of 1 to 100 characters.')
      await expect(renameName(page)).toHaveAttribute('aria-invalid', 'true')
      await expect(renameName(page)).toHaveAttribute('aria-describedby', 'rename-name-error')
      await expect(renameSubmit(page)).toBeDisabled()
    })
  }

  test('Enter submits only when submit is enabled', async ({ page }) => {
    await savedCopy(page, 'Enter build')
    const patches: Request[] = []
    page.on('request', (r) => {
      if (isNamedPatch(r)) patches.push(r)
    })
    await renameButton(page).click()
    await page.keyboard.press('Enter')
    await renameName(page).fill('')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    expect(patches).toHaveLength(0)
    await expect(renameForm(page)).toBeVisible()

    await renameName(page).fill('Entered')
    const responded = page.waitForResponse((r) => isNamedPatch(r.request()))
    await page.keyboard.press('Enter')
    expect((await responded).status()).toBe(200)
    await expect(renameForm(page)).toHaveCount(0)
    await expect(checkedOption(page)).toHaveText('Entered')
  })

  test('Escape and Cancel close it without a request and return focus to Rename', async ({ page }) => {
    await savedCopy(page, 'Close build')
    const patches: Request[] = []
    page.on('request', (r) => {
      if (isNamedPatch(r)) patches.push(r)
    })
    await renameButton(page).click()
    await renameName(page).fill('Typed but not saved')
    await page.keyboard.press('Escape')
    await expect(renameForm(page)).toHaveCount(0)
    expect(await focusedId(page)).toBe('rename-build')

    await renameButton(page).click()
    await expect(renameName(page)).toHaveValue('Close build')
    await byId(page, 'rename-cancel').click()
    await expect(renameForm(page)).toHaveCount(0)
    expect(await focusedId(page)).toBe('rename-build')
    expect(patches).toHaveLength(0)
    await expect(checkedOption(page)).toHaveText('Close build')
  })

  test('opening it closes the Save as copy form and the reverse', async ({ page }) => {
    await savedCopy(page, 'One form')
    await byId(page, 'save-build-copy').click()
    await expect(byId(page, 'save-copy-form')).toBeVisible()
    await renameButton(page).click()
    await expect(renameForm(page)).toBeVisible()
    await expect(byId(page, 'save-copy-form')).toHaveCount(0)
    await byId(page, 'save-build-copy').click()
    await expect(byId(page, 'save-copy-form')).toBeVisible()
    await expect(renameForm(page)).toHaveCount(0)
  })

  test('closes when another entry is chosen', async ({ page }) => {
    await savedCopy(page, 'Chosen away')
    await saveCopy(page, 'Chosen instead')
    await expect(checkedOption(page)).toHaveText('Chosen instead')
    await renameButton(page).click()
    await expect(renameForm(page)).toBeVisible()
    await byId(page, 'build-order-select').selectOption({ label: 'Chosen away' })
    await expect(checkedOption(page)).toHaveText('Chosen away')
    await expect(renameForm(page)).toHaveCount(0)
    await expect(renameButton(page)).toBeVisible()
  })
})

test.describe('a successful rename', () => {
  test('sends the trimmed name with the secret and revision, then shows it everywhere, twice in a row', async ({ page }) => {
    const created = await savedCopy(page, 'Before')
    const url = page.url()
    const first = await submitRename(page, '  After  ')
    expect(first.status()).toBe(200)
    const sent = first.request()
    expect(sent.postDataJSON()).toEqual({ name: 'After' })
    expect(await sent.headerValue('authorization')).toBe(`Bearer ${created.editSecret}`)
    expect(await sent.headerValue('if-match')).toBe('"1"')

    await expect(renameForm(page)).toHaveCount(0)
    await expect(checkedOption(page)).toHaveText('After')
    await expect(status(page)).toHaveText('Renamed')
    await expect(link(page)).toBeVisible()
    expect(page.url()).toBe(url)
    expect(await storedNames(page)).toEqual(['After'])

    const second = await submitRename(page, 'After again')
    expect(second.status()).toBe(200)
    expect(await second.request().headerValue('if-match')).toBe('"2"')
    await expect(checkedOption(page)).toHaveText('After again')
    expect(await storedNames(page)).toEqual(['After again'])
  })

  test('shows the new name when ?n= is reloaded and the build runs', async ({ page }) => {
    const created = await savedCopy(page, 'Reload before')
    await renamed(page, 'Reload after')
    await page.goto(`${AOE4_PAGE}?n=${created.id}`)
    await expect(byId(page, 'auto-run-status')).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(page)).toHaveText('Reload after')
    await expect(byId(page, 'build-order-select').locator('optgroup[label="My builds"] option')).toHaveText(['Reload after'])
  })

  test('on an edited build leaves it edited, and a later Save a new version sends the renamed revision and name', async ({ page }) => {
    await editedCopy(page, 'Edited before')
    await renamed(page, 'Edited after')
    await expect(checkedOption(page)).toHaveText('Edited after (edited)')
    await expect(byId(page, 'save-build')).toBeEnabled()

    const responded = page.waitForResponse((r) => isNamedPut(r.request()))
    await byId(page, 'save-build').click()
    const put = (await responded).request()
    expect(await put.headerValue('if-match')).toBe('"2"')
    expect(put.postDataJSON().buildOrder.name).toBe('Edited after')
  })

  test('answered after the input changed renames the list and storage but shows no link, status or error', async ({ page }) => {
    const created = await savedCopy(page, 'Late before')
    const release = await holdRequests(page, `${NAMED_BUILDS_PATH}/${created.id}`, 'PATCH')
    await renameButton(page).click()
    await renameName(page).fill('Late after')
    await renameSubmit(page).click()
    await expect(renameForm(page)).toHaveCount(0)
    await expect(renameButton(page)).toBeDisabled()

    await waitForRun(page, () => textarea(page).fill(EDIT_TEXT))
    const responded = page.waitForResponse((r) => isNamedPatch(r.request()))
    release()
    expect((await responded).status()).toBe(200)

    await expect(checkedOption(page)).toHaveText('Late after (edited)')
    expect(await storedNames(page)).toEqual(['Late after'])
    await expect(link(page)).toHaveCount(0)
    await expect(status(page)).toHaveText('')
    await expect(saveError(page)).toHaveCount(0)
  })

  test('Escape on the link returns focus to Rename', async ({ page }) => {
    await savedCopy(page, 'Link focus')
    await renamed(page, 'Link focus renamed')
    await expect(link(page)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(link(page)).toHaveCount(0)
    expect(await focusedId(page)).toBe('rename-build')
  })

  test('applies in this tab and shows the unavailable notice when the browser cannot store the list', async ({ page }) => {
    await blockStorageWrites(page)
    await openPage(page)
    await saveCopy(page, 'Unstored before')
    await renamed(page, 'Unstored after')
    await expect(checkedOption(page)).toHaveText('Unstored after')
    await expect(byId(page, 'my-builds-unavailable')).toBeVisible()
  })
})

test.describe('a rename that fails', () => {
  test('with 412 shows the conflict, disables Save a new version and Rename, and keeps the name', async ({ page, request, client }) => {
    const created = await savedCopy(page, 'Conflict build')
    const other = await putNamedBuild(request, created.id, saveBody('Changed elsewhere'), client, {
      Authorization: `Bearer ${created.editSecret}`,
      'If-Match': '"1"',
    })
    expect(other.status(), await other.text()).toBe(200)

    const response = await submitRename(page, 'Conflict renamed')
    expect(response.status()).toBe(412)
    await expect(saveError(page)).toContainText('This build changed somewhere else')
    await expect(renameButton(page)).toBeDisabled()
    await expect(byId(page, 'save-build')).toBeDisabled()
    await expect(checkedOption(page)).toHaveText('Conflict build')
    expect(await storedNames(page)).toEqual(['Conflict build'])
  })

  for (const { name, respond, message } of [
    { name: 'forbidden', respond: reply(403), message: 'You cannot edit this build here. Save a copy instead.' },
    { name: 'not found', respond: reply(404), message: 'This build no longer exists. Save a copy instead.' },
    { name: 'rate limited', respond: reply(429, { error: 'slow down' }, { 'Retry-After': '30' }), message: /./ },
    { name: 'a server error', respond: reply(500), message: /./ },
    { name: 'a network failure', respond: (route: Route) => route.abort(), message: /./ },
  ]) {
    test(`with ${name} shows its message, keeps the name and leaves Rename enabled`, async ({ page }) => {
      await savedCopy(page, 'Failing build')
      const unstub = await stubNamed(page, 'PATCH', respond)
      await renameButton(page).click()
      await renameName(page).fill('Failing renamed')
      await renameSubmit(page).click()
      await expect(saveError(page)).toHaveText(message)
      await expect(renameButton(page)).toBeEnabled()
      await expect(checkedOption(page)).toHaveText('Failing build')
      expect(await storedNames(page)).toEqual(['Failing build'])
      await unstub()
    })
  }
})

test.describe('library names', () => {
  test('a tab that has this build selected takes the name another tab stored and keeps its own text', async ({ page, context }) => {
    await savedCopy(page, 'Tab A name')
    await waitForRun(page, () => textarea(page).fill(EDIT_TEXT))
    await expect(checkedOption(page)).toHaveText('Tab A name (edited)')

    const other = await context.newPage()
    await openPage(other)
    await other.evaluate((key) => {
      const stored = JSON.parse(window.localStorage.getItem(key) ?? '')
      stored.builds[0] = { ...stored.builds[0], name: 'Tab B name', revision: 9 }
      window.localStorage.setItem(key, JSON.stringify(stored))
    }, MY_BUILDS_STORAGE_KEY)

    await expect(checkedOption(page)).toHaveText('Tab B name (edited)')
    await expect(textarea(page)).toHaveValue(EDIT_TEXT)
    await expect(byId(page, 'save-build')).toBeEnabled()
  })

  test('opening ?n= shows the server name when the stored name is out of date', async ({ page, request, client }) => {
    const created = await savedCopy(page, 'Stored name')
    const other = await request.patch(`${NAMED_BUILDS_PATH}/${created.id}`, {
      data: { name: 'Server name' },
      headers: { Authorization: `Bearer ${created.editSecret}`, 'If-Match': '"1"', 'x-forwarded-for': client },
    })
    expect(other.status(), await other.text()).toBe(200)
    await page.goto(`${AOE4_PAGE}?n=${created.id}`)
    await expect(byId(page, 'auto-run-status')).toHaveAttribute('data-status', 'current')
    await expect(checkedOption(page)).toHaveText('Server name')
  })
})

test.describe('layout', () => {
  const OWN_LINE = ['save-build', 'rename-build', 'save-build-copy', 'save-status', 'saved-build-link', 'copy-saved-link']

  const readRow = (row: Locator) =>
    row.evaluate((el, ids) => {
      const boxes = ids.map((id) => el.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect() ?? null)
      const copy = el.querySelector('[data-testid="save-build-copy"]')!.getBoundingClientRect()
      const row = el.getBoundingClientRect()
      return {
        present: boxes.filter((b) => b !== null).length,
        onLine: boxes.every((b) => b !== null && b.top < copy.bottom && b.bottom > copy.top),
        oneLine: row.height <= copy.height + 2,
        overflow: el.scrollWidth - el.clientWidth,
      }
    }, OWN_LINE)

  for (const width of [1200, 1280, 1800]) {
    test(`at ${width} px the row items share one line with Rename and the link shown`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await savedCopy(page, 'Layout build')
      await renamed(page, 'Layout build renamed')
      await expect(status(page)).toHaveText('Renamed')
      await expect
        .poll(() => readRow(byId(page, 'save-row')))
        .toEqual({ present: OWN_LINE.length, onLine: true, oneLine: true, overflow: 0 })
    })
  }
})
