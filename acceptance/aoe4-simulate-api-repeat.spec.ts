import { test, expect } from '@playwright/test'
import { WARM_UP_TIMEOUT_MS, postSimulate, simulateOk, type Timing } from './helpers'
import { expectValid } from './openapi-schemas'

test.describe.configure({ timeout: 60_000 })

const START = { villagers: { sheep: 3, wood: 3 }, rally: 'sheep' }
const VILLAGER = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const HOUSE = { action: 'build', building: 'house', from: 'wood' }
const MOVE = { action: 'move', count: 1, from: 'sheep', to: 'wood' }

function order(steps: unknown[]) {
  return { civ: 'english', name: 'Repeat', start: START, steps }
}

test.beforeAll(async ({ request }) => {
  await postSimulate(request, { buildOrder: order([VILLAGER]) }, WARM_UP_TIMEOUT_MS)
})

test.describe('repeat on a build order step', () => {
  test('a repeated build and move each give consecutive copies with their source and copy 1..n', async ({ request }) => {
    const result = await simulateOk<{ steps: Timing[] }>(request, order([VILLAGER, { ...HOUSE, repeat: 3 }, { ...MOVE, repeat: 2 }]), 300)
    expectValid('SimulationResult', result)
    expect(result.steps.map(({ step, source, copy }) => [step, source, copy])).toEqual([
      [0, 0, 1],
      [1, 1, 1],
      [2, 1, 2],
      [3, 1, 3],
      [4, 2, 1],
      [5, 2, 2],
    ])
    expect(result.steps.slice(1).every((timing) => timing.status === 'completed')).toBe(true)
  })

  test('repeat on a research step is a 400 with one invalid issue on that step', async ({ request }) => {
    const response = await postSimulate(request, { buildOrder: order([VILLAGER, { action: 'research', tech: 'wheelbarrow', repeat: 2 }]) })
    expect(response.status(), await response.text()).toBe(400)
    const { issues } = await response.json()
    expect(issues).toEqual([{ code: 'invalid', message: 'steps[1]: repeat on research; only build and move steps repeat', step: 1 }])
  })
})
