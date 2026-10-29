import { test, expect, type Page } from '@playwright/test'
import { armies, fillArmies } from './helpers'

function select(page: Page, name: string) {
  return page.locator(`select[name="${name}"]`)
}

async function enabledOptions(page: Page, name: string) {
  return select(page, name).locator('option:not([disabled])').evaluateAll((options) =>
    options.map((o) => Number((o as HTMLOptionElement).value))
  )
}

async function optionValues(page: Page, name: string) {
  return select(page, name).locator('option').evaluateAll((options) =>
    options.map((o) => Number((o as HTMLOptionElement).value))
  )
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

function trackPageErrors(page: Page) {
  const errors: Error[] = []
  page.on('pageerror', (e) => errors.push(e))
  return errors
}

function waitForFight(page: Page) {
  return page.waitForResponse((r) => r.url().endsWith('/api/fight') && r.request().method() === 'POST')
}

// Scoped to the form because Next renders its own empty role="alert" route announcer on every page.
const alert = (page: Page) => page.locator('#fight-form').getByRole('alert')

const resultsHeading = (page: Page) => page.getByRole('heading', { name: 'Army Results', exact: true })

test.beforeEach(async ({ page }) => {
  await page.goto('/apps/combat-simulator')
  await page.waitForLoadState('networkidle')
})

test('selects offer 0-10 fighters and 0-5 leaders', async ({ page }) => {
  for (const side of ['attack', 'defend']) {
    expect(await optionValues(page, `${side}-regs`)).toEqual(range(0, 10))
    expect(await optionValues(page, `${side}-elts`)).toEqual(range(0, 10))
    expect(await optionValues(page, `${side}-ldrs`)).toEqual(range(0, 5))
  }
  await select(page, 'attack-regs').selectOption('10')
  await expect(select(page, 'attack-regs')).toHaveValue('10')
  await select(page, 'attack-regs').selectOption('0')
  await select(page, 'attack-elts').selectOption('10')
  await expect(select(page, 'attack-elts')).toHaveValue('10')
})

test('options over the 10-fighter cap are disabled per side', async ({ page }) => {
  await select(page, 'attack-regs').selectOption('6')
  expect(await enabledOptions(page, 'attack-elts')).toEqual(range(0, 4))

  await select(page, 'attack-regs').selectOption('0')
  await select(page, 'attack-elts').selectOption('7')
  expect(await enabledOptions(page, 'attack-regs')).toEqual(range(0, 3))

  await select(page, 'attack-regs').selectOption('3')
  expect(await enabledOptions(page, 'attack-ldrs')).toEqual(range(0, 5))
  await select(page, 'attack-ldrs').selectOption('5')
  await expect(select(page, 'attack-ldrs')).toHaveValue('5')

  for (const name of ['defend-regs', 'defend-elts']) {
    expect(await enabledOptions(page, name)).toEqual(range(0, 10))
  }

  await select(page, 'defend-regs').selectOption('9')
  expect(await enabledOptions(page, 'attack-regs')).toEqual(range(0, 3))
  expect(await enabledOptions(page, 'attack-elts')).toEqual(range(0, 7))
})

test('a valid submit renders results and no alert', async ({ page }) => {
  await fillArmies(page, armies([10, 0, 5], [0, 10, 5]))
  const fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fight).status()).toBe(200)
  await expect(resultsHeading(page)).toBeVisible()
  await expect(alert(page)).toHaveCount(0)
})

test('a server rejection shows its error and clears old results; a valid submit recovers', async ({ page }) => {
  const errors = trackPageErrors(page)

  await fillArmies(page, armies([3, 1, 1], [3, 1, 1]))
  let fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fight).status()).toBe(200)
  await expect(resultsHeading(page)).toBeVisible()

  await fillArmies(page, armies([3, 1, 1], [0, 0, 2]))
  fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  const rejected = await fight
  expect(rejected.status()).toBe(400)
  const { error } = await rejected.json()
  await expect(alert(page)).toHaveText(error)
  await expect(resultsHeading(page)).toHaveCount(0)

  await fillArmies(page, armies([3, 1, 1], [2, 0, 0]))
  fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fight).status()).toBe(200)
  await expect(resultsHeading(page)).toBeVisible()
  await expect(alert(page)).toHaveCount(0)

  expect(errors).toEqual([])
})

test('a network failure shows an alert and no results', async ({ page }) => {
  const errors = trackPageErrors(page)
  await page.route('**/api/fight', (route) => route.abort())

  await fillArmies(page, armies([3, 1, 1], [3, 1, 1]))
  await page.getByRole('button', { name: 'Fight!' }).click()
  await expect(alert(page)).toBeVisible()
  await expect(alert(page)).not.toHaveText('')
  await expect(resultsHeading(page)).toHaveCount(0)

  expect(errors).toEqual([])
})
