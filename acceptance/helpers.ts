import { randomUUID } from 'crypto'
import { expect, type APIRequestContext, type Page, type Request, type Response } from '@playwright/test'
import { RESULT_CHART_IDS } from '../components/apps/aoe4-build-order/chart-layout'
import { AUTO_RUN_DEBOUNCE_MS, type AutoRunStatus } from '../components/apps/aoe4-build-order/auto-run'
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
export const CHART_IDS = RESULT_CHART_IDS

// A click on Fight! before React hydrates submits the form natively and reloads the page. React DOM sets a
// `__reactProps$` property on the form element once it attaches onSubmit; the server HTML has none.
export async function openCombatSimulator(page: Page) {
  await page.goto('/apps/combat-simulator')
  await page.waitForFunction(() => {
    const form = document.getElementById('fight-form')
    return form !== null && Object.getOwnPropertyNames(form).some((name) => name.startsWith('__reactProps$'))
  })
}

export const AOE4_PAGE = '/apps/aoe4-build-order'

export async function openPage(page: Page) {
  await page.goto(AOE4_PAGE)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
}

export async function openSavedBuild(page: Page, id: string) {
  await page.goto(`${AOE4_PAGE}?b=${id}`)
  await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'current')
}

// Call just before reloading or leaving an edited page: Playwright dismisses an unhandled dialog, which cancels the unload.
export function acceptBeforeUnload(page: Page): void {
  page.once('dialog', async (dialog) => {
    if (dialog.type() !== 'beforeunload') throw new Error(`Expected a beforeunload dialog, got ${dialog.type()}: ${dialog.message()}`)
    await dialog.accept()
  })
}

export const SPLIT_MIN_WIDTH = 1200
export const TABS_VIEWPORT = { width: 1024, height: 768 }
export const SPLIT_VIEWPORT = { width: 1280, height: 800 }
export const WIDE_VIEWPORT = { width: 1800, height: 900 }

// Decides from the viewport, not the DOM, so it cannot race the first client render.
export async function showTab(page: Page, tab: 'build' | 'results') {
  if ((page.viewportSize()?.width ?? 0) >= SPLIT_MIN_WIDTH) {
    await expect(page.getByTestId(`panel-${tab}`)).toBeVisible()
    return
  }
  await page.getByTestId(`tab-${tab}`).click()
}

export async function showView(page: Page, view: 'text' | 'table') {
  await page.getByTestId(`editor-view-${view}`).click()
}

export function isSimulatePost(r: Request): boolean {
  return r.url().endsWith(SIMULATE_PATH) && r.method() === 'POST'
}

export const bodyDuration = (r: Request): unknown => r.postDataJSON()?.inputs?.durationSeconds

// Holds every matching request until the returned function runs; later matching requests then pass at once.
// Other requests on the path, and held ones once released, go to any route registered earlier.
export async function holdRequests(page: Page, path: string, method: string, matches: (request: Request) => boolean = () => true): Promise<() => void> {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**${path}`, async (route) => {
    const request = route.request()
    if (request.method() !== method || !matches(request)) return route.fallback()
    await gate
    await route.fallback().catch(() => {})
  })
  return release
}

export function holdNextSimulate(page: Page, durationSeconds?: number): Promise<() => void> {
  return holdRequests(page, SIMULATE_PATH, 'POST', durationSeconds === undefined ? undefined : (r) => bodyDuration(r) === durationSeconds)
}

// Registers the wait for the simulate response before `action`, so a response that lands during it is not missed.
export async function waitForRun(page: Page, action?: () => Promise<unknown>, status: AutoRunStatus = 'current'): Promise<Response> {
  const response = page.waitForResponse((r) => isSimulatePost(r.request()))
  await action?.()
  const done = await response
  await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', status)
  return done
}

export async function expectNoRun(page: Page, action?: () => Promise<unknown>): Promise<void> {
  const posted: string[] = []
  const onRequest = (r: Request) => {
    if (isSimulatePost(r)) posted.push(r.url())
  }
  page.on('request', onRequest)
  try {
    await action?.()
    await page.waitForTimeout(AUTO_RUN_DEBOUNCE_MS + 500)
  } finally {
    page.off('request', onRequest)
  }
  expect(posted).toEqual([])
}

// Sets the duration the way typing would, without Playwright scrolling the field into view first.
export async function setDurationInPlace(page: Page, value: string): Promise<void> {
  await page.getByTestId('duration-seconds').evaluate((el, next) => {
    const input = el as HTMLInputElement
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, next)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

export async function scrollInstantly(page: Page, top: number): Promise<number> {
  return page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: 'instant' })
    return window.scrollY
  }, top)
}

// Read after two frames in one evaluate, so a scroll started by the last render has moved the page.
export function settledScrollY(page: Page): Promise<number> {
  return page.evaluate(() => new Promise<number>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.scrollY)))))
}

export async function expectInvalidNoRun(page: Page): Promise<void> {
  await expect(page.getByTestId('auto-run-status')).toHaveAttribute('data-status', 'invalid')
  await expectNoRun(page)
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

export const BUILDS_PATH = '/api/aoe4-build-order/builds'
export const buildPath = (id: string) => `${BUILDS_PATH}/${id}`

export const uniqueClient = (spec: string) => `${spec}-${randomUUID()}`

export function postBuild(request: APIRequestContext, body: unknown, client: string, timeout = 10_000) {
  return request.post(BUILDS_PATH, { data: body, headers: { 'x-forwarded-for': client }, timeout })
}

export const NAMED_BUILDS_PATH = '/api/aoe4-build-order/named-builds'
export const namedBuildUrl = (id: string) => `${NAMED_BUILDS_PATH}/${id}`

export function postNamedBuild(request: APIRequestContext, body: unknown, client: string, timeout = 10_000) {
  return request.post(NAMED_BUILDS_PATH, { data: body, headers: { 'x-forwarded-for': client }, timeout })
}

// `data` may be a Buffer, sent as is, for a raw body.
export function putNamedBuild(request: APIRequestContext, id: string, data: unknown, client: string, headers: Record<string, string>, timeout = 10_000) {
  return request.put(namedBuildUrl(id), { data, headers: { 'Content-Type': 'application/json', ...headers, 'x-forwarded-for': client }, timeout })
}

// Playwright JSON-encodes a string `data`, so a raw body (a bare JSON value, an oversized body) goes as a Buffer.
export function postBuildRaw(request: APIRequestContext, raw: string, client: string, timeout = 10_000) {
  return request.post(BUILDS_PATH, {
    data: Buffer.from(raw),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': client },
    timeout,
  })
}
