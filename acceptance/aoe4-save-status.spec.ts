import { expect, type Page, type Route } from '@playwright/test'
import { listBuilds } from '../lib/aoe4-build-order/builds'
import {
  blockStorageWrites,
  gatedTest,
  holdRequests,
  isNamedPost,
  isNamedPut,
  namedBuildUrl,
  NAMED_BUILDS_PATH,
  openPage,
  reply,
  stubNamed,
  waitForRun,
} from './helpers'

const test = gatedTest('aoe4-save-status')

const WIDE = { width: 1280, height: 800 }
const NARROW = { width: 390, height: 844 }
const VIEWPORTS = [
  { name: '1280x800', viewport: WIDE },
  { name: '390x844', viewport: NARROW },
]

const LINK_ROW = ['save-build', 'save-build-copy', 'save-status', 'saved-build-link', 'copy-saved-link']

const byId = (page: Page, id: string) => page.getByTestId(id)
const textOf = (n: number) => ['start -> sheep', ...Array<string>(n).fill('produce spearman from barracks')].join('\n')
const editText = (page: Page, n: number) => waitForRun(page, () => byId(page, 'build-order-text').fill(textOf(n)))
const rowIds = (page: Page) => byId(page, 'save-row').evaluate((row) => [...row.children].map((child) => (child as HTMLElement).dataset.testid))
const linkAndStatus = (page: Page) =>
  page.evaluate(() => ({
    link: document.querySelector('[data-testid="saved-build-link"]') !== null,
    status: document.querySelector('[data-testid="save-status"]')?.textContent,
  }))

async function saveCopy(page: Page) {
  await byId(page, 'save-build-copy').click()
  const responded = page.waitForResponse((r) => isNamedPost(r.request()))
  await byId(page, 'save-copy-submit').click()
  expect((await responded).status()).toBe(201)
  await expect(byId(page, 'saved-build-link')).toBeVisible()
}

async function saveVersion(page: Page): Promise<number> {
  const responded = page.waitForResponse((r) => isNamedPut(r.request()))
  await byId(page, 'save-build').click()
  const response = await responded
  expect(response.status()).toBe(200)
  return ((await response.json()) as { revision: number }).revision
}

for (const { name, viewport } of VIEWPORTS) {
  test.describe(`save status at ${name}`, () => {
    test.use({ viewport })

    test('reads Saved after a copy and the new revision after each version', async ({ page }) => {
      await openPage(page)
      expect(await rowIds(page)).toEqual(['save-build-copy', 'save-status'])
      await expect(byId(page, 'save-status')).toHaveText('')

      await saveCopy(page)
      await expect(byId(page, 'save-status')).toHaveText('Saved')
      expect(await rowIds(page)).toEqual(LINK_ROW)

      await editText(page, 1)
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: false, status: '' })
      const second = await saveVersion(page)
      expect(second).toBe(2)
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: true, status: `Saved version ${second}` })

      await editText(page, 2)
      await expect(byId(page, 'save-build')).toBeEnabled()
      expect(await saveVersion(page)).toBe(3)
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: true, status: 'Saved version 3' })
    })

    test('keeps the link and empties the status while a second copy is in flight', async ({ page }) => {
      await openPage(page)
      await saveCopy(page)
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: true, status: 'Saved' })
      const release = await holdRequests(page, NAMED_BUILDS_PATH, 'POST')
      await byId(page, 'save-build-copy').click()
      await byId(page, 'save-copy-submit').click()
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: true, status: '' })
      release()
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: true, status: 'Saved' })
    })
  })
}

test.describe('failed saves', () => {
  const failures = [
    { name: 'an error reply', respond: reply(503) },
    { name: 'a network error', respond: (route: Route) => route.abort() },
  ]
  for (const { name, respond } of failures) {
    test(`${name} leaves the status empty, with no stale Saved after a first save`, async ({ page }) => {
      await openPage(page)
      await saveCopy(page)
      await expect(byId(page, 'save-status')).toHaveText('Saved')
      await stubNamed(page, 'POST', respond)
      await byId(page, 'save-build-copy').click()
      await byId(page, 'save-copy-submit').click()
      await expect(byId(page, 'save-build-error')).not.toHaveText('')
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: false, status: '' })
    })
  }
})

test.describe('status lifetime', () => {
  test('stays shown past a few seconds with no input change', async ({ page }) => {
    await openPage(page)
    await saveCopy(page)
    await page.waitForTimeout(4000)
    await expect(byId(page, 'save-status')).toHaveText('Saved')
  })

  const changes = [
    { name: 'a text edit', change: (page: Page) => byId(page, 'build-order-text').fill(textOf(1)) },
    { name: 'a duration edit', change: (page: Page) => byId(page, 'duration-seconds').fill('900') },
    { name: 'a build select change', change: (page: Page) => byId(page, 'build-order-select').selectOption({ label: listBuilds()[1].name }) },
  ]
  for (const { name, change } of changes) {
    test(`is empty after ${name}`, async ({ page }) => {
      expect(listBuilds().length).toBeGreaterThan(1)
      await openPage(page)
      await saveCopy(page)
      await expect(byId(page, 'save-status')).toHaveText('Saved')
      await change(page)
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: false, status: '' })
    })
  }

  test('still shows with My builds unavailable, which then shows below the row', async ({ page }) => {
    await blockStorageWrites(page)
    await openPage(page)
    await saveCopy(page)
    await expect(byId(page, 'save-status')).toHaveText('Saved')
    await expect(byId(page, 'my-builds-unavailable')).toBeVisible()
  })
})

test.describe('Escape', () => {
  for (const id of ['saved-build-link', 'copy-saved-link']) {
    test(`on ${id} hides the link, empties the status and focuses Save as copy`, async ({ page }) => {
      await openPage(page)
      await saveCopy(page)
      await byId(page, id).focus()
      await page.keyboard.press('Escape')
      await expect.poll(() => linkAndStatus(page)).toEqual({ link: false, status: '' })
      await expect(byId(page, 'save-build-copy')).toBeFocused()
    })
  }

  test('on Save as copy leaves the link and the status shown', async ({ page }) => {
    await openPage(page)
    await saveCopy(page)
    await byId(page, 'save-build-copy').focus()
    await page.keyboard.press('Escape')
    await expect.poll(() => linkAndStatus(page)).toEqual({ link: true, status: 'Saved' })
  })
})

test.describe('layout', () => {
  const rects = (page: Page) =>
    page.evaluate((ids) => {
      const box = (el: Element | null) => {
        const r = el?.getBoundingClientRect()
        return r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height } : null
      }
      const row = document.querySelector('[data-testid="save-row"]')
      const byTestId = (id: string) => box(row?.querySelector(`[data-testid="${id}"]`) ?? null)
      return { row: box(row), items: ids.map(byTestId), overflow: row ? row.scrollWidth - row.clientWidth : 0 }
    }, LINK_ROW)

  test.describe('at 1280x800', () => {
    test.use({ viewport: WIDE })

    test('the empty status adds no height to the row before a save', async ({ page }) => {
      await openPage(page)
      const { row, items } = await rects(page)
      expect(Math.abs(row!.height - items[1]!.height)).toBeLessThanOrEqual(2)
    })

    test('the buttons, status, link and Copy link share one line', async ({ page }) => {
      await openPage(page)
      await saveCopy(page)
      await expect(byId(page, 'save-status')).toHaveText('Saved')
      await expect
        .poll(async () => {
          const { row, items, overflow } = await rects(page)
          const [version, copy, status, link, copyLink] = items
          const tops = [version, copy, link, copyLink].map((item) => item!.top)
          return {
            aligned: Math.max(...tops) - Math.min(...tops) <= 2,
            statusOnLine: status!.top < copy!.bottom && status!.bottom > copy!.top,
            oneLine: row!.height <= copy!.height + 2,
            overflow,
          }
        })
        .toEqual({ aligned: true, statusOnLine: true, oneLine: true, overflow: 0 })
    })
  })

  test.describe('at 390x844', () => {
    test.use({ viewport: NARROW })

    test('wraps in DOM order and keeps the status on or directly below the buttons', async ({ page }) => {
      await openPage(page)
      await saveCopy(page)
      await expect(byId(page, 'save-status')).toHaveText('Saved')
      await expect
        .poll(async () => {
          const { row, items } = await rects(page)
          const [version, copy, status] = items
          const buttonsBottom = Math.max(version!.bottom, copy!.bottom)
          const placed = items.every((item, i) => i === 0 || item!.top >= items[i - 1]!.bottom - 1 || item!.left >= items[i - 1]!.right - 1)
          const statusNear = status!.top - buttonsBottom <= 20
          return { wrapped: row!.height > copy!.height + 2, placed, statusNear }
        })
        .toEqual({ wrapped: true, placed: true, statusNear: true })
    })
  })
})

test.describe('what sits below the row', () => {
  const clipboardRefused = (page: Page) =>
    page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('refused')) } })
    })
  const states = [
    { id: 'save-copy-form', show: (page: Page) => byId(page, 'save-build-copy').click() },
    {
      id: 'copy-saved-link-hint',
      show: async (page: Page) => {
        await clipboardRefused(page)
        await openPage(page)
        await saveCopy(page)
        await byId(page, 'copy-saved-link').click()
      },
    },
    {
      id: 'my-builds-unavailable',
      show: async (page: Page) => {
        await blockStorageWrites(page)
        await openPage(page)
        await saveCopy(page)
      },
    },
    {
      id: 'save-build-error',
      show: async (page: Page) => {
        await stubNamed(page, 'POST', reply(503))
        await byId(page, 'save-build-copy').click()
        await byId(page, 'save-copy-submit').click()
      },
    },
  ]
  for (const { id, show } of states) {
    test(`${id} is shown outside the row, in the panel`, async ({ page }) => {
      if (id === 'save-copy-form' || id === 'save-build-error') await openPage(page)
      await show(page)
      await expect(byId(page, id)).toBeVisible()
      const place = await byId(page, id).evaluate((el) => ({
        inRow: el.closest('[data-testid="save-row"]') !== null,
        parent: el.parentElement?.dataset.testid,
        after: el.previousElementSibling?.matches('[data-testid="save-row"], [data-testid="save-copy-form"], [data-testid="copy-saved-link-hint"], [data-testid="my-builds-unavailable"]'),
      }))
      expect(place).toEqual({ inRow: false, parent: 'save-panel', after: true })
    })
  }
})
