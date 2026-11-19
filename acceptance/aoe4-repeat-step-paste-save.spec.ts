import { expect, type Page } from '@playwright/test'
import { randomUUID } from 'crypto'
import { buildPath, gatedTest, isNamedPost, openPage, openSavedBuild, postBuild, showView, waitForRun } from './helpers'

const test = gatedTest('aoe4-repeat-paste-save')

const WIDE = { width: 1280, height: 800 }
const START = 'start 4 sheep 2 wood -> sheep'
const BUILD_LINE = 'build house from wood walk 3s x3'
const MOVE_LINE = 'move 1 sheep to wood x2'
const REPEATED = [START, BUILD_LINE, MOVE_LINE].join('\n')

const textarea = (page: Page) => page.getByTestId('build-order-text')
const issues = (page: Page) => page.getByTestId('build-order-issue')
const row = (page: Page, step: number) => page.getByTestId('step-row').nth(step)
const field = (page: Page, step: number) => row(page, step).getByTestId('step-field-repeat')

async function textLines(page: Page) {
  await showView(page, 'text')
  const text = await textarea(page).inputValue()
  await showView(page, 'table')
  return text.split('\n')
}

const POSITION_ROWS = [
  { label: 'a second xN on a produce line', line: 'produce villager from capital-town-center x3 x2', code: 'syntax' },
  { label: 'xN after -> node on a produce line', line: 'produce villager from capital-town-center -> sheep x2', code: 'syntax' },
  { label: 'xN before walk on a build line', line: 'build house from wood x9 walk 3s', code: 'syntax' },
  { label: 'xN before then on a build line', line: 'build house from wood x9 then house', code: 'syntax' },
  { label: 'two trailing xN on a build line', line: 'build house from wood x9 x2', code: 'syntax' },
  { label: 'an uppercase X9', line: 'build house from wood X9', code: 'syntax' },
  { label: 'x with a space before the digits', line: 'build house from wood x 9', code: 'syntax' },
  { label: 'a negative xN', line: 'build house from wood x-1', code: 'syntax' },
  { label: 'a fractional xN', line: 'build house from wood x1.5', code: 'syntax' },
  { label: 'x9 in a move destination, which is a node', line: 'move 1 sheep to x9', code: 'unknown-id' },
  { label: 'x201, past the repeat cap', line: 'build house from wood x201', code: 'out-of-range' },
  { label: 'a repeat on research', line: 'research bloomery x2', code: 'invalid' },
]

test.describe('a repeat typed in the text view', () => {
  test.use({ viewport: WIDE })

  for (const { label, line, code } of POSITION_ROWS) {
    test(`${label} shows one ${code} issue on that line`, async ({ page }) => {
      await openPage(page)
      await textarea(page).fill([START, line].join('\n'))
      await expect(issues(page)).toHaveCount(1)
      await expect(issues(page)).toHaveAttribute('data-code', code)
      await expect(issues(page)).toHaveAttribute('data-line', '2')
    })
  }

  test('x09 is read as 9 and the table prints it back as x9', async ({ page }) => {
    await openPage(page)
    const response = await waitForRun(page, () => textarea(page).fill([START, 'build house from wood x09'].join('\n')))
    const { steps } = (await response.json()) as { steps: { source: number }[] }
    expect(steps.filter((timing) => timing.source === 0)).toHaveLength(9)
    await showView(page, 'table')
    await expect(field(page, 0)).toHaveValue('9')
    await field(page, 0).fill('8')
    await expect.poll(() => textLines(page)).toContain('build house from wood x8')
  })

  test('a move row takes Repeat, keeps it through a change to build, and the line prints x2 after walk', async ({ page }) => {
    await openPage(page)
    await waitForRun(page, () => textarea(page).fill([START, 'move 1 sheep to wood walk 2s'].join('\n')))
    await showView(page, 'table')
    await expect(row(page, 0).getByTestId('step-more')).toHaveAttribute('aria-expanded', 'true')
    await expect(field(page, 0)).toHaveValue('')
    await waitForRun(page, () => field(page, 0).fill('2'))
    expect((await textLines(page))[1]).toBe('move 1 sheep to wood walk 2s x2')

    await waitForRun(page, () => row(page, 0).getByTestId('step-action').selectOption('build'))
    expect((await textLines(page))[1]).toMatch(/^build .* x2$/)
    await expect(row(page, 0).getByTestId('step-more')).toHaveAttribute('aria-expanded', 'false')
    await row(page, 0).getByTestId('step-more').click()
    await expect(field(page, 0)).toHaveValue('2')
  })
})

test.describe('saving a repeated build', () => {
  test.use({ viewport: WIDE })

  test('the page saves a pasted build with repeat on a build and a move step, and the saved copy keeps both', async ({ page }) => {
    await openPage(page)
    await waitForRun(page, () => textarea(page).fill(REPEATED))
    await page.getByTestId('save-build-copy').click()
    await page.getByTestId('save-copy-name').fill(`Repeat ${randomUUID()}`)
    const responded = page.waitForResponse((r) => isNamedPost(r.request()))
    await page.getByTestId('save-copy-submit').click()
    const response = await responded
    expect(response.status(), await response.text()).toBe(201)
    const posted = response.request().postDataJSON() as { buildOrder: { steps: { action: string; repeat?: number }[] } }
    expect(posted.buildOrder.steps.map((step) => [step.action, step.repeat])).toEqual([
      ['build', 3],
      ['move', 2],
    ])
    await expect(page.getByTestId('saved-build-link')).toBeVisible()
  })

  test('a shared build with repeat is stored as sent and reopens with the xN lines and a copy list', async ({ page, request, client }) => {
    const buildOrder = {
      civ: 'english',
      name: `Repeat ${randomUUID()}`,
      start: { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' },
      steps: [
        { action: 'build', building: 'house', from: 'wood', walkSeconds: 3, repeat: 3 },
        { action: 'move', count: 1, from: 'sheep', to: 'wood', repeat: 2 },
      ],
    }
    const saved = await postBuild(request, { buildOrder, durationSeconds: 600 }, client)
    expect(saved.status(), await saved.text()).toBe(201)
    const { id } = (await saved.json()) as { id: string }
    const read = await request.get(buildPath(id), { timeout: 10_000 })
    expect(((await read.json()) as { buildOrder: unknown }).buildOrder).toEqual(buildOrder)

    await openSavedBuild(page, id)
    await showView(page, 'table')
    await expect(row(page, 0).getByTestId('step-copies')).toContainText('of 3 done')
    await expect(row(page, 1).getByTestId('step-copies')).toContainText('of 2 done')
    expect(await textLines(page)).toEqual(expect.arrayContaining([BUILD_LINE, MOVE_LINE]))
  })

  test('a shared build with repeat on a research step is refused', async ({ request, client }) => {
    const buildOrder = {
      civ: 'english',
      name: `Repeat ${randomUUID()}`,
      start: { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' },
      steps: [{ action: 'research', tech: 'bloomery', repeat: 2 }],
    }
    const { repeat: _repeat, ...once } = buildOrder.steps[0]
    const control = await postBuild(request, { buildOrder: { ...buildOrder, steps: [once] }, durationSeconds: 600 }, client)
    expect(control.status(), await control.text()).toBe(201)

    const response = await postBuild(request, { buildOrder, durationSeconds: 600 }, client)
    expect(response.status()).toBe(400)
    expect(await response.text()).toContain('repeat')
  })
})
