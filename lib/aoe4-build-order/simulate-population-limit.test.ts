import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { BuildStep, SimulationResult } from './model'
import { hasPopulationRoom, simulateBuildOrder } from './simulate'
import type { EngineState } from './simulate'
import { ENGLISH, INFINITE_NODES, at, countAt, editGameData, housesDone, inputsFor, run } from './test-helpers'
import type { Parts } from './test-helpers'

const maxPopCap = ENGLISH.base.maxPopCap.value
const startVillagers = Object.values(ENGLISH.civData.startingState.villagers.value).reduce((sum, n) => sum + n, 0)
const noHouses = { autoHouses: false }

function cappedAt(cap: number, edit: (parts: Parts) => void = () => {}) {
    return editGameData((parts) => {
        parts.base.maxPopCap.value = cap
        edit(parts)
    })
}

function wealthy(parts: Parts): void {
    parts.civData.startingState.resources.value = { food: 5000, wood: 5000, gold: 5000, stone: 5000 }
}

// Two barracks, and no villager unless a step produces it.
function rich(parts: Parts): void {
    wealthy(parts)
    parts.civData.startingState.buildings.value = ['capital-town-center', 'barracks', 'barracks']
    parts.base.villagerTarget.value = 0
}

const last = (values: readonly number[]) => values[values.length - 1]
const firstSampleFrom = (result: SimulationResult, t: number) => result.times.findIndex((time) => time >= t)
const menAtArms = (extra: Partial<Extract<BuildStep, { action: 'produce' }>> = {}): BuildStep => ({ action: 'produce', producer: 'barracks', unit: 'man-at-arms', ...extra })

describe('hasPopulationRoom', () => {
    const stateOf = (fields: { populationCapReachedAt?: number | null; supply: number; population: number }) => ({ data: ENGLISH, ...fields }) as unknown as EngineState

    it.each([
        ['before the cap is reached, with supply and population at the cap', { populationCapReachedAt: null, supply: maxPopCap, population: maxPopCap }, false],
        ['before the cap is reached, with room for the unit', { populationCapReachedAt: null, supply: maxPopCap, population: maxPopCap - 1 }, true],
        ['without the field, as not reached', { supply: maxPopCap, population: maxPopCap }, false],
        ['after the cap is reached, with supply at the cap', { populationCapReachedAt: 0, supply: maxPopCap, population: maxPopCap * 2 }, true],
        ['after the cap is reached, with supply below the cap', { populationCapReachedAt: 0, supply: maxPopCap - 10, population: maxPopCap }, false],
    ])('is %s', (_name, fields, expected) => {
        expect(hasPopulationRoom(stateOf(fields), 1)).toBe(expected)
    })
})

describe('production once the population cap is reached with supply at the cap', () => {
    // Start population 7 at a cap of 7, with the Town Center's supply clamped to 7.
    const atCap = cappedAt(1 + startVillagers, rich)

    it('starts a produce step on every target together', () => {
        const result = run([menAtArms({ count: 1 })], { game: atCap, inputs: noHouses })
        expect(result.populationCapReachedAt).toBe(0)
        expect(result.steps[0].startedAt).toBe(0)
        expect(countAt(result, 'man-at-arms', 15)).toBe(2)
    })

    it('keeps paying a continuous order', () => {
        const result = run([menAtArms({ instance: 1 })], { game: atCap, inputs: noHouses })
        expect(result.populationCapReachedAt).toBe(0)
        expect(countAt(result, 'man-at-arms', 300)).toBeGreaterThan(1)
    })

    it('starts a step that waited on population at the instant of the spawn that reaches the cap', () => {
        // Supply 10 at a cap of 10: the third villager fills population to 10 at 40 s and spawns at 60 s.
        const game = cappedAt(10, rich)
        const steps: BuildStep[] = [{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 3 }, menAtArms({ count: 1, instance: 1, trigger: at(45) })]
        const result = run(steps, { game, inputs: noHouses })
        expect(result.steps[1].waitBreakdown.population ?? 0).toBeGreaterThan(0)
        expect(result.populationCapReachedAt).not.toBeNull()
        expect(result.steps[1].startedAt).toBe(result.populationCapReachedAt)
    })
})

describe('a lowered population cap of 30', () => {
    const cap = 30
    // Infinite nodes and a full bank keep builders and house costs available for the whole run.
    const game = cappedAt(cap, wealthy)
    const { supplies, rules } = housesDone()
    const result = run([], { game, rules, inputs: { durationSeconds: 900, nodeAmounts: INFINITE_NODES } })
    const reached = result.populationCapReachedAt!
    const after = firstSampleFrom(result, reached)

    it('lets population grow past the cap while supply stays at it', () => {
        expect(reached).not.toBeNull()
        expect(result.spawnedPopulation[after - 1]).toBeLessThan(cap)
        expect(last(result.spawnedPopulation)).toBeGreaterThan(cap)
        expect(last(supplies)).toBe(cap)
    })

    it('starts no auto-house after the cap is reached', () => {
        expect(last(result.spent.buildings)).toBe(result.spent.buildings[after])
    })
})

describe('a start population at a lowered cap with too little supply', () => {
    // 12 villagers and the scout against a cap of 12; the Town Center gives 10.
    const game = cappedAt(12, wealthy)
    const { done: houses, supplies, rules } = housesDone()
    const steps: BuildStep[] = [{ action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1 }]
    const result = run(steps, { game, rules, start: { villagers: { sheep: 12 }, rally: 'sheep' } })

    it('waits on supply until an auto-house brings it to the cap, then produces from that instant', () => {
        expect(result.populationCapReachedAt).toBe(0)
        expect(houses).toHaveLength(1)
        expect(supplies).toEqual([12])
        expect(result.steps[0].waitBreakdown.population ?? 0).toBeGreaterThan(0)
        expect(result.steps[0].startedAt).toBe(houses[0])
    })
})

describe('villager production after the cap is reached', () => {
    const villagerTarget = 40
    const game = cappedAt(30, (parts) => void (parts.base.villagerTarget.value = villagerTarget))
    const options = { game, inputs: { durationSeconds: 1200 } }

    it('stops the default villager order at villagerTarget', () => {
        const result = run([], options)
        expect(result.populationCapReachedAt).not.toBeNull()
        expect(countAt(result, 'villager', 1200)).toBe(villagerTarget - startVillagers)
    })

    it('keeps a produce villager step producing past villagerTarget', () => {
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'villager' }], options)
        expect(result.populationCapReachedAt).not.toBeNull()
        expect(countAt(result, 'villager', 1200)).toBeGreaterThan(villagerTarget - startVillagers)
    })
})

describe('population waits', () => {
    // A step waits on population no longer than from its arming to the cap instant, and none waits on it at the end.
    function expectNoPopulationWaitAfterCap(result: SimulationResult): void {
        const reached = result.populationCapReachedAt
        expect(reached).not.toBeNull()
        for (const step of result.steps) {
            const before = step.armedAt === null ? 0 : Math.max(0, reached! - step.armedAt)
            expect(step.waitBreakdown.population ?? 0, `step ${step.step}`).toBeLessThanOrEqual(before + 1e-9)
        }
        expect(result.steps.filter((step) => step.waitingOn === 'population')).toEqual([])
    }

    it('occur only before the cap on ENG 1TC at 1800 s', () => {
        const build = listBuilds().find((b) => b.name === 'ENG 1TC')!
        expectNoPopulationWaitAfterCap(simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 1800 })))
    })

    it('occur only before the cap at a lowered cap of 30', () => {
        const steps: BuildStep[] = [{ action: 'build', building: 'barracks', from: 'sheep' }, menAtArms({ count: 3, trigger: at(800) })]
        const result = run(steps, { game: cappedAt(30, wealthy), inputs: { durationSeconds: 900 } })
        expect(result.populationCapReachedAt).toBeLessThan(800)
        expectNoPopulationWaitAfterCap(result)
    })
})
