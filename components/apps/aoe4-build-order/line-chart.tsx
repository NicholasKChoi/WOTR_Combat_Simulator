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
const PLOT_WIDTH_PX = 900

interface PlacedMarker {
    marker: ChartMarker
    side: 'left' | 'right'
    row: number
}

// Labels are stacked in rows: a marker takes the first row whose last label ends before this one starts, so
// markers close in time never share a row. Labels near the right edge extend leftward to stay inside the plot.
function placeMarkers(markers: readonly ChartMarker[], end: number): PlacedMarker[] {
    const rowEnds: number[] = []
    return markers.map((marker) => {
        const width = (markerLabel(marker).length * LABEL_CHAR_PX * end) / PLOT_WIDTH_PX
        const side = marker.at + width > end ? 'right' : 'left'
        const [from, to] = side === 'left' ? [marker.at, marker.at + width] : [marker.at - width, marker.at]
        let row = rowEnds.findIndex((rowEnd) => rowEnd < from)
        if (row < 0) row = rowEnds.length
        rowEnds[row] = to
        return { marker, side, row }
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
    const end = Math.max(1, ...times, ...(pinned?.times ?? []))
    const kinds = CHART_MARKER_KINDS.filter((kind) => markers.some((m) => m.kind === kind))

    return (
        <div data-testid={testId}>
            <h3 className="h5">{title}</h3>
            <ResponsiveContainer width="100%" height={360}>
                <LineChart data={toChartRows(times, series, pinned)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatMinSec} />
                    <YAxis width={110} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
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
                    {placeMarkers(markers, end).map(({ marker, side, row }, i) => (
                        <ReferenceLine
                            key={i}
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
                                dy: row * LABEL_LINE_HEIGHT,
                            }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            {kinds.length > 0 && (
                <ul className="list-inline small mb-0" data-testid="chart-marker-legend">
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
