import { test, expect } from '@playwright/test'
import knightLongbow from '../data/aoe4-build-order/builds/english-knight-longbow.json'
import spearLongbowMaa from '../data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json'
import english from '../data/aoe4-build-order/rules/english.json'
import { WARM_UP_TIMEOUT_MS, postSimulate } from './helpers'

type Series = { unitId: string; baseId: string; name: string; lineName: string; tier: number }
type Marker = { kind: string; label: string; at: number; unit?: string }
type Result = { unitsProduced: Series[]; markers: Marker[] }

test.describe.configure({ timeout: 60_000 })

const upgradeTargets: Record<string, { value: string }> = english.upgradeTargets

async function simulate(request: Parameters<typeof postSimulate>[0], buildOrder: unknown): Promise<Result> {
  const response = await postSimulate(request, { buildOrder, inputs: { durationSeconds: 1800 } }, WARM_UP_TIMEOUT_MS)
  expect(response.status(), await response.text()).toBe(200)
  return response.json()
}

let knight: Result
let maa: Result

test.beforeAll(async ({ request }) => {
  knight = await simulate(request, knightLongbow)
  maa = await simulate(request, spearLongbowMaa)
})

test.describe('unitsProduced lineName', () => {
  test('every series carries a non-empty lineName, equal across the series of one baseId', () => {
    for (const result of [knight, maa]) {
      expect(result.unitsProduced.length).toBeGreaterThan(0)
      for (const series of result.unitsProduced) {
        expect(series.lineName, series.unitId).toEqual(expect.any(String))
        expect(series.lineName.length, series.unitId).toBeGreaterThan(0)
        const sameLine = result.unitsProduced.filter((s) => s.baseId === series.baseId)
        expect(new Set(sameLine.map((s) => s.lineName)).size, series.baseId).toBe(1)
      }
    }
  })

  test('the converted longbowman tiers both show the line name Longbowman', () => {
    const tiers = knight.unitsProduced.filter((s) => s.baseId === 'longbowman')
    expect(tiers.length).toBeGreaterThanOrEqual(2)
    expect(tiers.map((s) => s.lineName)).toEqual(tiers.map(() => 'Longbowman'))
  })

  test('a tier whose own name has a prefix still shows the whole-line name', () => {
    const tiers = maa.unitsProduced.filter((s) => s.baseId === 'man-at-arms')
    expect(tiers.length).toBeGreaterThan(0)
    expect(tiers.some((s) => s.name !== 'Man-at-Arms')).toBe(true)
    expect(tiers.map((s) => s.lineName)).toEqual(tiers.map(() => 'Man-at-Arms'))
  })

  test('single-tier lines show their own name', () => {
    expect(knight.unitsProduced.find((s) => s.baseId === 'knight')?.lineName).toBe('Knight')
    expect(knight.unitsProduced.find((s) => s.baseId === 'villager')?.lineName).toBe('Villager')
  })
})

test.describe('research markers unit', () => {
  test('a unit-upgrade research marker carries the target baseId, a veteran-longbowmen marker shows longbowman', () => {
    const marker = knight.markers.find((m) => m.label === 'veteran-longbowmen')
    expect(marker).toBeDefined()
    expect(marker?.unit).toBe('longbowman')
  })

  test('every marker whose label is an upgradeTargets key carries exactly that target; every other marker has no unit key', () => {
    const all = [...knight.markers, ...maa.markers]
    expect(all.filter((m) => m.label in upgradeTargets).length).toBeGreaterThan(0)
    for (const marker of all) {
      if (marker.kind !== 'age-up' && marker.label in upgradeTargets) {
        expect(marker.unit, marker.label).toBe(upgradeTargets[marker.label].value)
      } else {
        expect(Object.keys(marker), `${marker.kind} ${marker.label}`).not.toContain('unit')
      }
    }
  })

  test('age-up markers and non-unit researches are present and have no unit key', () => {
    const all = [...knight.markers, ...maa.markers]
    expect(all.some((m) => m.kind === 'age-up')).toBe(true)
    const plain = knight.markers.find((m) => m.label === 'horticulture')
    expect(plain).toBeDefined()
    expect(Object.keys(plain!)).toEqual(['kind', 'label', 'at'])
  })
})
