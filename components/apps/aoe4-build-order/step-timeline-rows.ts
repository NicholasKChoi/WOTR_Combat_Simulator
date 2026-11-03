import { VILLAGER_ID } from '../../../lib/aoe4-build-order/engine-common'
import type { BuildStep, StepTiming, StepWait } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'

const BREAKDOWN_ORDER = ['resources', 'villagers', 'population', 'prerequisite'] as const

const EN_DASH = '–'

export const LONG_WAIT_SECONDS = 60

export const formatStepTime = (seconds: number | null): string => (seconds === null ? EN_DASH : formatMinSec(seconds))

export const formatWaitBreakdown = (breakdown: TimelineRow['waitBreakdown']): string =>
    breakdown.map((w) => `${w.reason} ${formatMinSec(w.seconds)}`).join(', ')

export const STEP_KINDS = {
    'age-up': 'Age up',
    research: 'Research',
    military: 'Military',
    villager: 'Villager',
    building: 'Building',
    economy: 'Economy',
    other: null,
} as const

export type StepKind = keyof typeof STEP_KINDS

export interface TimelineRow {
    step: number
    label: string
    kind: StepKind
    status: StepTiming['status']
    startedAt: number | null
    completedAt: number | null
    waitSeconds: number
    waitBreakdown: { reason: (typeof BREAKDOWN_ORDER)[number]; seconds: number }[]
    waitingOn: StepWait | null
    blockedBy: string
    longWait: boolean
    flagged: boolean
    reaction: boolean
}

function blockedByText(timing: StepTiming, breakdown: TimelineRow['waitBreakdown']): string {
    if (timing.status === 'not-reached') return `not reached (${timing.waitingOn})`
    const reasons = formatWaitBreakdown(breakdown)
    if (timing.status !== 'waiting') return reasons
    const still = `still waiting on ${timing.waitingOn}`
    return reasons === '' ? still : `${reasons}, ${still}`
}

export function stepKind(step: BuildStep | undefined, landmarks: readonly string[]): StepKind {
    switch (step?.action) {
        case undefined:
            return 'other'
        case 'build':
            return landmarks.includes(step.building) ? 'age-up' : 'building'
        case 'research':
            return 'research'
        case 'produce':
            return step.unit === VILLAGER_ID ? 'villager' : 'military'
        default:
            return 'economy'
    }
}

export function timelineRows(steps: StepTiming[], text: string, landmarks: readonly string[]): TimelineRow[] {
    const parsed = parseBuildOrderText(text)
    const parsedSteps = parsed.ok ? parsed.order.steps : []
    return steps.map((timing) => {
        const parsedStep = parsedSteps[timing.step]
        const waitBreakdown = BREAKDOWN_ORDER.flatMap((reason) => {
            const seconds = timing.waitBreakdown[reason] ?? 0
            return seconds > 0 ? [{ reason, seconds }] : []
        })
        return {
            step: timing.step,
            label: parsedStep === undefined ? `step ${timing.step + 1}` : formatBuildStep(parsedStep),
            kind: stepKind(parsedStep, landmarks),
            status: timing.status,
            startedAt: timing.startedAt,
            completedAt: timing.completedAt,
            waitSeconds: timing.waitSeconds,
            waitBreakdown,
            waitingOn: timing.waitingOn,
            blockedBy: blockedByText(timing, waitBreakdown),
            longWait: timing.waitSeconds >= LONG_WAIT_SECONDS,
            flagged: timing.status === 'waiting' || timing.status === 'not-reached',
            reaction: parsedStep?.reaction === true,
        }
    })
}
