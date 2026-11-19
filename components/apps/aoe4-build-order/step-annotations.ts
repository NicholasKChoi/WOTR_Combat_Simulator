import type { SimulateResponse } from '../../../lib/aoe4-build-order/api'
import { VILLAGER_ID } from '../../../lib/aoe4-build-order/engine-common'
import type { BuildStep, StepTiming, StepWait } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { waitDetailText } from '../../../lib/aoe4-build-order/wait-detail'
import { formatBuildStep, parseBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import type { LiveInput, ShownInput } from './auto-run'

const EN_DASH = '–'

export const LONG_WAIT_SECONDS = 60

export const formatStepTime = (seconds: number | null): string => (seconds === null ? EN_DASH : formatMinSec(seconds))

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
    waits: { text: string; seconds: number }[]
    waitingForText: string | null
    waitingOn: StepWait | null
    blockedBy: string
    longWait: boolean
    flagged: boolean
}

export const finishedText = (run: Pick<StepRun, 'status' | 'completedAt'>): string =>
    run.status === 'in-progress' ? 'ongoing' : formatStepTime(run.completedAt)

export const STILL_WAITING = 'still waiting'

export const waitedText = (run: Pick<StepRun, 'status' | 'waitSeconds'>): string =>
    run.status === 'waiting' || run.status === 'not-reached' ? STILL_WAITING : formatMinSec(run.waitSeconds)

export const annotationDetailText = (run: Pick<StepRun, 'status' | 'waitSeconds' | 'blockedBy'>): string => {
    const waited = waitedText(run)
    return `${waited === STILL_WAITING ? 'Still waiting' : `Waited ${waited}`}. Blocked by: ${run.blockedBy === '' ? 'nothing' : run.blockedBy}`
}

function causeText(status: StepTiming['status'], waitingOn: StepWait | null, waitingForText: string | null): string | null {
    if (status === 'not-reached') return `not reached (${waitingOn})`
    if (status === 'waiting') return waitingForText === null ? `still waiting on ${waitingOn}` : `still waiting for ${waitingForText}`
    return null
}

const waitListText = (waits: StepRun['waits']): string[] => waits.map((w) => `${w.text} ${formatMinSec(w.seconds)}`)

function blockedByText(timing: StepTiming, waits: StepRun['waits'], waitingForText: string | null): string {
    const cause = causeText(timing.status, timing.waitingOn, waitingForText)
    if (timing.status === 'not-reached') return cause ?? ''
    return [...waitListText(waits), ...(cause === null ? [] : [cause])].join(', ')
}

function stepRun(timing: StepTiming): StepRun {
    const waits = timing.waitDetails.filter((w) => w.seconds > 0).map((w) => ({ text: waitDetailText(w.detail), seconds: w.seconds }))
    const waitingForText = timing.waitingFor === null ? null : waitDetailText(timing.waitingFor)
    return {
        runStep: timing.step,
        status: timing.status,
        startedAt: timing.startedAt,
        completedAt: timing.completedAt,
        waitSeconds: timing.waitSeconds,
        waits,
        waitingForText,
        waitingOn: timing.waitingOn,
        blockedBy: blockedByText(timing, waits, waitingForText),
        longWait: timing.waitSeconds >= LONG_WAIT_SECONDS,
        flagged: timing.status === 'waiting' || timing.status === 'not-reached',
    }
}

export function groupBySource(steps: readonly StepTiming[]): StepTiming[][] {
    const groups: StepTiming[][] = []
    for (const timing of steps) (groups[timing.source] ??= []).push(timing)
    return groups.map((copies) => copies.sort((a, b) => a.copy - b.copy))
}

const ADVANCE: Record<StepTiming['status'], number> = { 'not-reached': 0, waiting: 1, 'in-progress': 2, completed: 3 }

function mergeWaits(copies: readonly StepRun[]): StepRun['waits'] {
    const merged = new Map<string, number>()
    for (const copy of copies) for (const w of copy.waits) merged.set(w.text, (merged.get(w.text) ?? 0) + w.seconds)
    return [...merged].map(([text, seconds]) => ({ text, seconds }))
}

export function combineRuns(copies: readonly StepRun[]): StepRun {
    if (copies.length === 1) return copies[0]
    const status = copies.reduce((least, c) => (ADVANCE[c.status] < ADVANCE[least] ? c.status : least), copies[0].status)
    const started = copies.flatMap((c) => (c.startedAt === null ? [] : [c.startedAt]))
    const completed = copies.flatMap((c) => (c.completedAt === null ? [] : [c.completedAt]))
    const waitSeconds = copies.reduce((sum, c) => sum + c.waitSeconds, 0)
    const waits = mergeWaits(copies)
    const cause = status === 'waiting' || status === 'not-reached' ? copies.find((c) => c.status === status) : undefined
    const causeLine = cause === undefined ? null : causeText(status, cause.waitingOn, cause.waitingForText)
    return {
        runStep: copies[0].runStep,
        status,
        startedAt: started.length === 0 ? null : Math.min(...started),
        completedAt: status === 'completed' && completed.length > 0 ? Math.max(...completed) : null,
        waitSeconds,
        waits,
        waitingForText: cause?.waitingForText ?? null,
        waitingOn: cause?.waitingOn ?? null,
        blockedBy: [...waitListText(waits), ...(causeLine === null ? [] : [causeLine])].join(', '),
        longWait: waitSeconds >= LONG_WAIT_SECONDS,
        flagged: status === 'waiting' || status === 'not-reached',
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

export function sourceSpan(steps: readonly StepTiming[], runStep: number, end: number): StepSpan | null {
    const target = steps[runStep]
    if (target === undefined) return null
    const spans = steps.filter((t) => t.source === target.source).flatMap((t) => stepSpan(t, end) ?? [])
    if (spans.length === 0) return null
    return { from: Math.min(...spans.map((s) => s.from)), to: Math.max(...spans.map((s) => s.to)) }
}

export const copyLineText = (run: StepRun, copy: number): string => {
    const waited = waitedText(run)
    return `Copy ${copy}: started ${formatStepTime(run.startedAt)}, finished ${finishedText(run)}, ${waited === STILL_WAITING ? waited : `waited ${waited}`}`
}

export const copiesDetailText = (copies: readonly StepRun[]): string => (copies.length <= 1 ? '' : copies.map((c, i) => copyLineText(c, i + 1)).join('\n'))

export interface StepAnnotation {
    kind: StepKind
    run: StepRun | null
    copies: StepRun[]
}

export function gutterDetailText(annotation: StepAnnotation): string {
    if (annotation.run === null) return ''
    const detail = annotationDetailText(annotation.run)
    return annotation.copies.length >= 2 ? `${detail}\n${copiesDetailText(annotation.copies)}` : detail
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

function alignedRuns(input: AnnotationInput, groups: readonly StepTiming[][], shown: ShownInput): (number | null)[] {
    const none = input.liveSteps.map(() => null)
    if (input.live.text === shown.text) return input.liveSteps.map((_, i) => i)
    if (input.live.selected !== shown.selected) return none
    const parsed = parseBuildOrderText(shown.text)
    if (!parsed.ok || parsed.order.steps.length !== groups.length) return none
    return alignSteps(parsed.order.steps, input.liveSteps)
}

export function buildAnnotations(input: AnnotationInput): BuildAnnotations | null {
    const { result, shown } = input
    if (result === null || shown === null) return null
    const groups = groupBySource(result.steps)
    const runs = alignedRuns(input, groups, shown)
    return {
        stale: input.stale,
        steps: input.liveSteps.map((step, i) => {
            const group = runs[i] === null ? undefined : groups[runs[i]]
            const copies = group === undefined ? [] : group.map(stepRun)
            return { kind: stepKind(step, input.landmarks), run: copies.length === 0 ? null : combineRuns(copies), copies }
        }),
    }
}

export function annotationsByLine(annotations: BuildAnnotations, stepLines: readonly number[], lineCount: number): (StepAnnotation | null)[] {
    const byLine: (StepAnnotation | null)[] = Array.from({ length: lineCount }, () => null)
    stepLines.forEach((line, i) => {
        if (line >= 1 && line <= lineCount) byLine[line - 1] = annotations.steps[i] ?? null
    })
    return byLine
}
