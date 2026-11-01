import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { BaseRules, CivData, GameData, Snapshot, buildGameData, loadGameData } from './data'
import { effectiveGatherRate } from './gather'
import type { BuildOrder, BuildStart, BuildStep, GatherNodeId, ResourceKind, SimInputs, SimulationResult } from './model'
import { simulateBuildOrder } from './simulate'
import { resolveSimInputs } from './validate'

const data = loadGameData('english')

type Starting = CivData['startingState']

function gameWith(edit: (start: Starting) => void): GameData {
    const civData = structuredClone(englishRules) as unknown as CivData
    edit(civData.startingState)
    return buildGameData('english', structuredClone(englishSnapshot) as unknown as Snapshot, structuredClone(baseRules) as unknown as BaseRules, civData)
}

function inputsFor(game: GameData, partial: unknown = {}): SimInputs {
    const result = resolveSimInputs(partial, game)
    if (result.ok === false) {
        throw new Error(JSON.stringify(result.issues))
    }
    return result.inputs
}

function run(steps: BuildStep[], options: { game?: GameData; inputs?: unknown; start?: BuildStart } = {}): SimulationResult {
    const game = options.game ?? data
    const order: BuildOrder = { civ: 'english', name: 'build-move-acceptance', start: options.start ?? { rally: 'sheep' }, steps }
    return simulateBuildOrder(order, game, inputsFor(game, options.inputs ?? {}))
}

const noHouses = { autoHouses: false }
const at = (seconds: number) => ({ kind: 'time' as const, seconds })

function idx(result: SimulationResult, t: number): number {
    const i = result.times.indexOf(t)
    expect(i).toBeGreaterThanOrEqual(0)
    return i
}

function rateAt(result: SimulationResult, kind: ResourceKind, t: number): number {
    return result.gatherRates[kind][idx(result, t)]
}

function floatAt(result: SimulationResult, kind: ResourceKind, t: number): number {
    return result.floating[kind][idx(result, t)]
}

function villagers(result: SimulationResult): number[] {
    return result.unitsProduced.find((u) => u.baseId === 'villager')?.counts ?? result.times.map(() => 0)
}

function countAt(result: SimulationResult, baseId: string, t: number): number {
    return result.unitsProduced.find((u) => u.baseId === baseId)?.counts[idx(result, t)] ?? 0
}

function perSecond(node: GatherNodeId, game = data): number {
    const simInputs = inputsFor(game)
    const state = { data: game, age: 1, buildings: new Map([['capital-town-center', 1]]), researched: new Set<string>(), coverage: simInputs.influenceCoverage }
    return effectiveGatherRate(node, state, simInputs)
}

const rs = perSecond('sheep')
const rg = perSecond('gold')
const rw = perSecond('wood')
const W = 5

function expectNonNegative(result: SimulationResult) {
    for (const kind of ['food', 'wood', 'gold', 'stone'] as ResourceKind[]) {
        for (const value of result.floating[kind]) {
            expect(value).toBeGreaterThanOrEqual(-1e-9)
        }
    }
}

describe('build timing scales with the number of builders', () => {
    const start: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
    const barracks = (builders: number): BuildStep => ({ action: 'build', building: 'barracks', builders, from: 'sheep' })

    it.each([
        [1, W + (30 * 3) / 3],
        [2, W + (30 * 3) / 4],
        [4, W + (30 * 3) / 6],
    ])('completes a 30 s barracks with %i builders at walk plus 90 / (n + 2)', (builders, expected) => {
        const result = run([barracks(builders)], { start, inputs: noHouses })
        expect(result.steps[0]).toMatchObject({ status: 'completed', startedAt: 0, waitSeconds: 0 })
        expect(result.steps[0].completedAt).toBeCloseTo(expected, 9)
        expect(floatAt(result, 'wood', 0)).toBe(50)
    })

    it('lets a produce step on the new barracks start only once it completes, spawning one unit time later', () => {
        const roomy = gameWith((s) => {
            s.buildings.value = ['capital-town-center', 'house']
        })
        const result = run([barracks(2), { action: 'produce', producer: 'barracks', unit: 'man-at-arms' }], { game: roomy, start, inputs: noHouses })
        // Barracks done at 5 + 22.5 = 27.5, first man-at-arms paid then and spawned 14.65 s later at 42.15.
        expect(result.steps[1].startedAt).toBeCloseTo(27.5, 9)
        expect(countAt(result, 'man-at-arms', 40)).toBe(0)
        expect(countAt(result, 'man-at-arms', 45)).toBe(1)
        // The second is paid when the first spawns, so it spawns at 56.8.
        expect(countAt(result, 'man-at-arms', 55)).toBe(1)
        expect(countAt(result, 'man-at-arms', 60)).toBe(2)
    })
})

describe('builder income dip and return', () => {
    const start: BuildStart = { villagers: { sheep: 2, gold: 4 }, rally: 'sheep' }
    // Starts at 20, arrives 25, barracks done at 25 + 22.5 = 47.5, builders back at 52.5.
    const result = run([{ trigger: at(20), action: 'build', building: 'barracks', builders: 2, from: 'gold', then: 'sheep' }], { start, inputs: noHouses })

    it('keeps full gold income before the start and halves it from the start sample until the end of the run', () => {
        expect(rateAt(result, 'gold', 15)).toBeCloseTo(4 * rg * 60, 6)
        expect(rateAt(result, 'gold', 20)).toBeCloseTo(2 * rg * 60, 6)
        expect(rateAt(result, 'gold', 50)).toBeCloseTo(2 * rg * 60, 6)
        // The builders went back to sheep, not gold.
        expect(rateAt(result, 'gold', 55)).toBeCloseTo(2 * rg * 60, 6)
    })

    it('adds the builders to the then node only after the walk back', () => {
        // Sheep: 2 at start, spawns at 20 and 40 arrive at 25 and 45.
        expect(rateAt(result, 'food', 50)).toBeCloseTo(4 * rs * 60, 6)
        expect(rateAt(result, 'food', 55)).toBeCloseTo(6 * rs * 60, 6)
    })

    it('completes the step at the building, before the builders are back', () => {
        expect(result.steps[0].startedAt).toBe(20)
        expect(result.steps[0].completedAt).toBeCloseTo(47.5, 9)
    })
})

describe('landmark age-ups unblock age-gated research', () => {
    const game = gameWith((s) => {
        s.buildings.value = ['capital-town-center', 'mill']
        s.resources.value = { food: 2000, wood: 500, gold: 1000, stone: 0 }
    })
    const start: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
    const steps: BuildStep[] = [
        { action: 'build', building: 'abbey-of-kings', builders: 3, from: 'sheep' },
        { action: 'research', tech: 'horticulture' },
    ]
    const result = run(steps, { game, start, inputs: noHouses })
    const baseline = run([{ action: 'build', building: 'abbey-of-kings', builders: 3, from: 'sheep' }], { game, start, inputs: noHouses })

    it('advances to age 2 at the landmark completion and starts the age 2 research at that instant', () => {
        // 5 + 190 * 3 / 5 = 119.
        expect(result.steps[0].completedAt).toBeCloseTo(119, 9)
        expect(result.ages).toEqual([
            { age: 1, reachedAt: 0 },
            { age: 2, reachedAt: 119 },
        ])
        expect(result.steps[1]).toMatchObject({ armedAt: 0, startedAt: 119, waitSeconds: 119 })
        expect(result.steps[1].completedAt).toBeCloseTo(119 + 45, 9)
    })

    it('pays the landmark at 0 and the research only at 119, in full and once', () => {
        expect(floatAt(result, 'gold', 115)).toBe(800)
        expect(floatAt(result, 'wood', 115)).toBe(500)
        expect(floatAt(result, 'gold', 120)).toBe(700)
        expect(floatAt(result, 'wood', 120)).toBe(450)
        expect(floatAt(result, 'gold', 1200)).toBe(700)
    })

    it('raises food income only after the research completes', () => {
        expect(rateAt(result, 'food', 160)).toBeCloseTo(rateAt(baseline, 'food', 160), 9)
        expect(rateAt(result, 'food', 170)).toBeGreaterThan(rateAt(baseline, 'food', 170))
    })

    it('never reaches the research when no landmark is built', () => {
        const stuck = run([{ action: 'research', tech: 'horticulture' }], { game, start, inputs: noHouses })
        expect(stuck.steps[0]).toMatchObject({ status: 'waiting', startedAt: null })
        expect(stuck.ages).toEqual([{ age: 1, reachedAt: 0 }])
    })
})

describe('an age 2 building waits for the landmark', () => {
    const game = gameWith((s) => {
        s.resources.value = { food: 2000, wood: 500, gold: 1000, stone: 0 }
    })
    const start: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
    const stable: BuildStep = { action: 'build', building: 'stable', builders: 2, from: 'sheep' }

    it('starts and pays the stable at the age-up instant, not before', () => {
        const result = run([{ action: 'build', building: 'abbey-of-kings', builders: 3, from: 'sheep' }, stable], { game, start, inputs: noHouses })
        expect(result.steps[1]).toMatchObject({ armedAt: 0, startedAt: 119, waitSeconds: 119 })
        expect(floatAt(result, 'wood', 115)).toBe(500)
        expect(floatAt(result, 'wood', 120)).toBe(350)
    })

    it('never starts or pays it at age 1', () => {
        const result = run([stable], { game, start, inputs: noHouses })
        expect(result.steps[0]).toMatchObject({ status: 'waiting', startedAt: null })
        expect(floatAt(result, 'wood', 1200)).toBe(500)
    })
})

describe('builders and movers still count as villagers', () => {
    const start: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
    const trigger = { kind: 'villagers' as const, count: 7 }
    const marker: BuildStep = { trigger, action: 'rally', producer: 'capital-town-center', to: 'wood' }

    it('arms an at-7-villagers step at the first spawn while two builders are away', () => {
        const result = run([{ action: 'build', building: 'barracks', builders: 2, from: 'sheep' }, marker], { start, inputs: noHouses })
        expect(result.steps[1]).toMatchObject({ armedAt: 20, startedAt: 20 })
    })

    it('arms an at-7-villagers step at the first spawn while three villagers walk to another node', () => {
        const result = run([{ action: 'move', count: 3, from: 'sheep', to: 'wood', walkSeconds: 30 }, marker], { start, inputs: noHouses })
        expect(result.steps[1]).toMatchObject({ armedAt: 20, startedAt: 20 })
    })
})

describe('auto-houses on a plain default order', () => {
    const result = run([])

    it('never stalls the villager order at the starting supply of 10', () => {
        const counts = villagers(result)
        result.times.forEach((t, i) => {
            if (t <= 600) {
                expect(counts[i]).toBe(Math.floor(t / 20))
            }
        })
    })

    it('stalls at supply with auto-houses off, so the check above can fail', () => {
        expect(countAt(run([], { inputs: noHouses }), 'villager', 600)).toBe(3)
    })

    it('keeps resources non-negative and spends wood on houses only in 50 wood amounts', () => {
        expectNonNegative(result)
        const spent = 200 - floatAt(result, 'wood', 600)
        expect(spent % 50).toBe(0)
        expect(spent).toBeGreaterThan(0)
    })
})

describe('a build step short of a resource', () => {
    it('waits without paying anything until the wood is there, then pays all at once', () => {
        const game = gameWith((s) => {
            s.villagers.value = { sheep: 0, berry: 0, deer: 0, boar: 0, farm: 0, wood: 6, gold: 0, stone: 0 }
            s.resources.value = { food: 200, wood: 100, gold: 100, stone: 0 }
        })
        const result = run([{ action: 'build', building: 'barracks', builders: 1, from: 'wood' }], { game, start: { rally: 'wood' }, inputs: noHouses })
        const expectedStart = 50 / (6 * rw)
        expect(result.steps[0].startedAt).toBeCloseTo(expectedStart, 3)
        expect(result.steps[0].waitSeconds).toBeCloseTo(expectedStart, 3)
        // Before the start the wood only grows; the build never took a partial payment.
        expect(floatAt(result, 'wood', 5)).toBeCloseTo(100 + 6 * rw * 5, 6)
        expect(floatAt(result, 'wood', 10)).toBeCloseTo(100 + 6 * rw * 10, 6)
        expectNonNegative(result)
    })

    it('stays waiting to the horizon on a resource with no income, leaves the wood untouched and blocks the next step', () => {
        const game = gameWith((s) => {
            s.buildings.value = ['capital-town-center']
            s.resources.value = { food: 200, wood: 500, gold: 100, stone: 0 }
        })
        const result = run(
            [
                { action: 'build', building: 'town-center', builders: 1, from: 'sheep' },
                { action: 'build', building: 'house', from: 'sheep' },
            ],
            { game, inputs: noHouses },
        )
        expect(result.steps[0]).toMatchObject({ status: 'waiting', startedAt: null })
        expect(result.steps[1].status).toBe('not-reached')
        expect(floatAt(result, 'wood', 1200)).toBe(500)
        expect(floatAt(result, 'stone', 1200)).toBe(0)
    })
})

describe('move between nodes', () => {
    const start: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }

    it('chains a second move on the villagers the first one delivers', () => {
        const result = run(
            [
                { action: 'move', count: 2, from: 'sheep', to: 'wood' },
                { action: 'move', count: 2, from: 'wood', to: 'gold' },
            ],
            { start, inputs: noHouses },
        )
        expect(result.steps[0]).toMatchObject({ startedAt: 0, completedAt: W })
        expect(result.steps[1]).toMatchObject({ startedAt: W, completedAt: 2 * W, waitSeconds: W })
        expect(rateAt(result, 'food', 5)).toBeCloseTo(4 * rs * 60, 6)
        expect(rateAt(result, 'wood', 5)).toBe(0)
        expect(rateAt(result, 'gold', 5)).toBe(0)
        expect(rateAt(result, 'gold', 10)).toBeCloseTo(2 * rg * 60, 6)
        expect(rateAt(result, 'wood', 10)).toBe(0)
    })

    it('treats from equal to to as a walk that pauses the movers for walkSeconds', () => {
        const result = run([{ action: 'move', count: 2, from: 'sheep', to: 'sheep', walkSeconds: 7 }], { start, inputs: noHouses })
        expect(result.steps[0]).toMatchObject({ startedAt: 0, completedAt: 7 })
        expect(rateAt(result, 'food', 5)).toBeCloseTo(4 * rs * 60, 6)
        expect(rateAt(result, 'food', 10)).toBeCloseTo(6 * rs * 60, 6)
    })

    it('moves nothing and stays waiting when asked for more villagers than the node ever has', () => {
        const result = run([{ action: 'move', count: 7, from: 'wood', to: 'gold', trigger: at(0) }], { start, inputs: noHouses })
        expect(result.steps[0]).toMatchObject({ status: 'waiting', startedAt: null })
        expect(rateAt(result, 'gold', 1200)).toBe(0)
    })
})

describe('research while a house builds', () => {
    const game = gameWith((s) => {
        s.buildings.value = ['capital-town-center', 'mill']
        s.resources.value = { food: 200, wood: 200, gold: 200, stone: 0 }
    })
    const steps: BuildStep[] = [
        { action: 'build', building: 'house', builders: 1, from: 'sheep' },
        { action: 'research', tech: 'wheelbarrow' },
    ]
    const result = run(steps, { game, inputs: noHouses })

    it('pays both at the start and lets each finish on its own clock', () => {
        expect(result.steps[0]).toMatchObject({ startedAt: 0 })
        expect(result.steps[1]).toMatchObject({ startedAt: 0, waitSeconds: 0 })
        // House: 5 + 15 * 3 / 3 = 20. Wheelbarrow: 90.
        expect(result.steps[0].completedAt).toBeCloseTo(20, 9)
        expect(result.steps[1].completedAt).toBeCloseTo(90, 9)
        expect(floatAt(result, 'wood', 0)).toBe(100)
        expect(floatAt(result, 'gold', 0)).toBe(50)
    })

    it('uses the house supply to keep paying villagers past the starting supply while the research runs', () => {
        // Supply 20: villagers paid at 0..., 40, 60 ... and one more per 20 s through t = 200 up to 13 (20 - 7).
        expect(countAt(result, 'villager', 200)).toBe(10)
        expect(countAt(result, 'villager', 60)).toBe(3)
        expect(countAt(result, 'villager', 80)).toBe(4)
    })

    it('splits exactly the wood between house and tech when both just fit', () => {
        const tight = gameWith((s) => {
            s.buildings.value = ['capital-town-center', 'mill']
            s.resources.value = { food: 200, wood: 100, gold: 150, stone: 0 }
        })
        const out = run(steps, { game: tight, inputs: noHouses })
        expect(out.steps[0].startedAt).toBe(0)
        expect(out.steps[1].startedAt).toBe(0)
        expect(floatAt(out, 'wood', 0)).toBe(0)
        expect(floatAt(out, 'gold', 0)).toBe(0)
        expectNonNegative(out)
    })

    it('pays the research while an auto-house is building and neither is lost', () => {
        const out = run([{ trigger: at(35), action: 'research', tech: 'wheelbarrow' }], { game })
        // Research at 35 takes 50 wood and 150 gold, the auto-house at 40 another 50 wood.
        expect(out.steps[0]).toMatchObject({ startedAt: 35 })
        expect(floatAt(out, 'wood', 45)).toBe(100)
        expect(floatAt(out, 'gold', 45)).toBe(50)
        expect(countAt(out, 'villager', 120)).toBe(6)
        expectNonNegative(out)
    })
})

describe('determinism and purity', () => {
    const game = gameWith((s) => {
        s.buildings.value = ['capital-town-center', 'mill']
        s.resources.value = { food: 1000, wood: 400, gold: 600, stone: 0 }
    })
    const steps: BuildStep[] = [
        { trigger: at(10), action: 'move', count: 2, from: 'sheep', to: 'wood' },
        { action: 'build', building: 'barracks', builders: 2, from: 'wood', then: 'gold' },
        { action: 'build', building: 'abbey-of-kings', builders: 2, from: 'sheep' },
        { action: 'research', tech: 'horticulture' },
    ]
    const order: BuildOrder = { civ: 'english', name: 'determinism', start: { rally: 'sheep' }, steps }

    it('gives deeply equal results for equal inputs and leaves order and inputs untouched', () => {
        const simInputs = inputsFor(game)
        const orderBefore = structuredClone(order)
        const inputsBefore = structuredClone(simInputs)
        const first = simulateBuildOrder(order, game, simInputs)
        const second = simulateBuildOrder(order, game, simInputs)
        expect(second).toEqual(first)
        expect(order).toEqual(orderBefore)
        expect(simInputs).toEqual(inputsBefore)
        expectNonNegative(first)
    })

    it('does not carry state between runs of different orders', () => {
        const simInputs = inputsFor(game)
        const lone = simulateBuildOrder({ ...order, steps: [steps[0]] }, game, simInputs)
        simulateBuildOrder(order, game, simInputs)
        expect(simulateBuildOrder({ ...order, steps: [steps[0]] }, game, simInputs)).toEqual(lone)
    })
})
