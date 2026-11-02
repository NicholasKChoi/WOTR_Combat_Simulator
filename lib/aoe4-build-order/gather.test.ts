import { describe, expect, it } from 'vitest'
import type { GameData, GatherNodeRules } from './data'
import { effectiveGatherRate } from './gather'
import type { GatherNodeId } from './model'
import { ENGLISH, effectStateOf, researchedOf, tripInputsOf } from './test-helpers'

const data = ENGLISH

function withNode(node: GatherNodeId, edit: (rules: GatherNodeRules) => GatherNodeRules): GameData {
    const gatherNodes = { ...data.base.gatherNodes, [node]: edit(data.base.gatherNodes[node]) }
    return { ...data, base: { ...data.base, gatherNodes } }
}

function cycleRate(capacity: number, rate: number, walk: number, dropOff: number): number {
    return capacity / (capacity / rate + walk + dropOff)
}

const inputs = tripInputsOf(data)

describe('effectiveGatherRate trip model', () => {
    const game = withNode('wood', (rules) => ({
        ...rules,
        trip: {
            walkSecondsCamp: { ...rules.trip.walkSecondsCamp, value: 2 },
            walkSecondsTownCenter: { ...rules.trip.walkSecondsTownCenter, value: 10 },
            dropOffSeconds: { ...rules.trip.dropOffSeconds, value: 1 },
        },
    }))
    const gameInputs = tripInputsOf(game)

    it('walks to the town center when no drop-off building exists', () => {
        expect(effectiveGatherRate('wood', effectStateOf({ data: game }), gameInputs)).toBeCloseTo(cycleRate(10, 0.75, 10, 1), 12)
        const noCamp = effectStateOf({ data: game, buildings: new Map([['lumber-camp', 0], ['mill', 1]]) })
        expect(effectiveGatherRate('wood', noCamp, gameInputs)).toBeCloseTo(cycleRate(10, 0.75, 10, 1), 12)
    })

    it('walks to the camp once a drop-off building exists', () => {
        const camp = effectStateOf({ data: game, buildings: new Map([['lumber-camp', 1]]) })
        expect(effectiveGatherRate('wood', camp, gameInputs)).toBeCloseTo(cycleRate(10, 0.75, 2, 1), 12)
    })

    it('reads the trip from the inputs and the rate from the data', () => {
        const longer = { ...inputs, trips: { ...inputs.trips, wood: { ...inputs.trips.wood, walkSecondsTownCenter: 20 } } }
        expect(effectiveGatherRate('wood', effectStateOf(), longer)).toBeCloseTo(cycleRate(10, 0.75, 20, 0), 12)
        const faster = withNode('wood', (rules) => ({ ...rules, rate: { ...rules.rate, value: 1.5 } }))
        expect(effectiveGatherRate('wood', effectStateOf({ data: faster }), inputs)).toBeCloseTo(cycleRate(10, 1.5, 6.02, 0), 12)
    })
})

describe('effectiveGatherRate with technologies', () => {
    it('applies Wheelbarrow carry capacity and move speed', () => {
        const state = effectStateOf(researchedOf(['wheelbarrow']))
        for (const [node, walk] of [['sheep', 2.86], ['wood', 6.02]] as const) {
            const expected = cycleRate(15, 0.75, walk / 1.15, 0)
            expect(effectiveGatherRate(node, state, inputs)).toBeCloseTo(expected, 12)
            expect(effectiveGatherRate(node, state, inputs)).not.toBeCloseTo(effectiveGatherRate(node, effectStateOf(), inputs), 6)
        }
    })

    it('applies Double Broadax to wood', () => {
        const state = effectStateOf(researchedOf(['double-broadax']))
        expect(effectiveGatherRate('wood', state, inputs)).toBeCloseTo(cycleRate(10, 0.75 * 1.15, 6.02, 0), 12)
    })

    it('applies Shaft Mining to gold and stone but not wood', () => {
        const state = effectStateOf(researchedOf(['shaft-mining']))
        for (const node of ['gold', 'stone'] as const) {
            expect(effectiveGatherRate(node, state, inputs)).toBeCloseTo(cycleRate(10, 0.75 * 1.15, 2.88, 0), 12)
        }
        expect(effectiveGatherRate('wood', state, inputs)).toBe(effectiveGatherRate('wood', effectStateOf(), inputs))
    })

    it('chains every rate property of a node', () => {
        const foodRow = { ...data.civData.effects.find((row) => row.grantedBy === 'shaft-mining'), property: 'foodGatherRate', value: 2 }
        const game = { ...data, civData: { ...data.civData, effects: [...data.civData.effects, foodRow] } }
        const state = effectStateOf({ data: game, age: 2, buildings: new Map([['mill', 1]]), coverage: { mill: 1 }, ...researchedOf(['shaft-mining'], game) })
        expect(effectiveGatherRate('farm', state, inputs)).toBeCloseTo(cycleRate(10, 0.75 * 2 * 1.25, 3.01, 0), 12)
    })
})

describe('effectiveGatherRate purity', () => {
    it('gives the same number twice and leaves the state as it was', () => {
        const buildings = new Map([['lumber-camp', 1]])
        const state = Object.freeze(effectStateOf({ buildings, ...researchedOf(['wheelbarrow']) }))
        const first = effectiveGatherRate('wood', state, inputs)
        expect(effectiveGatherRate('wood', state, inputs)).toBe(first)
        expect([...buildings]).toEqual([['lumber-camp', 1]])
    })
})

// Cross-check only: the net rates of SichYuriy/aoe4-production-calculator that the trip seeds were derived from.
describe('calculator cross-check', () => {
    const calculatorPerMinute: Partial<Record<GatherNodeId, number>> = {
        sheep: 37.05, berry: 32.93, deer: 41.7, farm: 36.718, wood: 31, gold: 37, stone: 37,
    }
    for (const [node, net] of Object.entries(calculatorPerMinute) as [GatherNodeId, number][]) {
        it(`${node} is within 0.05/min of ${net}/min`, () => {
            expect(Math.abs(effectiveGatherRate(node, effectStateOf(), inputs) * 60 - net)).toBeLessThan(0.05)
        })
    }
})
