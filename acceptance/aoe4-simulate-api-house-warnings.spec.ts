import { test, expect, type APIRequestContext } from '@playwright/test'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import { buildOrderFrom, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

type Warning = { code: string; severity: string; message: string; step?: number; at: number; seconds?: number }
type Result = { warnings: Warning[] }

const START = { rally: 'sheep' }
const house = (extra: object) => ({ action: 'build', building: 'house', builders: 1, from: 'sheep', ...extra })
// Nobody gathers berries, so the reaction never fires.
const NEVER_FIRES = { trigger: { kind: 'depleted', node: 'berry' }, reaction: true }

function order(steps: unknown[], inputs: object) {
  return { buildOrder: { civ: 'english', name: 'House warnings', start: START, steps }, inputs }
}

async function simulate(request: APIRequestContext, body: unknown): Promise<Result> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const houseWarnings = (result: Result) => result.warnings.filter((w) => w.code.startsWith('auto-houses'))

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: buildOrderFrom('start 6 sheep -> sheep') }, WARM_UP_TIMEOUT_MS)
})

test.describe('auto-house warnings through the simulate API', () => {
  test('a house that starts at 300 s holds production at the supply limit from 60 s for 240 s', async ({ request }) => {
    const result = await simulate(request, order([house({ trigger: { kind: 'time', seconds: 300 } })], { durationSeconds: 400 }))
    expect(houseWarnings(result)).toEqual([
      {
        code: 'auto-houses-held',
        severity: 'warning',
        message: 'production was held at the supply limit for 4:00 from 1:00 while auto-houses waited for step 1 (build house) to start.',
        step: 0,
        at: 60,
        seconds: 240,
      },
    ])
  })

  test('a reaction house that never fires warns that auto-houses never start, then reports the held production', async ({ request }) => {
    const result = await simulate(request, order([house(NEVER_FIRES)], { durationSeconds: 400 }))
    expect(houseWarnings(result)).toEqual([
      {
        code: 'auto-houses-never-start',
        severity: 'warning',
        message: 'auto-houses never start: they wait for step 1 (build house), a reaction that did not fire by 6:40, so no auto-house is built.',
        step: 0,
        at: 0,
      },
      expect.objectContaining({ code: 'auto-houses-held', step: 0, at: 60, seconds: 340 }),
    ])
  })

  for (const [name, step] of [
    ['a late house', house({ trigger: { kind: 'time', seconds: 300 } })],
    ['a reaction house that never fires', house(NEVER_FIRES)],
  ] as const) {
    test(`with autoHouses off ${name} produces neither warning`, async ({ request }) => {
      const result = await simulate(request, order([step], { durationSeconds: 400, autoHouses: false }))
      expect(houseWarnings(result)).toEqual([])
    })
  }

  test('the knight and longbow build at 1800 s reports one held warning on its late house step', async ({ request }) => {
    const result = await simulate(request, { buildOrder: knightLongbow, inputs: { durationSeconds: 1800 } })
    expect(houseWarnings(result)).toEqual([
      expect.objectContaining({ code: 'auto-houses-held', severity: 'warning', step: 23, at: expect.closeTo(461.819, 3), seconds: expect.closeTo(21.236, 3) }),
    ])
  })
})
