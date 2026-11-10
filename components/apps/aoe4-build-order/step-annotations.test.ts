import { describe, expect, it } from 'vitest'
import type { SimulateResponse } from '../../../lib/aoe4-build-order/api'
import type { StepTiming } from '../../../lib/aoe4-build-order/model'
import { parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { annotationsByLine, buildAnnotations, alignSteps, finishedText, formatStepTime, formatWaitBreakdown, stepKind, stepSpan, type AnnotationInput, type StepAnnotation, type StepKind } from './step-annotations'

const LANDMARKS = ['kings-palace']

function timing(step: number, overrides: Partial<StepTiming> = {}): StepTiming {
    return {
        step,
        status: 'completed',
        armedAt: 0,
        startedAt: 0,
        completedAt: 5,
        waitSeconds: 0,
        waitingOn: null,
        waitBreakdown: {},
        ...overrides,
    }
}

describe('stepKind', () => {
    const kindOf = (line: string) => {
        const parsed = parseBuildOrderText(`start -> sheep\n${line}`)
        if (!parsed.ok) throw new Error('fixture must parse')
        return stepKind(parsed.order.steps[0], LANDMARKS)
    }

    it.each<[string, StepKind]>([
        ['build kings-palace from wood', 'age-up'],
        ['build barracks from wood', 'building'],
        ['research wheelbarrow', 'research'],
        ['produce spearman from barracks', 'military'],
        ['produce villager from capital-town-center', 'villager'],
        ['move 2 sheep to wood', 'economy'],
        ['rally capital-town-center -> wood', 'economy'],
        ['pause capital-town-center', 'economy'],
    ])('classifies %j as %s', (line, kind) => {
        expect(kindOf(line)).toBe(kind)
    })

    it('maps a missing step to other', () => {
        expect(stepKind(undefined, LANDMARKS)).toBe('other')
    })
})

describe('step time formatting', () => {
    it('formats seconds as m:ss and null as an en dash', () => {
        expect(formatStepTime(65)).toBe('1:05')
        expect(formatStepTime(null)).toBe('–')
    })

    it('joins wait reasons with m:ss durations', () => {
        expect(formatWaitBreakdown([{ reason: 'resources', seconds: 2 }, { reason: 'villagers', seconds: 75 }])).toBe(
            'resources 0:02, villagers 1:15'
        )
        expect(formatWaitBreakdown([])).toBe('')
    })
})

describe('stepSpan', () => {
    const END = 600
    it.each<[string, Partial<StepTiming>, { from: number; to: number } | null]>([
        ['completed', { startedAt: 60, completedAt: 100 }, { from: 60, to: 100 }],
        ['in-progress runs to the end of the run', { status: 'in-progress', startedAt: 500, completedAt: null }, { from: 500, to: 600 }],
        ['waiting has no start', { status: 'waiting', startedAt: null, completedAt: null }, null],
        ['not-reached has no start', { status: 'not-reached', startedAt: null, completedAt: null }, null],
        ['zero-length completed', { startedAt: 30, completedAt: 30 }, { from: 30, to: 30 }],
        ['in-progress starting at the end', { status: 'in-progress', startedAt: 600, completedAt: null }, { from: 600, to: 600 }],
        ['clamps past the end', { startedAt: 590, completedAt: 700 }, { from: 590, to: 600 }],
        ['clamps a start past the end', { startedAt: 650, completedAt: 700 }, { from: 600, to: 600 }],
    ])('%s', (_name, overrides, expected) => {
        expect(stepSpan(timing(0, overrides), END)).toEqual(expected)
    })
})

const stepsOf = (...lines: string[]) => {
    const parsed = parseBuildOrderText(['start -> sheep', ...lines].join('\n'))
    if (!parsed.ok) throw new Error('fixture must parse')
    return parsed.order.steps
}

const [A, B, C, N, X, V] = [
    'produce villager from capital-town-center',
    'research wheelbarrow',
    'build barracks from wood',
    'research horticulture',
    'move 2 sheep to wood',
    'pause capital-town-center',
]

describe('alignSteps', () => {
    it.each<[string, string[], string[], (number | null)[]]>([
        ['equal', [A, B, C], [A, B, C], [0, 1, 2]],
        ['live empty', [A], [], []],
        ['shown empty', [], [A], [null]],
        ['insert at the top', [A, B, C], [N, A, B, C], [null, 0, 1, 2]],
        ['delete the middle', [A, B, C], [A, C], [0, 2]],
        ['edit one step', [A, B, C], [A, X, C], [0, null, 2]],
        ['swap the first two', [A, B, C], [B, A, C], [null, null, 2]],
        ['duplicate prefix keeps the last step', [V, V, B], [V, B], [0, 2]],
        ['equal duplicates', [V, V, V], [V, V], [0, 1]],
        ['suffix cap stops a run step mapping twice', [A, B], [A, A, B], [0, null, 1]],
    ])('%s', (_name, shown, live, expected) => {
        expect(alignSteps(stepsOf(...shown), stepsOf(...live))).toEqual(expected)
    })
})

const RUN_TEXT = ['start -> sheep', A, B, C].join('\n')

function runInput(overrides: Partial<AnnotationInput> = {}, steps: StepTiming[] = [timing(0), timing(1), timing(2)]): AnnotationInput {
    const live = { text: RUN_TEXT, duration: '600', selected: 'English 1 TC' }
    return {
        result: { steps } as unknown as SimulateResponse,
        shown: { text: RUN_TEXT, durationSeconds: 600, selected: 'English 1 TC' },
        live,
        liveSteps: stepsOf(A, B, C),
        landmarks: LANDMARKS,
        stale: false,
        ...overrides,
    }
}

describe('buildAnnotations', () => {
    const runs = (input: AnnotationInput) => buildAnnotations(input)?.steps.map((s) => s.run?.runStep ?? null)

    it('returns null without a result or a shown input', () => {
        expect(buildAnnotations(runInput({ result: null }))).toBeNull()
        expect(buildAnnotations(runInput({ shown: null }))).toBeNull()
    })

    it('gives every step its own run when the text is unchanged', () => {
        expect(runs(runInput())).toEqual([0, 1, 2])
    })

    it('drops every run but keeps kinds when another build is selected with different text', () => {
        const input = runInput({ live: { text: 'other', duration: '600', selected: 'Other' } })
        const result = buildAnnotations(input)
        expect(result?.steps.map((s) => s.run)).toEqual([null, null, null])
        expect(result?.steps.map((s) => s.kind)).toEqual(['villager', 'research', 'building'])
    })

    it('moves the old timing onto the shifted row and leaves an edited step bare', () => {
        const steps = [timing(0, { startedAt: 1 }), timing(1, { startedAt: 11 }), timing(2, { startedAt: 21 })]
        const deleted = runInput({ live: { text: 'edit', duration: '600', selected: 'English 1 TC' }, liveSteps: stepsOf(B, C) }, steps)
        const out = buildAnnotations(deleted)
        expect(out?.steps.map((s) => s.run?.startedAt ?? null)).toEqual([11, 21])
        const edited = buildAnnotations({ ...deleted, liveSteps: stepsOf(A, X, C) })
        expect(edited?.steps.map((s) => s.run?.runStep ?? null)).toEqual([0, null, 2])
        expect(edited?.steps[1].kind).toBe('economy')
    })

    it('drops every run when the shown text does not parse or its step count differs from the result', () => {
        const live = { text: 'edit', duration: '600', selected: 'English 1 TC' }
        const unparseable = runInput({ live, shown: { text: 'start -> fly', durationSeconds: 600, selected: 'English 1 TC' } })
        expect(runs(unparseable)).toEqual([null, null, null])
        expect(runs(runInput({ live }, [timing(0), timing(1)]))).toEqual([null, null, null])
    })

    it('copies stale from the input', () => {
        expect(buildAnnotations(runInput({ stale: true }))?.stale).toBe(true)
        expect(buildAnnotations(runInput({ stale: false }))?.stale).toBe(false)
    })
})

describe('StepRun', () => {
    const runOf = (overrides: Partial<StepTiming>) => {
        const run = buildAnnotations(runInput({}, [timing(0, overrides), timing(1), timing(2)]))?.steps[0].run
        if (!run) throw new Error('run expected')
        return run
    }

    it.each<[StepTiming['status'], StepTiming['waitingOn'], StepTiming['waitBreakdown'], string, boolean]>([
        ['completed', null, { villagers: 3 }, 'villagers 0:03', false],
        ['completed', null, { prerequisite: 4, population: 0, resources: 2, villagers: 3 }, 'resources 0:02, villagers 0:03, prerequisite 0:04', false],
        ['completed', null, {}, '', false],
        ['in-progress', null, {}, '', false],
        ['waiting', 'prerequisite', { resources: 2 }, 'resources 0:02, still waiting on prerequisite', true],
        ['waiting', 'resources', {}, 'still waiting on resources', true],
        ['not-reached', 'trigger', {}, 'not reached (trigger)', true],
    ])('%s waiting on %s reads %j and flagged %s', (status, waitingOn, waitBreakdown, blockedBy, flagged) => {
        const run = runOf({ status, waitingOn, waitBreakdown })
        expect([run.blockedBy, run.flagged]).toEqual([blockedBy, flagged])
    })

    it.each([
        [59.9, false],
        [60, true],
    ])('longWait at %s seconds is %s', (waitSeconds, expected) => {
        expect(runOf({ waitSeconds }).longWait).toBe(expected)
    })
})

describe('finishedText', () => {
    it.each<[StepTiming['status'], number | null, string]>([
        ['in-progress', null, 'ongoing'],
        ['in-progress', 30, 'ongoing'],
        ['completed', 65, '1:05'],
        ['completed', null, '–'],
    ])('%s with completedAt %s reads %s', (status, completedAt, expected) => {
        expect(finishedText({ status, completedAt })).toBe(expected)
    })
})

describe('annotationsByLine', () => {
    const a = (kind: StepKind): StepAnnotation => ({ kind, run: null })
    const [a0, a1] = [a('villager'), a('building')]
    const annotations = { stale: false, steps: [a0, a1] }

    it.each<[string, number[], number, (StepAnnotation | null)[]]>([
        ['step lines 2 and 4 of 5', [2, 4], 5, [null, a0, null, a1, null]],
        ['blank, comment and start lines between steps', [3, 6], 6, [null, null, a0, null, null, a1]],
        ['a trailing blank line', [1, 2], 3, [a0, a1, null]],
        ['a step line past the line count', [1, 9], 3, [a0, null, null]],
        ['a step line of zero', [0, 2], 2, [null, a1]],
    ])('%s', (_, stepLines, lineCount, expected) => {
        expect(annotationsByLine(annotations, stepLines, lineCount)).toEqual(expected)
    })
})
