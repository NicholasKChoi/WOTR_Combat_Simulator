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

type ChartRow = { t: number } & Record<string, number>

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

export function isLineHidden(hidden: ReadonlySet<string>, lineKey: string): boolean {
    return hidden.has(lineKey.startsWith(PINNED_PREFIX) ? lineKey.slice(PINNED_PREFIX.length) : lineKey)
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
