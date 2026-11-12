import cn from 'classnames'

import { CHART_MARKER_KINDS, type ChartMarker, type ChartMarkerKind } from '../../../lib/aoe4-build-order/model'
import { type ChartSeries, MARKER_COLORS, MARKER_KIND_LABELS, type PinnedSeries, isLineHidden, legendItems, pinnedKey } from './chart-rows'
import styles from './results.module.css'

interface SeriesLegendProps {
    series: readonly ChartSeries[]
    pinned?: PinnedSeries
    hidden: ReadonlySet<string>
    onToggle(key: string): void
}

export function SeriesLegend({ series, pinned, hidden, onToggle }: SeriesLegendProps) {
    return (
        <div className={cn(styles.legend, 'small mb-2')} data-testid="chart-series-legend">
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
                            style={{ display: 'inline-block', width: 24, borderTop: `2px ${item.lines === 'pinned' ? 'dashed' : 'solid'} ${item.color}` }}
                        />
                        {item.name}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function pinnedLegendShown(pinned: PinnedSeries | undefined, hidden: ReadonlySet<string>, pinnedAgeUpCount: number): boolean {
    return pinnedAgeUpCount > 0 || (pinned?.series.some((s) => !isLineHidden(hidden, pinnedKey(s.key))) ?? false)
}

export function PinnedLegend() {
    return (
        <p className={cn(styles.legend, 'small mb-3')} data-testid="chart-pinned-legend">
            <span
                className="me-1"
                data-testid="chart-pinned-legend-swatch"
                data-line-style="dashed"
                style={{ display: 'inline-block', width: 24, borderTop: '2px dashed currentColor' }}
            />
            dashed = pinned build
        </p>
    )
}

interface MarkerLegendProps {
    markers: readonly ChartMarker[]
    active: ChartMarkerKind | null
    onHover(kind: ChartMarkerKind | null): void
    onFocusKind(kind: ChartMarkerKind | null): void
}

export function MarkerLegend({ markers, active, onHover, onFocusKind }: MarkerLegendProps) {
    const kinds = CHART_MARKER_KINDS.filter((kind) => markers.some((m) => m.kind === kind))
    if (kinds.length === 0) return null
    return (
        <div className={cn(styles.legend, 'small mb-3 pt-2 border-top')} data-testid="chart-marker-legend">
            <h4 className="h6 mb-1">Markers</h4>
            <ul className="list-inline mb-0">
                {kinds.map((kind) => (
                    <li key={kind} className="list-inline-item">
                        <button
                            type="button"
                            className={styles.markerButton}
                            data-testid="chart-marker-legend-item"
                            data-kind={kind}
                            data-active={kind === active ? 'true' : undefined}
                            aria-label={`Show ${MARKER_KIND_LABELS[kind]} marker labels`}
                            onMouseEnter={() => onHover(kind)}
                            onMouseLeave={() => onHover(null)}
                            onFocus={() => onFocusKind(kind)}
                            onBlur={() => onFocusKind(null)}
                        >
                            <span
                                className="d-inline-block me-1 align-middle"
                                style={{ width: 2, height: 14, backgroundColor: MARKER_COLORS[kind] }}
                            />
                            {MARKER_KIND_LABELS[kind]}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
