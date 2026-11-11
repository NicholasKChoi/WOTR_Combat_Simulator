import cn from 'classnames'

import { CHART_MARKER_KINDS, type ChartMarker } from '../../../lib/aoe4-build-order/model'
import { type ChartSeries, MARKER_COLORS, MARKER_KIND_LABELS, type PinnedSeries, legendItems } from './chart-rows'
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
            {pinned && <PinnedLineKey />}
        </div>
    )
}

export function PinnedLineKey() {
    return (
        <div className="d-flex flex-wrap gap-3 mt-1" data-testid="chart-pinned-key">
            {(['solid', 'dashed'] as const).map((lineStyle) => (
                <span key={lineStyle} className="d-inline-flex align-items-center gap-1">
                    <span
                        data-testid="chart-pinned-key-swatch"
                        data-line-style={lineStyle}
                        style={{ display: 'inline-block', width: 24, borderTop: `2px ${lineStyle} currentColor` }}
                    />
                    {lineStyle === 'solid' ? 'current run' : 'pinned run'}
                </span>
            ))}
        </div>
    )
}

export function MarkerLegend({ markers, pinnedAgeUps = false }: { markers: readonly ChartMarker[]; pinnedAgeUps?: boolean }) {
    const kinds = CHART_MARKER_KINDS.filter((kind) => markers.some((m) => m.kind === kind))
    if (kinds.length === 0 && !pinnedAgeUps) return null
    return (
        <div className={cn(styles.legend, 'small mb-3 pt-2 border-top')} data-testid="chart-marker-legend">
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
                {pinnedAgeUps && (
                    <li className="list-inline-item" data-testid="chart-marker-legend-item" data-kind="pinned-age-up">
                        <span
                            className="d-inline-block me-1 align-middle"
                            style={{ height: 14, borderLeft: `2px dashed ${MARKER_COLORS['age-up']}` }}
                        />
                        Age-up (pinned)
                    </li>
                )}
            </ul>
        </div>
    )
}
