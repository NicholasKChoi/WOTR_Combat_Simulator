import type { APIRequestContext, Page } from '@playwright/test'

export const FIELDS = [
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

export type FightBody = Partial<Record<typeof FIELDS[number], unknown>> & Record<string, unknown>

export function armies(attack: [number, number, number], defend: [number, number, number]): Armies {
  const [ar, ae, al] = attack.map(String)
  const [dr, de, dl] = defend.map(String)
  return {
    'attack-regs': ar,
    'attack-elts': ae,
    'attack-ldrs': al,
    'defend-regs': dr,
    'defend-elts': de,
    'defend-ldrs': dl,
  }
}

export function postFight(request: APIRequestContext, body: Armies | FightBody, timeout?: number) {
  return request.post('/api/fight', { data: body, timeout })
}
