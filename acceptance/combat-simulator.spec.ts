import { test, expect } from '@playwright/test'
import { DEFAULT_ARMIES, fillArmies, openCombatSimulator, submitFight } from './helpers'

test('submitting the form fights and renders results', async ({ page }) => {
  await openCombatSimulator(page)
  await fillArmies(page, DEFAULT_ARMIES)

  await submitFight(page)

  await expect(page.getByRole('heading', { name: 'Army Results', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fighting Stats', exact: true })).toBeVisible()
})
