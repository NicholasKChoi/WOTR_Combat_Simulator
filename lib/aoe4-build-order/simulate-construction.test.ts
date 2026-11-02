import { describe, expect, it } from 'vitest'
import type { CivRules } from './civ-rules'
import type { CivData } from './data'
import { effectiveGatherRate } from './gather'
import type { BuildStart, BuildStep, GatherNodeId, SimulationResult } from './model'
import { ENGLISH, at, countAt, editGameData, inputsFor, run, sampleIndex, series, withHandler } from './test-helpers'
import type { Parts } from './test-helpers'

const data = ENGLISH
const noHouses = { autoHouses: false }

function rateOf(node: GatherNodeId, game = data, partial: unknown = {}, buildings = ['capital-town-center']): number {
    const simInputs = inputsFor(game, partial)
    const state = { data: game, age: 1, buildings: new Map(buildings.map((b) => [b, 1])), researched: new Set<string>(), researchedIds: new Set<string>(), coverage: simInputs.influenceCoverage }
    return effectiveGatherRate(node, state, simInputs)
}

function withStart(edit: (start: CivData['startingState']) => void): (parts: Parts) => void {
    return (parts) => edit(parts.civData.startingState)
}

type Entry = { id: string; costs: Record<string, number>; age: number }

function editEntry(parts: Parts, id: string, edit: (entry: Entry) => void) {
    const all = [...parts.snapshot.units, ...parts.snapshot.buildings] as unknown as Entry[]
    edit(all.find((e) => e.id === id))
}

const rw = rateOf('wood')
const rs = rateOf('sheep')
const rb = rateOf('berry')
const rg = rateOf('gold')
const vils = (count: number) => ({ kind: 'villagers' as const, count })
const house = (builders: number, from: GatherNodeId, extra: Partial<Extract<BuildStep, { action: 'build' }>> = {}): BuildStep => ({
    action: 'build',
    building: 'house',
    builders,
    from,
    ...extra,
})

describe('build step', () => {
    const start: BuildStart = { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' }
    const timed = run([house(2, 'wood', { then: 'wood', trigger: at(0) })], { start, inputs: noHouses })

    it('pays at the start and completes after the walk and the scaled construction', () => {
        expect(timed.steps[0]).toMatchObject({ startedAt: 0, status: 'completed' })
        expect(timed.floating.wood[0]).toBe(150)
        expect(timed.steps[0].completedAt).toBeCloseTo(5 + (15 * 3) / 4, 9)
        const quick = run([house(2, 'wood', { walkSeconds: 3 })], { start, inputs: noHouses })
        expect(quick.steps[0].completedAt).toBeCloseTo(3 + 11.25, 9)
    })

    it('scales construction with the builder count', () => {
        for (const n of [1, 2, 4]) {
            const result = run([house(n, 'wood')], { start: { villagers: { sheep: 2, wood: 4 }, rally: 'sheep' }, inputs: noHouses })
            const [step] = result.steps
            expect(step.completedAt - step.startedAt).toBeCloseTo(5 + (15 * 3) / (n + 2), 9)
        }
    })

    it('divides the walk by the villager moveSpeed multiplier', () => {
        const fast = editGameData((parts) => {
            parts.civData.effects.push({ property: 'moveSpeed', select: { id: ['villager'] }, effect: 'multiply', value: 2, type: 'passive', grantedBy: 'civ', source: 'test', unverified: true })
        })
        const result = run([house(2, 'wood')], { game: fast, start, inputs: noHouses })
        expect(result.steps[0].completedAt).toBeCloseTo(2.5 + 11.25, 9)
    })

    it('takes the builders off their node until they walk back', () => {
        expect(timed.gatherRates.wood[sampleIndex(timed, 15)]).toBe(0)
        expect(timed.gatherRates.wood[sampleIndex(timed, 20)]).toBe(0)
        expect(timed.gatherRates.wood[sampleIndex(timed, 25)]).toBeCloseTo(2 * rw * 60, 9)
        const fromSheep = run([house(2, 'sheep', { then: 'wood' })], { start, inputs: noHouses })
        expect(fromSheep.gatherRates.food[sampleIndex(fromSheep, 5)]).toBeCloseTo(2 * rs * 60, 9)
        expect(fromSheep.gatherRates.wood[sampleIndex(fromSheep, 20)]).toBeCloseTo(2 * rw * 60, 9)
        expect(fromSheep.gatherRates.wood[sampleIndex(fromSheep, 25)]).toBeCloseTo(4 * rw * 60, 9)
        expect(fromSheep.gatherRates.food[sampleIndex(fromSheep, 25)]).toBeCloseTo(3 * rs * 60, 9)
    })

    it('counts the builders as alive villagers', () => {
        const result = run([house(2, 'wood'), { action: 'rally', producer: 'capital-town-center', to: 'gold', trigger: vils(7) }], {
            start: { villagers: { wood: 6 }, rally: 'wood' },
            inputs: noHouses,
        })
        expect(result.steps[1].armedAt).toBe(20)
    })

    it('raises supply only at completion and never past maxPopCap', () => {
        expect(countAt(timed, 'villager', 120)).toBe(6)
        expect(countAt(run([], { start, inputs: noHouses }), 'villager', 120)).toBe(3)
        const capped = editGameData((parts) => {
            parts.base.maxPopCap.value = 30
        })
        const result = run([house(1, 'sheep'), house(1, 'sheep'), house(1, 'sheep')], { game: capped, start, inputs: { ...noHouses, durationSeconds: 900 } })
        expect(result.steps.every((s) => s.status === 'completed')).toBe(true)
        expect(countAt(result, 'villager', 900)).toBe(23)
    })

    it('waits for builders gathering at from, reserving nothing', () => {
        const result = run([house(3, 'wood')], { start: { villagers: { sheep: 4, wood: 2 }, rally: 'wood' }, inputs: noHouses })
        expect(result.steps[0].startedAt).toBe(25)
        expect(countAt(result, 'villager', 20)).toBe(1)
        expect(result.floating.food[sampleIndex(result, 20)]).toBeLessThan(150 + 20 * 4 * rs)
        expect(countAt(result, 'villager', 40)).toBe(2)
    })

    it('reserves the cost when blocked on resources alone, not on age or builders', () => {
        const woodVillagers = editGameData((parts) => {
            editEntry(parts, 'villager-1', (v) => {
                v.costs.food = 0
                v.costs.wood = 50
            })
            parts.civData.startingState.resources.value = { food: 200, wood: 100, gold: 100, stone: 0 }
        })
        const options = { game: woodVillagers, start: { villagers: { wood: 6 }, rally: 'wood' as const }, inputs: noHouses }
        const blocked = run([{ action: 'build', building: 'barracks', from: 'wood' }], options)
        const started = blocked.steps[0].startedAt
        expect(started).toBeCloseTo(50 / (6 * rw), 6)
        const payments = series(blocked, 'villager')
        expect(payments[sampleIndex(blocked, 20)]).toBe(0)
        expect(payments[blocked.times.findIndex((t) => t >= started + 20)]).toBe(0)
        const aged = run([{ action: 'build', building: 'kings-palace', from: 'wood' }], options)
        expect(aged.steps[0].status).toBe('waiting')
        expect(aged.floating.wood[0]).toBe(50)
        expect(countAt(aged, 'villager', 20)).toBe(1)
        for (const result of [blocked, aged]) {
            Object.values(result.floating).forEach((values) => values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0)))
        }
    })

    it('adds a villager producer that runs the default order with the held rally', () => {
        const rich = editGameData(
            withStart((start) => {
                start.resources.value = { food: 2000, wood: 1000, gold: 0, stone: 1000 }
                start.buildings.value = ['capital-town-center', 'house', 'house']
            }),
        )
        const tc: BuildStep = { action: 'build', building: 'town-center', builders: 3, from: 'sheep' }
        const options = { game: rich, start: { villagers: { sheep: 6 }, rally: 'sheep' as const }, inputs: noHouses }
        const plain = run([tc], options)
        expect(plain.steps[0].completedAt).toBeCloseTo(5 + (165 * 3) / 5, 9)
        expect(countAt(plain, 'villager', 120)).toBe(countAt(run([], options), 'villager', 120))
        expect(countAt(plain, 'villager', 125)).toBe(countAt(run([], options), 'villager', 125) + 1)
        const held = run([{ action: 'rally', producer: 'town-center', to: 'stone' }, { action: 'rally', producer: 'town-center', instance: 1, to: 'gold' }, tc], options)
        const byDefault = run([{ action: 'rally', producer: 'town-center', to: 'stone' }, tc], options)
        expect(byDefault.gatherRates.stone[sampleIndex(byDefault, 130)]).toBeCloseTo(rateOf('stone') * 60, 9)
        expect(plain.gatherRates.food[sampleIndex(plain, 130)] - plain.gatherRates.food[sampleIndex(plain, 125)]).toBeCloseTo(rs * 60, 9)
        expect(plain.gatherRates.gold[sampleIndex(plain, 130)]).toBe(0)
        expect(plain.gatherRates.stone[sampleIndex(plain, 130)]).toBe(0)
        expect(held.gatherRates.stone[sampleIndex(held, 130)]).toBe(0)
        expect(held.gatherRates.gold[sampleIndex(held, 130)]).toBeCloseTo(rg * 60, 9)
    })

    it('leaves a new instance out of a produce step written before it was built', () => {
        const two = editGameData(
            withStart((start) => {
                start.resources.value = { food: 2000, wood: 1000, gold: 0, stone: 1000 }
                start.buildings.value = ['capital-town-center', 'town-center', 'house', 'house']
            }),
        )
        const options = { game: two, start: { villagers: { sheep: 6 }, rally: 'sheep' as const }, inputs: noHouses }
        const once: BuildStep = { action: 'produce', producer: 'town-center', unit: 'villager', count: 1 }
        const result = run([once, { action: 'build', building: 'town-center', builders: 3, from: 'sheep' }], options)
        const without = run([once], options)
        expect(countAt(result, 'villager', 165)).toBe(countAt(without, 'villager', 165) + 3)
    })

    it('switches wood to the camp walk at the lumber camp completion', () => {
        const walks = { trips: { wood: { walkSecondsTownCenter: 20, walkSecondsCamp: 2 } } }
        const start: BuildStart = { villagers: { sheep: 2, wood: 4 }, rally: 'sheep' }
        const result = run([{ action: 'build', building: 'lumber-camp', from: 'sheep' }], { start, inputs: { ...walks, ...noHouses } })
        const completed = result.steps[0].completedAt
        expect(completed).toBeCloseTo(5 + (20 * 3) / 3, 9)
        expect(result.gatherRates.wood[sampleIndex(result, 20)]).toBeCloseTo(4 * rateOf('wood', data, walks) * 60, 9)
        expect(result.gatherRates.wood[sampleIndex(result, 25)]).toBeCloseTo(4 * rateOf('wood', data, walks, ['capital-town-center', 'lumber-camp']) * 60, 9)
        expect(rateOf('wood', data, walks)).not.toBeCloseTo(rateOf('wood', data, walks, ['capital-town-center', 'lumber-camp']), 3)
    })
})

const agesData = editGameData(
    withStart((start) => {
        start.buildings.value = ['capital-town-center', 'barracks', 'house', 'house']
        start.resources.value = { food: 2000, wood: 200, gold: 1000, stone: 0 }
    }),
)
const sixSheep: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
const abbey: BuildStep = { action: 'build', building: 'abbey-of-kings', builders: 4, from: 'sheep', trigger: at(0) }

describe('build hooks', () => {
    it('calls onBuildingComplete after the instance exists and onAgeAdvance after the age moves', () => {
        const calls: string[] = []
        const rules: CivRules = {
            onBuildingComplete(state, ctx) {
                const list = state.instances.get(ctx.baseId)
                expect(list[list.length - 1].instance).toBe(ctx.instance)
                calls.push(`built ${ctx.baseId}#${ctx.instance} count=${state.buildings.get(ctx.baseId)} age=${state.age}`)
            },
            onAgeAdvance(state, ctx) {
                calls.push(`age ${ctx.age} state=${state.age} t=${ctx.time}`)
            },
        }
        run([house(1, 'sheep'), { action: 'build', building: 'abbey-of-kings', builders: 4, from: 'sheep' }], { game: agesData, start: sixSheep, inputs: noHouses, rules })
        expect(calls).toEqual(['built house#3 count=3 age=1', 'built abbey-of-kings#1 count=1 age=1', 'age 2 state=2 t=100'])
    })
})

describe('ages', () => {
    const options = { game: agesData, start: sixSheep, inputs: noHouses }

    it('advances only on a landmark of the current age', () => {
        const result = run([abbey, { action: 'build', building: 'council-hall', builders: 1, from: 'sheep' }], options)
        expect(result.steps.map((s) => s.startedAt)).toEqual([0, 0])
        expect(result.steps[0].completedAt).toBeCloseTo(100, 9)
        expect(result.steps[1].completedAt).toBeCloseTo(195, 9)
        expect(result.ages).toEqual([
            { age: 1, reachedAt: 0 },
            { age: 2, reachedAt: 100 },
        ])
    })

    it('starts a next-age build at the age-up instant', () => {
        const result = run([abbey, { action: 'build', building: 'kings-palace', builders: 2, from: 'sheep' }], options)
        expect(result.steps[1]).toMatchObject({ armedAt: 0, startedAt: 100, waitSeconds: 100 })
        expect(result.steps[1].completedAt).toBeCloseTo(270, 9)
        expect(result.ages).toEqual([
            { age: 1, reachedAt: 0 },
            { age: 2, reachedAt: 100 },
            { age: 3, reachedAt: 270 },
        ])
    })

    it('keeps paid items and offers next-age units at the age-up instant', () => {
        const result = run(
            [abbey, { action: 'produce', producer: 'barracks', unit: 'man-at-arms' }, { action: 'produce', producer: 'barracks', unit: 'spearman' }],
            { ...options, inputs: { ...noHouses, durationSeconds: 120 } },
        )
        expect(result.steps.map((s) => s.startedAt)).toEqual([0, 0, 100])
        expect(result.steps[2]).toMatchObject({ armedAt: 0, waitSeconds: 100 })
        expect(result.steps[1].completedAt).toBe(100)
        const unit = (id: string) => result.unitsProduced.find((u) => u.unitId === id)
        expect(unit('man-at-arms-1')).toMatchObject({ tier: 1 })
        expect(unit('man-at-arms-1').counts[sampleIndex(result, 100)]).toBe(6)
        expect(unit('man-at-arms-1').counts.at(-1)).toBe(7)
        expect(unit('man-at-arms-2')).toBeUndefined()
        expect(unit('spearman-2')).toMatchObject({ tier: 2 })
        expect(unit('spearman-2').counts[sampleIndex(result, 115)]).toBe(0)
        expect(unit('man-at-arms-1').counts[sampleIndex(result, 105)]).toBe(7)
        expect(unit('spearman-2').counts[sampleIndex(result, 120)]).toBe(1)
    })
})

describe('move step', () => {
    const result = run([{ action: 'move', count: 2, from: 'sheep', to: 'wood', trigger: at(10) }], { inputs: noHouses })

    it('walks the villagers to the new node', () => {
        expect(result.steps[0]).toMatchObject({ startedAt: 10, completedAt: 15, status: 'completed' })
        expect(result.gatherRates.food[sampleIndex(result, 10)]).toBeCloseTo(4 * rs * 60, 9)
        expect(result.gatherRates.wood[sampleIndex(result, 10)]).toBe(0)
        expect(result.gatherRates.wood[sampleIndex(result, 15)]).toBeCloseTo(2 * rw * 60, 9)
        expect(result.gatherRates.food[sampleIndex(result, 25)]).toBeCloseTo(5 * rs * 60, 9)
        const quick = run([{ action: 'move', count: 2, from: 'sheep', to: 'wood', walkSeconds: 3, trigger: at(10) }], { inputs: noHouses })
        expect(quick.steps[0].completedAt).toBe(13)
    })

    it('waits for count villagers at from', () => {
        const waiting = run([{ action: 'move', count: 7, from: 'sheep', to: 'wood' }], { inputs: noHouses })
        expect(waiting.steps[0].startedAt).toBe(25)
        expect(waiting.floating.food[0]).toBe(150)
    })
})

const twoTowns = (edit: (parts: Parts) => void = () => {}) =>
    editGameData((parts) => {
        parts.civData.startingState.buildings.value = ['capital-town-center', 'town-center']
        parts.civData.startingState.resources.value = { food: 5000, wood: 200, gold: 0, stone: 0 }
        edit(parts)
    })
const woodStart: BuildStart = { villagers: { wood: 6 }, rally: 'wood' }
const villagersAt = (result: SimulationResult, t: number) => countAt(result, 'villager', t)

function housesDone(): { done: number[]; rules: CivRules } {
    const done: number[] = []
    return { done, rules: { onBuildingComplete: (_state, ctx) => void (ctx.baseId === 'house' && done.push(ctx.time)) } }
}

describe('auto-houses', () => {
    const towns = twoTowns()

    it('keep supply ahead of two producers', () => {
        const { done, rules } = housesDone()
        const auto = run([], { game: towns, start: woodStart, rules, inputs: { durationSeconds: 200 } })
        expect(villagersAt(auto, 200)).toBe(20)
        expect(done).toEqual([120])
        const off = run([], { game: towns, start: woodStart, inputs: noHouses })
        expect(villagersAt(off, 200)).toBe(13)
        expect(auto.gatherRates.wood[sampleIndex(auto, 105)]).toBeCloseTo(15 * rw * 60, 9)
        expect(off.gatherRates.wood[sampleIndex(off, 105)]).toBeCloseTo(16 * rw * 60, 9)
        expect(auto.gatherRates.wood[sampleIndex(auto, 125)]).toBeCloseTo(off.gatherRates.wood[sampleIndex(off, 125)], 9)
    })

    it('stay off until the last build-house step has started', () => {
        const never = run([house(1, 'wood', { trigger: at(600) })], { game: towns, start: woodStart })
        expect(villagersAt(never, 200)).toBe(13)
        const twoSteps = (second: number, inputs: unknown = { durationSeconds: 400 }) =>
            run([house(1, 'wood', { trigger: at(0) }), house(1, 'wood', { trigger: at(second) })], { game: towns, start: woodStart, inputs })
        const { done, rules } = housesDone()
        const gated = run([house(1, 'wood', { trigger: at(0) }), house(1, 'wood', { trigger: at(30) })], { game: towns, start: woodStart, rules, inputs: { durationSeconds: 400 } })
        expect(done).toEqual([20, 50, 320])
        expect(villagersAt(gated, 400)).toBe(40)
        expect(villagersAt(twoSteps(30, { durationSeconds: 400, autoHouses: false }), 400)).toBe(33)
        const late = twoSteps(300)
        expect(late.steps[1].startedAt).toBe(300)
        expect(villagersAt(late, 240)).toBe(23)
        expect(villagersAt(late, 300)).toBe(23)
        expect(late.steps[1].completedAt).toBe(320)
        expect(villagersAt(late, 340)).toBe(25)
    })

    it('take houseBuilders from houseBuilderSource and return them there', () => {
        const done: number[] = []
        const rules: CivRules = { onBuildingComplete: (_state, ctx) => void done.push(ctx.time) }
        const result = run([], { start: { villagers: { sheep: 6, gold: 2 }, rally: 'sheep' }, inputs: { houseBuilders: 2, houseBuilderSource: 'gold' }, rules })
        expect(done[0]).toBeCloseTo(5 + (15 * 3) / 4, 9)
        expect(result.gatherRates.gold[0]).toBe(0)
        expect(result.gatherRates.gold[sampleIndex(result, 20)]).toBe(0)
        expect(result.gatherRates.gold[sampleIndex(result, 25)]).toBeCloseTo(2 * rg * 60, 9)
    })

    it('start none when a house gives no supply', () => {
        const zero = run([], { rules: { supplyProvider: (supply, ctx) => (ctx.baseId === 'house' ? 0 : supply) } })
        expect(villagersAt(zero, 120)).toBe(3)
        const unlisted = editGameData((parts) => {
            delete parts.civData.supply.house
        })
        expect(villagersAt(run([], { game: unlisted }), 120)).toBe(3)
    })

    it('stop at maxPopCap', () => {
        const capped = editGameData((parts) => {
            parts.base.maxPopCap.value = 30
        })
        const houses: number[] = []
        const rules: CivRules = { onBuildingComplete: (_state, ctx) => void (ctx.baseId === 'house' && houses.push(ctx.time)) }
        const result = run([], { game: capped, rules, inputs: { durationSeconds: 900 } })
        expect(houses).toHaveLength(2)
        expect(villagersAt(result, 900)).toBe(23)
    })

    it('fall back to the fullest node when the source has too few gatherers', () => {
        const { done, rules } = housesDone()
        const result = run([], { rules })
        expect(done[0]).toBe(60)
        expect(result.gatherRates.wood.slice(0, sampleIndex(result, 120) + 1).every((v) => v === 0)).toBe(true)
        expect(result.gatherRates.food[sampleIndex(result, 40)]).toBeCloseTo(6 * rs * 60, 9)
        expect(result.gatherRates.food[sampleIndex(result, 45)]).toBeCloseTo(7 * rs * 60, 9)
        expect(result.gatherRates.food[sampleIndex(result, 60)]).toBeCloseTo(7 * rs * 60, 9)
        expect(result.gatherRates.food[sampleIndex(result, 65)]).toBeCloseTo(9 * rs * 60, 9)
        expect(result.floating.wood[sampleIndex(result, 40)]).toBe(150)
        expect(result.floating.wood[sampleIndex(result, 35)]).toBe(200)
        expect(villagersAt(result, 120)).toBe(6)
        expect(villagersAt(run([], { inputs: noHouses }), 120)).toBe(3)
        expect(run([], { inputs: { houseBuilderSource: 'gold' } })).toEqual(result)
    })

    it('break a fullest-node tie by node order', () => {
        const result = run([], { start: { villagers: { berry: 3, gold: 3 }, rally: 'stone' } })
        expect(result.gatherRates.food[sampleIndex(result, 45)]).toBeCloseTo(2 * rb * 60, 9)
        expect(result.gatherRates.gold[sampleIndex(result, 45)]).toBeCloseTo(3 * rg * 60, 9)
        expect(result.gatherRates.food[sampleIndex(result, 65)]).toBeCloseTo(3 * rb * 60, 9)
    })

    it('pay every resource of the house cost', () => {
        const stoneHouse = (stone: number) =>
            editGameData((parts) => {
                editEntry(parts, 'house-1', (h) => {
                    h.costs.stone = 10
                })
                parts.civData.startingState.resources.value.stone = stone
            })
        const none = run([], { game: stoneHouse(0) })
        expect(villagersAt(none, 120)).toBe(3)
        expect(none.floating.wood.every((v) => v === 200)).toBe(true)
        const paid = run([], { game: stoneHouse(10) })
        expect(paid.floating.stone[sampleIndex(paid, 45)]).toBe(0)
        expect(paid.floating.wood[sampleIndex(paid, 45)]).toBe(150)
        expect(paid.floating.wood[sampleIndex(paid, 35)]).toBe(200)
    })

    it('wait without error when no node has houseBuilders gatherers', () => {
        const result = run([], { inputs: { houseBuilders: 11 } })
        expect(villagersAt(result, 120)).toBe(3)
        expect(result.floating.wood.every((v) => v === 200)).toBe(true)
    })

    it('wake when the house becomes affordable', () => {
        const poor = editGameData((parts) => {
            parts.civData.startingState.resources.value.wood = 0
        })
        const { done, rules } = housesDone()
        run([], { game: poor, start: { villagers: { sheep: 5, wood: 1 }, rally: 'sheep' }, rules })
        const due = 50 / rw
        expect(due).toBeGreaterThan(40)
        expect(due % 5).toBeGreaterThan(0)
        expect(done[0]).toBeCloseTo(due + 20, 6)
    })

    it('ignore a waiting step reserve', () => {
        const woodVillagers = editGameData((parts) => {
            editEntry(parts, 'villager-1', (v) => {
                v.costs.food = 0
                v.costs.wood = 50
            })
        })
        withHandler(
            'research',
            () => ({ started: false, reserve: { food: 0, wood: 1e9, gold: 0, stone: 0 } }),
            () => {
                const result = run([{ action: 'research', tech: 'wheelbarrow' }], { game: woodVillagers, start: { villagers: { sheep: 9 }, rally: 'sheep' } })
                expect(result.floating.wood[0]).toBe(150)
                expect(result.unitsProduced).toEqual([])
                Object.values(result.floating).forEach((values) => values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0)))
            },
        )
    })

    it('project the demand at the modified production speed', () => {
        const fast = editGameData((parts) => {
            parts.civData.startingState.resources.value = { food: 5000, wood: 200, gold: 0, stone: 0 }
            parts.civData.effects.push({ property: 'productionSpeed', select: { id: ['villager'] }, effect: 'multiply', value: 2, type: 'passive', grantedBy: 'civ', source: 'test', unverified: true })
        })
        const { done, rules } = housesDone()
        const result = run([], { game: fast, start: woodStart, rules, inputs: { durationSeconds: 120 } })
        expect(done).toEqual([30])
        expect(villagersAt(result, 120)).toBe(12)
    })

    it('count every producing instance in the demand', () => {
        const army = twoTowns((parts) => {
            parts.civData.startingState.buildings.value.push('barracks')
            parts.civData.startingState.resources.value.gold = 1000
        })
        const { done, rules } = housesDone()
        const result = run([{ action: 'produce', producer: 'barracks', unit: 'man-at-arms' }], { game: army, start: woodStart, rules })
        expect(done[0]).toBeCloseTo(3 * 14.65 + 20, 9)
        expect(result.gatherRates.wood[sampleIndex(result, 45)]).toBeCloseTo(9 * rw * 60, 9)
    })
})

describe('determinism and data', () => {
    const scenarios: [BuildStep[], Parameters<typeof run>[1]][] = [
        [[house(2, 'wood', { then: 'wood' })], { start: { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' } }],
        [[abbey, { action: 'build', building: 'kings-palace', builders: 2, from: 'sheep' }], { game: agesData, start: sixSheep }],
        [[{ action: 'move', count: 2, from: 'sheep', to: 'wood', trigger: at(10) }], {}],
        [[house(1, 'wood', { trigger: at(0) }), house(1, 'wood', { trigger: at(30) })], { game: twoTowns(), start: woodStart }],
    ]

    it('repeats every scenario exactly without mutating its inputs', () => {
        for (const [steps, options] of scenarios) {
            const before = structuredClone(steps)
            expect(run(steps, options)).toEqual(run(steps, options))
            expect(steps).toEqual(before)
        }
    })

    it('follows builderScaling, the house cost and time, and the house supply', () => {
        const base = run([])
        const edits: ((parts: Parts) => void)[] = [
            (parts) => {
                parts.base.builderScaling.numerator.value = 6
            },
            (parts) => editEntry(parts, 'house-1', (h) => void (h.costs.wood = 100)),
            (parts) => editEntry(parts, 'house-1', (h) => void (h.costs.time = 60)),
            (parts) => {
                parts.civData.supply.house.value = 5
            },
        ]
        for (const edit of edits) {
            expect(run([], { game: editGameData(edit) })).not.toEqual(base)
        }
    })

    it('runs an hour of two producers, auto-houses and twenty steps in well under a second', () => {
        const steps: BuildStep[] = []
        for (let i = 0; i < 5; i += 1) {
            steps.push(
                { action: 'move', count: 1, from: 'wood', to: 'gold', trigger: at(i * 600 + 60) },
                house(1, 'wood'),
                { action: 'build', building: 'lumber-camp', from: 'wood', then: 'gold' },
                { action: 'move', count: 1, from: 'gold', to: 'wood' },
            )
        }
        const game = twoTowns()
        const started = performance.now()
        const result = run(steps, { game, start: woodStart, inputs: { durationSeconds: 3600 } })
        expect(performance.now() - started).toBeLessThan(1000)
        expect(result.steps.every((s) => s.status === 'completed')).toBe(true)
    })
})

