import { describe, expect, it } from 'vitest'
import type { SimulateResponse } from '../../../lib/aoe4-build-order/api'
import type { StepTiming, StepWaitDetail, StepWaitEntry } from '../../../lib/aoe4-build-order/model'
import { parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { annotationsByLine, buildAnnotations, alignSteps, annotationDetailText, finishedText, formatStepTime, stepKind, stepSpan, waitedText, type AnnotationInput, type StepAnnotation, type StepKind } from './step-annotations'

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
        waitingFor: null,
        waitDetails: [],
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

    it('keeps every row its own run when the text is equal and only the selected build differs', () => {
        const steps = [timing(0, { startedAt: 1 }), timing(1, { startedAt: 11 }), timing(2, { startedAt: 21 })]
        const input = runInput({ live: { text: RUN_TEXT, duration: '600', selected: 'Other' } }, steps)
        expect(input.live.selected).not.toBe(input.shown?.selected)
        expect(input.live.text).toBe(input.shown?.text)
        expect(buildAnnotations(input)?.steps.map((s) => s.run?.startedAt ?? null)).toEqual([1, 11, 21])
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

    const GOLD: StepWaitDetail = { kind: 'resources', short: { gold: 50 } }
    const CASTLE: StepWaitDetail = { kind: 'age', age: 3, landmark: null }
    const BARRACKS: StepWaitDetail = { kind: 'building', buildings: [{ baseId: 'barracks', name: 'Barracks' }], instance: null }
    const BUSY: StepWaitDetail = { kind: 'building-busy', buildings: [{ baseId: 'archery-range', name: 'Archery Range' }], instance: null, every: false }
    const entry = (detail: StepWaitDetail, seconds: number): StepWaitEntry => ({ detail, seconds })

    it.each<[string, Partial<StepTiming>, string, boolean]>([
        ['completed with one entry', { waitDetails: [entry(GOLD, 30)] }, '50 gold 0:30', false],
        ['completed keeps list order, not reason order', { waitDetails: [entry(CASTLE, 70), entry(GOLD, 30), entry(BUSY, 23)] }, 'Castle Age 1:10, 50 gold 0:30, a free Archery Range 0:23', false],
        ['completed leaves out zero-second entries', { waitDetails: [entry(GOLD, 0), entry(BUSY, 23)] }, 'a free Archery Range 0:23', false],
        ['completed with no entry', {}, '', false],
        ['in-progress with no entry', { status: 'in-progress' }, '', false],
        ['in-progress with an entry', { status: 'in-progress', waitDetails: [entry(GOLD, 5)] }, '50 gold 0:05', false],
        ['waiting with entries then waitingFor', { status: 'waiting', waitingOn: 'prerequisite', waitingFor: CASTLE, waitDetails: [entry(GOLD, 2), entry(CASTLE, 1200)] }, '50 gold 0:02, Castle Age 20:00, still waiting for Castle Age', true],
        ['waiting prints the entry for its own target', { status: 'waiting', waitingOn: 'prerequisite', waitingFor: BARRACKS, waitDetails: [entry(BARRACKS, 1200)] }, 'a Barracks 20:00, still waiting for a Barracks', true],
        ['waiting with waitingFor and no entry', { status: 'waiting', waitingOn: 'prerequisite', waitingFor: CASTLE }, 'still waiting for Castle Age', true],
        ['waiting with a zero-second entry and waitingFor', { status: 'waiting', waitingOn: 'prerequisite', waitingFor: CASTLE, waitDetails: [entry(GOLD, 0)] }, 'still waiting for Castle Age', true],
        ['waiting without waitingFor falls back to waitingOn', { status: 'waiting', waitingOn: 'prerequisite', waitDetails: [entry(GOLD, 2)] }, '50 gold 0:02, still waiting on prerequisite', true],
        ['waiting without waitingFor and no entry', { status: 'waiting', waitingOn: 'resources' }, 'still waiting on resources', true],
        ['not-reached ignores waitingFor and entries', { status: 'not-reached', waitingOn: 'trigger', waitingFor: CASTLE, waitDetails: [entry(GOLD, 30)] }, 'not reached (trigger)', true],
    ])('%s', (_name, overrides, blockedBy, flagged) => {
        const run = runOf(overrides)
        expect([run.blockedBy, run.flagged]).toEqual([blockedBy, flagged])
    })

    it('builds waits from the details only, in order, without zero-second entries, and waitingForText from waitingFor', () => {
        const run = runOf({
            status: 'waiting',
            waitingOn: 'prerequisite',
            waitBreakdown: { resources: 99 },
            waitingFor: CASTLE,
            waitDetails: [entry(BUSY, 23), entry(GOLD, 0), entry(CASTLE, 7)],
        })
        expect(run.waits).toEqual([
            { text: 'a free Archery Range', seconds: 23 },
            { text: 'Castle Age', seconds: 7 },
        ])
        expect(run.waitingForText).toBe('Castle Age')
        expect(run.blockedBy).not.toContain('resources')
        expect('waitBreakdown' in run).toBe(false)
    })

    it('reads waitingForText as null when waitingFor is null', () => {
        expect(runOf({ status: 'waiting', waitingOn: 'resources' }).waitingForText).toBeNull()
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

describe('waitedText', () => {
    it.each<[StepTiming['status'], string]>([
        ['completed', '1:15'],
        ['in-progress', '1:15'],
        ['waiting', 'still waiting'],
        ['not-reached', 'still waiting'],
    ])('%s with 75 waited seconds reads %s', (status, expected) => {
        expect(waitedText({ status, waitSeconds: 75 })).toBe(expected)
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

describe('annotationDetailText', () => {
    it.each<[StepTiming['status'], number, string, string]>([
        ['completed', 75, 'resources 0:20', 'Waited 1:15. Blocked by: resources 0:20'],
        ['completed', 0, '', 'Waited 0:00. Blocked by: nothing'],
        ['waiting', 75, 'still waiting on villagers', 'Still waiting. Blocked by: still waiting on villagers'],
        ['not-reached', 0, 'not reached (house)', 'Still waiting. Blocked by: not reached (house)'],
    ])('%s with %i waited seconds reads %s', (status, waitSeconds, blockedBy, expected) => {
        expect(annotationDetailText({ status, waitSeconds, blockedBy })).toBe(expected)
    })
})
