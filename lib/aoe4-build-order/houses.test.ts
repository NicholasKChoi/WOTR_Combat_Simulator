import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import type { CivRules } from './civ-rules'
import { BaseRules, CivData, GameData, Snapshot, buildGameData, loadGameData } from './data'
import { planAutoHouse } from './houses'
import type { SimInputs } from './model'
import type { EngineState } from './simulate'
import { resolveSimInputs } from './validate'

const data = loadGameData('english')

function inputsFor(game: GameData, partial: unknown = {}): SimInputs {
    const result = resolveSimInputs(partial, game)
    if (result.ok === false) {
        throw new Error(JSON.stringify(result.issues))
    }
    return result.inputs
}

function editedData(edit: (parts: { snapshot: Snapshot; base: BaseRules; civData: CivData }) => void): GameData {
    const parts = {
        snapshot: structuredClone(englishSnapshot) as unknown as Snapshot,
        base: structuredClone(baseRules) as unknown as BaseRules,
        civData: structuredClone(englishRules) as unknown as CivData,
    }
    edit(parts)
    return buildGameData('english', parts.snapshot, parts.base, parts.civData)
}

function stateOf(population: number, supply: number, game = data, rules: CivRules = {}): EngineState {
    return { data: game, rules, population, supply, time: 0, age: 1, buildings: new Map(), researched: new Set(), coverage: {} } as unknown as EngineState
}

// Default lead: a 5 s walk plus 15 x 3 / (1 + 2) s of construction.
const lead = 20

describe('planAutoHouse', () => {
    const inputs = inputsFor(data)

    it('plans nothing while the projected population fits the supply', () => {
        expect(planAutoHouse(stateOf(9, 10), inputs, data, { pendingSupply: 0, populationPerSecond: 1 / lead })).toBe(0)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { pendingSupply: 0, populationPerSecond: 0 })).toBe(0)
    })

    it('covers the shortfall over the lead in whole houses', () => {
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { pendingSupply: 0, populationPerSecond: 1 / lead })).toBe(1)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { pendingSupply: 0, populationPerSecond: 11 / lead })).toBe(2)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { pendingSupply: 10, populationPerSecond: 11 / lead })).toBe(1)
    })

    it('takes the lead from the walk, the house builders and builderScaling', () => {
        const demand = { pendingSupply: 0, populationPerSecond: 2 / lead }
        expect(planAutoHouse(stateOf(9, 10), inputs, data, demand)).toBe(1)
        expect(planAutoHouse(stateOf(9, 10), inputsFor(data, { houseBuilders: 4, walkSeconds: 1 }), data, demand)).toBe(0)
        const slow = editedData((parts) => {
            parts.base.builderScaling.numerator.value = 6
        })
        expect(planAutoHouse(stateOf(9, 10), inputs, slow, { pendingSupply: 0, populationPerSecond: 1 / lead })).toBe(1)
    })

    it('stops at maxPopCap and never returns a negative count', () => {
        const busy = { pendingSupply: 0, populationPerSecond: 100 }
        expect(planAutoHouse(stateOf(195, 195), inputs, data, busy)).toBe(1)
        expect(planAutoHouse(stateOf(200, 200), inputs, data, busy)).toBe(0)
        expect(planAutoHouse(stateOf(200, 200), inputs, data, { pendingSupply: 10, populationPerSecond: 100 })).toBe(0)
    })

    it('plans nothing when a house gives no supply', () => {
        const busy = { pendingSupply: 0, populationPerSecond: 100 }
        const none: CivRules = { supplyProvider: (supply, ctx) => (ctx.baseId === 'house' ? 0 : supply) }
        expect(planAutoHouse(stateOf(10, 10, data, none), inputs, data, busy)).toBe(0)
        const unlisted = editedData((parts) => {
            delete parts.civData.supply.house
        })
        expect(planAutoHouse(stateOf(10, 10, unlisted), inputsFor(unlisted), unlisted, busy)).toBe(0)
        const doubled: CivRules = { supplyProvider: (supply) => supply * 2 }
        expect(planAutoHouse(stateOf(10, 10, data, doubled), inputs, data, { pendingSupply: 0, populationPerSecond: 21 / lead })).toBe(2)
    })
})

describe('houses.ts source shape', () => {
    const code = readFileSync(join(__dirname, 'houses.ts'), 'utf8')

    it('exports exactly planAutoHouse and HouseDemand', () => {
        expect([...code.matchAll(/^export (?:const|function|interface|type) (\w+)/gm)].map((m) => m[1]).sort()).toEqual(['HouseDemand', 'planAutoHouse'])
        expect(code.match(/^export /gm)).toHaveLength(2)
    })

    it('reads no clock and has no numeric literal beyond 0, 1 and 60', () => {
        expect(code).not.toMatch(/Math\.random|Date\.now|new Date|performance\.now/)
        const stripped = code.replace(/\/\/.*$/gm, '').replace(/'[^']*'|`[^`]*`/g, "''")
        const literals = [...stripped.matchAll(/(?<![\w.])\d[\d.]*(?:e-?\d+)?/g)].map((m) => m[0])
        expect(literals.filter((n) => !['0', '1', '60'].includes(n))).toEqual([])
    })
})
