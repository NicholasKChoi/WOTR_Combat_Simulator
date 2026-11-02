import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { CHART_MARKER_KINDS, type ChartMarker } from '../../../lib/aoe4-build-order/model'
import {
    type ChartSeries,
    MARKER_COLORS,
    MARKER_KIND_LABELS,
    type PinnedSeries,
    markerLabel,
    pinnedKey,
    seriesColor,
    toChartRows,
    toggleHidden,
} from './chart-rows'

const LABEL_LINE_HEIGHT = 14
const LABEL_CHAR_PX = 7
const Y_AXIS_WIDTH = 110
// Mirrors recharts' default chart margin.
const CHART_MARGIN_PX = 5

interface PlacedMarker {
    marker: ChartMarker
    side: 'left' | 'right'
    row: number
    dx: number
}

// Labels are stacked in rows: a marker takes the first row whose last label ends before this one starts, so
// markers close in time never share a row. A label that fits on neither side of its line is pinned to the
// plot's left edge (dx shifts it there) so it never covers the Y-axis ticks.
function placeMarkers(markers: readonly ChartMarker[], end: number, plotWidth: number): PlacedMarker[] {
    const rowEnds: number[] = []
    return markers.map((marker) => {
        const width = (markerLabel(marker).length * LABEL_CHAR_PX * end) / plotWidth
        const fitsRight = marker.at + width <= end
        const pinned = !fitsRight && marker.at - width < 0
        const side = fitsRight || pinned ? 'left' : 'right'
        const dx = pinned ? (-marker.at * plotWidth) / end : 0
        const [from, to] = pinned ? [0, width] : side === 'left' ? [marker.at, marker.at + width] : [marker.at - width, marker.at]
        let row = rowEnds.findIndex((rowEnd) => rowEnd < from)
        if (row < 0) row = rowEnds.length
        rowEnds[row] = to
        return { marker, side, row, dx }
    })
}

interface SeriesChartProps {
    testId: string
    title: string
    yLabel: string
    times: number[]
    series: ChartSeries[]
    pinned?: PinnedSeries
    markers?: readonly ChartMarker[]
}

export function SeriesChart({ testId, title, yLabel, times, series, pinned, markers = [] }: SeriesChartProps) {
    const [hidden, setHidden] = useState<Set<string>>(new Set())
    const [chartWidth, setChartWidth] = useState<number | null>(null)
    const end = Math.max(1, ...times, ...(pinned?.times ?? []))
    const plotWidth = Math.max(1, (chartWidth ?? 0) - Y_AXIS_WIDTH - 2 * CHART_MARGIN_PX)
    const kinds = CHART_MARKER_KINDS.filter((kind) => markers.some((m) => m.kind === kind))

    return (
        <div data-testid={testId}>
            <h3 className="h5">{title}</h3>
            <ResponsiveContainer width="100%" height={360} onResize={(width) => setChartWidth(width)}>
                <LineChart data={toChartRows(times, series, pinned)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatMinSec} />
                    <YAxis width={Y_AXIS_WIDTH} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
                    <Tooltip labelFormatter={(t) => formatMinSec(Number(t))} />
                    <Legend onClick={(d) => setHidden((h) => toggleHidden(h, String(d.dataKey)))} />
                    {series.map((s, i) => (
                        <Line
                            key={s.key}
                            dataKey={s.key}
                            name={s.name}
                            data-series={s.key}
                            stroke={seriesColor(i)}
                            dot={false}
                            isAnimationActive={false}
                            hide={hidden.has(s.key)}
                        />
                    ))}
                    {pinned?.series.map((s, i) => {
                        const current = series.findIndex((c) => c.key === s.key)
                        return (
                            <Line
                                key={pinnedKey(s.key)}
                                dataKey={pinnedKey(s.key)}
                                name={`${s.name} (pinned)`}
                                data-series={pinnedKey(s.key)}
                                stroke={seriesColor(current >= 0 ? current : series.length + i)}
                                strokeDasharray="6 4"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                                hide={hidden.has(pinnedKey(s.key))}
                            />
                        )
                    })}
                    {(chartWidth === null ? [] : placeMarkers(markers, end, plotWidth)).map(({ marker, side, row, dx }) => (
                        <ReferenceLine
                            key={`${marker.kind}:${marker.label}:${marker.at}`}
                            x={marker.at}
                            stroke={MARKER_COLORS[marker.kind]}
                            strokeDasharray="8 2"
                            data-testid="chart-marker"
                            data-kind={marker.kind}
                            data-label={marker.label}
                            data-at={marker.at}
                            label={{
                                value: markerLabel(marker),
                                position: side === 'left' ? 'insideTopLeft' : 'insideTopRight',
                                fill: MARKER_COLORS[marker.kind],
                                fontSize: 12,
                                dx,
                                dy: row * LABEL_LINE_HEIGHT,
                            }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            {kinds.length > 0 && (
                <ul className="list-inline small mb-3" data-testid="chart-marker-legend">
                    {kinds.map((kind) => (
                        <li key={kind} className="list-inline-item" data-testid="chart-marker-legend-item" data-kind={kind}>
                            <span
                                className="d-inline-block me-1 align-middle"
                                style={{ width: 12, height: 12, backgroundColor: MARKER_COLORS[kind] }}
                            />
                            {MARKER_KIND_LABELS[kind]}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
