import { describe, expect, it } from 'vitest'
import englishSnapshot from '../../data/aoe4-build-order/aoe4world/english.json'
import baseRules from '../../data/aoe4-build-order/rules/base.json'
import englishRules from '../../data/aoe4-build-order/rules/english.json'
import { BaseRules, CivData, GameData, Snapshot, SnapshotEntry, buildGameData, loadGameData } from './data'
import { effectiveGatherRate } from './gather'
import type { BuildOrder, BuildStart, BuildStep, GatherNodeId, ResourceKind, SimInputs, SimulationResult } from './model'
import { researchHandler, researchNotes, resolveUnitEntry } from './research'
import { simulateBuildOrder, stepHandlers } from './simulate'
import { resolveSimInputs } from './validate'

const data = loadGameData('english')

interface Parts {
    snapshot: Snapshot
    base: BaseRules
    civData: CivData
}

function gameWith(age: number, buildings: string[], resources: Record<ResourceKind, number>, edit: (parts: Parts) => void = () => {}): GameData {
    const parts: Parts = {
        snapshot: structuredClone(englishSnapshot) as unknown as Snapshot,
        base: structuredClone(baseRules) as unknown as BaseRules,
        civData: structuredClone(englishRules) as unknown as CivData,
    }
    parts.civData.startingState.age.value = age
    parts.civData.startingState.buildings.value = buildings
    parts.civData.startingState.resources.value = resources
    edit(parts)
    return buildGameData('english', parts.snapshot, parts.base, parts.civData)
}

function entriesOf(parts: Parts, baseId: string): SnapshotEntry[] {
    return [...parts.snapshot.units, ...parts.snapshot.technologies, ...parts.snapshot.upgrades].filter((e) => e.baseId === baseId)
}

function inputsFor(game: GameData): SimInputs {
    const result = resolveSimInputs({}, game)
    if (result.ok === false) {
        throw new Error(JSON.stringify(result.issues))
    }
    return result.inputs
}

function run(steps: BuildStep[], game: GameData, start: BuildStart = { rally: 'sheep' }): SimulationResult {
    const order: BuildOrder = { civ: 'english', name: 'research-acceptance', start, steps }
    return simulateBuildOrder(order, game, inputsFor(game))
}

function count(result: SimulationResult, unitId: string, t: number): number {
    const i = result.times.indexOf(t)
    expect(i).toBeGreaterThanOrEqual(0)
    return result.unitsProduced.find((u) => u.unitId === unitId)?.counts[i] ?? 0
}

function villagerSeries(result: SimulationResult): number[] {
    return result.unitsProduced.find((u) => u.unitId === 'villager-1')?.counts ?? []
}

const plenty = { food: 5000, wood: 5000, gold: 5000, stone: 0 }
const houses = ['house', 'house', 'house']
const at = (seconds: number) => ({ kind: 'time' as const, seconds })

describe('research delays the queue and upgrades the tier of later units', () => {
    const game = gameWith(3, ['capital-town-center', 'barracks', ...houses], plenty)
    const produce: BuildStep = { action: 'produce', producer: 'barracks', unit: 'spearman' }
    const result = run([produce, { action: 'research', tech: 'veteran-spearmen', trigger: at(5) }], game)
    const plain = run([produce], game)

    it('pays the research at its step start and queues it behind the spearman already paid', () => {
        expect(result.steps[1]).toMatchObject({ status: 'completed', armedAt: 5, startedAt: 5, completedAt: 75 })
        const i = result.times.indexOf(10)
        expect(plain.floating.food[i] - result.floating.food[i]).toBeCloseTo(100, 6)
        expect(plain.floating.gold[i] - result.floating.gold[i]).toBeCloseTo(250, 6)
        expect(count(result, 'spearman-2', 15)).toBe(1)
    })

    it('pays the next spearman when the research ends and spawns it 60 s later than without research, at tier 3', () => {
        expect(count(plain, 'spearman-2', 30)).toBe(2)
        expect(count(result, 'spearman-2', 30)).toBe(1)
        expect(count(result, 'spearman-3', 85)).toBe(0)
        expect(count(result, 'spearman-3', 90)).toBe(1)
        expect(result.unitsProduced.filter((u) => u.baseId === 'spearman').map((u) => [u.unitId, u.tier])).toEqual([
            ['spearman-2', 2],
            ['spearman-3', 3],
        ])
        expect(plain.unitsProduced.filter((u) => u.baseId === 'spearman').map((u) => u.tier)).toEqual([2])
    })

    it('does not touch the town center, whose villagers are the same as without research while population room remains', () => {
        const upTo = result.times.indexOf(60)
        expect(villagerSeries(result).slice(0, upTo)).toEqual(villagerSeries(plain).slice(0, upTo))
    })
})

describe('the tier is fixed when a unit is paid', () => {
    const game = gameWith(3, ['capital-town-center', 'barracks', 'barracks', ...houses], plenty, (parts) => {
        entriesOf(parts, 'spearman').forEach((e) => {
            e.costs.time = 100
        })
        entriesOf(parts, 'veteran-spearmen').forEach((e) => {
            e.costs.time = 40
        })
    })
    const result = run(
        [
            { action: 'produce', producer: 'barracks', instance: 2, unit: 'spearman', count: 1 },
            { action: 'research', tech: 'veteran-spearmen', at: 'barracks' },
            { action: 'produce', producer: 'barracks', instance: 1, unit: 'spearman', count: 1, trigger: at(45) },
        ],
        game,
    )

    it('keeps tier 2 for the unit paid at 0 although the upgrade completed at 40, and gives tier 3 to the one paid at 45', () => {
        expect(result.steps[1]).toMatchObject({ startedAt: 0, completedAt: 40 })
        expect(result.steps[2]).toMatchObject({ startedAt: 45 })
        expect(count(result, 'spearman-2', 95)).toBe(0)
        expect(count(result, 'spearman-2', 100)).toBe(1)
        expect(count(result, 'spearman-3', 140)).toBe(0)
        expect(count(result, 'spearman-3', 145)).toBe(1)
    })

    it('resolves a unit to the lowest tier until its upgrade is researched, and ignores an upgrade with no entry at its age', () => {
        const state = (researched: string[]) => ({ data: game, age: 3, buildings: new Map<string, number>(), researched: new Set(researched), coverage: inputsFor(game).influenceCoverage })
        expect(resolveUnitEntry('spearman', state([]))?.id).toBe('spearman-2')
        expect(resolveUnitEntry('spearman', state(['veteran-spearmen']))?.id).toBe('spearman-3')
        expect(resolveUnitEntry('no-such-unit', state([]))).toBeUndefined()
    })
})

describe('which building takes a research', () => {
    const resources = { food: 500, wood: 500, gold: 500, stone: 0 }
    function targets(buildings: string[], steps: BuildStep[]): [string, number][] {
        const taken: [string, number][] = []
        const saved = stepHandlers.research
        stepHandlers.research = (step, index, state) => {
            const all = [...state.instances.values()].flat()
            const before = all.map((instance) => instance.paid.length)
            const outcome = researchHandler(step, index, state)
            if (outcome.started === true) {
                all.forEach((instance, i) => {
                    if (instance.paid.length > before[i]) {
                        taken.push([instance.baseId, instance.instance])
                    }
                })
            }
            return outcome
        }
        try {
            run(steps, gameWith(2, buildings, resources, () => {}))
        } finally {
            stepHandlers.research = saved
        }
        return taken
    }

    it('prefers the earlier producedBy building over a later one', () => {
        expect(targets(['capital-town-center', 'town-center', 'town-center'], [{ action: 'research', tech: 'textiles' }])).toEqual([['capital-town-center', 1]])
    })

    it('falls through to the next producedBy building that has an instance', () => {
        expect(targets(['town-center', 'town-center'], [{ action: 'research', tech: 'textiles' }])).toEqual([['town-center', 1]])
    })

    it('uses the named building and its first instance even when that instance is the busier one', () => {
        expect(targets(['capital-town-center', 'town-center', 'town-center'], [{ action: 'pause', producer: 'town-center', instance: 2 }, { action: 'research', tech: 'textiles', at: 'town-center', trigger: at(30) }])).toEqual([['town-center', 1]])
    })
})

describe('a research that cannot start', () => {
    const buildings = ['capital-town-center', ...houses]
    const base = { food: 400, wood: 0, gold: 0, stone: 0 }

    describe('short of gold only', () => {
        const game = gameWith(2, buildings, base)
        const start: BuildStart = { rally: 'sheep', villagers: { gold: 5 } }
        const result = run([{ action: 'research', tech: 'textiles' }], game, start)
        const goldRate = effectiveGatherRate('gold', { data: game, age: 2, buildings: new Map([['capital-town-center', 1]]), researched: new Set<string>(), coverage: inputsFor(game).influenceCoverage }, inputsFor(game))

        it('starts at the instant five gold miners reach 100 gold', () => {
            expect(result.steps[0].status).toBe('completed')
            expect(result.steps[0].startedAt).toBeCloseTo(100 / (5 * goldRate), 6)
            expect(result.steps[0].waitSeconds).toBeCloseTo(100 / (5 * goldRate), 6)
        })

        it('never lets a floating resource go below zero', () => {
            for (const kind of ['food', 'wood', 'gold', 'stone'] as const) {
                result.floating[kind].forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
            }
        })

        it('keeps food at or above the 50 the research needs while waiting for gold', () => {
            const startedAt = result.steps[0].startedAt
            result.times.forEach((t, i) => {
                if (t < startedAt) {
                    expect(result.floating.food[i]).toBeGreaterThanOrEqual(50 - 1e-9)
                }
            })
        })
    })

    const richEnough = gameWith(2, buildings, { food: 400, wood: 400, gold: 400, stone: 0 })
    const plain = run([], richEnough)
    const cases: [string, GameData, BuildStep][] = [
        ['no producing building exists', richEnough, { action: 'research', tech: 'wheelbarrow', at: 'mill' }],
        ['its age is not reached', gameWith(2, [...buildings, 'barracks'], { food: 400, wood: 400, gold: 400, stone: 0 }), { action: 'research', tech: 'veteran-spearmen' }],
        ['it has no producing building and no at', gameWith(3, buildings, { food: 400, wood: 400, gold: 400, stone: 0 }), { action: 'research', tech: 'upgrade-king-3' }],
    ]
    for (const [why, game, step] of cases) {
        it(`waits at the horizon, reserves nothing and blocks later steps when ${why}`, () => {
            const result = run([step, { action: 'rally', producer: 'capital-town-center', to: 'wood' }], game)
            expect(result.steps[0]).toMatchObject({ status: 'waiting' })
            expect(result.steps[0].startedAt).toBeNull()
            expect(result.steps[1].status).toBe('not-reached')
            if (game === richEnough) {
                expect(villagerSeries(result)).toEqual(villagerSeries(plain))
            }
        })
    }
})

describe('a technology applies from its completion', () => {
    const game = gameWith(1, ['capital-town-center', 'mill', ...houses], { food: 500, wood: 500, gold: 500, stone: 0 })
    const simInputs = inputsFor(game)
    const result = run([{ action: 'research', tech: 'wheelbarrow', at: 'mill' }], game)
    const plain = run([], game)
    const effects = (researched: string[]) => ({ data: game, age: 1, buildings: new Map([['capital-town-center', 1], ['mill', 1]]), researched: new Set(researched), coverage: simInputs.influenceCoverage })
    const nodes: GatherNodeId[] = ['sheep', 'berry', 'wood']
    const changed = nodes.filter((n) => effectiveGatherRate(n, effects(['wheelbarrow']), simInputs) !== effectiveGatherRate(n, effects([]), simInputs))

    it('has an observable effect on at least one gather node, so the checks below can fail', () => {
        expect(changed.length).toBeGreaterThan(0)
    })

    it('costs 50 wood and 150 gold at the start and completes after the 90 s research time', () => {
        expect(result.steps[0]).toMatchObject({ status: 'completed', startedAt: 0 })
        expect(result.steps[0].completedAt).toBeGreaterThanOrEqual(90 - 1e-9)
        expect(plain.floating.wood[0] - result.floating.wood[0]).toBeCloseTo(50, 6)
        expect(plain.floating.gold[0] - result.floating.gold[0]).toBeCloseTo(150, 6)
    })

    it('keeps gather rates as without the tech before completion and raises them after', () => {
        const done = result.steps[0].completedAt as number
        const node = changed[0]
        const resource = node === 'wood' ? 'wood' : 'food'
        result.times.forEach((t, i) => {
            if (t < done - 1) {
                expect(result.gatherRates[resource][i]).toBeCloseTo(plain.gatherRates[resource][i], 9)
            } else if (t > done + 1) {
                expect(result.gatherRates[resource][i]).toBeGreaterThan(plain.gatherRates[resource][i])
            }
        })
    })

    it('does not change the villager count or what the town center produces', () => {
        expect(villagerSeries(result)).toEqual(villagerSeries(plain))
    })
})

describe('research shares the building queue with the default villager order', () => {
    const game = gameWith(2, ['capital-town-center'], plenty)
    const result = run([{ action: 'research', tech: 'textiles', at: 'capital-town-center', trigger: at(5) }], game)

    it('lets the villager paid at 0 spawn at 20, pays nothing during the 20 s research, and resumes the order at 40', () => {
        expect(result.steps[0]).toMatchObject({ startedAt: 5, completedAt: 40 })
        expect(count(result, 'villager-1', 20)).toBe(1)
        expect(count(result, 'villager-1', 55)).toBe(1)
        expect(count(result, 'villager-1', 60)).toBe(2)
    })
})

describe('notes', () => {
    const game = gameWith(1, ['capital-town-center'], { food: 100, wood: 0, gold: 0, stone: 0 })
    const steps: BuildStep[] = [
        { action: 'research', tech: 'admiralty' },
        { action: 'research', tech: 'shaft-mining' },
        { action: 'research', tech: 'bloomery' },
        { action: 'research', tech: 'veteran-spearmen' },
        { action: 'research', tech: 'wheelbarrow' },
    ]
    const result = run(steps, game)

    it('flags admiralty-2 as unmodeled and bloomery as ignored, in step order, though neither is reached', () => {
        expect(result.steps.every((s) => s.status !== 'completed')).toBe(true)
        expect(result.notes.map(({ code, step, tech, properties }) => ({ code, step, tech, properties }))).toEqual([
            { code: 'tech-effect-unmodeled', step: 0, tech: 'admiralty', properties: [] },
            { code: 'tech-effect-ignored', step: 2, tech: 'bloomery', properties: ['meleeAttack'] },
        ])
        result.notes.forEach((n) => expect(n.message.length).toBeGreaterThan(0))
    })

    it('gives shaft-mining, wheelbarrow and veteran-spearmen no note', () => {
        expect(result.notes.filter((n) => ['shaft-mining', 'wheelbarrow', 'veteran-spearmen'].includes(n.tech as string))).toEqual([])
    })

    it('is the same on every run and equals researchNotes of the order', () => {
        const again = run(steps, game)
        expect(again.notes).toEqual(result.notes)
        expect(researchNotes({ civ: 'english', name: 'n', start: { rally: 'sheep' }, steps }, game)).toEqual(result.notes)
    })
})

describe('determinism', () => {
    it('gives deeply equal results for equal inputs', () => {
        const game = gameWith(3, ['capital-town-center', 'barracks', ...houses], plenty)
        const steps: BuildStep[] = [{ action: 'produce', producer: 'barracks', unit: 'spearman' }, { action: 'research', tech: 'veteran-spearmen', trigger: at(5) }]
        expect(run(steps, game)).toEqual(run(steps, game))
    })
})
