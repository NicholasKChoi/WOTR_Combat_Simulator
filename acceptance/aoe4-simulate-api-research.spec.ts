import { test, expect } from '@playwright/test'
import english1tc from '../data/aoe4-build-order/builds/english-1tc.json'
import { postSimulate } from './helpers'

// next dev compiles the route on its first request, which can take longer than a simulation.
const WARM_UP_TIMEOUT_MS = 60_000
const START = { villagers: { sheep: 6 }, rally: 'sheep' }

test.describe.configure({ timeout: 60_000 })

type Note = { code: string; severity: string; message: string; step: number; tech: string; properties: string[] }
type Timing = { step: number; status: string; startedAt: number | null; completedAt: number | null }

async function simulate(request: Parameters<typeof postSimulate>[0], body: unknown) {
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { text: ['start 6 sheep -> sheep', 'produce villager from capital-town-center'].join('\n') }, WARM_UP_TIMEOUT_MS)
})

test.describe('research notes', () => {
  const steps = [
    { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
    { action: 'research', tech: 'bloomery' },
    { action: 'research', tech: 'admiralty' },
    { action: 'research', tech: 'textiles' },
  ]

  test('every note is info severity and its message names the tech by id', async ({ request }) => {
    const body = await simulate(request, { buildOrder: { civ: 'english', name: 'Notes', start: START, steps } })
    const notes: Note[] = body.notes
    expect(notes.map((n) => n.tech)).toEqual(['bloomery', 'admiralty', 'textiles'])
    for (const note of notes) {
      expect(note.severity).toBe('info')
      expect(note.message.startsWith(`${note.tech}: `)).toBe(true)
    }
    expect(notes[0].message).toBe('bloomery: its effect on meleeAttack is not simulated; it still costs resources and queue time.')
    expect(notes[1].message).toBe('admiralty: its effect is not simulated; it still costs resources and queue time.')
  })
})

test.describe('a research whose only entry is above the current age', () => {
  const [villager] = english1tc.steps

  test('waits at age 1 without paying or reserving anything', async ({ request }) => {
    const options = { inputs: { durationSeconds: 600 } }
    const withTextiles = await simulate(request, {
      buildOrder: { ...english1tc, steps: [villager, { action: 'research', tech: 'textiles' }] },
      ...options,
    })
    const without = await simulate(request, { buildOrder: { ...english1tc, steps: [villager] }, ...options })
    expect(withTextiles.ages).toEqual([{ age: 1, reachedAt: 0 }])
    expect(withTextiles.steps[1]).toMatchObject({ status: 'waiting', startedAt: null, completedAt: null })
    expect(withTextiles.floating).toEqual(without.floating)
  })

  test('starts once the age is reached and not before', async ({ request }) => {
    const steps = [...english1tc.steps, { action: 'research', tech: 'textiles' }]
    const body = await simulate(request, { buildOrder: { ...english1tc, steps }, inputs: { durationSeconds: 900 } })
    const ageTwoAt: number = body.ages.find((a: { age: number }) => a.age === 2).reachedAt
    const textiles: Timing = body.steps[steps.length - 1]
    expect(textiles.status).toBe('completed')
    expect(textiles.startedAt).toBeGreaterThanOrEqual(ageTwoAt)
  })
})
