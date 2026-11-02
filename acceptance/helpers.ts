import type { APIRequestContext, Page } from '@playwright/test'
import { FINITE_GATHER_NODES, type SimulationResult } from '../lib/aoe4-build-order/model'

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

export const SIMULATE_PATH = '/api/aoe4-build-order/simulate'

// An `inputs.nodeAmounts` that keeps every finite node from running out.
export const INFINITE_NODES = Object.fromEntries(FINITE_GATHER_NODES.map((node) => [node, null]))

export function postSimulate(request: APIRequestContext, body: unknown, timeout = 10_000) {
  return request.post(SIMULATE_PATH, { data: body, timeout })
}

// Playwright JSON-encodes a string `data`, so a raw body (a bare JSON value, malformed JSON) goes as a Buffer.
export function postSimulateRaw(request: APIRequestContext, raw: string, timeout = 10_000) {
  return request.post(SIMULATE_PATH, {
    data: Buffer.from(raw),
    headers: { 'Content-Type': 'application/json' },
    timeout,
  })
}

export const AOE4_PAGE = '/apps/aoe4-build-order'

export async function openPage(page: Page) {
  await page.goto(AOE4_PAGE)
  await page.waitForLoadState('networkidle')
}

export async function runSimulation(page: Page) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith(SIMULATE_PATH) && r.request().method() === 'POST'
  )
  await page.getByTestId('run-simulation').click()
  return response
}

const COMPARE_ROW_KEYS = ['military-600', 'military-900', 'military-1200', 'age-2', 'age-3', 'age-4', 'pop-cap']

// Compare rows with a number on at least one side, in table order.
export function expectedCompareKeys(current: SimulationResult, pinned: SimulationResult): string[] {
  const present = (result: SimulationResult, key: string): boolean => {
    if (key === 'pop-cap') return result.populationCapReachedAt !== null
    if (key.startsWith('age-')) return result.ages.some((a) => `age-${a.age}` === key)
    return result.times.includes(Number(key.slice('military-'.length)))
  }
  return COMPARE_ROW_KEYS.filter((key) => present(current, key) || present(pinned, key))
}
