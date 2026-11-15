import { test, expect, type APIRequestContext } from '@playwright/test'
import { loadGameData } from '../lib/aoe4-build-order/data'
import { buildOrderFrom, postSimulate } from './helpers'

test.describe.configure({ timeout: 60_000 })

type Result = {
  sampleSeconds: number
  times: number[]
  unitsProduced: { baseId: string; counts: number[] }[]
  floating: Record<'food' | 'wood' | 'gold' | 'stone', number[]>
}

// Thin wood: 4-5 villagers on wood, a council hall making longbows nonstop, food floating well above need.
const THIN_WOOD_BUILD = `start -> sheep
produce villager from capital-town-center
at 7 vils rally capital-town-center -> gold
at 8 vils build mining-camp from gold then gold
at 10 vils rally capital-town-center -> wood
at 15 vils rally capital-town-center -> sheep
@2:30 build council-hall with 3 from sheep then sheep
build mill from sheep then sheep
@4:30 produce longbowman from council-hall
@5:00 build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm
build farm from sheep then farm`

const VILLAGER_SECONDS = loadGameData('english').byBaseId.get('villager')![0].costs.time
const WINDOW_START = 570
const WINDOW_END = 900
const DURATION = 1000

async function simulate(request: APIRequestContext, autoHouses: boolean): Promise<Result> {
  const body = { buildOrder: buildOrderFrom(THIN_WOOD_BUILD), inputs: { durationSeconds: DURATION, autoHouses } }
  const response = await postSimulate(request, body)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

const villagerSeries = (result: Result) => result.unitsProduced.find((series) => series.baseId === 'villager')!.counts

// Longest time inside the window over which the villager count does not change.
function longestFlat(result: Result): number {
  const counts = villagerSeries(result)
  let longest = 0
  let since = WINDOW_START
  let last: number | undefined
  result.times.forEach((time, index) => {
    if (time < WINDOW_START || time > WINDOW_END) return
    if (counts[index] !== last) since = time
    last = counts[index]
    longest = Math.max(longest, time - since)
  })
  return longest
}

test.beforeAll(async ({ request }) => {
  await simulate(request, true)
})

test.describe('auto-houses keep the Town Center supplied when wood is thin', () => {
  test('the Town Center never stalls longer than one villager plus a sample between 9:30 and 15:00', async ({ request }) => {
    const on = await simulate(request, true)
    const counts = villagerSeries(on)
    const inWindow = on.times.flatMap((time, index) => (time >= WINDOW_START && time <= WINDOW_END ? [index] : []))
    // Preconditions: the Town Center could always produce, so a flat count means supply, not food or the villager target.
    expect(inWindow.length).toBeGreaterThan(10)
    for (const index of inWindow) {
      expect(on.floating.food[index]).toBeGreaterThan(50)
      expect(counts[index]).toBeLessThan(90)
    }
    expect(counts[on.times.indexOf(WINDOW_END)]).toBeGreaterThan(counts[on.times.indexOf(WINDOW_START)])
    expect(longestFlat(on)).toBeLessThanOrEqual(VILLAGER_SECONDS + on.sampleSeconds)
  })

  test('the same stall measure sees the Town Center housed when auto-houses are off', async ({ request }) => {
    const off = await simulate(request, false)
    expect(longestFlat(off)).toBeGreaterThan(VILLAGER_SECONDS + off.sampleSeconds)
  })
})
