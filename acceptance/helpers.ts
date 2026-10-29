import type { APIRequestContext, Page } from '@playwright/test'

const FIELDS = [
  'attack-regs',
  'attack-elts',
  'attack-ldrs',
  'defend-regs',
  'defend-elts',
  'defend-ldrs',
] as const

export type Armies = Record<typeof FIELDS[number], string>

export const DEFAULT_ARMIES: Armies = {
  'attack-regs': '3',
  'attack-elts': '1',
  'attack-ldrs': '1',
  'defend-regs': '3',
  'defend-elts': '1',
  'defend-ldrs': '1',
}

export async function fillArmies(page: Page, armies: Armies) {
  for (const field of FIELDS) {
    await page.locator(`select[name="${field}"]`).selectOption(armies[field])
  }
}

export function postFight(request: APIRequestContext, armies: Armies) {
  return request.post('/api/fight', { data: armies })
}
