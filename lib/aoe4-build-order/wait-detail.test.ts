import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { StepWaitDetail } from './model'
import type { EngineState } from './simulate'
import { ENGLISH } from './test-helpers'
import { ageWait, buildingWait, busyWait, populationWait, resourceWait, villagerWait, waitDetailText, waitReasonOf, waitTargetKey } from './wait-detail'

const b = (baseId: string, name: string) => ({ baseId, name })
const barracks = b('barracks', 'Barracks')
const whiteTower = b('the-white-tower', 'The White Tower')

function stateOf(overrides: Partial<EngineState> = {}): EngineState {
    return {
        data: ENGLISH,
        age: 2,
        constructing: [],
        resources: { food: 0, wood: 0, gold: 0, stone: 0 },
        population: 0,
        supply: 0,
        ...overrides,
    } as unknown as EngineState
}

describe('waitDetailText', () => {
    it.each<[string, StepWaitDetail, string]>([
        ['an age with no landmark', { kind: 'age', age: 3, landmark: null }, 'Castle Age'],
        ['an age with a landmark', { kind: 'age', age: 3, landmark: b('kings-palace', "King's Palace") }, "Castle Age (King's Palace)"],
        ['a building starting with a vowel', { kind: 'building', buildings: [b('archery-range', 'Archery Range')], instance: null }, 'an Archery Range'],
        ...['Elite Hall', 'Inn', 'Outpost', 'University'].map((name): [string, StepWaitDetail, string] => [`a building starting with ${name[0]}`, { kind: 'building', buildings: [b('x', name)], instance: null }, `an ${name}`]),
        ['a building starting with a consonant', { kind: 'building', buildings: [b('blacksmith', 'Blacksmith')], instance: null }, 'a Blacksmith'],
        ['a building named The ...', { kind: 'building', buildings: [whiteTower], instance: null }, 'The White Tower'],
        ['several buildings', { kind: 'building', buildings: [barracks, whiteTower], instance: null }, 'a Barracks or The White Tower'],
        ['one instance of a building', { kind: 'building', buildings: [b('town-center', 'Town Center')], instance: 2 }, 'Town Center 2'],
        ['a free building', { kind: 'building-busy', buildings: [b('archery-range', 'Archery Range')], instance: null, every: false }, 'a free Archery Range'],
        [
            'a free one of several buildings',
            { kind: 'building-busy', buildings: [b('capital-town-center', 'Capital Town Center'), b('town-center', 'Town Center')], instance: null, every: false },
            'a free Capital Town Center or a free Town Center',
        ],
        ['a free building named The ...', { kind: 'building-busy', buildings: [whiteTower], instance: null, every: false }, 'a free White Tower'],
        ['one busy instance', { kind: 'building-busy', buildings: [barracks], instance: 3, every: false }, 'Barracks 3 to be free'],
        ['every busy instance', { kind: 'building-busy', buildings: [barracks], instance: null, every: true }, 'every Barracks to be free'],
        ['one resource', { kind: 'resources', short: { gold: 50 } }, '50 gold'],
        ['two resources, in resource order', { kind: 'resources', short: { gold: 50, wood: 20 } }, '20 wood and 50 gold'],
        ['three resources', { kind: 'resources', short: { gold: 10, food: 30, wood: 20 } }, '30 food, 20 wood and 10 gold'],
        ['four resources', { kind: 'resources', short: { stone: 5, gold: 10, food: 30, wood: 20 } }, '30 food, 20 wood, 10 gold and 5 stone'],
        ['two more villagers', { kind: 'villagers', node: 'wood', needed: 5, available: 3 }, '2 more villagers at wood'],
        ['one more villager', { kind: 'villagers', node: 'gold#2', needed: 1, available: 0 }, '1 more villager at gold#2'],
        ['population', { kind: 'population', needed: 1, used: 40, supply: 40 }, '1 population space (40/40 used)'],
    ])('words %s', (_, detail, text) => {
        expect(waitDetailText(detail)).toBe(text)
    })
})

describe('waitReasonOf and waitTargetKey', () => {
    it.each<[StepWaitDetail, string, string]>([
        [{ kind: 'age', age: 3, landmark: b('kings-palace', "King's Palace") }, 'prerequisite', 'age:3'],
        [{ kind: 'building', buildings: [barracks], instance: null }, 'prerequisite', 'building:barracks#'],
        [{ kind: 'building', buildings: [barracks, whiteTower], instance: null }, 'prerequisite', 'building:barracks,the-white-tower#'],
        [{ kind: 'building', buildings: [barracks], instance: 2 }, 'prerequisite', 'building:barracks#2'],
        [{ kind: 'building-busy', buildings: [barracks], instance: null, every: true }, 'prerequisite', 'busy:barracks#'],
        [{ kind: 'building-busy', buildings: [barracks], instance: 3, every: false }, 'prerequisite', 'busy:barracks#3'],
        [{ kind: 'villagers', node: 'wood', needed: 2, available: 0 }, 'villagers', 'villagers'],
        [{ kind: 'population', needed: 1, used: 10, supply: 10 }, 'population', 'population'],
        [{ kind: 'resources', short: { gold: 5 } }, 'resources', 'resources'],
    ])('%j counts under %s with key %s', (detail, reason, key) => {
        expect(waitReasonOf(detail)).toBe(reason)
        expect(waitTargetKey(detail)).toBe(key)
    })

    it('keys every and instance-free busy waits alike, and only by target', () => {
        const every = waitTargetKey({ kind: 'building-busy', buildings: [barracks], instance: null, every: true })
        expect(waitTargetKey({ kind: 'building-busy', buildings: [barracks], instance: null, every: false })).toBe(every)
        expect(waitTargetKey({ kind: 'resources', short: { food: 1 } })).toBe(waitTargetKey({ kind: 'resources', short: { gold: 9 } }))
        expect(waitTargetKey({ kind: 'age', age: 3, landmark: null })).not.toBe(waitTargetKey({ kind: 'age', age: 4, landmark: null }))
    })
})

describe('detail builders', () => {
    it('names buildings from the snapshot, falling back to the baseId', () => {
        const state = stateOf()
        expect(buildingWait(state, ['archery-range', 'no-such-building'], null)).toEqual({
            kind: 'building',
            buildings: [b('archery-range', 'Archery Range'), b('no-such-building', 'no-such-building')],
            instance: null,
        })
        expect(busyWait(state, ['barracks'], 2, false)).toEqual({ kind: 'building-busy', buildings: [barracks], instance: 2, every: false })
    })

    it.each([
        ['a fraction of a unit rounds up', { gold: 99.6 }, { gold: 100 }, { gold: 1 }],
        ['a part-unit amount rounds up to the next whole', { food: 100.5 }, { food: 150 }, { food: 50 }],
        ['a covered kind is absent', { food: 200, wood: 10 }, { food: 50, wood: 30 }, { wood: 20 }],
        ['a bank within the tolerance is covered', { stone: 100 - 5e-10, gold: 0 }, { stone: 100, gold: 1 }, { gold: 1 }],
    ])('resourceWait: %s', (_, bank, need, short) => {
        const state = stateOf({ resources: { food: 0, wood: 0, gold: 0, stone: 0, ...bank } })
        expect(resourceWait(state, { food: 0, wood: 0, gold: 0, stone: 0, ...need })).toEqual({ kind: 'resources', short })
    })

    it('takes the population used and the supply from the state', () => {
        expect(populationWait(stateOf({ population: 38, supply: 40 }), 3)).toEqual({ kind: 'population', needed: 3, used: 38, supply: 40 })
        expect(villagerWait('gold#2', 4, 1)).toEqual({ kind: 'villagers', node: 'gold#2', needed: 4, available: 1 })
    })
})

describe('ageWait', () => {
    const kingsPalace = b('kings-palace', "King's Palace")
    const building = (baseId: string, completesAt: number) => ({ baseId, completesAt })

    it.each([
        ['the landmark of the current age that completes first', 2, 3, [building('kings-palace', 300), building('the-white-tower', 200)], whiteTower],
        ['the lower baseId on a tie', 2, 3, [building('the-white-tower', 200), building('kings-palace', 200)], kingsPalace],
        ['no landmark of another age', 2, 3, [building('wynguard-palace', 100), building('council-hall', 50), building('kings-palace', 300)], kingsPalace],
        ['no building that is not a landmark', 2, 3, [building('barracks', 10), building('kings-palace', 300)], kingsPalace],
        ['null with only landmarks of another age', 2, 3, [building('council-hall', 50), building('wynguard-palace', 60)], null],
        ['null with nothing under construction', 2, 3, [], null],
        ['null when the wanted age is not the next one', 2, 4, [building('kings-palace', 300)], null],
    ])('names %s', (_, age, wanted, constructing, landmark) => {
        const state: EngineState = stateOf({ age, constructing })
        expect(ageWait(state, wanted)).toEqual({ kind: 'age', age: wanted, landmark })
    })
})

describe('wait-detail.ts imports', () => {
    it('value-imports only model.ts, engine-common.ts and landmarks.ts, so the page can load it', () => {
        const src = readFileSync(new URL('./wait-detail.ts', import.meta.url), 'utf8')
        const imports = [...src.matchAll(/^import (type )?[^;]*? from '([^']+)'/gm)]
        expect(imports.length).toBeGreaterThan(0)
        const valueImports = imports.filter((m) => m[1] === undefined).map((m) => m[2])
        expect(valueImports.length).toBeGreaterThan(0)
        expect(valueImports.filter((from) => !['./model', './engine-common', './landmarks'].includes(from))).toEqual([])
    })
})
