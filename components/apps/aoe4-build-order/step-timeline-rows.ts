import type { StepTiming, StepWait } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'

const BREAKDOWN_ORDER = ['resources', 'villagers', 'population', 'prerequisite'] as const

const EN_DASH = '–'

export const LONG_WAIT_SECONDS = 60

export const formatStepTime = (seconds: number | null): string => (seconds === null ? EN_DASH : formatMinSec(seconds))

export const formatWaitBreakdown = (breakdown: TimelineRow['waitBreakdown']): string =>
    breakdown.map((w) => `${w.reason} ${formatMinSec(w.seconds)}`).join(', ')

export interface TimelineRow {
    step: number
    label: string
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

export function timelineRows(steps: StepTiming[], text: string): TimelineRow[] {
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
