import { expect, type Page } from '@playwright/test'
import { MY_BUILDS_BACKUP_KEY, MY_BUILDS_STORAGE_KEY } from '../components/apps/aoe4-build-order/my-builds-storage'
import { gatedTest, openPage } from './helpers'

const test = gatedTest('aoe4-my-builds-unreadable')

const SECRET = 'e'.repeat(43)
const VALID = { id: 'NNNNNNNNNNNNNNNNNNNNNN', name: 'Kept build', editSecret: SECRET, revision: 2, updatedAt: '2026-02-01T00:00:00.000Z' }
const INVALID = { id: 'not a valid id', name: 'Broken build', editSecret: SECRET, revision: 1, updatedAt: '2026-01-01T00:00:00.000Z' }
const UNSTORED = 'This browser could not store the edit key, so you can edit this build only until you close the page.'
const COPY_NAME = 'Saved after unreadable'

const NOT_JSON = 'this is not json'
const OTHER_VERSION = JSON.stringify({ version: 2, builds: [VALID] })
const ONE_INVALID_ELEMENT = JSON.stringify({ version: 1, builds: [VALID, INVALID] })
const OTHER_UNREADABLE = '{"version":1,"builds":"nope"}'

const UNREADABLE = [
  { name: 'a value that is not JSON', raw: NOT_JSON, listed: [] as string[] },
  { name: 'a value with another version', raw: OTHER_VERSION, listed: [] as string[] },
  { name: 'a value with one invalid element', raw: ONE_INVALID_ELEMENT, listed: [VALID.name] },
]

interface Rig {
  seed: Record<string, string>
  throwSetOn?: string
  throwGetOn?: string[]
}

type Op = [op: 'set' | 'remove' | 'get', key: string]

// Records every storage call after seeding, so tests can assert what the page did and in which order.
const rigStorage = (page: Page, rig: Rig) =>
  page.addInitScript((r) => {
    const store = window.localStorage
    const log: Op[] = []
    Object.defineProperty(window, '__storageLog', { value: log })
    Object.defineProperty(window, '__rawGet', { value: Storage.prototype.getItem.bind(store) })
    for (const [key, value] of Object.entries(r.seed)) store.setItem(key, value)
    const proto = Storage.prototype
    const { setItem, removeItem, getItem } = proto
    proto.setItem = function (key: string, value: string) {
      log.push(['set', key])
      if (key === r.throwSetOn) throw new DOMException('blocked', 'QuotaExceededError')
      return setItem.call(this, key, value)
    }
    proto.removeItem = function (key: string) {
      log.push(['remove', key])
      return removeItem.call(this, key)
    }
    proto.getItem = function (key: string) {
      log.push(['get', key])
      if (r.throwGetOn?.includes(key)) throw new DOMException('denied', 'SecurityError')
      return getItem.call(this, key)
    }
  }, rig)

const storageLog = (page: Page) => page.evaluate(() => (window as unknown as { __storageLog: Op[] }).__storageLog)
const stored = (page: Page, key: string) => page.evaluate((k) => (window as unknown as { __rawGet: (key: string) => string | null }).__rawGet(k), key)
const storedKeys = (page: Page) => page.evaluate(() => Object.keys(window.localStorage).sort())
const writesTo = (log: Op[], key: string) => log.filter(([op, k]) => op !== 'get' && k === key)
const myBuildsLabels = (page: Page) => page.getByTestId('build-order-select').locator('optgroup[label="My builds"] option').allTextContents()

async function saveCopy(page: Page): Promise<void> {
  await page.getByTestId('save-build-copy').click()
  await page.getByTestId('save-copy-name').fill(COPY_NAME)
  const responded = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/named-builds'))
  await page.getByTestId('save-copy-submit').click()
  expect((await responded).status()).toBe(201)
  await expect(page.getByTestId('saved-build-link')).toBeVisible()
}

const storedNames = async (page: Page) => {
  const raw = await stored(page, MY_BUILDS_STORAGE_KEY)
  return (JSON.parse(raw as string) as { builds: { name: string }[] }).builds.map((b) => b.name)
}

test.describe('reading an unreadable my-builds value', () => {
  for (const row of UNREADABLE) {
    test(`${row.name} stays byte-identical, is never removed or rewritten, and lists only its valid builds`, async ({ page }) => {
      await rigStorage(page, { seed: { [MY_BUILDS_STORAGE_KEY]: row.raw } })
      await openPage(page)

      expect(await myBuildsLabels(page)).toEqual(row.listed)
      expect(await stored(page, MY_BUILDS_STORAGE_KEY)).toBe(row.raw)
      expect(await stored(page, MY_BUILDS_BACKUP_KEY)).toBeNull()
      const log = await storageLog(page)
      expect(writesTo(log, MY_BUILDS_STORAGE_KEY)).toEqual([])
      expect(writesTo(log, MY_BUILDS_BACKUP_KEY)).toEqual([])
    })
  }

  test('a missing value and the availability probe leave neither the probe key nor the backup key behind', async ({ page }) => {
    await rigStorage(page, { seed: {} })
    await openPage(page)

    expect((await storageLog(page)).some(([op]) => op === 'set')).toBe(true)
    expect(await storedKeys(page)).toEqual([])
  })
})

test.describe('saving over an unreadable my-builds value', () => {
  for (const row of UNREADABLE) {
    test(`${row.name} is copied verbatim to the backup before the list replaces it`, async ({ page }) => {
      await rigStorage(page, { seed: { [MY_BUILDS_STORAGE_KEY]: row.raw } })
      await openPage(page)
      await saveCopy(page)

      expect(await stored(page, MY_BUILDS_BACKUP_KEY)).toBe(row.raw)
      expect(await storedNames(page)).toEqual([COPY_NAME, ...row.listed])
      const writes = (await storageLog(page)).filter(([op, k]) => op === 'set' && (k === MY_BUILDS_BACKUP_KEY || k === MY_BUILDS_STORAGE_KEY))
      expect(writes).toEqual([
        ['set', MY_BUILDS_BACKUP_KEY],
        ['set', MY_BUILDS_STORAGE_KEY],
      ])
      await expect(page.getByTestId('my-builds-unavailable')).toHaveCount(0)
    })
  }

  test('an existing backup is kept when a later unreadable value is replaced, and the list is still written', async ({ page }) => {
    const firstBackup = 'first unreadable value'
    await rigStorage(page, { seed: { [MY_BUILDS_STORAGE_KEY]: OTHER_UNREADABLE, [MY_BUILDS_BACKUP_KEY]: firstBackup } })
    await openPage(page)
    await saveCopy(page)

    expect(await stored(page, MY_BUILDS_BACKUP_KEY)).toBe(firstBackup)
    expect(writesTo(await storageLog(page), MY_BUILDS_BACKUP_KEY)).toEqual([])
    expect(await storedNames(page)).toEqual([COPY_NAME])
  })

  test('a failing backup write stops the save: the original value stays, no list is written, and the page warns', async ({ page }) => {
    await rigStorage(page, { seed: { [MY_BUILDS_STORAGE_KEY]: ONE_INVALID_ELEMENT }, throwSetOn: MY_BUILDS_BACKUP_KEY })
    await openPage(page)
    await saveCopy(page)

    expect(await stored(page, MY_BUILDS_STORAGE_KEY)).toBe(ONE_INVALID_ELEMENT)
    expect(await stored(page, MY_BUILDS_BACKUP_KEY)).toBeNull()
    expect(writesTo(await storageLog(page), MY_BUILDS_STORAGE_KEY)).toEqual([])
    await expect(page.getByTestId('my-builds-unavailable')).toHaveText(UNSTORED)
  })
})

test.describe('saving over a missing or intact my-builds value', () => {
  const intact = JSON.stringify({ version: 1, builds: [VALID] })
  const rows: { name: string; seed: Record<string, string>; expected: string[] }[] = [
    { name: 'a missing value', seed: {}, expected: [COPY_NAME] },
    { name: 'an intact value', seed: { [MY_BUILDS_STORAGE_KEY]: intact }, expected: [COPY_NAME, VALID.name] },
  ]
  for (const row of rows) {
    test(`${row.name} writes the list and never touches the backup key`, async ({ page }) => {
      await rigStorage(page, { seed: row.seed })
      await openPage(page)
      await saveCopy(page)

      expect(await storedNames(page)).toEqual(row.expected)
      expect(await stored(page, MY_BUILDS_BACKUP_KEY)).toBeNull()
      expect(writesTo(await storageLog(page), MY_BUILDS_BACKUP_KEY)).toEqual([])
    })
  }
})

test.describe('saving when the stored value cannot be read', () => {
  test('a throwing read attempts no backup, still writes the list, and reports it stored', async ({ page }) => {
    await rigStorage(page, { seed: { [MY_BUILDS_STORAGE_KEY]: NOT_JSON }, throwGetOn: [MY_BUILDS_STORAGE_KEY, MY_BUILDS_BACKUP_KEY] })
    await openPage(page)
    await saveCopy(page)

    expect(await stored(page, MY_BUILDS_STORAGE_KEY)).not.toBe(NOT_JSON)
    expect(await storedNames(page)).toEqual([COPY_NAME])
    expect((await storageLog(page)).filter(([, k]) => k === MY_BUILDS_BACKUP_KEY)).toEqual([])
    expect(await stored(page, MY_BUILDS_BACKUP_KEY)).toBeNull()
    await expect(page.getByTestId('my-builds-unavailable')).toHaveCount(0)
  })
})
