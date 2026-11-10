import type { SimulateRequest, SimulateResponse } from '../../../lib/aoe4-build-order/api'
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import { SIM_INPUT_BOUNDS, outOfRange, type BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { textToBuildOrder, type TextToBuildResult } from '../../../lib/aoe4-build-order/text-to-build'
import { readRejection, simulationFailureMessage } from './simulate-client'

export const AUTO_RUN_DEBOUNCE_MS = 500

export type AutoRunStatus = 'loading' | 'running' | 'current' | 'updating' | 'invalid' | 'rejected' | 'failed'

export interface LiveInput {
    text: string
    duration: string
    selected: string
}

export interface ShownInput {
    text: string
    durationSeconds: number
    selected: string
}

export interface AutoRunDeps {
    catalog: BuildOrderCatalog
    post(request: SimulateRequest, signal: AbortSignal): Promise<Response>
}

export interface AutoRunState {
    status: AutoRunStatus
    settled: LiveInput
    conversion: TextToBuildResult
    durationError: string | null
    request: SimulateRequest | null
    result: SimulateResponse | null
    resultRequestKey: string | null
    shown: ShownInput | null
    serverIssues: BuildOrderIssue[]
    omittedIssues: number
    errorMessage: string | null
}

export interface AutoRunController {
    input(live: LiveInput): void
    flush(live?: LiveInput): void
    release(): void
    retry(): void
    dispose(): void
    getState(): AutoRunState
}

export function durationError(duration: string): string | null {
    if (duration.trim() === '') return 'Duration is required.'
    const seconds = Number(duration)
    if (Number.isInteger(seconds) && outOfRange(seconds, 'durationSeconds') === undefined) return null
    const { min, max } = SIM_INPUT_BOUNDS.durationSeconds
    return `Duration must be a whole number of seconds from ${min} to ${max}.`
}

export function resultsStale(state: Pick<AutoRunState, 'status' | 'result' | 'shown'>, live: LiveInput): boolean {
    const { status, result, shown } = state
    if (result === null) return false
    if (status === 'invalid' || status === 'rejected' || status === 'failed') return true
    return shown === null || live.text !== shown.text || live.duration.trim() === '' || Number(live.duration) !== shown.durationSeconds
}

export function requestKey(request: SimulateRequest): string {
    return JSON.stringify(request)
}

type SettledFields = Pick<AutoRunState, 'settled' | 'conversion' | 'durationError' | 'request'>

type Outcome =
    | { kind: 'result'; result: SimulateResponse }
    | { kind: 'rejected'; issues: BuildOrderIssue[]; omittedIssues: number }
    | { kind: 'failed'; status: number | null }

const NO_ISSUES: BuildOrderIssue[] = []
const CLEARED = { serverIssues: NO_ISSUES, omittedIssues: 0, errorMessage: null } as const

function settledFields(settled: LiveInput, catalog: BuildOrderCatalog): SettledFields {
    const conversion = textToBuildOrder(settled.text, catalog)
    const error = durationError(settled.duration)
    const request = conversion.ok && error === null ? { buildOrder: conversion.order, inputs: { durationSeconds: Number(settled.duration) } } : null
    return { settled, conversion, durationError: error, request }
}

export function sameInput(a: LiveInput, b: LiveInput): boolean {
    return a.text === b.text && a.duration === b.duration && a.selected === b.selected
}

function settledOf({ settled, conversion, durationError, request }: AutoRunState): SettledFields {
    return { settled, conversion, durationError, request }
}

function sameShown(a: ShownInput, b: ShownInput): boolean {
    return a.text === b.text && a.durationSeconds === b.durationSeconds && a.selected === b.selected
}

function shownInput(settled: LiveInput): ShownInput {
    return { text: settled.text, durationSeconds: Number(settled.duration), selected: settled.selected }
}

async function readOutcome(response: Response): Promise<Outcome> {
    if (response.ok) return { kind: 'result', result: await response.json() }
    if (response.status === 400) {
        const rejection = await readRejection(response)
        if (rejection !== null) return { kind: 'rejected', ...rejection }
    }
    return { kind: 'failed', status: response.status }
}

export function createAutoRunController(deps: AutoRunDeps, initial: LiveInput, held: boolean, onChange: (state: AutoRunState) => void): AutoRunController {
    let live = initial
    let isHeld = held
    let disposed = false
    let notify = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let inflight: { key: string; abort: AbortController } | null = null
    let seq = 0
    let rejectedKey: string | null = null
    let state: AutoRunState = {
        ...settledFields(initial, deps.catalog),
        status: 'loading',
        result: null,
        resultRequestKey: null,
        shown: null,
        ...CLEARED,
    }

    function update(patch: Partial<AutoRunState>): void {
        const keys = Object.keys(patch) as (keyof AutoRunState)[]
        if (keys.every((key) => Object.is(patch[key], state[key]))) return
        state = { ...state, ...patch }
        if (notify) onChange(state)
    }

    function clearTimer(): void {
        if (timer === null) return
        clearTimeout(timer)
        timer = null
    }

    function abortInflight(): void {
        if (inflight === null) return
        inflight.abort.abort()
        inflight = null
        seq += 1
    }

    function apply(outcome: Outcome, key: string, captured: ShownInput): void {
        if (outcome.kind === 'rejected') {
            rejectedKey = key
            update({ status: 'rejected', serverIssues: outcome.issues, omittedIssues: outcome.omittedIssues, errorMessage: null })
        } else if (outcome.kind === 'result') {
            update({ ...CLEARED, status: 'current', result: outcome.result, resultRequestKey: key, shown: captured })
        } else {
            update({ ...CLEARED, status: 'failed', errorMessage: simulationFailureMessage(outcome.status) })
        }
    }

    // Staleness is by seq, not by AbortError: a post that ignores its signal still resolves.
    async function send(request: SimulateRequest, key: string, captured: ShownInput, signal: AbortSignal, mine: number): Promise<void> {
        const isLatest = () => seq === mine
        let outcome: Outcome
        try {
            const response = await deps.post(request, signal)
            if (!isLatest()) return
            outcome = await readOutcome(response)
        } catch {
            outcome = { kind: 'failed', status: null }
        }
        if (!isLatest()) return
        inflight = null
        apply(outcome, key, captured)
    }

    function post(fields: SettledFields, request: SimulateRequest, key: string): void {
        abortInflight()
        rejectedKey = null
        const abort = new AbortController()
        inflight = { key, abort }
        const mine = seq
        update({ ...fields, ...CLEARED, status: state.result === null ? 'running' : 'updating' })
        void send(request, key, shownInput(fields.settled), abort.signal, mine)
    }

    function fire(): void {
        const fields = sameInput(live, state.settled) ? settledOf(state) : settledFields(live, deps.catalog)
        const { request } = fields
        if (request === null) {
            abortInflight()
            rejectedKey = null
            update({ ...fields, ...CLEARED, status: 'invalid' })
            return
        }
        const key = requestKey(request)
        if (inflight?.key === key) {
            update(fields)
        } else if (key === state.resultRequestKey) {
            abortInflight()
            rejectedKey = null
            const shown = shownInput(fields.settled)
            update({ ...fields, ...CLEARED, status: 'current', shown: state.shown !== null && sameShown(state.shown, shown) ? state.shown : shown })
        } else if (key === rejectedKey) {
            abortInflight()
            update({ ...fields, status: 'rejected' })
        } else {
            post(fields, request, key)
        }
    }

    function settleLater(): void {
        clearTimer()
        timer = setTimeout(() => {
            timer = null
            fire()
        }, AUTO_RUN_DEBOUNCE_MS)
    }

    if (!isHeld) fire()
    notify = true

    return {
        input(next) {
            if (disposed) return
            live = next
            if (!isHeld) settleLater()
        },
        flush(next) {
            if (disposed) return
            if (next !== undefined) live = next
            if (isHeld) return
            clearTimer()
            fire()
        },
        release() {
            if (disposed || !isHeld) return
            isHeld = false
            clearTimer()
            fire()
        },
        retry() {
            if (disposed || state.status !== 'failed' || state.request === null) return
            post(settledOf(state), state.request, requestKey(state.request))
        },
        dispose() {
            if (disposed) return
            clearTimer()
            abortInflight()
            disposed = true
        },
        getState: () => state,
    }
}
