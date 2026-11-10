import type { SimulateResponse } from '../../../lib/aoe4-build-order/api'
import { VILLAGER_ID } from '../../../lib/aoe4-build-order/engine-common'
import type { BuildStep, StepTiming, StepWait } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import type { LiveInput, ShownInput } from './auto-run'

const BREAKDOWN_ORDER = ['resources', 'villagers', 'population', 'prerequisite'] as const

const EN_DASH = '–'

export const LONG_WAIT_SECONDS = 60

export const formatStepTime = (seconds: number | null): string => (seconds === null ? EN_DASH : formatMinSec(seconds))

export const formatWaitBreakdown = (breakdown: StepRun['waitBreakdown']): string =>
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

export interface StepRun {
    runStep: number
    status: StepTiming['status']
    startedAt: number | null
    completedAt: number | null
    waitSeconds: number
    waitBreakdown: { reason: (typeof BREAKDOWN_ORDER)[number]; seconds: number }[]
    waitingOn: StepWait | null
    blockedBy: string
    longWait: boolean
    flagged: boolean
}

export const finishedText = (run: Pick<StepRun, 'status' | 'completedAt'>): string =>
    run.status === 'in-progress' ? 'ongoing' : formatStepTime(run.completedAt)

function blockedByText(timing: StepTiming, breakdown: StepRun['waitBreakdown']): string {
    if (timing.status === 'not-reached') return `not reached (${timing.waitingOn})`
    const reasons = formatWaitBreakdown(breakdown)
    if (timing.status !== 'waiting') return reasons
    const still = `still waiting on ${timing.waitingOn}`
    return reasons === '' ? still : `${reasons}, ${still}`
}

function stepRun(timing: StepTiming): StepRun {
    const waitBreakdown = BREAKDOWN_ORDER.flatMap((reason) => {
        const seconds = timing.waitBreakdown[reason] ?? 0
        return seconds > 0 ? [{ reason, seconds }] : []
    })
    return {
        runStep: timing.step,
        status: timing.status,
        startedAt: timing.startedAt,
        completedAt: timing.completedAt,
        waitSeconds: timing.waitSeconds,
        waitBreakdown,
        waitingOn: timing.waitingOn,
        blockedBy: blockedByText(timing, waitBreakdown),
        longWait: timing.waitSeconds >= LONG_WAIT_SECONDS,
        flagged: timing.status === 'waiting' || timing.status === 'not-reached',
    }
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

export interface StepSpan {
    from: number
    to: number
}

export function stepSpan(timing: StepTiming, end: number): StepSpan | null {
    if (timing.startedAt === null) return null
    const to = timing.status === 'in-progress' ? end : (timing.completedAt ?? end)
    const clamp = (t: number) => Math.min(Math.max(t, 0), end)
    const from = clamp(timing.startedAt)
    return { from, to: Math.max(from, clamp(to)) }
}

export interface StepAnnotation {
    kind: StepKind
    run: StepRun | null
}

export interface BuildAnnotations {
    stale: boolean
    steps: StepAnnotation[]
}

export interface AnnotationInput {
    result: SimulateResponse | null
    shown: ShownInput | null
    live: LiveInput
    liveSteps: readonly BuildStep[]
    landmarks: readonly string[]
    stale: boolean
}

function commonLength(shown: readonly string[], live: readonly string[], fromEnd: boolean, cap: number): number {
    const at = (keys: readonly string[], n: number) => keys[fromEnd ? keys.length - 1 - n : n]
    let n = 0
    while (n < cap && at(shown, n) === at(live, n)) n++
    return n
}

export function alignSteps(shownSteps: readonly BuildStep[], liveSteps: readonly BuildStep[]): (number | null)[] {
    const shown = shownSteps.map(formatBuildStep)
    const live = liveSteps.map(formatBuildStep)
    const shortest = Math.min(shown.length, live.length)
    const prefix = commonLength(shown, live, false, shortest)
    const suffix = commonLength(shown, live, true, shortest - prefix)
    return live.map((_, i) => {
        if (i < prefix) return i
        return i >= live.length - suffix ? i - live.length + shown.length : null
    })
}

function alignedRuns(input: AnnotationInput, result: SimulateResponse, shown: ShownInput): (number | null)[] {
    const none = input.liveSteps.map(() => null)
    if (input.live.text === shown.text) return input.liveSteps.map((_, i) => i)
    if (input.live.selected !== shown.selected) return none
    const parsed = parseBuildOrderText(shown.text)
    if (!parsed.ok || parsed.order.steps.length !== result.steps.length) return none
    return alignSteps(parsed.order.steps, input.liveSteps)
}

export function buildAnnotations(input: AnnotationInput): BuildAnnotations | null {
    const { result, shown } = input
    if (result === null || shown === null) return null
    const runs = alignedRuns(input, result, shown)
    return {
        stale: input.stale,
        steps: input.liveSteps.map((step, i) => {
            const timing = runs[i] === null ? undefined : result.steps[runs[i]]
            return { kind: stepKind(step, input.landmarks), run: timing === undefined ? null : stepRun(timing) }
        }),
    }
}
