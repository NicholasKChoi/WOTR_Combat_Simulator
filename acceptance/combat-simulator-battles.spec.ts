import { test, expect, type Page } from '@playwright/test'
import { armies, fillArmies } from './helpers'

function waitForFight(page: Page) {
  return page.waitForResponse((r) => r.url().endsWith('/api/fight') && r.request().method() === 'POST')
}

// Scoped to the form because Next renders its own empty role="alert" route announcer on every page.
const alert = (page: Page) => page.locator('#fight-form').getByRole('alert')

const heading = (page: Page, name: string) => page.getByRole('heading', { name, exact: true })

const battlesInput = (page: Page) => page.locator('input[name="battles"]')

const SYNTHETIC = {
  battles: 40,
  outcomes: {
    attacker: { count: 10, frequency: 0.25 },
    defender: { count: 20, frequency: 0.5 },
    tie: { count: 6, frequency: 0.15 },
    extra: { count: 4, frequency: 0.1 },
  },
  rounds: { mean: 3.5, median: 3, p10: 1, p90: 6 },
  survivors: {
    attacker: [{ regulars: 2, elites: 1, count: 10, frequency: 1 }],
    defender: [
      { regulars: 3, elites: 0, count: 15, frequency: 0.75 },
      { regulars: 1, elites: 1, count: 5, frequency: 0.25 },
    ],
  },
  hitsPerRound: {
    attacker: [0.5, 0.25, 0.125, 0.0625, 0.03125, 0.03125],
    defender: [0.1, 0.2, 0.3, 0.2, 0.1, 0.1],
  },
}

test.beforeEach(async ({ page }) => {
  await page.goto('/apps/combat-simulator')
  await page.waitForLoadState('networkidle')
})

test('the battles input defaults to 1000 with 1-100000 bounds', async ({ page }) => {
  const input = battlesInput(page)
  await expect(input).toHaveValue('1000')
  await expect(input).toHaveAttribute('type', 'number')
  await expect(input).toHaveAttribute('min', '1')
  await expect(input).toHaveAttribute('max', '100000')
  await expect(input).not.toHaveAttribute('required', /.*/)
  await expect(page.getByLabel('Battles')).toBeVisible()
})

test('a valid submit posts battles and renders every results section with the response numbers', async ({ page }) => {
  await fillArmies(page, armies([5, 2, 1], [3, 3, 0]))
  await battlesInput(page).fill('250')
  const fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  const response = await fight
  expect(response.status()).toBe(200)
  expect(response.request().postDataJSON().battles).toBe('250')
  const body = await response.json()
  expect(body.battles).toBe(250)

  for (const name of ['Army Results', 'Fighting Stats', 'Surviving Units', 'Hits per Round']) {
    await expect(heading(page, name)).toBeVisible()
  }
  await expect(alert(page)).toHaveCount(0)
  await expect(page.getByText('Battles: 250')).toBeVisible()

  const winsRow = (label: string) => page.getByRole('row', { name: new RegExp(`^${label}`) })
  for (const [kind, label] of [['attacker', 'Attacker wins'], ['defender', 'Defender wins'], ['tie', 'Tie']] as const) {
    const { count, frequency } = body.outcomes[kind]
    await expect(winsRow(label)).toContainText(String(count))
    await expect(winsRow(label)).toContainText(`${(100 * frequency).toFixed(1)}%`)
  }
})

test('outcome rows follow the response keys, with the raw key for an unknown kind', async ({ page }) => {
  await page.route('**/api/fight', (route) => route.fulfill({ status: 200, json: SYNTHETIC }))
  await fillArmies(page, armies([5, 2, 1], [3, 3, 0]))
  await page.getByRole('button', { name: 'Fight!' }).click()
  await expect(heading(page, 'Fighting Stats')).toBeVisible()

  const outcomeTable = page.locator('table', { has: page.getByRole('columnheader', { name: 'Outcome' }) })
  const rows = outcomeTable.locator('tbody tr')
  await expect(rows).toHaveCount(4)
  const expected = [
    ['Attacker wins', '10', '25.0%'],
    ['Defender wins', '20', '50.0%'],
    ['Tie', '6', '15.0%'],
    ['extra', '4', '10.0%'],
  ]
  for (let i = 0; i < expected.length; i++) {
    await expect(rows.nth(i).locator('th, td')).toHaveText(expected[i])
  }
  await expect(alert(page)).toHaveCount(0)
})

test('survivor tables list each side with its win shares, and a side with no wins says so', async ({ page }) => {
  const noDefenderWins = {
    ...SYNTHETIC,
    survivors: { attacker: SYNTHETIC.survivors.attacker, defender: [] },
  }
  await page.route('**/api/fight', (route) => route.fulfill({ status: 200, json: noDefenderWins }))
  await fillArmies(page, armies([5, 2, 1], [3, 3, 0]))
  await page.getByRole('button', { name: 'Fight!' }).click()
  await expect(heading(page, 'Surviving Units')).toBeVisible()

  const survivorTable = (side: string) => page.locator('table', { has: page.locator('caption', { hasText: side }) })
  await expect(survivorTable('Attack').locator('tbody tr')).toHaveText(/2\s*1\s*10\s*100\.0%/)
  await expect(survivorTable('Defense').locator('tbody tr')).toHaveText('no wins')
})

test('hits per round shows six rows with attack and defense percents', async ({ page }) => {
  await page.route('**/api/fight', (route) => route.fulfill({ status: 200, json: SYNTHETIC }))
  await fillArmies(page, armies([5, 2, 1], [3, 3, 0]))
  await page.getByRole('button', { name: 'Fight!' }).click()
  await expect(heading(page, 'Hits per Round')).toBeVisible()

  const table = page.locator('table', { has: page.getByRole('columnheader', { name: 'Hits' }) })
  const rows = table.locator('tbody tr')
  await expect(rows).toHaveCount(6)
  await expect(rows.nth(0).locator('th, td')).toHaveText(['0', '50.0%', '10.0%'])
  await expect(rows.nth(2).locator('th, td')).toHaveText(['2', '12.5%', '30.0%'])
  await expect(rows.nth(5).locator('th, td')).toHaveText(['5', '3.1%', '10.0%'])
})

test('Army Results shows the submitted armies and ignores form edits until the next submit', async ({ page }) => {
  await fillArmies(page, armies([4, 2, 3], [1, 6, 2]))
  let fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fight).status()).toBe(200)

  const armyTable = page.locator('table', { has: page.getByRole('columnheader', { name: 'Army Type' }) })
  const rowCells = (side: string) => armyTable.getByRole('row', { name: new RegExp(`^${side}`) }).locator('th, td')
  await expect(rowCells('Attack')).toHaveText(['Attack', 'Shadow', '4', '2', '3'])
  await expect(rowCells('Defense')).toHaveText(['Defense', 'Free', '1', '6', '2'])

  await fillArmies(page, armies([0, 7, 0], [2, 5, 4]))
  await battlesInput(page).fill('7')
  await expect(rowCells('Attack')).toHaveText(['Attack', 'Shadow', '4', '2', '3'])
  await expect(rowCells('Defense')).toHaveText(['Defense', 'Free', '1', '6', '2'])

  fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fight).status()).toBe(200)
  await expect(rowCells('Attack')).toHaveText(['Attack', 'Shadow', '0', '7', '0'])
  await expect(rowCells('Defense')).toHaveText(['Defense', 'Free', '2', '5', '4'])
})

test('clearing battles shows the server error and no results', async ({ page }) => {
  await fillArmies(page, armies([3, 1, 1], [3, 1, 1]))
  await battlesInput(page).fill('')
  const fight = waitForFight(page)
  await page.getByRole('button', { name: 'Fight!' }).click()
  const response = await fight
  expect(response.status()).toBe(400)
  const { error } = await response.json()
  expect(error).toContain('battles')
  await expect(alert(page)).toHaveText(error)
  await expect(heading(page, 'Army Results')).toHaveCount(0)
})
