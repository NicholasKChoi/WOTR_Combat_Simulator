import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { chromium } from '@playwright/test'

const USAGE = 'usage: npm run smoke:preview -- <url>'
const BYPASS_HEADER = 'x-vercel-protection-bypass'
const SAVED_BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const DURATION_SECONDS = 1200
const FETCH_TIMEOUT_MS = 15_000
const OPEN_TIMEOUT_MS = 30_000
const BUILDS_PATH = '/api/aoe4-build-order/builds'
const PAGE_PATH = '/apps/aoe4-build-order'
const FIXTURE = new URL('../data/aoe4-build-order/builds/english-1tc.json', import.meta.url)

class StepFailure extends Error {
  constructor(step, reason) {
    super(reason)
    this.step = step
  }
}

class MissingSecret extends Error {}

function parseOrigin(arg) {
  try {
    const url = new URL(arg)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null
  } catch {
    return null
  }
}

const origin = parseOrigin(process.argv[2])
if (!origin) {
  console.error(USAGE)
  process.exit(2)
}

const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const authHeaders = secret ? { [BYPASS_HEADER]: secret } : {}

async function request(step, method, path, body) {
  try {
    const res = await fetch(origin + path, {
      method,
      headers: body === undefined ? authHeaders : { ...authHeaders, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      json = undefined
    }
    return { status: res.status, json }
  } catch (err) {
    throw new StepFailure(step, err instanceof Error ? err.message : 'request failed')
  }
}

const statusReason = (res) =>
  typeof res.json?.error === 'string' ? `status ${res.status}: ${res.json.error}` : `status ${res.status}`

async function save(sent) {
  const res = await request('save', 'POST', BUILDS_PATH, sent)
  if (!secret && (res.status === 401 || res.status === 403)) throw new MissingSecret()
  const id = res.json?.id
  if ((res.status !== 201 && res.status !== 200) || typeof id !== 'string' || !SAVED_BUILD_ID_PATTERN.test(id)) {
    throw new StepFailure('save', statusReason(res))
  }
  console.log(`PASS save: ${res.status} ${id}`)
  return id
}

async function readBack(id, sent) {
  const res = await request('read back', 'GET', `${BUILDS_PATH}/${id}`)
  if (res.status !== 200) throw new StepFailure('read back', statusReason(res))
  for (const key of ['buildOrder', 'durationSeconds']) {
    if (!isDeepStrictEqual(res.json?.[key], sent[key])) throw new StepFailure('read back', `${key} differs from what was saved`)
  }
  console.log('PASS read back')
}

function routeBypassToOrigin(context) {
  return context.route('**/*', (route) => {
    const req = route.request()
    const sameOrigin = new URL(req.url()).origin === origin
    return route.continue(sameOrigin ? { headers: { ...req.headers(), ...authHeaders } } : {})
  })
}

async function launch() {
  try {
    return await chromium.launch()
  } catch (err) {
    const message = err instanceof Error ? err.message.split('\n')[0] : 'launch failed'
    throw new StepFailure('open', `could not launch Chromium (${message}); run npm run acceptance:setup`)
  }
}

async function open(id) {
  const browser = await launch()
  try {
    const context = await browser.newContext()
    if (secret) await routeBypassToOrigin(context)
    const page = await context.newPage()
    const deadline = Date.now() + OPEN_TIMEOUT_MS
    const remaining = () => Math.max(deadline - Date.now(), 1)
    await page.goto(`${origin}${PAGE_PATH}?b=${encodeURIComponent(id)}`, { timeout: remaining() })
    await page.waitForFunction(
      (suffix) => {
        const select = document.querySelector('[data-testid="build-order-select"]')
        const status = document.querySelector('[data-testid="auto-run-status"]')
        return (
          select instanceof HTMLSelectElement &&
          Array.from(select.selectedOptions).some((o) => (o.textContent ?? '').includes(suffix)) &&
          status?.getAttribute('data-status') === 'current'
        )
      },
      `(${id})`,
      { timeout: remaining() },
    )
    await page.getByTestId('chart-units-produced').waitFor({ state: 'visible', timeout: remaining() })
    console.log('PASS open')
  } catch (err) {
    if (err instanceof StepFailure) throw err
    throw new StepFailure('open', err instanceof Error ? err.message.split('\n')[0] : 'page did not load')
  } finally {
    await browser.close()
  }
}

const sendDelete = (id) => request('delete', 'DELETE', `${BUILDS_PATH}/${id}`)

async function deleteStep(id) {
  const res = await sendDelete(id)
  if (res.status === 405) throw new StepFailure(null, 'FAIL production deployment: delete is disabled')
  // No re-read: GET is cached as immutable, so a deleted build can still be served from the CDN.
  if (res.status !== 204) throw new StepFailure('delete', statusReason(res))
  console.log('PASS delete')
}

function report(err) {
  if (err instanceof StepFailure) {
    console.log(err.step === null ? err.message : `FAIL ${err.step}: ${err.message}`)
  } else {
    console.log(`FAIL smoke: ${err instanceof Error ? err.message : 'unexpected error'}`)
  }
}

async function main() {
  const sent = { buildOrder: JSON.parse(readFileSync(FIXTURE, 'utf8')), durationSeconds: DURATION_SECONDS }
  let id
  let deleteAttempted = false
  try {
    id = await save(sent)
    await readBack(id, sent)
    await open(id)
    deleteAttempted = true
    await deleteStep(id)
  } catch (err) {
    process.exitCode = 1
    if (err instanceof MissingSecret) {
      console.error('set VERCEL_AUTOMATION_BYPASS_SECRET')
      process.exitCode = 2
    } else {
      report(err)
    }
  } finally {
    if (id !== undefined && !deleteAttempted) await cleanUp(id)
  }
}

async function cleanUp(id) {
  try {
    const res = await sendDelete(id)
    if (res.status !== 204) throw new StepFailure('delete', statusReason(res))
  } catch (err) {
    report(err)
  }
}

await main()
