export interface ChartSeries {
    key: string
    name: string
    values: number[]
}

export interface PinnedSeries {
    times: number[]
    series: ChartSeries[]
}

export const pinnedKey = (key: string): string => 'pinned:' + key

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

export function toggleHidden(hidden: ReadonlySet<string>, key: string): Set<string> {
    const next = new Set(hidden)
    if (!next.delete(key)) next.add(key)
    return next
}
