import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import { formatMinSec } from './format-time'
import type { BuildOrder, BuildStart, BuildStep, NodeRef, SimulationResult, Trigger } from './model'
import { researchNotes } from './research'
import { expandRepeats, expandedStepCount } from './repeat'
import { simulateBuildOrder } from './simulate'
import { ENGLISH, buildOrder, inputsFor, run } from './test-helpers'

const house = (extra: Partial<Extract<BuildStep, { action: 'build' }>> = {}): BuildStep => ({ action: 'build', building: 'house', from: 'wood', ...extra })
const move = (count: number | 'all', from: NodeRef, to: NodeRef, extra: Partial<Extract<BuildStep, { action: 'move' }>> = {}): BuildStep => ({ action: 'move', count, from, to, ...extra })
const villager: BuildStep = { action: 'produce', producer: 'capital-town-center', unit: 'villager' }
const bloomery: BuildStep = { action: 'research', tech: 'bloomery' }
const onBerry = { trigger: { kind: 'depleted', node: 'berry' } as Trigger, reaction: true as const }
const shortSheep: BuildStart = { villagers: { sheep: 1, wood: 5 }, rally: 'wood' }
const berryStart: BuildStart = { villagers: { berry: 3, wood: 3 }, rally: 'wood' }
const mixed: BuildStart = { villagers: { sheep: 3, wood: 3 }, rally: 'sheep' }
const DURATION = 300
const short = { durationSeconds: DURATION }

function without(step: BuildStep): BuildStep {
    const { repeat: _repeat, ...once } = step
    return once as BuildStep
}

// Sets aside the only fields a repeat may change: source, copy and the step-stuck message.
function comparable(result: SimulationResult): unknown {
    return {
        ...result,
        steps: result.steps.map(({ source: _source, copy: _copy, ...timing }) => timing),
        warnings: result.warnings.map((warning) => (warning.code === 'step-stuck' ? { ...warning, message: '' } : warning)),
    }
}

function stuckWarnings(result: SimulationResult) {
    return result.warnings.filter((warning) => warning.code === 'step-stuck')
}

describe('a repeated step runs as the step written out', () => {
    it.each<[string, BuildStep[], BuildStart, object, number]>([
        ['a house x5 and a move x2', [villager, house({ repeat: 5 }), move(1, 'sheep', 'wood', { repeat: 2 }), bloomery], mixed, {}, 7],
        [
            'a bank-triggered house x3 and a depleted reaction x2',
            [house({ trigger: { kind: 'bank', resource: 'wood', atLeast: 200 }, repeat: 3 }), move('all', 'berry', 'wood', { ...onBerry, repeat: 2 })],
            berryStart,
            { autoHouses: false, nodeAmounts: { berry: 300 } },
            5,
        ],
    ])('gives the whole result of %s written out, apart from source and copy', (_, repeated, start, inputs, completed) => {
        const writtenOut = repeated.flatMap((step) => Array<BuildStep>(step.repeat ?? 1).fill(without(step)))
        const result = run(repeated, { start, inputs: { ...short, ...inputs } })
        expect(writtenOut.length).toBeGreaterThan(repeated.length)
        expect(result.steps.filter((timing) => timing.status === 'completed')).toHaveLength(completed)
        expect(comparable(result)).toEqual(comparable(run(writtenOut, { start, inputs: { ...short, ...inputs } })))
    })

    it('re-checks a bank trigger on each copy when it arms', () => {
        const result = run([house({ trigger: { kind: 'bank', resource: 'wood', atLeast: 200 }, repeat: 3 })], { start: mixed, inputs: short })
        const [first, second, third] = result.steps
        expect(first.startedAt).not.toBeNull()
        expect(second.armedAt).toBeGreaterThan(first.startedAt!)
        expect(third.armedAt).toBeGreaterThan(second.startedAt!)
    })

    it('arms every copy of a depleted reaction at the run-out, the later copy moving none and completing at once', () => {
        const result = run([move('all', 'berry', 'wood', { ...onBerry, repeat: 2 })], { start: berryStart, inputs: { ...short, autoHouses: false, nodeAmounts: { berry: 300 } } })
        const runOut = result.depletions.find((d) => d.node === 'berry')!.depletedAt
        expect(runOut).not.toBeNull()
        expect(result.steps.map(({ copy, armedAt, startedAt, completedAt }) => ({ copy, armedAt, startedAt, completedAt }))).toEqual([
            { copy: 1, armedAt: runOut, startedAt: runOut, completedAt: expect.any(Number) },
            { copy: 2, armedAt: runOut, startedAt: runOut, completedAt: runOut },
        ])
    })
})

describe('source and copy', () => {
    const steps = [villager, house({ repeat: 3 }), bloomery, move(1, 'sheep', 'wood', { repeat: 2 })]
    const result = run(steps, { inputs: short })

    it('gives one timing per copy, indexed in expanded order, copies consecutive with copy 1..n', () => {
        expect(result.steps).toHaveLength(expandedStepCount(steps))
        expect(result.steps.map((timing, index) => timing.step - index)).toEqual([0, 0, 0, 0, 0, 0, 0])
        expect(result.steps.map((timing) => `${timing.source}.${timing.copy}`)).toEqual(['0.1', '1.1', '1.2', '1.3', '2.1', '3.1', '3.2'])
    })

    it('indexes a research note after a repeated step by its expanded index', () => {
        expect(result.notes.map(({ step, tech }) => ({ step, tech }))).toEqual([{ step: 4, tech: 'bloomery' }])
        expect(result.notes).toEqual(researchNotes(expandRepeats(buildOrder(steps)).order, ENGLISH))
    })

    it('gives the same result twice and leaves the submitted order unchanged', () => {
        const order: BuildOrder = buildOrder(steps)
        const before = structuredClone(order)
        const inputs = inputsFor(ENGLISH, short)
        expect(simulateBuildOrder(order, ENGLISH, inputs)).toEqual(simulateBuildOrder(order, ENGLISH, inputs))
        expect(order).toStrictEqual(before)
    })
})

describe('shipped builds carry no repeat', () => {
    it.each(listBuilds().map((build) => [build.name, build] as const))('gives %s one timing per written step with source step and copy 1', (_, build) => {
        expect(build.steps.some((step) => step.repeat !== undefined)).toBe(false)
        const result = simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 600 }))
        expect(result.steps).toHaveLength(build.steps.length)
        result.steps.forEach((timing) => expect(timing).toMatchObject({ source: timing.step, copy: 1 }))
    })
})

describe('copies that are not reached or still waiting', () => {
    it('leaves the first short copy of a move waiting on villagers and the later copies not reached behind it', () => {
        const result = run([move(1, 'sheep', 'wood', { repeat: 3 })], { start: shortSheep, inputs: short })
        expect(result.steps.map(({ status, waitingOn }) => [status, waitingOn])).toEqual([
            ['completed', null],
            ['waiting', 'villagers'],
            ['not-reached', 'earlier-step'],
        ])
    })

    it('leaves the cursor copy behind a trigger not reached on trigger and the later copies on earlier-step', () => {
        const result = run([house({ trigger: { kind: 'time', seconds: 900 }, repeat: 3 }), move('all', 'berry', 'wood', onBerry)], { inputs: short })
        expect(result.steps.map(({ status, waitingOn }) => [status, waitingOn])).toEqual([
            ['not-reached', 'trigger'],
            ['not-reached', 'earlier-step'],
            ['not-reached', 'earlier-step'],
            ['not-reached', 'trigger'],
        ])
    })

    it('warns for a stuck copy with its expanded index and the source step, copy k of n', () => {
        const result = run([house({ repeat: 2 }), move(1, 'sheep', 'wood', { repeat: 3 })], { start: shortSheep, inputs: short })
        const stuck = result.steps[3]
        expect(stuck).toMatchObject({ source: 1, copy: 2, status: 'waiting' })
        expect(stuckWarnings(result)).toEqual([
            {
                code: 'step-stuck',
                severity: 'warning',
                message: `step 2 (move, copy 2 of 3) was still waiting on villagers at ${formatMinSec(DURATION)}, from ${formatMinSec(stuck.armedAt!)}.`,
                step: 3,
                waitingOn: 'villagers',
                at: stuck.armedAt,
            },
        ])
    })

    it.each<[string, Partial<Extract<BuildStep, { action: 'move' }>>]>([
        ['no repeat', {}],
        ['repeat 1', { repeat: 1 }],
    ])('numbers a stuck single-copy step after a repeated one by its source in the plain form, with %s', (_, extra) => {
        const result = run([house({ repeat: 2 }), move(2, 'sheep', 'wood', extra)], { start: shortSheep, inputs: short })
        const stuck = result.steps[2]
        expect(stuck).toMatchObject({ source: 1, copy: 1, status: 'waiting' })
        expect(stuckWarnings(result)).toEqual([
            expect.objectContaining({ step: 2, message: `step 2 (move) was still waiting on villagers at ${formatMinSec(DURATION)}, from ${formatMinSec(stuck.armedAt!)}.` }),
        ])
    })
})
