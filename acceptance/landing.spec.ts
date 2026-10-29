import { test, expect } from '@playwright/test'

const links = [
  { name: 'Combat Simulator', route: '/apps/combat-simulator' },
  { name: 'Starcraft Helper', route: '/apps/starcraft-helper' },
]

for (const { name, route } of links) {
  test.describe(`landing link "${name}"`, () => {
    test('points at its route, which serves 200', async ({ page, request }) => {
      await page.goto('/')
      const link = page.getByRole('link', { name, exact: true })
      await expect(link).toHaveAttribute('href', route)
      expect((await request.get(route)).status()).toBe(200)
    })

    test('navigates to the app page', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('link', { name, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`${route}$`))
      await expect(page.locator('h1')).toHaveText(name)
    })
  })
}
