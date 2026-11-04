import { test, expect } from '@playwright/test'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
test.describe.configure({ timeout: 60_000 })
const WARM_UP_TIMEOUT_MS = 60_000

const START = { villagers: { sheep: 6 }, rally: 'sheep' }
const VILLAGER = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const cut = (n: number) => `${'a'.repeat(40)}${n > 40 ? '...' : ''}`

type Issue = { code: string; message: string }

async function messageOf(request: Parameters<typeof postSimulate>[0], body: { buildOrder: object; inputs?: object }): Promise<string> {
  const response = await postSimulate(request, body, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(400)
  const json = (await response.json()) as { error: string; issues: Issue[] }
  expect(json.issues).toHaveLength(1)
  return json.issues[0].message
}

const order = (steps: unknown[], extra: object = {}) => ({ buildOrder: { civ: 'english', name: 'Test', start: START, steps, ...extra } })

const SITES: [string, (id: string) => { buildOrder: object; inputs?: object }, (quoted: string) => string][] = [
  ['unit', (id) => order([{ action: 'produce', producer: 'capital-town-center', unit: id }]), (q) => `steps[0]: unknown unit "${q}" in unit`],
  ['start rally node', (id) => ({ buildOrder: { civ: 'english', name: 'Test', start: { villagers: { sheep: 6 }, rally: id }, steps: [VILLAGER] } }), (q) => `unknown node "${q}" in start.rally`],
  ['action', (id) => order([{ action: id }]), (q) => `unknown action "${q}"`],
  ['civ', (id) => ({ buildOrder: { civ: id, name: 'Test', start: START, steps: [VILLAGER] } }), (q) => `unknown civ "${q}"`],
  ['trips key', (id) => ({ ...order([VILLAGER]), inputs: { trips: { [id]: 5 } } }), (q) => `unknown node "${q}"`],
]

test.describe('quoted ids in issue messages', () => {
  for (const [site, build, expected] of SITES) {
    for (const length of [40, 41, 500]) {
      test(`${site}: a ${length}-character id is quoted ${length > 40 ? 'cut to 40 characters and "..."' : 'whole'}`, async ({ request }) => {
        const message = await messageOf(request, build('a'.repeat(length)))
        expect(message).toContain(expected(cut(length)))
        if (length > 40) {
          expect(message.replace(/^inputs\.trips\.a+: /, '')).not.toContain('a'.repeat(41))
        }
      })
    }
  }
})

test.describe('warning order', () => {
  test('node warnings come back in time order, not node order', async ({ request }) => {
    const response = await postSimulate(request, {
      buildOrder: { civ: 'english', name: 'Order', start: { villagers: { berry: 1, stone: 3, wood: 2 }, rally: 'wood' }, steps: [{ action: 'pause', producer: 'capital-town-center' }] },
      inputs: { autoHouses: false, nodeAmounts: { berry: 300, stone: 10 } },
    }, WARM_UP_TIMEOUT_MS)
    expect(response.status(), await response.text()).toBe(200)
    const { warnings } = (await response.json()) as { warnings: { at: number; code: string; node?: string }[] }
    const depleted = warnings.filter((w) => w.code === 'node-depleted')
    expect(depleted.map((w) => w.node)).toEqual(['stone', 'berry'])
    const times = warnings.map((w) => w.at)
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })
})
