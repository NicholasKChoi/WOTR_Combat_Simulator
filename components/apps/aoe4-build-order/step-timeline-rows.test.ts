import { describe, expect, it } from 'vitest'
import type { StepTiming } from '../../../lib/aoe4-build-order/model'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { formatStepTime, formatWaitBreakdown, stepSpan, timelineRows, type StepKind } from './step-timeline-rows'

const TEXT = [
    'start -> sheep',
    'produce villager from capital-town-center -> sheep',
    'whenever gold runs out move all gold to gold#2',
].join('\n')

const LANDMARKS = ['kings-palace']

const rowsOf = (steps: StepTiming[], text: string) => timelineRows(steps, text, LANDMARKS)

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

describe('timelineRows', () => {
    it('labels each row with the formatted parsed step and marks reactions', () => {
        const parsed = parseBuildOrderText(TEXT)
        if (!parsed.ok) throw new Error('fixture must parse')
        const rows = rowsOf([timing(0), timing(1, { status: 'not-reached', waitingOn: 'trigger' })], TEXT)
        expect(rows.map((r) => r.label)).toEqual(parsed.order.steps.slice(0, 2).map(formatBuildStep))
        expect(rows.map((r) => r.reaction)).toEqual([false, true])
        expect(rows[1].label).toMatch(/^whenever /)
    })

    it('flags only waiting and not-reached rows and passes waitingOn through', () => {
        const statuses: StepTiming['status'][] = ['completed', 'in-progress', 'waiting', 'not-reached']
        const rows = rowsOf(
            statuses.map((status, i) => timing(i % 2, { status, waitingOn: status === 'waiting' ? 'prerequisite' : null })),
            TEXT
        )
        expect(rows.map((r) => r.flagged)).toEqual([false, false, true, true])
        expect(rows.map((r) => r.waitingOn)).toEqual([null, null, 'prerequisite', null])
    })

    it('lists non-zero wait reasons in the fixed order', () => {
        const [row] = rowsOf(
            [timing(0, { waitBreakdown: { prerequisite: 4, population: 0, resources: 2, villagers: 3 } })],
            TEXT
        )
        expect(row.waitBreakdown).toEqual([
            { reason: 'resources', seconds: 2 },
            { reason: 'villagers', seconds: 3 },
            { reason: 'prerequisite', seconds: 4 },
        ])
    })

    it.each([
        ['completed', { prerequisite: 4, resources: 2, villagers: 3 }, null, 'resources 0:02, villagers 0:03, prerequisite 0:04'],
        ['completed', {}, null, ''],
        ['in-progress', { villagers: 3 }, null, 'villagers 0:03'],
        ['waiting', { resources: 2 }, 'prerequisite', 'resources 0:02, still waiting on prerequisite'],
        ['waiting', {}, 'resources', 'still waiting on resources'],
        ['not-reached', {}, 'trigger', 'not reached (trigger)'],
        ['not-reached', {}, 'earlier-step', 'not reached (earlier-step)'],
    ] as const)('blockedBy for a %s row with breakdown %j and waitingOn %s is %j', (status, waitBreakdown, waitingOn, expected) => {
        const [row] = rowsOf([timing(0, { status, waitBreakdown, waitingOn })], TEXT)
        expect(row.blockedBy).toBe(expected)
    })

    it('highlights a long wait from exactly 60 seconds', () => {
        const rows = rowsOf([59.9, 60, 61].map((waitSeconds) => timing(0, { waitSeconds })), TEXT)
        expect(rows.map((r) => r.longWait)).toEqual([false, true, true])
    })

    it('falls back to a 1-based step label for unparsable text or an index past the steps', () => {
        expect(rowsOf([timing(0), timing(1)], 'start -> fly').map((r) => r.label)).toEqual(['step 1', 'step 2'])
        const rows = rowsOf([timing(7)], TEXT)
        expect(rows[0].label).toBe('step 8')
        expect(rows[0].reaction).toBe(false)
    })
})

describe('timelineRows kind', () => {
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
        const text = `start -> sheep\n${line}`
        expect(rowsOf([timing(0)], text)[0].kind).toBe(kind)
    })

    it('maps a step missing from the parsed text to other', () => {
        expect(rowsOf([timing(7)], TEXT)[0].kind).toBe('other')
    })

    it('reads the kind of the step each timing points at', () => {
        const text = ['start -> sheep', 'build kings-palace from wood', 'research wheelbarrow'].join('\n')
        expect(rowsOf([timing(1), timing(0)], text).map((r) => r.kind)).toEqual(['research', 'age-up'])
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
        const [row] = rowsOf([timing(0, overrides)], TEXT)
        expect(stepSpan(row, END)).toEqual(expected)
    })
})
