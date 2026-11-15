import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CivRules } from './civ-rules'
import { planAutoHouse } from './houses'
import type { EngineState } from './simulate'
import { ENGLISH, editGameData, inputsFor } from './test-helpers'

const data = ENGLISH

function stateOf(population: number, supply: number, game = data, rules: CivRules = {}): EngineState {
    return { data: game, rules, population, supply, time: 0, age: 1, buildings: new Map(), researched: new Set(), researchedIds: new Set(), coverage: {} } as unknown as EngineState
}

// Default lead: a 5 s walk plus 15 x 3 / (1 + 2) s of construction.
const lead = 20

const arriving = (supply: number, completesAt = lead) => ({ supply, completesAt })

const NONE = { food: 0, wood: 0, gold: 0, stone: 0 }
const houseWood = data.byBaseId.get('house')![0].costs.wood
// The house cost is in the bank, so the window is the lead alone.
const banked = { bank: { ...NONE, wood: houseWood }, income: NONE }
// A bank of `wood` and the wood income that gathers the rest of one house in `seconds`.
const gathering = (wood: number, seconds: number) => ({ bank: { ...NONE, wood }, income: { ...NONE, wood: (houseWood - wood) / seconds } })

describe('planAutoHouse', () => {
    const inputs = inputsFor(data)

    it('plans nothing while the projected population fits the supply', () => {
        expect(planAutoHouse(stateOf(9, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 1 / lead })).toBe(0)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 0 })).toBe(0)
    })

    it('covers the shortfall over the lead in whole houses', () => {
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 1 / lead })).toBe(1)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 11 / lead })).toBe(2)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { ...banked, pending: [arriving(10)], populationPerSecond: 11 / lead })).toBe(1)
    })

    it('takes the lead from the walk, the house builders and builderScaling', () => {
        const demand = { ...banked, pending: [], populationPerSecond: 2 / lead }
        expect(planAutoHouse(stateOf(9, 10), inputs, data, demand)).toBe(1)
        expect(planAutoHouse(stateOf(9, 10), inputsFor(data, { houseBuilders: 4, walkSeconds: 1 }), data, demand)).toBe(0)
        const slow = editGameData((parts) => {
            parts.base.builderScaling.numerator.value = 6
        })
        expect(planAutoHouse(stateOf(9, 10), inputs, slow, { ...banked, pending: [], populationPerSecond: 1 / lead })).toBe(1)
    })

    it('treats a projected shortfall within the resource tolerance as none', () => {
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 1e-10 / lead })).toBe(0)
        expect(planAutoHouse(stateOf(10, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 1e-8 / lead })).toBe(1)
    })

    it('stops at maxPopCap and never returns a negative count', () => {
        const busy = { ...banked, pending: [], populationPerSecond: 100 }
        expect(planAutoHouse(stateOf(195, 195), inputs, data, busy)).toBe(1)
        expect(planAutoHouse(stateOf(200, 200), inputs, data, busy)).toBe(0)
        expect(planAutoHouse(stateOf(200, 200), inputs, data, { ...banked, pending: [arriving(10)], populationPerSecond: 100 })).toBe(0)
    })

    it('plans nothing when a house gives no supply', () => {
        const busy = { ...banked, pending: [], populationPerSecond: 100 }
        const none: CivRules = { supplyProvider: (supply, ctx) => (ctx.baseId === 'house' ? 0 : supply) }
        expect(planAutoHouse(stateOf(10, 10, data, none), inputs, data, busy)).toBe(0)
        const unlisted = editGameData((parts) => {
            delete parts.civData.supply.house
        })
        expect(planAutoHouse(stateOf(10, 10, unlisted), inputsFor(unlisted), unlisted, busy)).toBe(0)
        const doubled: CivRules = { supplyProvider: (supply) => supply * 2 }
        expect(planAutoHouse(stateOf(10, 10, data, doubled), inputs, data, { ...banked, pending: [], populationPerSecond: 21 / lead })).toBe(2)
    })
})

describe('planAutoHouse pending supply', () => {
    const inputs = inputsFor(data)
    const now = 100
    const at = (population: number, supply: number) => ({ ...stateOf(population, supply), time: now }) as EngineState
    const plan = (pending: { supply: number; completesAt: number }[], populationPerSecond = 11 / lead, state = at(10, 10)) =>
        planAutoHouse(state, inputs, data, { ...banked, pending, populationPerSecond })

    it.each([
        ['after the lead', now + lead + 1, 2],
        ['exactly at the lead', now + lead, 1],
        ['inside the lead', now + lead - 1, 1],
    ])('counts a building finishing %s as headroom only when it lands in time', (_, completesAt, houses) => {
        expect(plan([])).toBe(2)
        expect(plan([{ supply: 10, completesAt }])).toBe(houses)
    })

    it('sums several pending buildings by the same rule', () => {
        const pending = [now + lead - 1, now + lead, now + lead + 1].map((completesAt) => ({ supply: 10, completesAt }))
        expect(plan([], 31 / lead)).toBe(4)
        expect(plan(pending, 31 / lead)).toBe(2)
    })

    it('counts every pending building toward maxPopCap, even one far beyond the lead', () => {
        const far = [{ supply: 10, completesAt: now + 10 * lead }]
        expect(plan([], 100, at(190, 190))).toBe(1)
        expect(plan(far, 100, at(190, 190))).toBe(0)
        expect(plan(far, 1000, at(190, 190))).toBe(0)
    })

    it('returns the same count for the same arguments and leaves them untouched', () => {
        const state = at(10, 10)
        const demand = { ...banked, pending: [{ supply: 10, completesAt: now + 1 }, { supply: 10, completesAt: now + 1000 }], populationPerSecond: 31 / lead }
        const copy = structuredClone(demand)
        const first = planAutoHouse(state, inputs, data, demand)
        expect(planAutoHouse(state, inputs, data, demand)).toBe(first)
        expect(demand).toEqual(copy)
    })
})

describe('planAutoHouse with the house cost not yet banked', () => {
    const inputs = inputsFor(data)
    const now = 100
    const at = (population: number, supply: number) => ({ ...stateOf(population, supply), time: now }) as EngineState

    // One pop per 2 leads fits the supply over the lead alone (9.5 of 10).
    it.each([
        ['due when gathering the cost takes 40 s', gathering(0, 40), 1],
        ['due when half the cost is banked and the rest takes 40 s', gathering(houseWood / 2, 40), 1],
        ['not yet due while a 10 s gather leaves slack', gathering(0, 10), 0],
        ['not due with the cost banked, whatever the income', { bank: { ...NONE, wood: houseWood }, income: gathering(0, 40).income }, 0],
        ['not due while the bank is short and nobody gathers wood', { bank: NONE, income: NONE }, 0],
    ])('is %s', (_, wood, houses) => {
        expect(planAutoHouse(at(9, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 1 / (2 * lead) })).toBe(0)
        expect(planAutoHouse(at(9, 10), inputs, data, { ...wood, pending: [], populationPerSecond: 1 / (2 * lead) })).toBe(houses)
    })

    it('plans nothing for a short resource with no income, however far the population outgrows supply', () => {
        expect(planAutoHouse(at(10, 10), inputs, data, { ...banked, pending: [], populationPerSecond: 100 })).toBeGreaterThan(0)
        expect(planAutoHouse(at(10, 10), inputs, data, { bank: { ...NONE, wood: houseWood - 1 }, income: { ...NONE, food: 10 }, pending: [], populationPerSecond: 100 })).toBe(0)
    })

    // Over a 30 s window (lead plus a 10 s gather) the population reaches 19 of 10 supply.
    it.each([
        ['after the lead but inside the window', now + lead + 5, 0, 1],
        ['exactly at the window', now + lead + 10, 0, 1],
        ['after the window', now + lead + 11, 1, 1],
    ])('counts a building finishing %s toward headroom', (_, completesAt, gatheringHouses, bankedHouses) => {
        const pending = [{ supply: 10, completesAt }]
        expect(planAutoHouse(at(10, 10), inputs, data, { ...gathering(0, 10), pending, populationPerSecond: 0.3 })).toBe(gatheringHouses)
        expect(planAutoHouse(at(10, 10), inputs, data, { ...banked, pending, populationPerSecond: 0.3 })).toBe(bankedHouses)
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
