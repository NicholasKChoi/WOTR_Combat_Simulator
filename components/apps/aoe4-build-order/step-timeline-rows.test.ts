import { describe, expect, it } from 'vitest'
import type { StepTiming } from '../../../lib/aoe4-build-order/model'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { formatStepTime, formatWaitBreakdown, timelineRows } from './step-timeline-rows'

const TEXT = [
    'start -> sheep',
    'produce villager from capital-town-center -> sheep',
    'whenever gold runs out move all gold to gold#2',
].join('\n')

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
        const rows = timelineRows([timing(0), timing(1, { status: 'not-reached', waitingOn: 'trigger' })], TEXT)
        expect(rows.map((r) => r.label)).toEqual(parsed.order.steps.slice(0, 2).map(formatBuildStep))
        expect(rows.map((r) => r.reaction)).toEqual([false, true])
        expect(rows[1].label).toMatch(/^whenever /)
    })

    it('flags only waiting and not-reached rows and passes waitingOn through', () => {
        const statuses: StepTiming['status'][] = ['completed', 'in-progress', 'waiting', 'not-reached']
        const rows = timelineRows(
            statuses.map((status, i) => timing(i % 2, { status, waitingOn: status === 'waiting' ? 'prerequisite' : null })),
            TEXT
        )
        expect(rows.map((r) => r.flagged)).toEqual([false, false, true, true])
        expect(rows.map((r) => r.waitingOn)).toEqual([null, null, 'prerequisite', null])
    })

    it('lists non-zero wait reasons in the fixed order', () => {
        const [row] = timelineRows(
            [timing(0, { waitBreakdown: { prerequisite: 4, population: 0, resources: 2, villagers: 3 } })],
            TEXT
        )
        expect(row.waitBreakdown).toEqual([
            { reason: 'resources', seconds: 2 },
            { reason: 'villagers', seconds: 3 },
            { reason: 'prerequisite', seconds: 4 },
        ])
    })

    it('falls back to a 1-based step label for unparsable text or an index past the steps', () => {
        expect(timelineRows([timing(0), timing(1)], 'start -> fly').map((r) => r.label)).toEqual(['step 1', 'step 2'])
        const rows = timelineRows([timing(7)], TEXT)
        expect(rows[0].label).toBe('step 8')
        expect(rows[0].reaction).toBe(false)
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
