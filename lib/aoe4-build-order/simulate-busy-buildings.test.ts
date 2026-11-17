import { describe, expect, it } from 'vitest'
import type { GameData } from './data'
import { instanceFree } from './engine-common'
import type { BuildStart, BuildStep, ResourceKind, SimulationResult } from './model'
import { researchHandler } from './research'
import { stepHandlers } from './simulate'
import type { BuildingInstance, EngineState, PaidItem, StepStart } from './simulate'
import { at, countAt, noAutoVillagers, noneNegative, run, startingWith, withHandler } from './test-helpers'

const plenty = { food: 5000, wood: 5000, gold: 5000, stone: 0 }
const houses = ['house', 'house', 'house']
const short = 120

// Fixed training times, so the order in which two barracks free up is set by the test.
function timed(age: number, buildings: string[], times: Record<string, number>, resources: Record<ResourceKind, number> = plenty): GameData {
    return noAutoVillagers(
        startingWith(age, buildings, resources, (parts) => {
            parts.snapshot.units.forEach((e) => {
                e.costs.time = times[e.baseId] ?? e.costs.time
            })
        }),
    )
}

const produce = (unit: string, extra: Partial<Extract<BuildStep, { action: 'produce' }>> = {}): BuildStep => ({ action: 'produce', producer: 'barracks', unit, ...extra })

// The building and instance that took each research, read from the one research item it now holds.
function researchTargets(steps: BuildStep[], game: GameData, start?: BuildStart): { result: SimulationResult; taken: [string, number][] } {
    const taken: [string, number][] = []
    let result: SimulationResult | undefined
    withHandler(
        'research',
        (step, index, state) => {
            const outcome = researchHandler(step, index, state)
            const target = [...state.instances.values()].flat().find((i) => i.paid.length === 1 && i.paid[0].entry.baseId === step.tech)
            if (outcome.started && target) {
                taken.push([target.baseId, target.instance])
            }
            return outcome
        },
        () => {
            result = run(steps, { game, start, inputs: { durationSeconds: short } })
        },
    )
    return { result: result!, taken }
}

describe('instanceFree', () => {
    const instance = (paid: number): BuildingInstance => ({ baseId: 'barracks', instance: 1, rally: undefined, order: null, paid: Array<PaidItem>(paid).fill({} as PaidItem), busyUntil: null })
    const stateWith = (held: { step: number; holds: boolean } | null, target: BuildingInstance) =>
        ({ held: held && { step: held.step, instances: new Set(held.holds ? [target] : []) } }) as EngineState

    it.each([
        ['an instance with a paid item', 1, null, false],
        ['an empty instance with no hold', 0, null, true],
        ['an empty instance held for another step', 0, { step: 2, holds: true }, false],
        ['an empty instance held for the same step', 0, { step: 5, holds: true }, true],
        ['an empty instance outside the hold of another step', 0, { step: 2, holds: false }, true],
        ['an instance with a paid item held for the same step', 1, { step: 5, holds: true }, false],
    ])('%s is free for step 5: %s', (_, paid, held, free) => {
        const target = instance(paid as number)
        expect(instanceFree(stateWith(held as { step: number; holds: boolean } | null, target), target, 5)).toBe(free)
    })
})

describe('a produce on one busy producer starts when its unit completes', () => {
    const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(10) }])
    const plain = run([])

    it('waits for the villager paid at 0, accrued to prerequisite, then trains the scout', () => {
        expect(result.steps[0]).toMatchObject({ status: 'completed', armedAt: 10, startedAt: 20, completedAt: 43, waitBreakdown: { prerequisite: 10 } })
    })

    it('does not charge the scout before it starts', () => {
        const i = result.times.indexOf(10)
        expect(plain.floating.food[i] - result.floating.food[i]).toBeCloseTo(0, 9)
        expect(result.spent.military[result.times.indexOf(20)]).toBe(65)
    })
})

describe('a produce on several instances starts when every target is free', () => {
    const game = timed(2, ['capital-town-center', 'barracks', 'barracks', ...houses], { spearman: 10, 'man-at-arms': 30 })
    const steps: BuildStep[] = [produce('spearman', { instance: 1 }), produce('man-at-arms', { instance: 2, count: 1 }), produce('man-at-arms', { trigger: at(1) })]
    const result = run(steps, { game, inputs: { durationSeconds: short } })

    it('frees barracks 1 at 10, before barracks 2 at 30', () => {
        expect(countAt(result, 'spearman', 10)).toBe(1)
        expect(countAt(result, 'man-at-arms', 25)).toBe(0)
        expect(countAt(result, 'man-at-arms', 30)).toBe(1)
    })

    it('starts at 30 and pays no spearman on the held barracks 1 meanwhile', () => {
        expect(result.steps[2]).toMatchObject({ armedAt: 1, startedAt: 30, waitBreakdown: { prerequisite: 29 } })
        expect(countAt(result, 'spearman', short)).toBe(1)
    })

    it('releases the hold when the step starts, so both barracks keep training', () => {
        expect(countAt(result, 'man-at-arms', 60)).toBe(3)
        expect(countAt(result, 'man-at-arms', 90)).toBe(5)
    })

    it('keeps every floating resource at or above zero and gives the same result twice', () => {
        noneNegative(result)
        expect(run(steps, { game, inputs: { durationSeconds: short } })).toEqual(result)
    })
})

describe('a produce on instance k waits only for instance k', () => {
    const game = timed(2, ['capital-town-center', 'barracks', 'barracks', ...houses], { spearman: 10, 'man-at-arms': 30 })

    it.each([
        [1, 10],
        [2, 30],
    ])('on barracks %i it starts at %i', (instance, startedAt) => {
        const result = run([produce('spearman', { instance: 1, count: 1 }), produce('man-at-arms', { instance: 2, count: 1 }), produce('man-at-arms', { instance, count: 1, trigger: at(1) })], {
            game,
            inputs: { durationSeconds: short },
        })
        expect(result.steps[2]).toMatchObject({ startedAt, waitBreakdown: { prerequisite: startedAt - 1 } })
    })
})

describe('the busy check comes after the resource check', () => {
    it('waits on resources until the scout is affordable, then on the busy town center', () => {
        const game = startingWith(1, ['capital-town-center', 'house'], { food: 50, wood: 0, gold: 0, stone: 0 })
        // Armed at 1, after the villager order spent the 50 food at 0, so the town center is busy and the bank short.
        const result = run([{ action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(1) }], { game })
        const { waitBreakdown } = result.steps[0]
        expect(result.steps[0].startedAt).toBe(20)
        expect(Object.keys(waitBreakdown)).toEqual(['resources', 'prerequisite'])
        expect(waitBreakdown.resources).toBeGreaterThan(0)
        expect(waitBreakdown.resources! + waitBreakdown.prerequisite!).toBeCloseTo(19, 9)
    })

    it('reserves the cost while it waits for the busy building, so another order cannot spend it', () => {
        const game = timed(2, ['capital-town-center', 'barracks', 'barracks', ...houses], { spearman: 40, 'man-at-arms': 10 }, { ...plenty, gold: 40 })
        const steps = [produce('man-at-arms', { instance: 2 }), produce('spearman', { instance: 1, count: 1 }), produce('man-at-arms', { instance: 1, count: 1, trigger: at(1) })]
        const result = run(steps, { game, inputs: { durationSeconds: short } })
        expect(result.steps[2]).toMatchObject({ startedAt: 40, waitBreakdown: { prerequisite: 39 } })
        expect(result.floating.gold[result.times.indexOf(35)]).toBe(20)
        expect(countAt(result, 'man-at-arms', short)).toBe(2)
        noneNegative(result)
    })
})

describe('a reaction treats instances held for the cursor step as busy', () => {
    // Barracks 1 frees at 10 and is held for the third step until barracks 2 frees at 30.
    const game = timed(3, ['capital-town-center', 'barracks', 'barracks', ...houses], { spearman: 10, 'man-at-arms': 30 })
    const start: BuildStart = { rally: 'sheep', villagers: { berry: 6 } }
    const onBerry = { trigger: { kind: 'depleted', node: 'berry' }, reaction: true } as const
    const order = (reaction: BuildStep): BuildStep[] => [produce('spearman', { instance: 1, count: 1 }), produce('man-at-arms', { instance: 2, count: 1 }), produce('man-at-arms', { count: 1, trigger: at(1) }), reaction]

    it.each([
        ['produce', { ...produce('spearman', { instance: 1, count: 1 }), ...onBerry }, 60, 30],
        ['research', { action: 'research', tech: 'veteran-spearmen', at: 'barracks', ...onBerry } as BuildStep, 30, 90],
    ])('a reaction %s armed while barracks 1 is held does not take it', (_, reaction, reactionStart, cursorStart) => {
        const result = run(order(reaction), { game, start, inputs: { durationSeconds: short, nodeAmounts: { berry: 60 } } })
        const armedAt = result.steps[3].armedAt!
        expect(armedAt).toBeGreaterThan(10)
        expect(armedAt).toBeLessThan(30)
        expect(result.steps[3].startedAt).toBe(reactionStart)
        expect(result.steps[2].startedAt).toBe(cursorStart)
    })
})

describe('a research waits for a free building', () => {
    it('runs after the spearman its barracks trains, for its research time', () => {
        const game = startingWith(3, ['capital-town-center', 'barracks', ...houses], plenty)
        const steps: BuildStep[] = [produce('spearman'), { action: 'research', tech: 'veteran-spearmen', trigger: at(5) }]
        const result = run(steps, { game })
        expect(result.steps[1]).toMatchObject({ armedAt: 5, startedAt: 15, completedAt: 75, waitBreakdown: { prerequisite: 10 } })
        noneNegative(result)
        expect(run(steps, { game })).toEqual(result)
    })

    it('reserves its cost while it waits for the blacksmith, so a man-at-arms order cannot spend the gold', () => {
        const game = noAutoVillagers(startingWith(2, ['capital-town-center', 'barracks', 'blacksmith', ...houses], { ...plenty, gold: 270 }))
        const steps: BuildStep[] = [produce('man-at-arms'), { action: 'research', tech: 'steeled-arrow' }, { action: 'research', tech: 'fitted-leatherwork' }]
        const result = run(steps, { game, inputs: { durationSeconds: short } })
        expect(result.steps[2]).toMatchObject({ startedAt: 60, waitBreakdown: { prerequisite: 60 } })
        expect(countAt(result, 'man-at-arms', short)).toBe(1)
        noneNegative(result)
    })

    it.each([
        ['one blacksmith runs them back to back', ['blacksmith'], [0, 60], [60, 120], { prerequisite: 60 }],
        ['two blacksmiths run them at once', ['blacksmith', 'blacksmith'], [0, 60], [0, 60], {}],
    ])('%s', (_, smiths, first, second, wait) => {
        const game = startingWith(2, ['capital-town-center', ...smiths, 'house'], plenty)
        const result = run([{ action: 'research', tech: 'steeled-arrow' }, { action: 'research', tech: 'fitted-leatherwork' }], { game, inputs: { durationSeconds: short } })
        expect([result.steps[0].startedAt, result.steps[0].completedAt]).toEqual(first)
        expect([result.steps[1].startedAt, result.steps[1].completedAt]).toEqual(second)
        expect(result.steps[1].waitBreakdown).toEqual(wait)
    })
})

describe('a research takes the first free candidate instance', () => {
    const longbow = (extra: Partial<Extract<BuildStep, { action: 'produce' }>> = {}): BuildStep => ({ action: 'produce', producer: 'archery-range', unit: 'longbowman', ...extra })
    const veteran = (extra: Partial<Extract<BuildStep, { action: 'research' }>> = {}): BuildStep => ({ action: 'research', tech: 'veteran-longbowmen', ...extra })
    const rangeAndHall = startingWith(3, ['capital-town-center', 'archery-range', 'council-hall', ...houses], plenty)
    const twoRanges = startingWith(3, ['capital-town-center', 'archery-range', 'archery-range', ...houses], plenty)

    it.each([
        ['an idle council hall over a range training longbowmen', rangeAndHall, [longbow(), veteran({ trigger: at(5) })], ['council-hall', 1], 5],
        ['the range, offered before its first longbowman is paid', rangeAndHall, [veteran(), longbow()], ['archery-range', 1], 0],
        ['the idle council hall, offered after the range paid its first longbowman', rangeAndHall, [longbow(), veteran()], ['council-hall', 1], 0],
        ['the named range, waiting for it over an idle council hall', rangeAndHall, [longbow(), veteran({ at: 'archery-range', trigger: at(5) })], ['archery-range', 1], 15],
        ['instance 1 when both ranges free at once', twoRanges, [longbow(), veteran({ trigger: at(5) })], ['archery-range', 1], 15],
        ['the range that frees first', twoRanges, [longbow({ instance: 2 }), longbow({ instance: 1, trigger: at(3) }), veteran({ trigger: at(5) })], ['archery-range', 2], 15],
    ])('%s', (_, game, steps, target, startedAt) => {
        const { result, taken } = researchTargets(steps, game)
        expect(taken).toEqual([target])
        expect(result.steps[steps.findIndex((s) => s.action === 'research')]).toMatchObject({ startedAt, completedAt: startedAt + 60 })
    })
})

describe('a running research pauses its instance', () => {
    const game = startingWith(2, ['capital-town-center', ...houses], plenty)
    const textiles: BuildStep = { action: 'research', tech: 'textiles', at: 'capital-town-center', trigger: at(5) }

    it('pays no villager while it runs, then resumes the order at its end', () => {
        const result = run([textiles], { game })
        expect(result.steps[0]).toMatchObject({ startedAt: 20, completedAt: 40 })
        expect(countAt(result, 'villager', 55)).toBe(countAt(result, 'villager', 20))
        expect(countAt(result, 'villager', 60)).toBe(countAt(result, 'villager', 20) + 1)
    })

    it('lets a waiting produce take the instance at the research end, before the order pays', () => {
        const result = run([textiles, { action: 'produce', producer: 'capital-town-center', unit: 'scout', count: 1, trigger: at(6) }], { game })
        expect(result.steps[1]).toMatchObject({ armedAt: 20, startedAt: 40, completedAt: 63 })
        expect(countAt(result, 'villager', 80)).toBe(countAt(result, 'villager', 20))
        expect(countAt(result, 'villager', 85)).toBe(countAt(result, 'villager', 20) + 1)
    })
})

describe('a step with no target instance is unchanged', () => {
    function outcomeOf(action: 'produce' | 'research', step: BuildStep, game: GameData): StepStart {
        const outcomes: StepStart[] = []
        const handler = stepHandlers[action] as (s: BuildStep, i: number, st: EngineState) => StepStart
        withHandler(action, ((s: BuildStep, i: number, st: EngineState) => {
            const outcome = handler(s, i, st)
            outcomes.push(outcome)
            return outcome
        }) as never, () => run([step], { game, inputs: { durationSeconds: 60 } }))
        return outcomes[0]
    }
    const game = startingWith(3, ['capital-town-center', 'barracks', 'barracks', ...houses], plenty)

    it.each([
        ['produce', produce('man-at-arms', { instance: 3, count: 1 })],
        ['research', { action: 'research', tech: 'steeled-arrow' } as BuildStep],
    ] as const)('a %s waits on prerequisite with nothing held or reserved', (action, step) => {
        expect(outcomeOf(action, step, game)).toEqual({ started: false, waitingOn: 'prerequisite' })
    })
})

describe('a target never free by the horizon', () => {
    const game = timed(2, ['capital-town-center', 'barracks', ...houses], { spearman: 1000 })
    const result = run([produce('spearman', { count: 1 }), produce('man-at-arms', { count: 1, trigger: at(1) }), { action: 'rally', producer: 'capital-town-center', to: 'wood' }], { game, inputs: { durationSeconds: short } })

    it('leaves the step waiting on prerequisite with a step-stuck warning and later steps not reached', () => {
        expect(result.steps.slice(1).map((s) => [s.status, s.waitingOn])).toEqual([
            ['waiting', 'prerequisite'],
            ['not-reached', 'earlier-step'],
        ])
        expect(result.warnings.filter((w) => w.code === 'step-stuck').map((w) => w.step)).toEqual([1])
    })
})

describe('steps that never wait on a building', () => {
    it.each([
        { action: 'pause', producer: 'capital-town-center', trigger: at(5) },
        { action: 'rally', producer: 'capital-town-center', to: 'wood', trigger: at(5) },
        { action: 'build', building: 'house', builders: 1, from: 'sheep', trigger: at(5) },
        { action: 'move', count: 1, from: 'sheep', to: 'wood', trigger: at(5) },
    ] as BuildStep[])('$action starts at 5 while the town center trains a villager', (step) => {
        const result = run([step], { inputs: { durationSeconds: 60 } })
        expect(countAt(result, 'villager', 20) - countAt(result, 'villager', 15)).toBe(1)
        expect(result.steps[0].startedAt).toBe(5)
    })
})
