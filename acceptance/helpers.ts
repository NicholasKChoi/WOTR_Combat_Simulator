import { expect, type APIRequestContext, type Page, type Request } from '@playwright/test'
import { FINITE_GATHER_NODES, type BuildOrder, type SimulationResult } from '../lib/aoe4-build-order/model'
import { buildOrderCatalog, type BuildOrderCatalog } from '../lib/aoe4-build-order/schema'
import { textToBuildOrder } from '../lib/aoe4-build-order/text-to-build'

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

export async function simulateOk<T>(request: APIRequestContext, buildOrder: unknown, durationSeconds: number, timeout?: number): Promise<T> {
  const response = await postSimulate(request, { buildOrder, inputs: { durationSeconds } }, timeout)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

// Playwright JSON-encodes a string `data`, so a raw body (a bare JSON value, malformed JSON) goes as a Buffer.
export function postSimulateRaw(request: APIRequestContext, raw: string, timeout = 10_000) {
  return request.post(SIMULATE_PATH, {
    data: Buffer.from(raw),
    headers: { 'Content-Type': 'application/json' },
    timeout,
  })
}

let catalog: BuildOrderCatalog | undefined

// The game data is required on first call so specs that never convert paste (the WOTR ones) do not load it.
export function buildOrderFrom(text: string): BuildOrder {
  catalog ??= buildOrderCatalog((require('../lib/aoe4-build-order/data') as typeof import('../lib/aoe4-build-order/data')).loadGameData('english'))
  const converted = textToBuildOrder(text, catalog)
  if (converted.ok === false) throw new Error(converted.issues.map((found) => found.message).join('\n'))
  return converted.order
}

export const RESOURCE_CHARTS = ['chart-gather-rates', 'chart-gathered-resources', 'chart-floating-resources'] as const
export const CHART_IDS = ['chart-units-produced', ...RESOURCE_CHARTS] as const

// A veterancy upgrade moves units to a higher-tier series of the same base unit, so sum every series.
export function finalCount(body: { unitsProduced: { baseId: string; counts: number[] }[] }, baseId: string): number {
  return body.unitsProduced.filter((s) => s.baseId === baseId).reduce((sum, s) => sum + (s.counts.at(-1) ?? 0), 0)
}

export const AOE4_PAGE = '/apps/aoe4-build-order'

export async function openPage(page: Page) {
  await page.goto(AOE4_PAGE)
  await page.waitForLoadState('networkidle')
}

export async function showTab(page: Page, tab: 'build' | 'results') {
  await page.getByTestId(`tab-${tab}`).click()
}

export async function showView(page: Page, view: 'text' | 'table') {
  await page.getByTestId(`editor-view-${view}`).click()
}

export async function runSimulation(page: Page) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith(SIMULATE_PATH) && r.request().method() === 'POST'
  )
  await page.getByTestId('run-simulation').click()
  return response
}

// Clicks Run and expects the page to reject the text itself: issues appear under the editor and nothing is posted.
export async function runRejected(page: Page): Promise<void> {
  const posted: string[] = []
  const onRequest = (r: Request) => {
    if (r.url().endsWith(SIMULATE_PATH) && r.method() === 'POST') posted.push(r.url())
  }
  page.on('request', onRequest)
  try {
    await page.getByTestId('run-simulation').click()
    await expect(page.getByTestId('build-order-issues')).toBeVisible()
  } finally {
    page.off('request', onRequest)
  }
  expect(posted).toEqual([])
}

export const INVALID_PASTE = ['start -> sheep', 'at 8 vils fly capital-town-center'].join('\n')

// The one issue INVALID_PASTE (`at 8 vils fly ...` on line 2) must produce, and no server error list.
export async function expectFlySyntaxIssue(page: Page): Promise<void> {
  const issue = page.getByTestId('build-order-issue')
  await expect(issue).toHaveCount(1)
  await expect(issue).toHaveAttribute('data-line', '2')
  await expect(issue).toHaveAttribute('data-code', 'syntax')
  await expect(issue).toContainText('fly')
  await expect(page.getByTestId('simulation-error')).toHaveCount(0)
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

export const hexToRgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`
