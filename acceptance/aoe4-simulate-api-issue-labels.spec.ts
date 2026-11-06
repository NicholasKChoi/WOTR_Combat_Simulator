import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, type APIRequestContext } from '@playwright/test'
import { SIMULATE_PATH, postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
test.describe.configure({ timeout: 60_000 })
const WARM_UP_TIMEOUT_MS = 60_000

const VILLAGER = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const cut = (key: string) => (key.length > 40 ? `${key.slice(0, 40)}...` : key)

type Issue = { code: string; message: string; step?: number }

async function issuesOf(request: APIRequestContext, body: unknown): Promise<Issue[]> {
  const response = await postSimulate(request, body, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(400)
  return ((await response.json()) as { issues: Issue[] }).issues
}

const withStart = (start: object, inputs?: object) => ({
  buildOrder: { civ: 'english', name: 'Test', start, steps: [VILLAGER] },
  ...(inputs ? { inputs } : {}),
})

const KEY_SITES: [string, (key: string) => object, (shown: string) => string][] = [
  ['inputs.trips', (key) => withStart({ villagers: { sheep: 6 }, rally: 'sheep' }, { trips: { [key]: {} } }), (shown) => `inputs.trips.${shown}: unknown node "${shown}"`],
  ['inputs.influenceCoverage', (key) => withStart({ villagers: { sheep: 6 }, rally: 'sheep' }, { influenceCoverage: { [key]: 1 } }), (shown) => `inputs.influenceCoverage.${shown}: unknown building "${shown}"`],
  ['inputs.nodeAmounts', (key) => withStart({ villagers: { sheep: 6 }, rally: 'sheep' }, { nodeAmounts: { [key]: 1 } }), (shown) => `inputs.nodeAmounts.${shown}: unknown node "${shown}"`],
  ['start.villagers', (key) => withStart({ villagers: { [key]: '6' }, rally: 'sheep' }), (shown) => `start: start.villagers.${shown} must be a number`],
]

test.describe('object keys in issue labels', () => {
  for (const [site, build, expected] of KEY_SITES) {
    for (const length of [39, 40, 41, 5000]) {
      test(`${site}: a ${length}-character key is shown ${length > 40 ? 'cut to 40 characters and "..."' : 'whole'} in the label`, async ({ request }) => {
        const key = 'x'.repeat(length)
        const issues = await issuesOf(request, build(key))
        const matching = issues.filter((issue) => issue.message === expected(cut(key)))
        expect(matching, JSON.stringify(issues.map((issue) => issue.message.slice(0, 120)))).toHaveLength(1)
        for (const issue of issues) expect(issue.message.length).toBeLessThan(200)
      })
    }
  }
})

const spec = JSON.parse(readFileSync(join(__dirname, '..', 'docs', 'api', 'openapi.json'), 'utf8'))
const description: string = spec.paths[SIMULATE_PATH].post.responses['400'].description

const REQUEST_LEVEL: [string, unknown, string][] = [
  ['buildOrder is absent', {}, 'request: missing buildOrder'],
  ['the body has a text key', { text: 'start -> sheep' }, 'request: text is no longer accepted; convert the paste to buildOrder and send that'],
  ['the body is not a JSON object', [1], 'request body: must be a JSON object'],
]

test.describe('request-level messages documented on the 400 response', () => {
  for (const [when, body, message] of REQUEST_LEVEL) {
    test(`when ${when}, the route returns the documented single syntax issue with no step`, async ({ request }) => {
      expect(description).toContain(`"${message}"`)
      const issues = await issuesOf(request, body)
      expect(issues).toEqual([{ code: 'syntax', message }])
    })
  }
})
