import { test, expect } from '@playwright/test'
import { DEFAULT_ARMIES, fillArmies } from './helpers'

test('submitting the form fights and renders results', async ({ page }) => {
  await page.goto('/apps/combat-simulator')
  await page.waitForLoadState('networkidle')
  await fillArmies(page, DEFAULT_ARMIES)

  const fightResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/fight') && r.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'Fight!' }).click()
  expect((await fightResponse).status()).toBe(200)

  await expect(page.getByRole('heading', { name: 'Army Results', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fighting Stats', exact: true })).toBeVisible()
})
