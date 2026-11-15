import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { ChartMarker, ChartMarkerKind } from '../../../lib/aoe4-build-order/model'

export interface ChartSeries {
    key: string
    name: string
    values: number[]
}

export interface PinnedSeries {
    times: number[]
    series: ChartSeries[]
}

const PINNED_PREFIX = 'pinned:'

export const pinnedKey = (key: string): string => PINNED_PREFIX + key

const seriesKeyOf = (rowKey: string): string => (rowKey.startsWith(PINNED_PREFIX) ? rowKey.slice(PINNED_PREFIX.length) : rowKey)

export type ChartRow = { t: number } & Record<string, number>

export function toChartRows(times: number[], series: ChartSeries[], pinned?: PinnedSeries): ChartRow[] {
    if (!pinned) {
        return times.map((t, i) => {
            const row: ChartRow = { t }
            for (const s of series) row[s.key] = s.values[i]
            return row
        })
    }
    const rows = new Map<number, ChartRow>()
    for (const t of [...times, ...pinned.times].sort((a, b) => a - b)) {
        if (!rows.has(t)) rows.set(t, { t })
    }
    const fill = (own: number[], list: ChartSeries[], keyOf: (key: string) => string) => {
        own.forEach((t, i) => {
            const row = rows.get(t)!
            for (const s of list) row[keyOf(s.key)] = s.values[i]
        })
    }
    fill(times, series, (key) => key)
    fill(pinned.times, pinned.series, pinnedKey)
    return [...rows.values()]
}

const MAX_LINE_OFFSET = 0.45

// Slot i of n gets i * MAX_LINE_OFFSET / n, so offsets are distinct, never negative and always below half a count.
export function lineOffsets(keys: readonly string[]): Record<string, number> {
    return Object.fromEntries(keys.map((key, i) => [key, (i * MAX_LINE_OFFSET) / keys.length]))
}

// Slot order: visible current series, then visible keys only the pinned run has. Hidden keys take no slot.
function offsetSlotKeys(series: readonly ChartSeries[], pinned: PinnedSeries | undefined, hidden: ReadonlySet<string>): string[] {
    const keys = [...series, ...(pinned?.series ?? [])].map((s) => s.key).filter((key) => !hidden.has(key))
    return [...new Set(keys)]
}

// Rows for integer-valued series whose lines would coincide: each line is lifted by its key's offset, and a pinned
// line takes the offset of the current line with the same key.
export function toOffsetChartRows(times: number[], series: ChartSeries[], pinned: PinnedSeries | undefined, hidden: ReadonlySet<string>): ChartRow[] {
    const offsets = lineOffsets(offsetSlotKeys(series, pinned, hidden))
    const lift = (row: ChartRow): ChartRow => {
        const lifted: ChartRow = { t: row.t }
        for (const [key, value] of Object.entries(row)) {
            if (key === 't') continue
            const offset = offsets[seriesKeyOf(key)]
            lifted[key] = offset === undefined ? value : value + offset
        }
        return lifted
    }
    return toChartRows(times, series, pinned).map(lift)
}

// The offset is below half a count, so rounding a lifted value gives back the integer count.
export const trueCount = (row: ChartRow, key: string): number => Math.round(row[key])

const MAX_Y_TICK_STEPS = 5

export interface WholeNumberAxis {
    domain: [number, number]
    ticks: number[]
}

// The top is the smallest whole number at or above the highest visible drawn value (at least 1). Ticks are whole
// multiples of a step chosen so there are at most MAX_Y_TICK_STEPS steps; the top itself may fall between ticks.
export function wholeNumberAxis(rows: readonly ChartRow[], hidden: ReadonlySet<string>): WholeNumberAxis {
    const visible = rows.flatMap((row) =>
        Object.entries(row).filter(([key, value]) => key !== 't' && Number.isFinite(value) && !hidden.has(seriesKeyOf(key))),
    )
    const top = Math.max(1, Math.ceil(Math.max(0, ...visible.map(([, value]) => value))))
    const step = Math.ceil(top / MAX_Y_TICK_STEPS)
    const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)
    return { domain: [0, top], ticks }
}

export const PALETTE: readonly string[] = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#393b79', '#e6550d', '#31a354', '#756bb1', '#843c39',
    '#637939', '#ad494a',
]

export function seriesColor(index: number): string {
    return PALETTE[index % PALETTE.length]
}

// A pinned series keeps the colour of the current series with the same key, else follows the current series by pinned index.
export function pinnedColor(series: readonly ChartSeries[], key: string, pinnedIndex: number): string {
    const current = series.findIndex((c) => c.key === key)
    return seriesColor(current >= 0 ? current : series.length + pinnedIndex)
}

export interface LegendItem {
    key: string
    name: string
    color: string
    lines: 'current' | 'pinned' | 'both'
}

export function legendItems(series: readonly ChartSeries[], pinned?: PinnedSeries): LegendItem[] {
    const pinnedSeries = pinned?.series ?? []
    const items = series.map((s, i): LegendItem => ({
        key: s.key,
        name: s.name,
        color: seriesColor(i),
        lines: pinnedSeries.some((p) => p.key === s.key) ? 'both' : 'current',
    }))
    const pinnedOnly = pinnedSeries.flatMap((s, i): LegendItem[] =>
        series.some((c) => c.key === s.key) ? [] : [{ key: s.key, name: s.name, color: pinnedColor(series, s.key, i), lines: 'pinned' }],
    )
    return [...items, ...pinnedOnly]
}

export function isLineHidden(hidden: ReadonlySet<string>, seriesKey: string): boolean {
    return hidden.has(seriesKey)
}

export function toggleHidden(hidden: ReadonlySet<string>, key: string): Set<string> {
    const next = new Set(hidden)
    if (!next.delete(key)) next.add(key)
    return next
}

export const MARKER_COLORS: Readonly<Record<ChartMarkerKind, string>> = {
    'age-up': '#b8860b',
    economy: '#008080',
    'unit-tier': '#c43bb0',
    blacksmith: '#5f7d8c',
    other: '#6b6bd6',
}

export const MARKER_KIND_LABELS: Readonly<Record<ChartMarkerKind, string>> = {
    'age-up': 'Age-up',
    economy: 'Economy',
    'unit-tier': 'Unit tier',
    blacksmith: 'Blacksmith',
    other: 'Other',
}

export const markerLabel = (marker: ChartMarker): string => `${marker.label} ${formatMinSec(marker.at)}`

// Rounds to at most 1 decimal without a trailing zero; a non-number (a missing value) passes through.
export function formatChartValue<T>(value: T): T | string {
    return typeof value === 'number' ? String(Math.round(value * 10) / 10) : value
}
