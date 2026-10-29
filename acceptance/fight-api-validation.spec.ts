import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { FIELDS, armies, postFight, type FightBody } from './helpers'

const VALID = armies([5, 2, 1], [3, 3, 0])

async function expectNoBattle(response: APIResponse) {
  expect(response.status()).not.toBe(200)
  let body: unknown
  try {
    body = JSON.parse(await response.text())
  } catch {
    return
  }
  if (body && typeof body === 'object') {
    expect(body).not.toHaveProperty('rounds')
    expect(body).not.toHaveProperty('survivor')
  }
}

async function expectRejected(response: APIResponse, errorContains?: string) {
  expect(response.status()).toBe(400)
  await expectNoBattle(response)
  const body = await response.json()
  expect(typeof body.error).toBe('string')
  expect(body.error.length).toBeGreaterThan(0)
  if (errorContains !== undefined) {
    expect(body.error).toContain(errorContains)
  }
  return body.error as string
}

async function expectBattle(response: APIResponse) {
  expect(response.status()).toBe(200)
  const body = await response.json()
  for (const key of ['attack', 'defend', 'rounds', 'averageAttackHitsPerRound', 'averageDefendHitsPerRound', 'survivor']) {
    expect(body).toHaveProperty(key)
  }
  expect(Number.isFinite(body.averageAttackHitsPerRound)).toBe(true)
  expect(Number.isFinite(body.averageDefendHitsPerRound)).toBe(true)
}

function postRaw(request: APIRequestContext, body: string | Buffer, contentType: string) {
  return request.post('/api/fight', { data: body, headers: { 'Content-Type': contentType } })
}

function withField(base: FightBody, key: string, value: unknown): FightBody {
  return { ...base, [key]: value }
}

function without(base: FightBody, key: string): FightBody {
  const copy = { ...base }
  delete copy[key]
  return copy
}

function asNumbers(body: FightBody): FightBody {
  return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, Number(v)]))
}

test.describe('method', () => {
  for (const method of ['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    test(`${method} returns 405 with Allow: POST`, async ({ request }) => {
      const response = await request.fetch('/api/fight', { method, data: method === 'GET' ? undefined : VALID })
      expect(response.status()).toBe(405)
      expect(response.headers()['allow']).toBe('POST')
      const body = await response.json()
      expect(typeof body.error).toBe('string')
      expect(body.error.length).toBeGreaterThan(0)
      await expectNoBattle(response)
    })
  }

  test('HEAD returns 405 with Allow: POST', async ({ request }) => {
    const response = await request.head('/api/fight')
    expect(response.status()).toBe(405)
    expect(response.headers()['allow']).toBe('POST')
  })
})

test.describe('valid fights', () => {
  const cases: [string, FightBody][] = [
    ['5/2/1 vs 3/3/0', VALID],
    ['10/0/5 vs 0/10/5', armies([10, 0, 5], [0, 10, 5])],
    ['10/0/0 vs 1/0/0', armies([10, 0, 0], [1, 0, 0])],
    ['all JSON numbers', asNumbers(VALID)],
    ['all digit strings', VALID],
    ['mixed numbers and strings', { ...VALID, 'attack-regs': 5, 'defend-elts': 3, 'defend-ldrs': 0 }],
    ['leading zeros', { ...VALID, 'attack-regs': '007', 'defend-regs': '03', 'defend-ldrs': '00' }],
    ['leaders not counted toward the cap', armies([6, 4, 5], [6, 4, 5])],
    ['unknown extra keys ignored', { ...VALID, extra: 'ignored' }],
  ]
  for (const [name, body] of cases) {
    test(name, async ({ request }) => {
      await expectBattle(await postFight(request, body))
    })
  }
})

test.describe('field errors', () => {
  const badValues: [string, unknown][] = [
    ['"abc"', 'abc'],
    ['"3abc"', '3abc'],
    ['"2.5"', '2.5'],
    ['""', ''],
    ['"-1"', '-1'],
    ['"1e2"', '1e2'],
    ['" 3"', ' 3'],
    ['"+3"', '+3'],
    ['"3.0"', '3.0'],
    ['"0x3"', '0x3'],
    ['2.5', 2.5],
    ['-1', -1],
    ['true', true],
    ['null', null],
    ['1e21', 1e21],
    ['an object', { n: 3 }],
    ['an array', [3]],
  ]

  for (const key of FIELDS) {
    test(`${key} missing`, async ({ request }) => {
      await expectRejected(await postFight(request, without(VALID, key)), key)
    })
  }

  for (const key of ['attack-elts', 'defend-ldrs']) {
    for (const [label, value] of badValues) {
      test(`${key} = ${label}`, async ({ request }) => {
        await expectRejected(await postFight(request, withField(VALID, key, value)), key)
      })
    }
  }
})

test.describe('body shape', () => {
  for (const raw of ['null', '[]', 'true', '3', '"x"']) {
    test(`JSON body ${raw} is rejected`, async ({ request }) => {
      await expectRejected(await postRaw(request, raw, 'application/json'))
    })
  }

  test('text/plain body is rejected', async ({ request }) => {
    await expectRejected(await postRaw(request, JSON.stringify(VALID), 'text/plain'))
  })

  test('empty JSON body names attack-regs', async ({ request }) => {
    // Playwright does not send an empty string body as an empty application/json request.
    await expectRejected(await postRaw(request, Buffer.alloc(0), 'application/json'), 'attack-regs')
  })

  test('malformed JSON runs no battle', async ({ request }) => {
    const response = await postRaw(request, '{"attack-regs":', 'application/json')
    expect(response.status()).toBe(400)
    await expectNoBattle(response)
  })
})

test.describe('range boundaries', () => {
  for (const side of ['attack', 'defend'] as const) {
    const other = side === 'attack' ? 'defend' : 'attack'
    const make = (counts: [number, number, number]) =>
      side === 'attack' ? armies(counts, [3, 0, 0]) : armies([3, 0, 0], counts)

    test(`${side}: 10 regulars, 10 elites, and 5 leaders are accepted`, async ({ request }) => {
      await expectBattle(await postFight(request, make([10, 0, 0])))
      await expectBattle(await postFight(request, make([0, 10, 0])))
      await expectBattle(await postFight(request, make([3, 0, 5])))
    })

    test(`${side}: 6 leaders names ${side}-ldrs`, async ({ request }) => {
      await expectRejected(await postFight(request, make([3, 0, 6])), `${side}-ldrs`)
    })

    test(`${side}: 11 regulars names ${side}-regs`, async ({ request }) => {
      await expectRejected(await postFight(request, make([11, 0, 0])), `${side}-regs`)
    })

    test(`${side}: 10 regulars + 1 elite names the side`, async ({ request }) => {
      for (const leaders of [0, 5]) {
        const error = await expectRejected(await postFight(request, make([10, 1, leaders])), side)
        expect(error).not.toContain(other)
      }
    })

    test(`${side}: zero fighters names the side`, async ({ request }) => {
      for (const leaders of [0, 5]) {
        const error = await expectRejected(await postFight(request, make([0, 0, leaders])), side)
        expect(error).not.toContain(other)
      }
    })
  }
})

test.describe('error precedence', () => {
  test('PUT with an invalid body is 405', async ({ request }) => {
    const response = await request.put('/api/fight', { data: { 'attack-regs': 'abc' } })
    expect(response.status()).toBe(405)
  })

  test('first invalid field in order wins', async ({ request }) => {
    const body = without(withField(VALID, 'attack-elts', 'abc'), 'defend-regs')
    const error = await expectRejected(await postFight(request, body), 'attack-elts')
    expect(error).not.toContain('defend-regs')
  })

  test('field checks run before side checks', async ({ request }) => {
    await expectRejected(await postFight(request, { ...armies([0, 0, 0], [3, 0, 0]), 'defend-ldrs': 6 }), 'defend-ldrs')
    await expectRejected(await postFight(request, asNumbers(armies([0, 0, 0], [11, 0, 0]))), 'defend-regs')
  })

  test('attack side checks run before defend side checks', async ({ request }) => {
    const error = await expectRejected(await postFight(request, armies([0, 0, 0], [6, 5, 0])), 'attack')
    expect(error).not.toContain('defend')
  })
})

test.describe('large values', () => {
  const large: [string, unknown][] = [
    ['1e9', 1e9],
    ['"999999999"', '999999999'],
    ['a 400-digit string', '9'.repeat(400)],
  ]

  test.beforeAll(async ({ request }) => {
    // next dev compiles the route on first hit, which can take longer than the 1-second budget.
    await postFight(request, VALID)
  })

  for (const [label, value] of large) {
    test(`attack-regs = ${label} is rejected within 1 second`, async ({ request }) => {
      await expectRejected(await postFight(request, withField(VALID, 'attack-regs', value), 1000), 'attack-regs')
    })
  }
})
