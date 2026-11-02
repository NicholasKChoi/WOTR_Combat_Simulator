import { describe, expect, it } from 'vitest'
import { GameData, loadGameData } from './data'
import { EffectState, ModifierTarget, modifiedValue } from './effects'
import type { OverlayEffect } from './model'
import { researchedOf } from './test-helpers'

const data = loadGameData('english')
const villager: ModifierTarget = { baseId: 'villager', classes: data.byBaseId.get('villager')[0].classes }

function stateOf(overrides: Partial<EffectState> = {}): EffectState {
    return { data, age: 1, buildings: new Map(), researched: new Set(), researchedIds: new Set(), coverage: {}, ...overrides }
}

function row(overrides: Partial<OverlayEffect>): OverlayEffect {
    return {
        property: 'woodGatherRate',
        select: { id: ['villager'] },
        effect: 'multiply',
        value: 2,
        type: 'passive',
        grantedBy: 'civ',
        source: 'test fixture',
        unverified: true,
        ...overrides,
    }
}

function withOverlay(...effects: OverlayEffect[]): GameData {
    return { ...data, civData: { ...data.civData, effects } }
}

describe('modifiedValue activation', () => {
    it('applies a researched technology and nothing before it is researched', () => {
        expect(modifiedValue(10, 'carryCapacity', villager, stateOf())).toBe(10)
        expect(modifiedValue(10, 'carryCapacity', villager, stateOf(researchedOf(['wheelbarrow'])))).toBe(15)
        expect(modifiedValue(1, 'moveSpeed', villager, stateOf(researchedOf(['wheelbarrow'])))).toBeCloseTo(1.15, 12)
    })

    it('applies an overlay row granted by research, a building or the civ', () => {
        expect(modifiedValue(1, 'goldGatherRate', villager, stateOf(researchedOf(['shaft-mining'])))).toBeCloseTo(1.15, 12)
        const game = withOverlay(row({ grantedBy: 'blacksmith' }), row({ property: 'goldGatherRate', grantedBy: 'civ', value: 3 }))
        expect(modifiedValue(1, 'woodGatherRate', villager, stateOf({ data: game }))).toBe(1)
        expect(modifiedValue(1, 'woodGatherRate', villager, stateOf({ data: game, buildings: new Map([['blacksmith', 0]]) }))).toBe(1)
        expect(modifiedValue(1, 'woodGatherRate', villager, stateOf({ data: game, buildings: new Map([['blacksmith', 1]]) }))).toBe(2)
        expect(modifiedValue(1, 'goldGatherRate', villager, stateOf({ data: game }))).toBe(3)
    })

    it('applies a property only to itself', () => {
        const state = stateOf(researchedOf(['double-broadax']))
        expect(modifiedValue(1, 'woodGatherRate', villager, state)).toBeCloseTo(1.15, 12)
        expect(modifiedValue(1, 'goldGatherRate', villager, state)).toBe(1)
    })
})

describe('modifiedValue arithmetic', () => {
    it('adds every change before multiplying by every multiplier', () => {
        const game = withOverlay(
            row({ effect: 'multiply', value: 2 }),
            row({ effect: 'change', value: 5 }),
            row({ effect: 'change', value: 1 }),
            row({ effect: 'multiply', value: 3 }),
        )
        expect(modifiedValue(10, 'woodGatherRate', villager, stateOf({ data: game }))).toBe(96)
    })

    it('skips effects that are not passive change or multiply', () => {
        const game = withOverlay(row({ type: 'influence' }), row({ effect: 'ability', value: 5 }))
        expect(modifiedValue(10, 'woodGatherRate', villager, stateOf({ data: game }))).toBe(10)
    })

    it('reads values from the data', () => {
        const game = withOverlay(row({ value: 1.7 }))
        expect(modifiedValue(10, 'woodGatherRate', villager, stateOf({ data: game }))).toBeCloseTo(17, 12)
    })
})

describe('modifiedValue select', () => {
    it('leaves a villager unchanged by a fishing-boat technology', () => {
        const state = stateOf(researchedOf(['extended-lines']))
        expect(modifiedValue(10, 'carryCapacity', villager, state)).toBe(10)
        expect(modifiedValue(1, 'foodGatherRate', villager, state)).toBe(1)
        expect(modifiedValue(10, 'carryCapacity', { baseId: 'fishing-boat', classes: [] }, state)).toBe(20)
    })

    it('matches a class set only when every class in it is on the target', () => {
        const target = { baseId: 'villager', classes: ['worker', 'human'] }
        const value = (select: OverlayEffect['select']) =>
            modifiedValue(1, 'woodGatherRate', target, stateOf({ data: withOverlay(row({ select })) }))
        expect(value({ class: [['worker', 'human']] })).toBe(2)
        expect(value({ class: [['worker', 'cavalry']] })).toBe(1)
        expect(value({ class: [['cavalry'], ['worker']] })).toBe(2)
    })

    it('requires both id and class when both are present, and matches nothing when empty', () => {
        const target = { baseId: 'villager', classes: ['worker'] }
        const value = (select: OverlayEffect['select']) =>
            modifiedValue(1, 'woodGatherRate', target, stateOf({ data: withOverlay(row({ select })) }))
        expect(value({ id: ['scout'], class: [['worker']] })).toBe(1)
        expect(value({ id: ['villager'], class: [['cavalry']] })).toBe(1)
        expect(value({ id: ['villager'], class: [['worker']] })).toBe(2)
        expect(value({})).toBe(1)
    })
})

describe('modifiedValue conditions', () => {
    const farm = (overrides: Partial<EffectState>) => modifiedValue(1, 'farmGatherRate', villager, stateOf(overrides))
    const mill = new Map([['mill', 1]])

    it('scales the English farm bonus by age and mill coverage', () => {
        expect(farm({ age: 2, buildings: mill, coverage: { mill: 1 } })).toBeCloseTo(1.25, 12)
        expect(farm({ age: 2, buildings: mill, coverage: { mill: 0.5 } })).toBeCloseTo(1.125, 12)
        expect(farm({ age: 3, buildings: mill, coverage: { mill: 1 } })).toBeCloseTo(1.3, 12)
        expect(farm({ age: 2, coverage: { mill: 1 } })).toBe(1)
        expect(farm({ age: 2, buildings: mill })).toBe(1)
    })

    it('scales a change value by coverage', () => {
        const game = withOverlay(row({ effect: 'change', value: 4, condition: { nearBuilding: 'mill' } }))
        expect(modifiedValue(10, 'woodGatherRate', villager, stateOf({ data: game, buildings: mill, coverage: { mill: 0.25 } }))).toBe(11)
    })

    it('finds no coverage for an inherited key', () => {
        const game = withOverlay(row({ effect: 'change', value: 4, condition: { nearBuilding: '__proto__' } }))
        const state = stateOf({ data: game, buildings: new Map([['__proto__', 1]]), coverage: {} })
        expect(modifiedValue(10, 'woodGatherRate', villager, state)).toBe(10)
    })

    it('applies the King\'s Palace bonus only to its own production', () => {
        const palace = new Map([['kings-palace', 1]])
        const speed = (producer: string | undefined, buildings: ReadonlyMap<string, number>) =>
            modifiedValue(1, 'productionSpeed', { ...villager, producer }, stateOf({ age: 2, buildings }))
        expect(speed('kings-palace', palace)).toBeCloseTo(1.1, 12)
        expect(speed('kings-palace', new Map())).toBe(1)
        expect(speed('capital-town-center', palace)).toBe(1)
        expect(speed(undefined, palace)).toBe(1)
    })

    it('ignores the target producer when the condition names none', () => {
        const state = stateOf({ age: 2, buildings: new Map([['mill', 1]]), coverage: { mill: 1 } })
        expect(modifiedValue(1, 'farmGatherRate', { ...villager, producer: 'town-center' }, state)).toBeCloseTo(1.25, 12)
    })
})

describe('modifiedValue purity', () => {
    it('gives the same number twice and leaves the state as it was', () => {
        const buildings = new Map([['mill', 1]])
        const { researched, researchedIds } = researchedOf(['wheelbarrow', 'shaft-mining'])
        const coverage = Object.freeze({ mill: 0.5 })
        const state = Object.freeze(stateOf({ age: 2, buildings, researched, researchedIds, coverage }))
        const first = modifiedValue(1, 'farmGatherRate', villager, state)
        expect(modifiedValue(1, 'farmGatherRate', villager, state)).toBe(first)
        expect([...buildings]).toEqual([['mill', 1]])
        expect([...researched]).toEqual(['wheelbarrow', 'shaft-mining'])
        expect([...researchedIds]).toEqual(['wheelbarrow-1', 'shaft-mining-3'])
    })
})
