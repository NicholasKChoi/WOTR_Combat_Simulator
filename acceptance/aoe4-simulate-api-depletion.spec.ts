import { test, expect } from '@playwright/test'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000

test.describe.configure({ timeout: 60_000 })

const START_LINE = 'start 6 sheep -> sheep'
const ORDERS: [string, unknown][] = [
  ['the start line alone', { text: START_LINE }],
  ['villagers from the town center', { text: [START_LINE, 'produce villager from capital-town-center x3'].join('\n') }],
  ['a research step', { text: [START_LINE, 'produce villager from capital-town-center x3', 'research textiles'].join('\n') }],
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
  ],
]

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: START_LINE }, WARM_UP_TIMEOUT_MS)
})

test.describe('depletions and warnings until the engine reports them', () => {
  for (const [name, body] of ORDERS) {
    test(`${name} returns empty depletions and warnings arrays`, async ({ request }) => {
      const response = await postSimulate(request, body)
      expect(response.status(), await response.text()).toBe(200)
      const result = await response.json()
      expect(result.depletions).toEqual([])
      expect(result.warnings).toEqual([])
    })
  }

  test('the same order twice returns identical depletions and warnings', async ({ request }) => {
    const [first, second] = await Promise.all([postSimulate(request, ORDERS[1][1]), postSimulate(request, ORDERS[1][1])])
    const [a, b] = [await first.json(), await second.json()]
    expect({ depletions: a.depletions, warnings: a.warnings }).toEqual({ depletions: b.depletions, warnings: b.warnings })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
