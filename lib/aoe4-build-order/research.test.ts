import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { GameData, SnapshotEntry } from './data'
import { modifiedValue } from './effects'
import type { EffectState } from './effects'
import { effectiveGatherRate } from './gather'
import type { BuildStart, BuildStep, GatherNodeId, ResourceKind, SimInputs, SimulationResult } from './model'
import { researchEntry, researchHandler, researchNotes, resolveUnitEntry } from './research'
import type { BuildingInstance, EngineState } from './simulate'
import { ENGLISH, at, buildOrder, editGameData, effectStateOf, inputsFor, researchedOf, run, sampleIndex, withHandler } from './test-helpers'
import type { Parts } from './test-helpers'

const data = ENGLISH

function startingWith(age: number, buildings: string[], resources: Record<ResourceKind, number>, edit: (parts: Parts) => void = () => {}): GameData {
    return editGameData((parts) => {
        parts.civData.startingState.age.value = age
        parts.civData.startingState.buildings.value = buildings
        parts.civData.startingState.resources.value = resources
        edit(parts)
    })
}

function entriesOf(parts: Parts, baseId: string): SnapshotEntry[] {
    const all = [...parts.snapshot.units, ...parts.snapshot.technologies, ...parts.snapshot.upgrades]
    return all.filter((e) => e.baseId === baseId)
}

function tierCountAt(result: SimulationResult, unitId: string, t: number): number {
    return result.unitsProduced.find((u) => u.unitId === unitId)?.counts[sampleIndex(result, t)] ?? 0
}

interface Taken {
    baseId: string
    instance: number
    target: BuildingInstance
    // Every instance as the handler found it: [baseId, instance, paid items, has an order].
    queues: [string, number, number, boolean][]
}

// Records, for each research start, the instance whose queue grew; the real handler is put back after fn.
function recordTargets(fn: () => void): Taken[] {
    const taken: Taken[] = []
    withHandler(
        'research',
        (step, index, state) => {
            const all = [...state.instances.values()].flat()
            const before = all.map((instance) => instance.paid.length)
            const queues = all.map((instance): Taken['queues'][number] => [instance.baseId, instance.instance, instance.paid.length, instance.order !== null])
            const outcome = researchHandler(step, index, state)
            if (outcome.started === true) {
                all.filter((instance, i) => instance.paid.length > before[i]).forEach((target) => {
                    taken.push({ baseId: target.baseId, instance: target.instance, target, queues })
                })
            }
            return outcome
        },
        fn,
    )
    return taken
}

const plenty = { food: 5000, wood: 5000, gold: 5000, stone: 0 }
const houses = ['house', 'house', 'house']
const rallyStep: BuildStep = { action: 'rally', producer: 'capital-town-center', to: 'wood' }

describe('an upgrade delays production and changes the tier', () => {
    const game = startingWith(3, ['capital-town-center', 'barracks', ...houses], plenty)
    const produce: BuildStep = { action: 'produce', producer: 'barracks', unit: 'spearman' }
    const research: BuildStep = { action: 'research', tech: 'veteran-spearmen', trigger: at(5) }
    let taken: Taken[]
    let result: SimulationResult
    taken = recordTargets(() => {
        result = run([produce, research], { game })
    })
    const plain = run([produce], { game })

    it('runs the research after the spearman already paid, for its 60 s', () => {
        expect(tierCountAt(result, 'spearman-2', 15)).toBe(1)
        expect(result.steps[1]).toMatchObject({ status: 'completed', startedAt: 5, completedAt: 75 })
        expect(taken.map((t) => [t.baseId, t.instance])).toEqual([['barracks', 1]])
    })

    it('pays the next spearman when the research ends, as the upgraded tier, 60 s later', () => {
        expect(tierCountAt(result, 'spearman-3', 85)).toBe(0)
        expect(tierCountAt(result, 'spearman-3', 90)).toBe(1)
        expect(tierCountAt(result, 'spearman-2', 90)).toBe(1)
        expect(tierCountAt(plain, 'spearman-2', 30)).toBe(2)
        expect(plain.unitsProduced.some((u) => u.unitId === 'spearman-3')).toBe(false)
    })

    it('reports each tier as its own series', () => {
        const spearmen = result.unitsProduced.filter((u) => u.baseId === 'spearman').map((u) => [u.unitId, u.tier])
        expect(spearmen).toEqual([
            ['spearman-2', 2],
            ['spearman-3', 3],
        ])
    })

    it('keeps the produce order on the instance after the research', () => {
        expect(taken[0].target.order).toMatchObject({ step: 0, unit: 'spearman', remaining: null })
        expect(result.steps[0].status).toBe('in-progress')
    })
})

describe('the tier is fixed when a unit is paid', () => {
    const game = startingWith(3, ['capital-town-center', 'barracks', 'barracks', ...houses], plenty, (parts) => {
        entriesOf(parts, 'spearman').forEach((e) => {
            e.costs.time = 100
        })
    })
    const steps = (trigger: BuildStep['trigger']): BuildStep[] => [
        { action: 'produce', producer: 'barracks', instance: 2, unit: 'spearman', count: 1 },
        { action: 'research', tech: 'veteran-spearmen', at: 'barracks' },
        { action: 'produce', producer: 'barracks', instance: 1, unit: 'spearman', count: 1, trigger },
    ]
    const timed = run(steps(at(70)), { game })
    const untimed = run(steps(undefined), { game })

    it('keeps the lower tier for a unit paid before the upgrade completes', () => {
        expect(timed.steps[1]).toMatchObject({ startedAt: 0, completedAt: 60 })
        expect(tierCountAt(timed, 'spearman-2', 100)).toBe(1)
        expect(tierCountAt(timed, 'spearman-3', 100)).toBe(0)
    })

    it('gives the upgraded tier to a unit paid after it', () => {
        expect(timed.steps[2].startedAt).toBe(70)
        expect(tierCountAt(timed, 'spearman-3', 170)).toBe(1)
        expect(tierCountAt(timed, 'spearman-2', 170)).toBe(1)
    })

    it('reads the tier at payment, not at spawn', () => {
        expect(untimed.steps[2].startedAt).toBe(0)
        expect(tierCountAt(untimed, 'spearman-2', 160)).toBe(2)
        expect(untimed.unitsProduced.some((u) => u.unitId === 'spearman-3')).toBe(false)
    })
})

describe('resolveUnitEntry', () => {
    const state = (game: GameData, researched: string[]): EffectState => ({ data: game, age: 4, buildings: new Map(), ...researchedOf(researched, game), coverage: {} })
    const idOf = (entry: SnapshotEntry | undefined) => entry?.id

    it('gives the lowest-age entry with no upgrade researched', () => {
        expect(idOf(resolveUnitEntry('spearman', state(data, [])))).toBe('spearman-2')
        expect(idOf(resolveUnitEntry('spearman', state(data, ['wheelbarrow', 'early-men-at-arms'])))).toBe('spearman-2')
    })

    it('gives the entry at the age of the researched upgrade', () => {
        expect(idOf(resolveUnitEntry('spearman', state(data, ['veteran-spearmen'])))).toBe('spearman-3')
    })

    it('takes the highest researched upgrade', () => {
        expect(idOf(resolveUnitEntry('spearman', state(data, ['veteran-spearmen', 'elite-spearmen'])))).toBe('spearman-4')
        expect(idOf(resolveUnitEntry('spearman', state(data, ['elite-spearmen', 'veteran-spearmen'])))).toBe('spearman-4')
    })

    it('gives the lowest-age entry when the unit has no entry at the upgrade age', () => {
        const gap = editGameData((parts) => {
            parts.snapshot.units = parts.snapshot.units.filter((u) => u.id !== 'spearman-3')
        })
        expect(idOf(resolveUnitEntry('spearman', state(gap, ['veteran-spearmen'])))).toBe('spearman-2')
    })

    it('finds nothing for an unknown unit', () => {
        expect(resolveUnitEntry('no-such-unit', state(data, []))).toBeUndefined()
    })

    it('paces auto-houses by the build time of the upgraded tier', () => {
        const rich = { food: 50000, wood: 50000, gold: 50000, stone: 50000 }
        const game = startingWith(3, ['capital-town-center', 'barracks'], rich, (parts) => {
            parts.snapshot.units.find((u) => u.id === 'spearman-3').costs.time = 5
        })
        const result = run(
            [
                { action: 'research', tech: 'veteran-spearmen', at: 'barracks' },
                { action: 'produce', producer: 'barracks', unit: 'spearman' },
            ],
            { game },
        )
        expect(tierCountAt(result, 'spearman-3', 400)).toBe(65)
    })
})

describe('research target', () => {
    const textiles: BuildStep = { action: 'research', tech: 'textiles' }
    const where = (taken: Taken[]) => taken.map((t) => [t.baseId, t.instance])

    it('takes the first producedBy building with an instance, on instance 1', () => {
        const game = startingWith(2, ['capital-town-center', 'town-center', 'town-center'], plenty)
        expect(where(recordTargets(() => run([textiles], { game })))).toEqual([['capital-town-center', 1]])
    })

    it('takes instance 1 of the named building without looking at queue length', () => {
        const game = startingWith(2, ['capital-town-center', 'town-center', 'town-center'], plenty)
        const taken = recordTargets(() => {
            run([{ action: 'pause', producer: 'town-center', instance: 2 }, { ...textiles, at: 'town-center', trigger: at(30) }], { game })
        })
        expect(where(taken)).toEqual([['town-center', 1]])
        expect(taken[0].queues.filter(([baseId]) => baseId === 'town-center')).toEqual([
            ['town-center', 1, 1, true],
            ['town-center', 2, 0, false],
        ])
    })

    it('skips a candidate building with no instance', () => {
        const game = startingWith(2, ['town-center', 'town-center'], plenty)
        expect(where(recordTargets(() => run([textiles], { game })))).toEqual([['town-center', 1]])
    })
})

describe('resources never go negative and waits are reported', () => {
    const goldRate = (game: GameData, simInputs: SimInputs) =>
        effectiveGatherRate('gold', { data: game, age: 2, buildings: new Map([['capital-town-center', 1]]), researched: new Set<string>(), researchedIds: new Set<string>(), coverage: simInputs.influenceCoverage }, simInputs)

    describe('a research short of gold only', () => {
        const game = startingWith(2, ['capital-town-center', ...houses], { food: 120, wood: 0, gold: 0, stone: 0 })
        const simInputs = inputsFor(game)
        const start: BuildStart = { rally: 'sheep', villagers: { gold: 6 } }
        const result = run([{ action: 'research', tech: 'textiles' }], { game, start })
        const plain = run([], { game, start })

        it('starts when six gold miners have gathered its 100 gold', () => {
            expect(result.steps[0].armedAt).toBe(0)
            expect(result.steps[0].startedAt).toBeCloseTo(100 / (6 * goldRate(game, simInputs)), 6)
            expect(result.steps[0].waitSeconds).toBeCloseTo(result.steps[0].startedAt, 9)
        })

        it('keeps every floating value at or above zero', () => {
            for (const values of Object.values(result.floating)) {
                values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0))
            }
        })

        it('holds back a villager payment that would drop food below the research cost of it', () => {
            expect(result.floating.food[0]).toBeCloseTo(70, 9)
            expect(tierCountAt(plain, 'villager-1', 40)).toBe(2)
            expect(tierCountAt(result, 'villager-1', 40)).toBe(1)
        })
    })

    it('starts at the instant the gold arrives, despite rounding in the gathered amount', () => {
        const game = startingWith(2, ['capital-town-center', ...houses], { food: 120, wood: 0, gold: 3, stone: 0 })
        const simInputs = inputsFor(game)
        const result = run([{ action: 'research', tech: 'textiles' }], { game, start: { rally: 'sheep', villagers: { gold: 9 } } })
        expect(result.steps[0].startedAt).toBeCloseTo(97 / (9 * goldRate(game, simInputs)), 6)
    })

    it('waits with a reserve when the bank is short by more than the resource tolerance', () => {
        const { food, wood, gold, stone } = data.byBaseId.get('wheelbarrow')[0].costs
        const game = startingWith(1, ['capital-town-center', 'mill', ...houses], { food, wood, gold: gold - 5e-9, stone })
        const outcomes: ReturnType<typeof researchHandler>[] = []
        let result: SimulationResult
        withHandler(
            'research',
            (step, index, state) => {
                outcomes.push(researchHandler(step, index, state))
                return outcomes[outcomes.length - 1]
            },
            () => {
                result = run([{ action: 'research', tech: 'wheelbarrow' }], { game })
            },
        )
        expect(outcomes[0]).toEqual({ started: false, reserve: { food, wood, gold, stone } })
        expect(result.steps[0].status).toBe('waiting')
    })

    function waitsWithoutReserve(step: BuildStep, game: GameData) {
        const result = run([step, rallyStep], { game })
        expect(result.steps.map((s) => s.status)).toEqual(['waiting', 'not-reached'])
        expect(tierCountAt(result, 'villager-1', 20)).toBe(1)
        return result
    }

    it('waits on a missing target instance', () => {
        waitsWithoutReserve({ action: 'research', tech: 'wheelbarrow', at: 'mill' }, data)
        const lean = startingWith(2, ['capital-town-center', ...houses], { food: 60, wood: 0, gold: 100, stone: 0 })
        waitsWithoutReserve({ action: 'research', tech: 'textiles', at: 'town-center' }, lean)
    })

    it('waits on an unreached age, not on the target', () => {
        const game = startingWith(2, ['capital-town-center', 'barracks', ...houses], { food: 120, wood: 0, gold: 5000, stone: 0 })
        waitsWithoutReserve({ action: 'research', tech: 'veteran-spearmen' }, game)
        const aged = startingWith(3, ['capital-town-center', 'barracks', ...houses], { food: 120, wood: 0, gold: 5000, stone: 0 })
        expect(run([{ action: 'research', tech: 'veteran-spearmen' }, rallyStep], { game: aged }).steps[0].startedAt).toBe(0)
    })

    it('never starts a tech with no producing building and no at', () => {
        const game = startingWith(3, ['capital-town-center', ...houses], plenty)
        waitsWithoutReserve({ action: 'research', tech: 'upgrade-king-3' }, game)
    })
})

describe('technology effects apply from completion', () => {
    const resources = { food: 200, wood: 200, gold: 200, stone: 0 }
    const game = startingWith(1, ['capital-town-center', 'mill'], resources)
    const simInputs = inputsFor(game)
    const wheelbarrow: BuildStep = { action: 'research', tech: 'wheelbarrow', at: 'mill' }
    const result = run([wheelbarrow], { game, inputs: { autoHouses: false } })
    const plain = run([], { game, inputs: { autoHouses: false } })
    const effectState = (researched: string[]) => ({ data: game, age: 1, buildings: new Map([['capital-town-center', 1], ['mill', 1]]), ...researchedOf(researched, game), coverage: simInputs.influenceCoverage })
    const sheepRate = (researched: string[]) => effectiveGatherRate('sheep' as GatherNodeId, effectState(researched), simInputs)
    const entry = game.byBaseId.get('wheelbarrow')[0]
    const speed = modifiedValue(1, 'productionSpeed', { baseId: entry.baseId, classes: entry.classes, producer: 'mill' }, effectState([]))

    it('pays 50 wood and 150 gold at its start and completes after its research time', () => {
        expect(result.steps[0].startedAt).toBe(0)
        expect(result.steps[0].completedAt).toBeCloseTo(90 / speed, 9)
        expect(result.steps[0].status).toBe('completed')
        expect(result.floating.wood[0]).toBeCloseTo(150, 9)
        expect(result.floating.gold[0]).toBeCloseTo(50, 9)
    })

    it('leaves gather rates unchanged before completion and applies the tech after it', () => {
        expect(sheepRate(['wheelbarrow'])).not.toBeCloseTo(sheepRate([]), 6)
        result.times.forEach((t, i) => {
            if (t < 90) {
                expect(result.gatherRates.food[i]).toBe(plain.gatherRates.food[i])
            }
        })
        for (const t of [95, 120, 300]) {
            const gatherers = plain.gatherRates.food[sampleIndex(plain, t)] / (sheepRate([]) * 60)
            expect(gatherers).toBeCloseTo(9, 9)
            expect(result.gatherRates.food[sampleIndex(result, t)]).toBeCloseTo(gatherers * sheepRate(['wheelbarrow']) * 60, 9)
        }
    })

    it('changes neither population nor units produced', () => {
        expect(result.unitsProduced).toEqual(plain.unitsProduced)
    })

    it('follows the research time and cost in the game data', () => {
        const quick = startingWith(1, ['capital-town-center', 'mill'], resources, (parts) => {
            entriesOf(parts, 'wheelbarrow').forEach((e) => {
                e.costs.time = 45
                e.costs.gold = 100
            })
        })
        const changed = run([wheelbarrow], { game: quick })
        expect(changed.steps[0].completedAt).toBeCloseTo(45 / speed, 9)
        expect(changed.floating.gold[0]).toBeCloseTo(100, 9)
    })
})

describe('research shares the queue with production', () => {
    const game = startingWith(2, ['capital-town-center'], plenty)
    const result = run([{ action: 'research', tech: 'textiles', at: 'capital-town-center', trigger: at(5) }], { game })
    const plain = run([], { game })

    it('lets the villager paid before it spawn on time', () => {
        expect(tierCountAt(result, 'villager-1', 20)).toBe(1)
    })

    it('holds the villager order until the research ends, then resumes it', () => {
        expect(result.steps[0]).toMatchObject({ startedAt: 5, completedAt: 40 })
        expect(tierCountAt(plain, 'villager-1', 40)).toBe(2)
        expect(tierCountAt(result, 'villager-1', 55)).toBe(1)
        expect(tierCountAt(result, 'villager-1', 60)).toBe(2)
    })
})

describe('multi-tier research', () => {
    // Adds an entry of baseId at age, copied from its existing entry with costs and effect values replaced.
    function addTier(parts: Parts, baseId: string, age: number, costs: { wood: number; gold: number }, effectValue?: number): void {
        const tier = structuredClone(entriesOf(parts, baseId)[0])
        tier.id = `${baseId}-${age}`
        tier.age = age
        tier.costs = { ...tier.costs, ...costs }
        if (effectValue !== undefined) {
            tier.effects = tier.effects.map((e) => ({ ...e, value: effectValue }))
        }
        if (tier.type === 'upgrade') {
            parts.snapshot.upgrades.push(tier)
        } else {
            parts.snapshot.technologies.push(tier)
        }
    }

    const tiered = editGameData((parts) => {
        addTier(parts, 'wheelbarrow', 3, { wood: 80, gold: 300 }, 20)
        addTier(parts, 'veteran-spearmen', 4, { wood: 0, gold: 400 })
    })
    const idAt = (baseId: string, age: number) => researchEntry(baseId, effectStateOf({ data: tiered, age }))?.id

    describe('researchEntry', () => {
        it('picks the highest entry at or below the current age', () => {
            expect(idAt('wheelbarrow', 1)).toBe('wheelbarrow-1')
            expect(idAt('wheelbarrow', 2)).toBe('wheelbarrow-1')
            expect(idAt('wheelbarrow', 3)).toBe('wheelbarrow-3')
            expect(idAt('wheelbarrow', 4)).toBe('wheelbarrow-3')
            expect(idAt('veteran-spearmen', 3)).toBe('veteran-spearmen-3')
            expect(idAt('veteran-spearmen', 4)).toBe('veteran-spearmen-4')
        })

        it('finds nothing while every entry is above the age, for an unknown id, or for a non-tech', () => {
            expect(idAt('veteran-spearmen', 2)).toBeUndefined()
            expect(idAt('no-such-tech', 4)).toBeUndefined()
            expect(idAt('spearman', 4)).toBeUndefined()
        })
    })

    describe('a research step', () => {
        const start: BuildStart = { villagers: { sheep: 6 }, rally: 'sheep' }
        const noHouses = { autoHouses: false }
        const abbey: BuildStep = { action: 'build', building: 'abbey-of-kings', builders: 3, from: 'sheep' }
        const game = startingWith(1, ['capital-town-center', 'mill'], { food: 2000, wood: 500, gold: 1000, stone: 0 }, (parts) => {
            addTier(parts, 'horticulture', 3, { wood: 80, gold: 300 }, 1.5)
            addTier(parts, 'wheelbarrow', 2, { wood: 70, gold: 250 }, 20)
        })
        // Villagers gather only food, so the wood and gold a run ends with differ from a plain run by what research paid.
        const plain = run([abbey], { game, start, inputs: noHouses })
        const paid = (result: SimulationResult) => ({
            wood: plain.floating.wood.at(-1) - result.floating.wood.at(-1),
            gold: plain.floating.gold.at(-1) - result.floating.gold.at(-1),
        })
        function recorded(steps: BuildStep[]): { result: SimulationResult; outcomes: ReturnType<typeof researchHandler>[]; state: EngineState } {
            const outcomes: ReturnType<typeof researchHandler>[] = []
            let state: EngineState
            let result: SimulationResult
            withHandler(
                'research',
                (step, index, engine) => {
                    state = engine
                    outcomes.push(researchHandler(step, index, engine))
                    return outcomes[outcomes.length - 1]
                },
                () => {
                    result = run(steps, { game, start, inputs: noHouses })
                },
            )
            return { result, outcomes, state }
        }

        it('waits with no reserve while every entry is above the age, then pays the entry of the age reached', () => {
            const { result, outcomes, state } = recorded([abbey, { action: 'research', tech: 'horticulture' }])
            const reachedAt = result.ages[1].reachedAt
            expect(outcomes[0]).toEqual({ started: false })
            expect(outcomes.filter((o) => o.started === false).every((o) => !('reserve' in o))).toBe(true)
            expect(result.steps[1]).toMatchObject({ armedAt: 0, startedAt: reachedAt, status: 'completed' })
            expect(paid(result)).toEqual({ wood: 50, gold: 100 })
            expect([...state.researchedIds]).toEqual(['horticulture-2'])
            expect([...state.researched]).toEqual(['horticulture'])
        })

        it('picks the tier on each attempt, so a step offered after an age-up pays the higher tier', () => {
            const early = recorded([abbey, { action: 'research', tech: 'wheelbarrow' }])
            expect(early.result.steps[1].startedAt).toBe(0)
            expect(paid(early.result)).toEqual({ wood: 50, gold: 150 })
            expect([...early.state.researchedIds]).toEqual(['wheelbarrow-1'])

            const late = recorded([abbey, { action: 'research', tech: 'wheelbarrow', trigger: at(150) }])
            expect(late.result.steps[1].startedAt).toBe(150)
            expect(paid(late.result)).toEqual({ wood: 70, gold: 250 })
            expect([...late.state.researchedIds]).toEqual(['wheelbarrow-2'])
            expect([...late.state.researched]).toEqual(['wheelbarrow'])
        })
    })

    it('applies only the effects of the researched entry, not of its sibling', () => {
        const villager = { baseId: 'villager', classes: tiered.byBaseId.get('villager')[0].classes }
        const carry = (researchedIds: string[]) =>
            modifiedValue(10, 'carryCapacity', villager, effectStateOf({ data: tiered, researched: new Set(['wheelbarrow']), researchedIds: new Set(researchedIds) }))
        expect(carry(['wheelbarrow-1'])).toBe(15)
        expect(carry(['wheelbarrow-3'])).toBe(30)
        expect(carry([])).toBe(10)
    })

    it('resolves a unit to the age of the researched upgrade entry, not the highest entry of its baseId', () => {
        const unit = (researchedIds: string[]) =>
            resolveUnitEntry('spearman', effectStateOf({ data: tiered, age: 4, researched: new Set(['veteran-spearmen']), researchedIds: new Set(researchedIds) }))?.id
        expect(unit(['veteran-spearmen-3'])).toBe('spearman-3')
        expect(unit(['veteran-spearmen-4'])).toBe('spearman-4')
        expect(unit(['veteran-spearmen-3', 'veteran-spearmen-4'])).toBe('spearman-4')
    })
})

describe('notes', () => {
    const steps: BuildStep[] = [
        { action: 'rally', producer: 'capital-town-center', to: 'sheep' },
        { action: 'research', tech: 'bloomery' },
        { action: 'research', tech: 'wheelbarrow' },
        { action: 'research', tech: 'admiralty' },
        { action: 'research', tech: 'veteran-spearmen' },
        { action: 'research', tech: 'shaft-mining' },
    ]
    const result = run(steps)

    // shaft-mining has empty effects but an overlay row grants its effect, so it is supported and gets no note.
    it('gives one note per ignored or unmodeled research step, in step order, reached or not', () => {
        expect(result.steps.map((s) => s.status)).toEqual(['completed', 'waiting', 'not-reached', 'not-reached', 'not-reached', 'not-reached'])
        expect(result.notes.map(({ code, step, tech, properties }) => ({ code, step, tech, properties }))).toEqual([
            { code: 'tech-effect-ignored', step: 1, tech: 'bloomery', properties: ['meleeAttack'] },
            { code: 'tech-effect-unmodeled', step: 3, tech: 'admiralty', properties: [] },
        ])
    })

    it('names the tech by id, and for ignored effects the properties', () => {
        expect(result.notes.map((n) => n.message)).toEqual([
            'bloomery: its effect on meleeAttack is not simulated; it still costs resources and queue time.',
            'admiralty: its effect is not simulated; it still costs resources and queue time.',
        ])
    })

    it('marks every note info and none error', () => {
        expect(result.notes.map((n) => n.severity)).toEqual(['info', 'info'])
        expect(result.notes.some((n) => n.severity === 'error')).toBe(false)
    })

    it('marks info the note of every tech in the data', () => {
        const techs = [...data.byBaseId.values()].filter(([e]) => e.type === 'technology' || e.type === 'upgrade')
        const notes = researchNotes(buildOrder(techs.map(([e]): BuildStep => ({ action: 'research', tech: e.baseId }))), data)
        expect(notes.length).toBeGreaterThan(1)
        expect(notes.filter((n) => n.severity !== 'info')).toEqual([])
    })

    it('is a pure function of the order and the data', () => {
        expect(run(steps).notes).toEqual(result.notes)
        expect(researchNotes(buildOrder(steps), data)).toEqual(result.notes)
    })

    it('gives no note for a rejected tech and does not throw', () => {
        expect(researchNotes(buildOrder([{ action: 'research', tech: 'forestry' }]), data)).toEqual([])
    })

    it('still charges and queues a tech whose effects are ignored', () => {
        const game = startingWith(2, ['capital-town-center', 'blacksmith'], { food: 200, wood: 0, gold: 200, stone: 0 })
        const bloomery = run([{ action: 'research', tech: 'bloomery' }], { game })
        expect(bloomery.steps[0]).toMatchObject({ status: 'completed', startedAt: 0, completedAt: 60 })
        expect(bloomery.floating.gold[0]).toBeCloseTo(75, 9)
        expect(bloomery.notes).toHaveLength(1)
    })
})

describe('source shape', () => {
    it('has no numeric literal other than 0 and 1', () => {
        const code = readFileSync(join(__dirname, 'research.ts'), 'utf8')
            .replace(/\/\/.*$/gm, '')
            .replace(/'[^']*'|`[^`]*`/g, "''")
        const literals = [...code.matchAll(/(?<![\w.])\d[\d.]*(?:e-?\d+)?/g)].map((m) => m[0])
        expect(literals.filter((n) => n !== '0' && n !== '1')).toEqual([])
    })
})
