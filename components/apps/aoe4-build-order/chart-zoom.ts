import type { ChartRow } from './chart-rows'

export interface TimeWindow {
    from: number
    to: number
}

export const MIN_ZOOM_SECONDS = 30

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function usableWindow(from: number, to: number, end: number): TimeWindow | null {
    if (to - from < MIN_ZOOM_SECONDS || (from === 0 && to === end)) return null
    return { from, to }
}

export function zoomTo(a: number, b: number, end: number): TimeWindow | null {
    return usableWindow(clamp(Math.round(Math.min(a, b)), 0, end), clamp(Math.round(Math.max(a, b)), 0, end), end)
}

export function clampWindow(window: TimeWindow | null, end: number): TimeWindow | null {
    return window && usableWindow(window.from, Math.min(window.to, end), end)
}

export function panWindow(window: TimeWindow, deltaSeconds: number, end: number): TimeWindow {
    const span = window.to - window.from
    const from = clamp(Math.round(window.from + deltaSeconds), 0, end - span)
    return { from, to: from + span }
}

export function panStepSeconds(window: TimeWindow): number {
    return Math.max(1, Math.round((window.to - window.from) / 2))
}

export function timeAtX(x: number, plot: { left: number; width: number }, shown: TimeWindow): number {
    if (plot.width <= 0) return shown.from
    return clamp(shown.from + ((x - plot.left) / plot.width) * (shown.to - shown.from), shown.from, shown.to)
}

export function rowsInWindow(rows: ChartRow[], shown: TimeWindow): ChartRow[] {
    const onFrom = rows.some((row) => row.t === shown.from)
    const onTo = rows.some((row) => row.t === shown.to)
    const before = onFrom ? -1 : rows.reduce((last, row, i) => (row.t < shown.from ? i : last), -1)
    const after = onTo ? -1 : rows.findIndex((row) => row.t > shown.to)
    return rows.filter((row, i) => (row.t >= shown.from && row.t <= shown.to) || i === before || i === after)
}
