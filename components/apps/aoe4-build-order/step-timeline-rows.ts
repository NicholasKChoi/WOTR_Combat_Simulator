import type { StepTiming, StepWait } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'

const BREAKDOWN_ORDER = ['resources', 'villagers', 'population', 'prerequisite'] as const

const EN_DASH = '–'

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
    flagged: boolean
    reaction: boolean
}

export function timelineRows(steps: StepTiming[], text: string): TimelineRow[] {
    const parsed = parseBuildOrderText(text)
    const parsedSteps = parsed.ok ? parsed.order.steps : []
    return steps.map((timing) => {
        const parsedStep = parsedSteps[timing.step]
        return {
            step: timing.step,
            label: parsedStep === undefined ? `step ${timing.step + 1}` : formatBuildStep(parsedStep),
            status: timing.status,
            startedAt: timing.startedAt,
            completedAt: timing.completedAt,
            waitSeconds: timing.waitSeconds,
            waitBreakdown: BREAKDOWN_ORDER.flatMap((reason) => {
                const seconds = timing.waitBreakdown[reason] ?? 0
                return seconds > 0 ? [{ reason, seconds }] : []
            }),
            waitingOn: timing.waitingOn,
            flagged: timing.status === 'waiting' || timing.status === 'not-reached',
            reaction: parsedStep?.reaction === true,
        }
    })
}
