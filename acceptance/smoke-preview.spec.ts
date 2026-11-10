import { execFile } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { createServer, type IncomingHttpHeaders, type Server } from 'http'
import type { AddressInfo } from 'net'
import { tmpdir } from 'os'
import path from 'path'
import { test, expect } from '@playwright/test'

const SCRIPT = path.resolve('scripts/smoke-preview.mjs')
const BUILD = JSON.parse(readFileSync(path.resolve('data/aoe4-build-order/builds/english-1tc.json'), 'utf8'))
const ID = 'AbCdEfGhIj_'
const SENTINEL = 'sentinel-secret-7f3a91'
const BYPASS_HEADER = 'x-vercel-protection-bypass'
const BUILDS = '/api/aoe4-build-order/builds'
const PAGE = '/apps/aoe4-build-order'
const USAGE = 'usage: npm run smoke:preview -- <url>'

interface Recorded {
  method: string
  url: string
  headers: IncomingHttpHeaders
}

interface Reply {
  status: number
  json?: unknown
}

interface StubOptions {
  saveStatuses?: number[]
  save?: Reply
  read?: (stored: unknown) => Reply
  deleteStatus?: number
  keepAfterDelete?: boolean
  pageOption?: string
}

interface AssetStub {
  origin: string
  requests: Recorded[]
}

interface Stub {
  origin: string
  requests: Recorded[]
  posted: unknown[]
}

interface Outcome {
  code: number
  stdout: string
  stderr: string
}

const stubs: Server[] = []
const outputs: string[] = []

async function listen(handler: Parameters<typeof createServer>[1]): Promise<{ origin: string; server: Server }> {
  const server = createServer(handler)
  stubs.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, server }
}

function pageHtml(option: string, assetOrigin: string) {
  return `<!doctype html><select data-testid="build-order-select"><option>ENG Knight</option><option selected>${option}</option></select>
<div data-testid="auto-run-status" data-status="current"></div>
<div data-testid="chart-units-produced" style="width:200px;height:100px"></div>
<script src="${assetOrigin}/asset.js"></script>`
}

async function startAssetStub(): Promise<AssetStub> {
  const requests: Recorded[] = []
  const { origin } = await listen((req, res) => {
    requests.push({ method: req.method ?? '', url: req.url ?? '', headers: req.headers })
    res.writeHead(200, { 'Content-Type': 'text/javascript' }).end('')
  })
  return { origin, requests }
}

async function startStub(options: StubOptions, assetOrigin: string): Promise<Stub> {
  const requests: Recorded[] = []
  const posted: unknown[] = []
  let saves = 0
  let deleted = false
  const { origin } = await listen((req, res) => {
    const method = req.method ?? ''
    const url = req.url ?? ''
    requests.push({ method, url, headers: req.headers })
    const send = ({ status, json }: Reply) =>
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(json === undefined ? undefined : JSON.stringify(json))
    if (method === 'POST' && url === BUILDS) {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        posted.push(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        deleted = false
        const status = options.saveStatuses?.[saves++] ?? 201
        send(options.save ?? { status, json: { id: ID, path: `${PAGE}?b=${ID}` } })
      })
    } else if (method === 'GET' && url === `${BUILDS}/${ID}`) {
      if (deleted && !options.keepAfterDelete) return send({ status: 404, json: { error: 'not found' } })
      const stored = { ...(posted.at(-1) as object), id: ID }
      send(options.read?.(stored) ?? { status: 200, json: stored })
    } else if (method === 'DELETE' && url === `${BUILDS}/${ID}`) {
      deleted = true
      send({ status: options.deleteStatus ?? 204 })
    } else if (method === 'GET' && url === `${PAGE}?b=${ID}`) {
      res.writeHead(200, { 'Content-Type': 'text/html' }).end(pageHtml(options.pageOption ?? `ENG 1TC (${ID})`, assetOrigin))
    } else {
      res.writeHead(404).end()
    }
  })
  return { origin, requests, posted }
}

function run(args: string[], env: Record<string, string | undefined>, cwd?: string): Promise<Outcome> {
  const childEnv = { ...process.env, ...env }
  for (const key of Object.keys(childEnv)) if (childEnv[key] === undefined) delete childEnv[key]
  return new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT, ...args], { env: childEnv, cwd }, (error, stdout, stderr) => {
      outputs.push(stdout, stderr)
      resolve({ code: error ? Number((error as { code?: number }).code) : 0, stdout, stderr })
    })
  })
}

const lines = (out: Outcome) => out.stdout.split('\n').filter(Boolean)
const summary = (stub: Stub) =>
  stub.requests.filter((r) => r.url !== '/favicon.ico').map((r) => `${r.method} ${r.url}`)

const PASS_LINES = [`PASS save: 201 ${ID}`, 'PASS read back', 'PASS open', 'PASS delete']
const POST = `POST ${BUILDS}`
const GET = `GET ${BUILDS}/${ID}`
const DELETE = `DELETE ${BUILDS}/${ID}`
const OPEN = `GET ${PAGE}?b=${ID}`

interface Row {
  name: string
  stub?: StubOptions
  secret?: string | null
  timeout?: number
  check: (out: Outcome, stub: Stub, assets: AssetStub) => void
}

const ROWS: Row[] = [
  {
    name: 'all steps pass',
    check: (out, stub) => {
      expect(out.code).toBe(0)
      expect(lines(out)).toEqual(PASS_LINES)
      expect(summary(stub)).toEqual([POST, GET, OPEN, DELETE])
      expect(stub.posted).toEqual([{ buildOrder: BUILD, durationSeconds: 1200 }])
    },
  },
  {
    name: 'secret set is sent and never printed',
    check: (out, stub, assets) => {
      expect(out.code).toBe(0)
      expect(summary(stub)).toHaveLength(4)
      for (const request of stub.requests) expect(request.headers[BYPASS_HEADER]).toBe(SENTINEL)
      expect(assets.requests.filter((r) => r.url === '/asset.js')).toHaveLength(1)
      for (const request of assets.requests) expect(request.headers[BYPASS_HEADER]).toBeUndefined()
    },
  },
  {
    name: 'secret unset, first response 401',
    secret: null,
    stub: { save: { status: 401 } },
    check: expectProtected,
  },
  {
    name: 'secret unset, first response 403',
    secret: null,
    stub: { save: { status: 403 } },
    check: expectProtected,
  },
  {
    name: 'secret set, first response 401',
    stub: { save: { status: 401 } },
    check: (out) => {
      expect(out.code).toBe(1)
      expect(lines(out).filter((l) => l.startsWith('FAIL save:') && l.includes('401'))).toHaveLength(1)
    },
  },
  {
    name: 'save fails',
    stub: { save: { status: 400, json: { error: 'x' } } },
    check: (out, stub) => {
      expect(out.code).toBe(1)
      expect(lines(out)).toEqual(['FAIL save: status 400: x'])
      expect(summary(stub)).toEqual([POST])
    },
  },
  {
    name: 'read back differs',
    stub: { read: (stored) => ({ status: 200, json: { ...(stored as object), durationSeconds: 900 } }) },
    check: (out, stub) => {
      expect(out.code).toBe(1)
      expect(lines(out).map((l) => l.split(':')[0])).toEqual(['PASS save', 'FAIL read back'])
      expect(summary(stub)).toEqual([POST, GET, DELETE])
    },
  },
  {
    name: 'open fails',
    timeout: 90_000,
    stub: { pageOption: 'ENG 1TC (other)' },
    check: (out, stub) => {
      expect(out.code).toBe(1)
      expect(lines(out).map((l) => l.split(':')[0])).toEqual(['PASS save', 'PASS read back', 'FAIL open'])
      expect(summary(stub).at(-1)).toBe(DELETE)
    },
  },
  {
    name: 'delete refused in production',
    stub: { deleteStatus: 405 },
    check: (out) => {
      expect(out.code).toBe(1)
      expect(lines(out)).toEqual([...PASS_LINES.slice(0, 3), 'FAIL production deployment: delete is disabled'])
    },
  },
  {
    name: 'a cached read after delete does not fail the run',
    stub: { keepAfterDelete: true },
    check: (out, stub) => {
      expect(out.code).toBe(0)
      expect(lines(out)).toEqual(PASS_LINES)
      expect(summary(stub)).toEqual([POST, GET, OPEN, DELETE])
    },
  },
]

function expectProtected(out: Outcome, stub: Stub) {
  expect(out.code).toBe(2)
  expect(out.stderr).toContain('set VERCEL_AUTOMATION_BYPASS_SECRET')
  expect(out.stdout).toBe('')
  expect(summary(stub)).toEqual([POST])
}

test.afterEach(async () => {
  for (const output of outputs.splice(0)) expect(output).not.toContain(SENTINEL)
  await Promise.all(stubs.splice(0).map((server) => new Promise((resolve) => server.close(resolve)).catch(() => {})))
})

for (const row of ROWS) {
  test(row.name, async () => {
    if (row.timeout) test.setTimeout(row.timeout)
    const assets = await startAssetStub()
    const stub = await startStub(row.stub ?? {}, assets.origin)
    const env = { VERCEL_AUTOMATION_BYPASS_SECRET: row.secret === null ? undefined : (row.secret ?? SENTINEL) }
    const out = await run([stub.origin], env)
    row.check(out, stub, assets)
  })
}

test('repeat run', async () => {
  const assets = await startAssetStub()
  const stub = await startStub({ saveStatuses: [201, 200] }, assets.origin)
  const first = await run([stub.origin], {})
  const second = await run([`${stub.origin}/`], {})
  expect(first.code).toBe(0)
  expect(second.code).toBe(0)
  expect(lines(first)[0]).toBe(`PASS save: 201 ${ID}`)
  expect(lines(second)[0]).toBe(`PASS save: 200 ${ID}`)
})

test('runs from another directory', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'smoke-cwd-'))
  try {
    const assets = await startAssetStub()
    const stub = await startStub({}, assets.origin)
    const out = await run([stub.origin], {}, cwd)
    expect(out.code).toBe(0)
    expect(lines(out)).toEqual(PASS_LINES)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test.describe('usage', () => {
  const CASES: [string, (origin: string) => string[]][] = [
    ['no argument', () => []],
    ['an unparsable url', () => ['not a url']],
    ['a non-http url', (origin) => [origin.replace('http:', 'ftp:')]],
  ]
  for (const [name, args] of CASES) {
    test(name, async () => {
      const assets = await startAssetStub()
      const stub = await startStub({}, assets.origin)
      const out = await run(args(stub.origin), {})
      expect(out.code).toBe(2)
      expect(out.stderr.trim()).toBe(USAGE)
      expect(out.stdout).toBe('')
      expect(stub.requests).toEqual([])
    })
  }
})
