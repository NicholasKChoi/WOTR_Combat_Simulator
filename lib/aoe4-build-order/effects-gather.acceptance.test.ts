import { describe, expect, it } from 'vitest'
import type { GameData } from './data'
import { ModifierTarget, modifiedValue } from './effects'
import { constructionSeconds } from './construction'
import { effectiveGatherRate } from './gather'
import type { GatherNodeId, OverlayEffect } from './model'
import { ENGLISH, effectStateOf, tripInputsOf } from './test-helpers'

const data = ENGLISH

function cycle(capacity: number, rate: number, walk: number, speed = 1, dropOff = 0): number {
    return capacity / (capacity / rate + walk / speed + dropOff)
}

const villager: ModifierTarget = { baseId: 'villager', classes: ['villager', 'worker'] }
const inputs = tripInputsOf(data)

function withOverlay(row: OverlayEffect): GameData {
    return { ...data, civData: { ...data.civData, effects: [...data.civData.effects, row] } }
}

describe('constructionSeconds', () => {
    it('scales 100 base seconds by 3/(n+2) for the English rules', () => {
        expect([1, 2, 4, 8].map((n) => constructionSeconds(100, n, data))).toEqual([100, 75, 50, 30])
    })

    it('reads numerator and offset from the rules', () => {
        const base = data.base.builderScaling
        const game = {
            ...data,
            base: {
                ...data.base,
                builderScaling: { numerator: { ...base.numerator, value: 4 }, offset: { ...base.offset, value: 3 } },
            },
        }
        expect(constructionSeconds(100, 5, game)).toBeCloseTo((100 * 4) / 8, 10)
    })

    it.each([0, 1.5, -1, Number.NaN])('rejects %s builders with a RangeError', (n) => {
        expect(() => constructionSeconds(100, n, data)).toThrow(RangeError)
    })
})

describe('effectiveGatherRate', () => {
    it('uses the town-center walk without a drop-off and the camp walk with one', () => {
        const wood = data.base.gatherNodes.wood
        const game: GameData = {
            ...data,
            base: {
                ...data.base,
                gatherNodes: {
                    ...data.base.gatherNodes,
                    wood: {
                        ...wood,
                        trip: {
                            ...wood.trip,
                            walkSecondsCamp: { ...wood.trip.walkSecondsCamp, value: 2 },
                            walkSecondsTownCenter: { ...wood.trip.walkSecondsTownCenter, value: 10 },
                            dropOffSeconds: { ...wood.trip.dropOffSeconds, value: 1 },
                        },
                    },
                },
            },
        }
        const gi = tripInputsOf(game)
        expect(effectiveGatherRate('wood', effectStateOf({ data: game }), gi)).toBeCloseTo(cycle(10, 0.75, 10, 1, 1), 10)
        const camp = effectStateOf({ data: game, buildings: new Map([['lumber-camp', 1]]) })
        expect(effectiveGatherRate('wood', camp, gi)).toBeCloseTo(cycle(10, 0.75, 2, 1, 1), 10)
    })

    it('applies wheelbarrow capacity and move speed to wood and sheep', () => {
        const plain = effectStateOf()
        const wb = effectStateOf({ researched: new Set(['wheelbarrow']) })
        expect(effectiveGatherRate('wood', wb, inputs)).toBeCloseTo(cycle(15, 0.75, 6.02, 1.15), 10)
        expect(effectiveGatherRate('sheep', wb, inputs)).toBeCloseTo(cycle(15, 0.75, 2.86, 1.15), 10)
        expect(effectiveGatherRate('wood', wb, inputs)).not.toBeCloseTo(effectiveGatherRate('wood', plain, inputs), 3)
    })

    it('raises wood by 15% rate with double-broadax', () => {
        const state = effectStateOf({ researched: new Set(['double-broadax']) })
        expect(effectiveGatherRate('wood', state, inputs)).toBeCloseTo(cycle(10, 0.75 * 1.15, 6.02), 10)
        expect(effectiveGatherRate('gold', state, inputs)).toBeCloseTo(effectiveGatherRate('gold', effectStateOf(), inputs), 10)
    })

    it('raises gold and stone but not wood with shaft-mining', () => {
        const state = effectStateOf({ researched: new Set(['shaft-mining']) })
        expect(effectiveGatherRate('gold', state, inputs)).toBeCloseTo(cycle(10, 0.75 * 1.15, 2.88), 10)
        expect(effectiveGatherRate('stone', state, inputs)).toBeCloseTo(cycle(10, 0.75 * 1.15, 2.88), 10)
        expect(effectiveGatherRate('wood', state, inputs)).toBeCloseTo(effectiveGatherRate('wood', effectStateOf(), inputs), 10)
    })

    it('applies the English mill farm bonus by age and coverage', () => {
        const farm = (age: number, coverage: Record<string, number>, mill = true) =>
            effectiveGatherRate('farm', effectStateOf({ age, coverage, buildings: new Map(mill ? [['mill', 1]] : []) }), inputs)
        const cycleAt = (m: number) => cycle(10, 0.75 * m, 3.01)
        expect(farm(2, { mill: 1 })).toBeCloseTo(cycleAt(1.25), 10)
        expect(farm(2, { mill: 0.5 })).toBeCloseTo(cycleAt(1.125), 10)
        expect(farm(3, { mill: 1 })).toBeCloseTo(cycleAt(1.3), 10)
        expect(farm(2, { mill: 1 }, false)).toBeCloseTo(cycleAt(1), 10)
        expect(farm(2, {})).toBeCloseTo(cycleAt(1), 10)
    })

    it('matches the production calculator net rates per minute', () => {
        // Cross-check only: numbers come from the calculator, not from the rules files.
        const expected: Record<string, number> = {
            sheep: 37.05, berry: 32.93, deer: 41.7, farm: 36.718, wood: 31, gold: 37, stone: 37,
        }
        for (const [node, perMinute] of Object.entries(expected)) {
            expect(effectiveGatherRate(node as GatherNodeId, effectStateOf(), inputs) * 60).toBeCloseTo(perMinute, 1)
        }
    })

    it('follows a changed rules value (no hard-coded game numbers)', () => {
        const wood = data.base.gatherNodes.wood
        const game: GameData = {
            ...data,
            base: {
                ...data.base,
                gatherNodes: { ...data.base.gatherNodes, wood: { ...wood, rate: { ...wood.rate, value: 1.5 } } },
            },
        }
        expect(effectiveGatherRate('wood', effectStateOf({ data: game }), inputs)).toBeCloseTo(cycle(10, 1.5, 6.02), 10)
    })

    it('is deterministic and leaves state untouched', () => {
        const state = effectStateOf({ researched: new Set(['wheelbarrow']), buildings: new Map([['mill', 1]]) })
        const a = effectiveGatherRate('sheep', state, inputs)
        expect(effectiveGatherRate('sheep', state, inputs)).toBe(a)
        expect([...state.researched]).toEqual(['wheelbarrow'])
        expect([...state.buildings]).toEqual([['mill', 1]])
    })
})

describe('modifiedValue', () => {
    const palace = { ...villager, producer: 'kings-palace' }

    it('speeds villager production only at a built King\'s Palace', () => {
        const built = effectStateOf({ buildings: new Map([['kings-palace', 1]]) })
        expect(modifiedValue(1, 'productionSpeed', palace, built)).toBeCloseTo(1.1, 10)
        expect(modifiedValue(1, 'productionSpeed', palace, effectStateOf())).toBe(1)
        expect(modifiedValue(1, 'productionSpeed', { ...villager, producer: 'capital-town-center' }, built)).toBe(1)
        expect(modifiedValue(1, 'productionSpeed', villager, built)).toBe(1)
    })

    it('ignores a fishing-boat tech for villagers', () => {
        const state = effectStateOf({ researched: new Set(['extended-lines']) })
        expect(modifiedValue(10, 'carryCapacity', villager, state)).toBe(10)
        expect(modifiedValue(1, 'foodGatherRate', villager, state)).toBe(1)
    })

    it('matches a class set only when every class is on the target', () => {
        const row: OverlayEffect = {
            property: 'moveSpeed', select: { class: [['villager', 'cavalry'], ['scout']] },
            effect: 'multiply', value: 2, type: 'passive', grantedBy: 'civ', source: 't', unverified: false,
        } as OverlayEffect
        const game = withOverlay(row)
        const speedFor = (classes: string[]) => modifiedValue(1, 'moveSpeed', { baseId: 'x', classes }, effectStateOf({ data: game }))
        expect(speedFor(['villager'])).toBe(1)
        expect(speedFor(['villager', 'cavalry'])).toBe(2)
        expect(speedFor(['scout'])).toBe(2)
    })

    it('treats an empty select as matching nothing', () => {
        const row = {
            property: 'moveSpeed', select: {}, effect: 'multiply', value: 2, type: 'passive', grantedBy: 'civ',
            source: 't', unverified: false,
        } as OverlayEffect
        expect(modifiedValue(1, 'moveSpeed', villager, effectStateOf({ data: withOverlay(row) }))).toBe(1)
    })

    it('adds changes before multiplying on the same property', () => {
        const row = (effect: string, value: number) =>
            ({
                property: 'carryCapacity', select: { id: ['villager'] }, effect, value, type: 'passive',
                grantedBy: 'civ', source: 't', unverified: false,
            }) as OverlayEffect
        const both = withOverlay(row('multiply', 2))
        both.civData.effects.push(row('change', 5))
        expect(modifiedValue(10, 'carryCapacity', villager, effectStateOf({ data: both }))).toBe(30)
    })

    it('does not find a coverage entry through the prototype chain', () => {
        const state = effectStateOf({ age: 2, buildings: new Map([['mill', 1]]), coverage: {} })
        expect(modifiedValue(1, 'farmGatherRate', villager, state)).toBe(1)
        const proto = Object.create({ mill: 1 }) as Record<string, number>
        expect(modifiedValue(1, 'farmGatherRate', villager, { ...state, coverage: proto })).toBe(1)
    })

    it('is deterministic and does not mutate state', () => {
        const state = effectStateOf({ researched: new Set(['wheelbarrow']) })
        expect(modifiedValue(10, 'carryCapacity', villager, state)).toBe(modifiedValue(10, 'carryCapacity', villager, state))
        expect([...state.researched]).toEqual(['wheelbarrow'])
    })
})
