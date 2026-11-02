import { describe, expect, it } from 'vitest'
import { canAfford, costOf, markCompleted, payCost, villagerWalkSeconds } from './engine-common'
import type { EngineState } from './simulate'
import { ENGLISH, effectStateOf, researchedOf } from './test-helpers'

const cost = { food: 50, wood: 25, gold: 0, stone: 0 }

function engineState(resources: typeof cost): EngineState {
    return {
        resources: { ...resources },
        spent: { villagers: 0, military: 0, buildings: 3, research: 0 },
        time: 42,
        steps: [{ status: 'waiting' }, { status: 'in-progress', startedAt: 7 }],
    } as unknown as EngineState
}

describe('canAfford', () => {
    it('accepts a bank a hair under the cost and refuses one clearly under it', () => {
        expect(canAfford({ ...cost, food: cost.food - 5e-10 }, cost)).toBe(true)
        expect(canAfford({ ...cost, food: cost.food - 2e-9 }, cost)).toBe(false)
        expect(canAfford({ ...cost, wood: cost.wood - 2e-9 }, cost)).toBe(false)
    })
})

describe('costOf', () => {
    it('scales every resource of the entry by the unit count', () => {
        const villager = ENGLISH.byBaseId.get('villager')[0]
        const { food, wood, gold, stone } = villager.costs
        expect(costOf(villager, 3)).toEqual({ food: food * 3, wood: wood * 3, gold: gold * 3, stone: stone * 3 })
    })
})

describe('payCost', () => {
    it('never leaves a resource below 0 and adds the four-resource sum to its category', () => {
        const state = engineState({ food: 50 - 5e-10, wood: 100, gold: 0, stone: 0 })
        payCost(state, cost, 'buildings')
        expect(state.resources).toEqual({ food: 0, wood: 75, gold: 0, stone: 0 })
        expect(state.spent).toEqual({ villagers: 0, military: 0, buildings: 78, research: 0 })
    })
})

describe('villagerWalkSeconds', () => {
    it('divides the walk by the villager move-speed multiplier', () => {
        expect(villagerWalkSeconds(effectStateOf(), 23)).toBe(23)
        expect(villagerWalkSeconds(effectStateOf(researchedOf(['wheelbarrow'])), 23)).toBeCloseTo(23 / 1.15, 12)
    })
})

describe('markCompleted', () => {
    it('stamps the current time and status on that step only', () => {
        const state = engineState(cost)
        markCompleted(state, 1)
        expect(state.steps[1]).toMatchObject({ status: 'completed', startedAt: 7, completedAt: 42 })
        expect(state.steps[0]).toEqual({ status: 'waiting' })
    })
})
