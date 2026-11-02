import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const KIND_ORDER = ['age-up', 'economy', 'unit-tier', 'blacksmith', 'other']

test.describe.configure({ timeout: 60_000 })

type Marker = { kind: string; label: string; at: number }
type Body = {
  durationSeconds: number
  ages: { age: number; reachedAt: number }[]
  markers: Marker[]
  steps: { status: string; completedAt: number | null }[]
}

async function simulate(request: Parameters<typeof postSimulate>[0], body: unknown): Promise<Body> {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

function expectSorted(markers: Marker[]) {
  const key = (m: Marker) => [m.at, KIND_ORDER.indexOf(m.kind), m.label] as const
  for (let i = 1; i < markers.length; i++) {
    const [a, b] = [key(markers[i - 1]), key(markers[i])]
    const ordered = a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] <= b[2])))
    expect(ordered, `markers[${i - 1}] before markers[${i}]`).toBe(true)
  }
}

const withHorizon = (durationSeconds: number) => ({ buildOrder: english1tc, inputs: { durationSeconds } })
const villager = english1tc.steps[0]

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: 'start 6 sheep -> sheep' }, WARM_UP_TIMEOUT_MS)
})

test.describe('markers on the prebuilt English build', () => {
  test('lists Feudal first at the age reachedAt, the same-instant techs by label, then the later blacksmith techs; no start-age marker', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    expect(body.ages.map((a) => a.age)).toEqual([1, 2])
    const feudalAt = body.ages[1].reachedAt
    expect(feudalAt).toBeCloseTo(262.5667, 3)

    expect(body.markers[0]).toEqual({ kind: 'age-up', label: 'Feudal', at: feudalAt })
    expect(body.markers.filter((m) => m.kind === 'age-up')).toHaveLength(1)

    const stepAt = (i: number) => body.steps[i].completedAt!
    expect(english1tc.steps.slice(14, 16).map((s) => (s as { tech: string }).tech)).toEqual(['horticulture', 'double-broadax'])
    expect(stepAt(14)).toBe(stepAt(15))
    expect(body.markers.slice(1)).toEqual([
      { kind: 'economy', label: 'double-broadax', at: stepAt(15) },
      { kind: 'economy', label: 'horticulture', at: stepAt(14) },
      { kind: 'blacksmith', label: 'steeled-arrow', at: stepAt(22) },
      { kind: 'blacksmith', label: 'iron-undermesh', at: stepAt(23) },
    ])
  })

  test('orders same-instant techs by label even when the step order is the reverse', async ({ request }) => {
    const steps = [...english1tc.steps]
    steps[14] = { action: 'research', tech: 'specialized-pick' }
    steps[15] = { action: 'research', tech: 'double-broadax' }
    const body = await simulate(request, { buildOrder: { ...english1tc, steps } })
    expect(body.steps[14].completedAt).toBe(body.steps[15].completedAt)
    const pair = body.markers.filter((m) => m.at === body.steps[14].completedAt)
    expect(pair.map((m) => [m.kind, m.label])).toEqual([
      ['economy', 'double-broadax'],
      ['economy', 'specialized-pick'],
    ])
  })

  test('has exactly one marker per completed research, at that step completedAt', async ({ request }) => {
    const body = await simulate(request, { buildOrder: english1tc })
    const techs = english1tc.steps
      .map((s, i) => ({ s: s as { action: string; tech?: string }, i }))
      .filter(({ s }) => s.action === 'research')
    const completed = techs.filter(({ i }) => body.steps[i].status === 'completed')
    expect(completed).toHaveLength(4)
    const research = body.markers.filter((m) => m.kind !== 'age-up')
    expect(research).toHaveLength(completed.length)
    for (const { s, i } of completed) {
      const matches = research.filter((m) => m.label === s.tech)
      expect(matches, s.tech).toHaveLength(1)
      expect(matches[0].at).toBe(body.steps[i].completedAt)
    }
  })

  test('is sorted, within the horizon, and identical on a repeated request', async ({ request }) => {
    const first = await simulate(request, { buildOrder: english1tc })
    const second = await simulate(request, { buildOrder: english1tc })
    expectSorted(first.markers)
    expect(first.markers.length).toBeGreaterThan(1)
    for (const m of first.markers) expect(m.at).toBeLessThanOrEqual(first.durationSeconds)
    expect(second.markers).toEqual(first.markers)
  })

  test('classifies a tech with no other class as other', async ({ request }) => {
    const steps = [...english1tc.steps, { action: 'research', tech: 'textiles' }, { action: 'research', tech: 'professional-scouts' }]
    const body = await simulate(request, { buildOrder: { ...english1tc, steps }, inputs: { durationSeconds: 1800 } })
    expect(body.markers.slice(-2)).toEqual([
      { kind: 'other', label: 'textiles', at: body.steps[24].completedAt },
      { kind: 'other', label: 'professional-scouts', at: body.steps[25].completedAt },
    ])
    expectSorted(body.markers)
  })
})

test.describe('markers at a truncated horizon', () => {
  test('is empty while the landmark is still under construction', async ({ request }) => {
    const body = await simulate(request, withHorizon(200))
    expect(body.ages).toEqual([{ age: 1, reachedAt: 0 }])
    expect(body.markers).toEqual([])
  })

  test('keeps Feudal and drops the techs finishing after the horizon', async ({ request }) => {
    const body = await simulate(request, withHorizon(300))
    expect(body.markers.map((m) => m.label)).toEqual(['Feudal'])
    expect(body.markers[0].at).toBe(body.ages[1].reachedAt)
  })

  test('gives no marker to research still in progress, then marks it once the horizon passes the completion', async ({ request }) => {
    const before = await simulate(request, withHorizon(408))
    expect(before.steps.slice(14, 16).map((s) => s.status)).toEqual(['in-progress', 'in-progress'])
    expect(before.markers.map((m) => m.label)).toEqual(['Feudal'])

    const after = await simulate(request, withHorizon(409))
    expect(after.steps.slice(14, 16).map((s) => s.status)).toEqual(['completed', 'completed'])
    expect(after.markers.map((m) => m.label)).toEqual(['Feudal', 'double-broadax', 'horticulture'])
    for (const m of after.markers) expect(m.at).toBeLessThanOrEqual(409)
  })
})

test.describe('markers for research that never starts', () => {
  const options = { inputs: { durationSeconds: 600 } }

  test('a tech waiting on an age that is never reached gives markers []', async ({ request }) => {
    const body = await simulate(request, { buildOrder: { ...english1tc, steps: [villager, { action: 'research', tech: 'textiles' }] }, ...options })
    expect(body.steps[1].status).toBe('waiting')
    expect(body.markers).toEqual([])
  })

  test('techs queued behind unfinished work are not-reached and give markers []', async ({ request }) => {
    const steps = [villager, { action: 'research', tech: 'bloomery' }, { action: 'research', tech: 'admiralty' }]
    const body = await simulate(request, { buildOrder: { civ: 'english', name: 'Queued', start: { villagers: { sheep: 6 }, rally: 'sheep' }, steps } })
    expect(body.steps.slice(1).map((s) => s.status)).toEqual(['waiting', 'not-reached'])
    expect(body.markers).toEqual([])
  })
})
