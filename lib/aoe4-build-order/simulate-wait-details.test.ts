import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { GameData } from './data'
import { formatMinSec } from './format-time'
import type { BreakdownReason, BuildStart, BuildStep, SimulationResult, StepTiming, StepWaitDetail } from './model'
import { accrueWait, simulateBuildOrder, stepHandlers } from './simulate'
import type { StepHandler, StepStart } from './simulate'
import { ENGLISH, at, editGameData, inputsFor, noAutoVillagers, run, startingWith, withHandler } from './test-helpers'
import type { Parts } from './test-helpers'
import { waitReasonOf, waitTargetKey } from './wait-detail'

const plenty = { food: 5000, wood: 5000, gold: 5000, stone: 0 }
const houses = ['house', 'house', 'house']
const REASONS: readonly BreakdownReason[] = ['resources', 'villagers', 'population', 'prerequisite']

const named = (baseId: string) => ({ baseId, name: ENGLISH.byBaseId.get(baseId)![0].name })
const barracks = (unit: string, extra: Partial<Extract<BuildStep, { action: 'produce' }>> = {}): BuildStep => ({ action: 'produce', producer: 'barracks', unit, count: 1, ...extra })
const scoutThenVillager: BuildStep[] = [
    { action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(10) },
    { action: 'produce', producer: 'capital-town-center', unit: 'villager' },
]
const twoBarracks = noAutoVillagers(startingWith(2, ['capital-town-center', 'barracks', 'barracks', ...houses], plenty))
const blacksmith = startingWith(2, ['capital-town-center', 'blacksmith', 'house'], plenty)

// Runs fn with every step handler wrapped, returning each handler outcome in offer order.
function recordOffers(fn: () => void): StepStart[] {
    const outcomes: StepStart[] = []
    const handlers = stepHandlers as Record<string, StepHandler>
    const saved = { ...handlers }
    for (const [action, handler] of Object.entries(saved)) {
        handlers[action] = (step, index, state) => {
            const outcome = handler(step, index, state)
            outcomes.push(outcome)
            return outcome
        }
    }
    try {
        fn()
    } finally {
        Object.assign(handlers, saved)
    }
    return outcomes
}

function simulateBuild(name: string, durationSeconds: number): SimulationResult {
    const build = listBuilds().find((b) => b.name === name)!
    return simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds }))
}

const onlyEntry = (timing: StepTiming) => {
    expect(timing.waitDetails).toHaveLength(1)
    return timing.waitDetails[0]
}

describe('produce details', () => {
    it.each<[string, BuildStep[], GameData | undefined, StepWaitDetail]>([
        ['a missing producer names it from the snapshot', [barracks('man-at-arms')], undefined, { kind: 'building', buildings: [named('barracks')], instance: null }],
        ['a unit above the age names the age', [{ action: 'produce', producer: 'stable', unit: 'knight', count: 1 }], undefined, { kind: 'age', age: 3, landmark: null }],
        ['a missing instance names it', [barracks('spearman', { instance: 3 })], twoBarracks, { kind: 'building', buildings: [named('barracks')], instance: 3 }],
    ])('%s', (_, steps, game, detail) => {
        const result = run(steps, { game, inputs: { durationSeconds: 60 } })
        expect(result.steps[0]).toMatchObject({ status: 'waiting', waitingOn: 'prerequisite', waitingFor: detail })
        expect(result.steps[0].waitDetails).toEqual([{ detail, seconds: 60 }])
    })

    it('reports the age before the missing producer', () => {
        expect(ENGLISH.civData.startingState.buildings.value).not.toContain('stable')
        const result = run([{ action: 'produce', producer: 'stable', unit: 'knight', count: 1 }], { inputs: { durationSeconds: 60 } })
        expect(result.steps[0].waitingFor?.kind).toBe('age')
    })

    it('gives the population the targets need, used and supply', () => {
        const game = noAutoVillagers(startingWith(2, ['capital-town-center', 'barracks', 'barracks'], plenty))
        const result = run([barracks('spearman')], { game, start: { villagers: { sheep: 8 }, rally: 'sheep' }, inputs: { durationSeconds: 60, autoHouses: false } })
        const detail = result.steps[0].waitingFor
        expect(result.steps[0].waitingOn).toBe('population')
        expect(detail).toMatchObject({ kind: 'population', needed: 2 })
        const { used, supply } = detail as Extract<StepWaitDetail, { kind: 'population' }>
        expect(used + 2).toBeGreaterThan(supply)
        expect(used + 1).toBeLessThanOrEqual(supply)
    })

    it('names the busy capital town center once, for exactly the seconds waited (busy sample)', () => {
        const result = run(scoutThenVillager, { inputs: { durationSeconds: 120 } })
        const villager = result.steps[1]
        expect(villager.waitBreakdown.prerequisite).toBeGreaterThan(0)
        const entry = onlyEntry(villager)
        expect(entry.detail).toEqual({ kind: 'building-busy', buildings: [named('capital-town-center')], instance: null, every: false })
        expect(entry.seconds).toBeCloseTo(villager.waitBreakdown.prerequisite!, 9)
        expect(entry.seconds).toBeCloseTo(villager.waitSeconds, 9)
        expect(villager.waitingFor).toBeNull()
    })

    it.each<[string, BuildStep, StepWaitDetail]>([
        ['every target, for a produce with no instance on two instances', barracks('man-at-arms', { trigger: at(1) }), { kind: 'building-busy', buildings: [named('barracks')], instance: null, every: true }],
        ['the named instance', barracks('man-at-arms', { instance: 1, trigger: at(1) }), { kind: 'building-busy', buildings: [named('barracks')], instance: 1, every: false }],
    ])('a busy wait names %s', (_, step, detail) => {
        const result = run([barracks('spearman', { instance: 1 }), step], { game: twoBarracks, inputs: { durationSeconds: 60 } })
        expect(result.steps[0].startedAt).toBe(0)
        expect(onlyEntry(result.steps[1]).detail).toEqual(detail)
        expect(result.steps[1].waitBreakdown.prerequisite).toBeGreaterThan(0)
    })
})

describe('resource details', () => {
    it('lists exactly the short kinds, each a whole number of at least 1', () => {
        const game = noAutoVillagers(startingWith(1, ['capital-town-center', ...houses], { food: 0, wood: 100, gold: 0, stone: 0 }))
        const result = run([{ action: 'build', building: 'barracks', from: 'sheep' }], { game, inputs: { durationSeconds: 60 } })
        expect(result.steps[0].waitingOn).toBe('resources')
        expect(onlyEntry(result.steps[0]).detail).toEqual({ kind: 'resources', short: { wood: 50 } })
    })

    const wood = (baseId: string) => ENGLISH.byBaseId.get(baseId)![0].costs.wood

    it.each<[BuildStep, string]>([
        [{ action: 'build', building: 'barracks', from: 'sheep' }, 'barracks'],
        [barracks('spearman'), 'spearman'],
        [{ action: 'research', tech: 'wheelbarrow', at: 'mill' }, 'wheelbarrow'],
    ])('a %j short only through an auto-house hold names the held wood', (step, paid) => {
        // A house that takes 600 s keeps one due from the start; four builders never gather at one node.
        const bank = wood(paid) + wood('house') - 10
        const game = editGameData((parts) => {
            const start = parts.civData.startingState
            start.age.value = 2
            start.buildings.value = ['capital-town-center', 'barracks', 'mill', 'house']
            start.resources.value = { food: 5000, wood: bank, gold: 1000, stone: 0 }
            parts.snapshot.buildings.find((entry) => entry.baseId === 'house')!.costs.time = 600
        })
        const start: BuildStart = { villagers: { sheep: 3, gold: 3, wood: 1, berry: 1 }, rally: 'stone' }
        const result = run([step], { game, start, inputs: { houseBuilders: 4, durationSeconds: 60, nodeAmounts: { berry: 1 } } })
        expect(wood(paid)).toBeGreaterThan(0)
        expect(result.steps[0].waitingOn).toBeNull()
        expect(result.steps[0].waitDetails[0].detail).toEqual({ kind: 'resources', short: { wood: 10 } })
    })
})

describe('build and move details', () => {
    it.each<[string, BuildStep, StepWaitDetail]>([
        ['a build short of villagers', { action: 'build', building: 'barracks', from: 'stone', builders: 3 }, { kind: 'villagers', node: 'stone', needed: 3, available: 0 }],
        ['a build above the age', { action: 'build', building: 'stable', from: 'sheep' }, { kind: 'age', age: 2, landmark: null }],
        ['a move short of villagers', { action: 'move', count: 3, from: 'gold', to: 'wood' }, { kind: 'villagers', node: 'gold', needed: 3, available: 0 }],
    ])('%s', (_, step, detail) => {
        const result = run([step], { inputs: { durationSeconds: 60 } })
        expect(result.steps[0].waitingFor).toEqual(detail)
        expect(result.steps[0].waitDetails).toEqual([{ detail, seconds: 60 }])
    })
})

describe('research details', () => {
    it('names the lowest age among the tech entries while every tier is above the age', () => {
        const game = editGameData((parts) => {
            const vet = parts.snapshot.upgrades.find((entry) => entry.baseId === 'veteran-spearmen')!
            parts.snapshot.upgrades.unshift({ ...structuredClone(vet), id: 'veteran-spearmen-4', age: 4 })
        })
        expect(game.byBaseId.get('veteran-spearmen')!.map((entry) => entry.age).sort()).toEqual([3, 4])
        const result = run([{ action: 'research', tech: 'veteran-spearmen' }], { game, inputs: { durationSeconds: 60 } })
        expect(result.steps[0].waitingFor).toEqual({ kind: 'age', age: 3, landmark: null })
    })

    const unsortedProducers = ['council-hall', 'archery-range']
    const unsortedLongbowmen = (parts: Parts) => {
        parts.snapshot.upgrades.find((entry) => entry.baseId === 'veteran-longbowmen')!.producedBy = [...unsortedProducers]
    }
    const unsortedGame = (buildings: string[]) => startingWith(3, ['capital-town-center', ...buildings, ...houses], plenty, unsortedLongbowmen)

    it.each<[string, BuildStep, string[]]>([
        ['every producing building in snapshot order', { action: 'research', tech: 'veteran-longbowmen' }, unsortedProducers],
        ['the at building', { action: 'research', tech: 'veteran-longbowmen', at: 'council-hall' }, ['council-hall']],
    ])('a missing building names %s', (_, step, baseIds) => {
        const game = unsortedGame([])
        const producedBy = game.byBaseId.get('veteran-longbowmen')![0].producedBy
        expect(producedBy).toEqual(unsortedProducers)
        expect(producedBy).not.toEqual([...producedBy].sort())
        const result = run([step], { game, inputs: { durationSeconds: 60 } })
        expect(result.steps[0].waitingFor).toEqual({ kind: 'building', buildings: baseIds.map(named), instance: null })
    })

    it('names the busy blacksmith while another research runs there', () => {
        const result = run([{ action: 'research', tech: 'steeled-arrow' }, { action: 'research', tech: 'fitted-leatherwork' }], { game: blacksmith, inputs: { durationSeconds: 150 } })
        expect(result.steps[1].waitBreakdown.prerequisite).toBeGreaterThan(0)
        const entry = onlyEntry(result.steps[1])
        expect(entry.detail).toEqual({ kind: 'building-busy', buildings: [named('blacksmith')], instance: null, every: false })
        expect(entry.seconds).toBeCloseTo(result.steps[1].waitBreakdown.prerequisite!, 9)
    })

    it('lists only the candidates that have an instance', () => {
        const game = noAutoVillagers(startingWith(3, ['capital-town-center', 'archery-range', ...houses], plenty))
        const steps: BuildStep[] = [{ action: 'produce', producer: 'archery-range', unit: 'longbowman', count: 3 }, { action: 'research', tech: 'veteran-longbowmen', trigger: at(1) }]
        const result = run(steps, { game, inputs: { durationSeconds: 150 } })
        expect(onlyEntry(result.steps[1]).detail).toEqual({ kind: 'building-busy', buildings: [named('archery-range')], instance: null, every: false })
    })

    it('lists the busy candidates in candidate order', () => {
        const game = noAutoVillagers(unsortedGame(['archery-range', 'council-hall']))
        const steps: BuildStep[] = [
            { action: 'produce', producer: 'archery-range', unit: 'longbowman', count: 3 },
            { action: 'produce', producer: 'council-hall', unit: 'longbowman', count: 3 },
            { action: 'research', tech: 'veteran-longbowmen', trigger: at(1) },
        ]
        const result = run(steps, { game, inputs: { durationSeconds: 150 } })
        expect(result.steps.slice(0, 2).map((step) => step.startedAt)).toEqual([0, 0])
        expect(result.steps[2].waitBreakdown.prerequisite).toBeGreaterThan(0)
        expect(onlyEntry(result.steps[2]).detail).toEqual({ kind: 'building-busy', buildings: unsortedProducers.map(named), instance: null, every: false })
    })
})

describe('age details name the landmark under construction', () => {
    const game = startingWith(2, ['capital-town-center', 'stable', ...houses], plenty)
    const palace: BuildStep = { action: 'build', building: 'kings-palace', from: 'sheep', builders: 6 }

    it('while a landmark of the current age is built', () => {
        const result = run([palace, { action: 'produce', producer: 'stable', unit: 'knight', count: 1 }], { game, inputs: { durationSeconds: 60 } })
        expect(result.steps[1].waitDetails).toEqual([{ detail: { kind: 'age', age: 3, landmark: named('kings-palace') }, seconds: 60 }])
    })

    it('not for an age two above the current one', () => {
        const councilHall: BuildStep = { action: 'build', building: 'council-hall', from: 'sheep', builders: 6 }
        const result = run([councilHall, { action: 'produce', producer: 'stable', unit: 'knight', count: 1 }], { game: startingWith(1, ['capital-town-center', 'stable', ...houses], plenty), inputs: { durationSeconds: 60 } })
        expect(result.steps[0].status).toBe('in-progress')
        expect(result.steps[1].waitingFor).toEqual({ kind: 'age', age: 3, landmark: null })
    })
})

describe('waitingFor lifecycle', () => {
    it('keeps the last failed offer of an instant', () => {
        let calls = 0
        withHandler(
            'build',
            () => {
                calls += 1
                return { started: false, waitingOn: 'villagers', detail: { kind: 'villagers', node: 'stone', needed: 9, available: calls } }
            },
            () => {
                const result = run([{ action: 'build', building: 'house', from: 'stone' }], { inputs: { durationSeconds: 60 } })
                expect(calls).toBeGreaterThan(2)
                expect(result.steps[0].waitDetails[0].detail).toMatchObject({ available: 2 })
                expect(result.steps[0].waitingFor).toMatchObject({ available: calls })
            },
        )
    })

    it('is null at the horizon for completed, in-progress and both not-reached kinds, and the last detail while waiting', () => {
        const steps: BuildStep[] = [
            { action: 'rally', producer: 'capital-town-center', to: 'sheep' },
            { action: 'build', building: 'kings-palace', from: 'sheep' },
            { action: 'build', building: 'barracks', from: 'stone', builders: 3 },
            { action: 'rally', producer: 'capital-town-center', to: 'wood' },
            { action: 'move', count: 'all', from: 'gold', to: 'wood', trigger: { kind: 'depleted', node: 'gold' }, reaction: true },
        ]
        const result = run(steps, { game: startingWith(2, ['capital-town-center', ...houses], plenty), inputs: { durationSeconds: 60 } })
        expect(result.steps.map((s) => [s.status, s.waitingOn, s.waitingFor])).toEqual([
            ['completed', null, null],
            ['in-progress', null, null],
            ['waiting', 'villagers', { kind: 'villagers', node: 'stone', needed: 3, available: 0 }],
            ['not-reached', 'earlier-step', null],
            ['not-reached', 'trigger', null],
        ])
        expect(result.steps.map((s) => s.waitDetails.length)).toEqual([0, 0, 1, 0, 0])
    })

    it('counts every failed offer of a breakdown reason under the reason of its detail', () => {
        const outcomes = recordOffers(() => {
            listBuilds().forEach((build) => simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 1200 })))
            run(scoutThenVillager, { inputs: { durationSeconds: 120 } })
            run([{ action: 'research', tech: 'steeled-arrow' }, { action: 'research', tech: 'fitted-leatherwork' }], { game: blacksmith, inputs: { durationSeconds: 150 } })
            run([barracks('spearman', { instance: 1 }), barracks('man-at-arms', { trigger: at(1) })], { game: twoBarracks, inputs: { durationSeconds: 60 } })
        })
        const failed = outcomes.flatMap((o) => (o.started === false && REASONS.includes(o.waitingOn as BreakdownReason) ? [o] : []))
        expect(new Set(failed.map((o) => o.waitingOn))).toEqual(new Set(REASONS))
        for (const outcome of failed) {
            expect(outcome.detail).not.toBeNull()
            expect(waitReasonOf(outcome.detail!)).toBe(outcome.waitingOn)
        }
    })
})

describe('accrueWait keys details by target', () => {
    const gold = (n: number): StepWaitDetail => ({ kind: 'resources', short: { gold: n } })
    const age = (landmark: string | null): StepWaitDetail => ({ kind: 'age', age: 3, landmark: landmark === null ? null : named(landmark) })
    const missing: StepWaitDetail = { kind: 'building', buildings: [named('barracks')], instance: null }

    function accrued(intervals: [StepWaitDetail | null, number][]): StepTiming['waitDetails'] {
        const timing = { waitingOn: 'prerequisite', waitBreakdown: {}, waitingFor: null, waitDetails: [] as StepTiming['waitDetails'] } as unknown as StepTiming
        for (const [detail, seconds] of intervals) {
            timing.waitingFor = detail
            timing.waitingOn = detail === null ? 'prerequisite' : waitReasonOf(detail)
            accrueWait({ steps: [timing] }, [0], seconds)
        }
        return timing.waitDetails
    }

    it.each<[string, [StepWaitDetail | null, number][], StepTiming['waitDetails']]>([
        ['gold, a prerequisite, then gold again: one gold entry with its first numbers', [[gold(50), 10], [missing, 5], [gold(20), 3]], [{ detail: gold(50), seconds: 13 }, { detail: missing, seconds: 5 }]],
        [
            'a missing then a busy barracks: two entries, each with the numbers of its first interval',
            [[missing, 4], [{ kind: 'building-busy', buildings: [named('barracks')], instance: null, every: true }, 6], [{ kind: 'building-busy', buildings: [named('barracks')], instance: null, every: false }, 2]],
            [{ detail: missing, seconds: 4 }, { detail: { kind: 'building-busy', buildings: [named('barracks')], instance: null, every: true }, seconds: 8 }],
        ],
        [
            'two buildings of one kind: two entries',
            [[missing, 1], [{ kind: 'building', buildings: [named('stable')], instance: null }, 2]],
            [{ detail: missing, seconds: 1 }, { detail: { kind: 'building', buildings: [named('stable')], instance: null }, seconds: 2 }],
        ],
        ['an age takes a later landmark and keeps it through a later null one', [[age(null), 5], [age('kings-palace'), 7], [age(null), 1]], [{ detail: age('kings-palace'), seconds: 13 }]],
        ['two ages: two entries', [[age(null), 1], [{ kind: 'age', age: 4, landmark: null }, 2]], [{ detail: age(null), seconds: 1 }, { detail: { kind: 'age', age: 4, landmark: null }, seconds: 2 }]],
        ['no entry for a null detail or a zero interval', [[null, 5], [gold(5), 0]], []],
    ])('%s', (_, intervals, entries) => {
        expect(accrued(intervals)).toEqual(entries)
    })
})

describe('the wait details add up to the breakdown', () => {
    it('for every step of every prebuilt build at 1200 s and of the cases above', () => {
        const results = [
            ...listBuilds().map((build) => simulateBuild(build.name, 1200)),
            run(scoutThenVillager, { inputs: { durationSeconds: 120 } }),
            run([{ action: 'research', tech: 'steeled-arrow' }, { action: 'research', tech: 'fitted-leatherwork' }], { game: blacksmith, inputs: { durationSeconds: 150 } }),
            run([barracks('spearman', { instance: 1 }), barracks('man-at-arms', { trigger: at(1) })], { game: twoBarracks, inputs: { durationSeconds: 60 } }),
            run([{ action: 'build', building: 'barracks', from: 'stone', builders: 3 }], { inputs: { durationSeconds: 60 } }),
        ]
        const steps = results.flatMap((r) => r.steps)
        expect(steps.some((s) => s.waitDetails.length > 0)).toBe(true)
        for (const step of steps) {
            for (const reason of REASONS) {
                const sum = step.waitDetails.filter((e) => waitReasonOf(e.detail) === reason).reduce((total, e) => total + e.seconds, 0)
                expect(sum).toBeCloseTo(step.waitBreakdown[reason] ?? 0, 6)
            }
            const keys = step.waitDetails.map((e) => waitTargetKey(e.detail))
            expect(new Set(keys).size).toBe(keys.length)
        }
    })
})

describe('repeat runs and warnings', () => {
    it('deep-equals a repeat run that waits on resources, an age and a busy building', () => {
        const name = listBuilds().find((build) => {
            const kinds = simulateBuild(build.name, 1200).steps.flatMap((s) => s.waitDetails.map((e) => e.detail.kind))
            return ['resources', 'age', 'building-busy'].every((kind) => kinds.includes(kind as StepWaitDetail['kind']))
        })?.name
        expect(name).toBeDefined()
        expect(simulateBuild(name!, 1200)).toEqual(simulateBuild(name!, 1200))
    })

    it.each<[string, BuildStep[], GameData | undefined, StepTiming['waitingOn']]>([
        ['a resource wait', [{ action: 'build', building: 'kings-palace', from: 'sheep' }], startingWith(2, ['capital-town-center', ...houses], { food: 0, wood: 0, gold: 0, stone: 0 }), 'resources'],
        ['a prerequisite wait', [barracks('man-at-arms')], undefined, 'prerequisite'],
        [
            'a busy building',
            [{ action: 'research', tech: 'wheelbarrow' }, { action: 'research', tech: 'horticulture' }],
            startingWith(2, ['capital-town-center', 'mill', ...houses], plenty),
            'prerequisite',
        ],
    ])('keeps the step-stuck message and fields for %s', (_, steps, game, waitingOn) => {
        const result = run(steps, { game, inputs: { durationSeconds: 60 } })
        const stuck = result.steps.find((s) => s.status === 'waiting')!
        const action = steps[stuck.step].action
        expect(result.warnings.filter((w) => w.code === 'step-stuck')).toEqual([
            {
                code: 'step-stuck',
                severity: 'warning',
                message: `step ${stuck.step + 1} (${action}) was still waiting on ${waitingOn} at ${formatMinSec(60)}, from ${formatMinSec(stuck.armedAt!)}.`,
                step: stuck.step,
                waitingOn,
                at: stuck.armedAt,
            },
        ])
    })
})
