import { CHART_MARKER_KINDS, type ChartMarker } from '../../../lib/aoe4-build-order/model'
import { type ChartSeries, MARKER_COLORS, MARKER_KIND_LABELS, type PinnedSeries, pinnedKey, seriesColor } from './chart-rows'

interface LegendItem {
    key: string
    name: string
    color: string
    pinned: boolean
}

export function legendItems(series: readonly ChartSeries[], pinned?: PinnedSeries): LegendItem[] {
    const pinnedSeries = pinned?.series ?? []
    const pinnedItem = (s: ChartSeries, i: number): LegendItem => {
        const current = series.findIndex((c) => c.key === s.key)
        return { key: pinnedKey(s.key), name: `${s.name} (pinned)`, color: seriesColor(current >= 0 ? current : series.length + i), pinned: true }
    }
    const items = series.flatMap((s, i): LegendItem[] => {
        const pinnedIndex = pinnedSeries.findIndex((p) => p.key === s.key)
        const current = { key: s.key, name: s.name, color: seriesColor(i), pinned: false }
        return pinnedIndex >= 0 ? [current, pinnedItem(pinnedSeries[pinnedIndex], pinnedIndex)] : [current]
    })
    const pinnedOnly = pinnedSeries.flatMap((s, i) => (series.some((c) => c.key === s.key) ? [] : [pinnedItem(s, i)]))
    return [...items, ...pinnedOnly]
}

interface SeriesLegendProps {
    series: readonly ChartSeries[]
    pinned?: PinnedSeries
    hidden: ReadonlySet<string>
    onToggle(key: string): void
}

export function SeriesLegend({ series, pinned, hidden, onToggle }: SeriesLegendProps) {
    return (
        <div className="small mb-2" data-testid="chart-series-legend">
            <h4 className="h6 mb-1">Series</h4>
            <div className="d-flex flex-wrap gap-2">
                {legendItems(series, pinned).map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                        data-testid="chart-series-legend-item"
                        data-series={item.key}
                        aria-pressed={hidden.has(item.key)}
                        style={hidden.has(item.key) ? { opacity: 0.5 } : undefined}
                        onClick={() => onToggle(item.key)}
                    >
                        <span
                            data-testid="chart-series-legend-swatch"
                            style={{ display: 'inline-block', width: 24, borderTop: `2px ${item.pinned ? 'dashed' : 'solid'} ${item.color}` }}
                        />
                        {item.name}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function MarkerLegend({ markers }: { markers: readonly ChartMarker[] }) {
    const kinds = CHART_MARKER_KINDS.filter((kind) => markers.some((m) => m.kind === kind))
    if (kinds.length === 0) return null
    return (
        <div className="small mb-3 pt-2 border-top" data-testid="chart-marker-legend">
            <h4 className="h6 mb-1">Markers</h4>
            <ul className="list-inline mb-0">
                {kinds.map((kind) => (
                    <li key={kind} className="list-inline-item" data-testid="chart-marker-legend-item" data-kind={kind}>
                        <span
                            className="d-inline-block me-1 align-middle"
                            style={{ width: 2, height: 14, backgroundColor: MARKER_COLORS[kind] }}
                        />
                        {MARKER_KIND_LABELS[kind]}
                    </li>
                ))}
            </ul>
        </div>
    )
}
