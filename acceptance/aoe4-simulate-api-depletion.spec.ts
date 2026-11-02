import { test, expect } from '@playwright/test'
import { INFINITE_NODES, postSimulate } from './helpers'
import { FINITE_GATHER_NODES } from '../lib/aoe4-build-order/model'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const START_LINE = 'start 6 sheep -> sheep'
const ORDERS: [string, unknown, unknown[]][] = [
  ['the start line alone', { text: START_LINE }, []],
  ['villagers from the town center', { text: [START_LINE, 'produce villager from capital-town-center x3'].join('\n') }, []],
  [
    'a research step above the age',
    { text: [START_LINE, 'produce villager from capital-town-center x3', 'research textiles'].join('\n') },
    [
      {
        code: 'step-stuck',
        severity: 'warning',
        message: 'step 2 (research) was still waiting on prerequisite at 20:00, from 0:00.',
        step: 1,
        waitingOn: 'prerequisite',
        at: 0,
      },
    ],
  ],
  [
    'a JSON order with a custom duration',
    {
      buildOrder: {
        civ: 'english',
        name: 'Villagers',
        start: { villagers: { sheep: 6 }, rally: 'sheep' },
        steps: [{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 5 }],
      },
      inputs: { durationSeconds: 300 },
    },
    [],
  ],
]

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: START_LINE }, WARM_UP_TIMEOUT_MS)
})

test.describe('depletions and warnings with every node infinite', () => {
  for (const [name, body, expected] of ORDERS) {
    test(`${name} returns one null depletion row per finite node and ${expected.length === 0 ? 'no warnings' : 'only its step-stuck warning'}`, async ({ request }) => {
      const { inputs, ...rest } = body as { inputs?: object }
      const response = await postSimulate(request, { ...rest, inputs: { ...inputs, nodeAmounts: INFINITE_NODES } })
      expect(response.status(), await response.text()).toBe(200)
      const result = await response.json()
      expect(result.depletions).toEqual(FINITE_GATHER_NODES.map((node) => ({ node, amount: null, depletedAt: null })))
      expect(result.warnings).toEqual(expected)
    })
  }

  test('the same order twice returns identical depletions and warnings', async ({ request }) => {
    const [first, second] = await Promise.all([postSimulate(request, ORDERS[1][1]), postSimulate(request, ORDERS[1][1])])
    const [a, b] = [await first.json(), await second.json()]
    expect({ depletions: a.depletions, warnings: a.warnings }).toEqual({ depletions: b.depletions, warnings: b.warnings })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
