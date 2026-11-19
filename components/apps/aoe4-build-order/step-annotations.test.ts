import { describe, expect, it } from 'vitest'
import type { SimulateResponse } from '../../../lib/aoe4-build-order/api'
import type { StepTiming, StepWaitDetail, StepWaitEntry } from '../../../lib/aoe4-build-order/model'
import { parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import {
    LONG_WAIT_SECONDS,
    alignSteps,
    annotationDetailText,
    annotationsByLine,
    buildAnnotations,
    combineRuns,
    copiesDetailText,
    finishedText,
    formatStepTime,
    groupBySource,
    gutterDetailText,
    sourceSpan,
    stepKind,
    stepSpan,
    waitedText,
    type AnnotationInput,
    type StepAnnotation,
    type StepKind,
    type StepRun,
} from './step-annotations'

const LANDMARKS = ['kings-palace']

function timing(step: number, overrides: Partial<StepTiming> = {}): StepTiming {
    return {
        step,
        source: step,
        copy: 1,
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
    const a = (kind: StepKind): StepAnnotation => ({ kind, run: null, copies: [] })
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

function stepRunOf(overrides: Partial<StepRun> = {}): StepRun {
    return {
        runStep: 0,
        status: 'completed',
        startedAt: 10,
        completedAt: 20,
        waitSeconds: 0,
        waits: [],
        waitingForText: null,
        waitingOn: null,
        blockedBy: '',
        longWait: false,
        flagged: false,
        ...overrides,
    }
}

const copyTiming = (step: number, source: number, copy: number, overrides: Partial<StepTiming> = {}) => timing(step, { source, copy, ...overrides })

describe('groupBySource', () => {
    it('groups by source and orders each group by copy, whatever the position', () => {
        const steps = [copyTiming(0, 0, 2), copyTiming(1, 1, 1), copyTiming(2, 0, 1), copyTiming(3, 0, 3)]
        const groups = groupBySource(steps)
        expect(groups.map((g) => g.map((t) => t.step))).toEqual([[2, 0, 3], [1]])
    })

    it('gives one single-copy group per step when nothing repeats', () => {
        const groups = groupBySource([timing(0), timing(1), timing(2)])
        expect(groups.map((g) => g.length)).toEqual([1, 1, 1])
    })
})

describe('combineRuns', () => {
    it('returns the same run for one copy', () => {
        const only = stepRunOf({ status: 'waiting', blockedBy: 'still waiting on resources' })
        expect(combineRuns([only])).toBe(only)
    })

    it('reports completed with the first start, the latest finish, summed waits and no cause', () => {
        const combined = combineRuns([
            stepRunOf({ runStep: 3, startedAt: 10, completedAt: 20, waitSeconds: 5, waits: [{ text: 'wood', seconds: 5 }] }),
            stepRunOf({ runStep: 4, startedAt: 30, completedAt: 50, waitSeconds: 7, waits: [{ text: 'wood', seconds: 7 }] }),
        ])
        expect(combined).toMatchObject({
            runStep: 3,
            status: 'completed',
            startedAt: 10,
            completedAt: 50,
            waitSeconds: 12,
            waitingOn: null,
            waitingForText: null,
            blockedBy: 'wood 0:12',
            flagged: false,
        })
    })

    it('takes the earliest start even when a later copy comes first in the list', () => {
        expect(combineRuns([stepRunOf({ startedAt: 40, completedAt: 60 }), stepRunOf({ startedAt: 5, completedAt: 9 })]).startedAt).toBe(5)
    })

    it('is in-progress with no finish when one copy is in progress and the rest completed', () => {
        const combined = combineRuns([stepRunOf({ completedAt: 20 }), stepRunOf({ status: 'in-progress', startedAt: 30, completedAt: null, waitingOn: 'resources' })])
        expect([combined.status, combined.completedAt, combined.startedAt, combined.waitingOn]).toEqual(['in-progress', null, 10, null])
    })

    it.each<[string, StepRun['status'][], StepRun['status'], boolean]>([
        ['not-reached last', ['completed', 'in-progress', 'not-reached'], 'not-reached', true],
        ['not-reached first', ['not-reached', 'completed', 'completed'], 'not-reached', true],
        ['waiting below in-progress', ['in-progress', 'waiting', 'completed'], 'waiting', true],
        ['not-reached below waiting', ['waiting', 'not-reached'], 'not-reached', true],
        ['in-progress below completed', ['completed', 'in-progress', 'completed'], 'in-progress', false],
    ])('takes the least advanced status, flagged only when waiting or not-reached: %s', (_name, statuses, expected, flagged) => {
        const combined = combineRuns(statuses.map((status) => stepRunOf({ status })))
        expect([combined.status, combined.flagged]).toEqual([expected, flagged])
    })

    it('flags a not-reached combination, keeps the start of started copies and takes that copy waitingOn', () => {
        const combined = combineRuns([
            stepRunOf(),
            stepRunOf({ status: 'not-reached', startedAt: null, completedAt: null, waitingOn: 'earlier-step', blockedBy: 'not reached (earlier-step)', flagged: true }),
        ])
        expect([combined.status, combined.flagged, combined.waitingOn, combined.startedAt, combined.blockedBy]).toEqual(['not-reached', true, 'earlier-step', 10, 'not reached (earlier-step)'])
    })

    it('merges waits with the same text into one entry in first-seen order', () => {
        const combined = combineRuns([
            stepRunOf({ waits: [{ text: 'wood', seconds: 10 }, { text: 'gold', seconds: 4 }] }),
            stepRunOf({ waits: [{ text: 'stone', seconds: 1 }, { text: 'wood', seconds: 5 }] }),
        ])
        expect(combined.waits).toEqual([
            { text: 'wood', seconds: 15 },
            { text: 'gold', seconds: 4 },
            { text: 'stone', seconds: 1 },
        ])
    })

    it('sets longWait from the summed wait although no single copy reached it', () => {
        const half = stepRunOf({ waitSeconds: LONG_WAIT_SECONDS / 2 })
        expect(half.longWait).toBe(false)
        expect(combineRuns([half, half]).longWait).toBe(true)
        expect(combineRuns([half, stepRunOf({ waitSeconds: LONG_WAIT_SECONDS / 2 - 1 })]).longWait).toBe(false)
    })
})

describe('combined run built from timings', () => {
    const WOOD: StepWaitDetail = { kind: 'resources', short: { wood: 50 } }
    const annotate = (steps: StepTiming[]) => buildAnnotations(runInput({ liveSteps: stepsOf(A, B) }, steps))?.steps[0]
    const waited = (seconds: number) => ({ waitDetails: [{ detail: WOOD, seconds }], waitSeconds: seconds })

    it('selects the not-reached copy cause over an earlier waiting copy, keeping its wood seconds in the waits', () => {
        const annotation = annotate([
            copyTiming(0, 0, 1, waited(3)),
            copyTiming(1, 0, 2, { status: 'waiting', startedAt: null, completedAt: null, waitingOn: 'resources', waitingFor: WOOD, ...waited(20) }),
            copyTiming(2, 0, 3, { status: 'not-reached', startedAt: null, completedAt: null, waitingOn: 'earlier-step' }),
            copyTiming(3, 1, 1),
        ])
        const run = annotation?.run
        expect([run?.status, run?.waitingOn, run?.waitingForText]).toEqual(['not-reached', 'earlier-step', null])
        expect(run?.waits).toEqual([{ text: '50 wood', seconds: 23 }])
        expect(run?.blockedBy).toMatch(/not reached \(earlier-step\)$/)
        expect(run?.blockedBy).toContain('50 wood 0:23')
        expect(run?.blockedBy).not.toContain('still waiting')
        expect(annotation?.copies[1]).toMatchObject({ status: 'waiting', blockedBy: '50 wood 0:20, still waiting for 50 wood' })
    })

    it.each<[string, Partial<StepTiming>, string, string | null]>([
        ['waiting', { status: 'waiting', startedAt: null, completedAt: null, waitingOn: 'resources', waitingFor: WOOD }, '50 wood 0:16, still waiting for 50 wood', '50 wood'],
        ['not-reached', { status: 'not-reached', startedAt: null, completedAt: null, waitingOn: 'trigger' }, '50 wood 0:16, not reached (trigger)', null],
        ['completed', {}, '50 wood 0:16', null],
    ])('words blockedBy of a %s combination as the merged waits then the selected cause', (status, second, expected, waitingForText) => {
        const run = annotate([copyTiming(0, 0, 1, waited(7)), copyTiming(1, 0, 2, { ...waited(9), ...second }), copyTiming(2, 1, 1)])?.run
        expect(run?.status).toBe(status)
        expect(run?.blockedBy).toBe(expected)
        expect(run?.waitingForText).toBe(waitingForText)
    })

    it('leaves a single copy blockedBy as it was', () => {
        const only = annotate([copyTiming(0, 0, 1, { status: 'not-reached', startedAt: null, completedAt: null, waitingOn: 'trigger', ...waited(5) }), copyTiming(1, 1, 1)])
        expect(only?.run?.blockedBy).toBe('not reached (trigger)')
        expect(only?.copies).toHaveLength(1)
    })
})

describe('sourceSpan', () => {
    const END = 600
    const repeated = (overrides: Partial<StepTiming>[]) => overrides.map((o, i) => copyTiming(i, 0, i + 1, o))

    it('equals stepSpan for an unrepeated step', () => {
        const steps = [timing(0, { startedAt: 5, completedAt: 9 }), timing(1, { startedAt: 40, completedAt: 90 })]
        expect(sourceSpan(steps, 1, END)).toEqual(stepSpan(steps[1], END))
        expect(sourceSpan(steps, 1, END)).toEqual({ from: 40, to: 90 })
    })

    it('spans from the first started copy to the last started copy whichever copy runStep names', () => {
        const steps = repeated([{ startedAt: 10, completedAt: 20 }, { startedAt: 30, completedAt: 70 }, { startedAt: 80, completedAt: 100 }])
        expect(sourceSpan(steps, 0, END)).toEqual({ from: 10, to: 100 })
        expect(sourceSpan(steps, 1, END)).toEqual({ from: 10, to: 100 })
    })

    it('ends at the run end for a later in-progress copy', () => {
        const steps = repeated([{ startedAt: 10, completedAt: 20 }, { status: 'in-progress', startedAt: 30, completedAt: null }])
        expect(sourceSpan(steps, 0, END)).toEqual({ from: 10, to: END })
    })

    it('ignores an unstarted trailing copy and other sources', () => {
        const steps = [
            ...repeated([{ startedAt: 10, completedAt: 20 }, { status: 'waiting', startedAt: null, completedAt: null }]),
            copyTiming(2, 1, 1, { startedAt: 300, completedAt: 400 }),
        ]
        expect(sourceSpan(steps, 0, END)).toEqual({ from: 10, to: 20 })
    })

    it('is null when no copy started or runStep names no step', () => {
        const steps = repeated([{ status: 'waiting', startedAt: null, completedAt: null }, { status: 'not-reached', startedAt: null, completedAt: null }])
        expect(sourceSpan(steps, 0, END)).toBeNull()
        expect(sourceSpan([timing(0)], 5, END)).toBeNull()
        expect(sourceSpan([timing(0)], -1, END)).toBeNull()
    })
})

describe('copiesDetailText', () => {
    it('is empty for zero or one copy', () => {
        expect(copiesDetailText([])).toBe('')
        expect(copiesDetailText([stepRunOf()])).toBe('')
    })

    it('gives one numbered line per copy, and says still waiting for a waiting or not-reached copy', () => {
        const lines = copiesDetailText([
            stepRunOf({ startedAt: 65, completedAt: 125, waitSeconds: 10, status: 'completed' }),
            stepRunOf({ status: 'waiting', startedAt: null, completedAt: null, waitSeconds: 33 }),
            stepRunOf({ status: 'not-reached', startedAt: null, completedAt: null, waitSeconds: 44 }),
        ]).split('\n')
        expect(lines).toEqual(['Copy 1: started 1:05, finished 2:05, waited 0:10', 'Copy 2: started –, finished –, still waiting', 'Copy 3: started –, finished –, still waiting'])
    })
})

describe('gutterDetailText', () => {
    const one = stepRunOf({ waitSeconds: 5, blockedBy: 'wood 0:05' })
    const two = stepRunOf({ startedAt: 30, completedAt: 40 })

    it('is empty without a run', () => {
        expect(gutterDetailText({ kind: 'building', run: null, copies: [] })).toBe('')
    })

    it('equals the combined detail alone, with no line break, for an unrepeated annotation', () => {
        expect(gutterDetailText({ kind: 'building', run: one, copies: [one] })).toBe(annotationDetailText(one))
    })

    it('follows the combined detail with one line per copy for a repeated annotation', () => {
        const combined = combineRuns([one, two])
        expect(gutterDetailText({ kind: 'building', run: combined, copies: [one, two] })).toBe(`${annotationDetailText(combined)}\n${copiesDetailText([one, two])}`)
    })
})

describe('alignment with a repeated source', () => {
    const steps = [copyTiming(0, 0, 1, { startedAt: 1 }), copyTiming(1, 0, 2, { startedAt: 11 }), copyTiming(2, 1, 1, { startedAt: 21 })]
    const shownText = ['start -> sheep', A, B].join('\n')
    const input = (overrides: Partial<AnnotationInput>) => ({
        ...runInput({ shown: { text: shownText, durationSeconds: 600, selected: 'English 1 TC' }, live: { text: 'edit', duration: '600', selected: 'English 1 TC' }, liveSteps: stepsOf(A, B), ...overrides }, steps),
    })

    it('aligns both live steps to their sources through alignSteps and groups the copies', () => {
        const out = buildAnnotations(input({}))
        expect(out?.steps.map((s) => s.copies.length)).toEqual([2, 1])
        expect(out?.steps.map((s) => s.run?.runStep)).toEqual([0, 2])
        expect(out?.steps[0].run?.startedAt).toBe(1)
    })

    it('gives a step that does not align no run and no copies while the others keep theirs', () => {
        const out = buildAnnotations(input({ liveSteps: stepsOf(A, X) }))
        expect(out?.steps.map((s) => s.copies.length)).toEqual([2, 0])
        expect(out?.steps[1].run).toBeNull()
        expect(out?.steps[0].run?.runStep).toBe(0)
    })

    it('compares the shown step count with the source count, not result.steps.length', () => {
        const three = ['start -> sheep', A, B, C].join('\n')
        const out = buildAnnotations(input({ shown: { text: three, durationSeconds: 600, selected: 'English 1 TC' }, liveSteps: stepsOf(A, B, C) }))
        expect(three.split('\n').length - 1).toBe(steps.length)
        expect(out?.steps.map((s) => s.run)).toEqual([null, null, null])
    })

    it('gives live step 1 the run of source 1 on the identity path, not result.steps[1]', () => {
        const out = buildAnnotations(input({ live: { text: shownText, duration: '600', selected: 'English 1 TC' } }))
        expect(out?.steps.map((s) => s.run?.runStep)).toEqual([0, 2])
        expect(out?.steps.map((s) => s.copies.length)).toEqual([2, 1])
    })

    it('gives a repeated source copies equal to its copy count and a run equal to the combined run', () => {
        const timings = [
            copyTiming(0, 0, 1, { startedAt: 1, completedAt: 6 }),
            copyTiming(1, 0, 2, { startedAt: 11, completedAt: 15 }),
            copyTiming(2, 1, 1, { startedAt: 21, completedAt: 25 }),
        ]
        const out = buildAnnotations(runInput({ shown: { text: shownText, durationSeconds: 600, selected: 'English 1 TC' }, live: { text: shownText, duration: '600', selected: 'English 1 TC' }, liveSteps: stepsOf(A, B) }, timings))
        const first = out?.steps[0]
        expect(first?.copies).toHaveLength(2)
        expect(first?.run).toMatchObject({ runStep: 0, startedAt: 1, completedAt: 15 })
    })
})
