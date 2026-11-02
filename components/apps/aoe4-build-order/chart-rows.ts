export interface ChartSeries {
    key: string
    name: string
    values: number[]
}

export function toChartRows(times: number[], series: ChartSeries[]): Array<{ t: number } & Record<string, number>> {
    return times.map((t, i) => {
        const row: { t: number } & Record<string, number> = { t }
        for (const s of series) row[s.key] = s.values[i]
        return row
    })
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
