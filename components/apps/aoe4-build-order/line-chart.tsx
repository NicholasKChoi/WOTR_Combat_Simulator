import { type ReactNode, useEffect, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { ChartMarker, ChartMarkerKind } from '../../../lib/aoe4-build-order/model'
import {
    type ChartSeries,
    MARKER_COLORS,
    type PinnedSeries,
    formatChartValue,
    isLineHidden,
    markerLabel,
    pinnedColor,
    pinnedKey,
    seriesColor,
    toChartRows,
    toggleHidden,
} from './chart-rows'
import { type ChartControls, ChartHeader } from './chart-header'
import { MarkerLegend, PinnedLegend, SeriesLegend, pinnedLegendShown } from './chart-legend'
import type { StepSpan } from './step-annotations'
import styles from './results.module.css'

const LABEL_LINE_HEIGHT = 14
const LABEL_CHAR_PX = 8
const Y_AXIS_WIDTH = 110
// Mirrors recharts' default chart margin.
const CHART_MARGIN_PX = 5
const LABEL_FONT_SIZE = 12
const BAND_COLOR = '#0d6efd'

export interface PlacedMarker {
    marker: ChartMarker
    side: 'left' | 'right'
    row: number
    dx: number
}

const estimateLabelWidth = (label: string): number => label.length * LABEL_CHAR_PX

// Labels are stacked in rows: a marker takes the first row whose last label ends before this one starts, so
// markers close in time never share a row. A label that fits on neither side of its line is pinned to the
// plot's left edge (dx shifts it there) so it never covers the Y-axis ticks.
export function placeMarkers(
    markers: readonly ChartMarker[],
    end: number,
    plotWidth: number,
    labelWidth: (label: string) => number = estimateLabelWidth,
): PlacedMarker[] {
    const rowEnds: number[] = []
    return markers.map((marker) => {
        const width = (labelWidth(markerLabel(marker)) * end) / plotWidth
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

export const ageUpMarkers = (markers: readonly ChartMarker[]): ChartMarker[] => markers.filter((m) => m.kind === 'age-up')

const hasKind = (markers: readonly ChartMarker[], kind: ChartMarkerKind): boolean => markers.some((m) => m.kind === kind)

// `active` must be a kind that has markers; activeMarkerKind guarantees it.
export const labelledMarkers = (markers: readonly ChartMarker[], active: ChartMarkerKind | null): ChartMarker[] =>
    active === null ? ageUpMarkers(markers) : markers.filter((m) => m.kind === active)

export function activeMarkerKind(markers: readonly ChartMarker[], hoverKind: ChartMarkerKind | null, focusKind: ChartMarkerKind | null): ChartMarkerKind | null {
    return [hoverKind, focusKind].find((kind) => kind !== null && hasKind(markers, kind)) ?? null
}

// A legend item that unmounts (its kind's markers are gone, or the chart collapsed) fires no mouseleave or blur,
// so a hover or focus kind it left behind is reset here.
export const liveMarkerKind = (markers: readonly ChartMarker[], kind: ChartMarkerKind | null, collapsed: boolean): ChartMarkerKind | null =>
    kind !== null && !collapsed && hasKind(markers, kind) ? kind : null

interface SeriesChartProps {
    testId: string
    title: string
    yLabel: string
    times: number[]
    series: ChartSeries[]
    pinned?: PinnedSeries
    markers?: readonly ChartMarker[]
    pinnedMarkers?: readonly ChartMarker[]
    highlight?: StepSpan | null
    headerControls?: ReactNode
    layout?: ChartControls
    sectionRef?: (element: HTMLElement | null) => void
}

export function SeriesChart({ testId, title, yLabel, times, series, pinned, markers = [], pinnedMarkers = [], highlight = null, headerControls, layout, sectionRef }: SeriesChartProps) {
    const [hidden, setHidden] = useState<Set<string>>(new Set())
    const [chartWidth, setChartWidth] = useState<number | null>(null)
    const end = Math.max(1, ...times, ...(pinned?.times ?? []))
    const plotWidth = Math.max(1, (chartWidth ?? 0) - Y_AXIS_WIDTH - 2 * CHART_MARGIN_PX)
    const [labelWidths, setLabelWidths] = useState<ReadonlyMap<string, number>>(new Map())
    const measureRef = useRef<SVGTextElement>(null)
    const pinnedAgeUps = ageUpMarkers(pinnedMarkers)
    const collapsed = layout?.collapsed ?? false
    const [hoverKind, setHoverKind] = useState<ChartMarkerKind | null>(null)
    const [focusKind, setFocusKind] = useState<ChartMarkerKind | null>(null)
    const liveHover = liveMarkerKind(markers, hoverKind, collapsed)
    const liveFocus = liveMarkerKind(markers, focusKind, collapsed)
    if (liveHover !== hoverKind) setHoverKind(liveHover)
    if (liveFocus !== focusKind) setFocusKind(liveFocus)
    const active = activeMarkerKind(markers, liveHover, liveFocus)
    const labelled = labelledMarkers(markers, active)
    const labelKey = labelled.map(markerLabel).join('\n')

    useEffect(() => {
        const text = measureRef.current
        if (!text || labelKey === '') return
        const widths = new Map<string, number>()
        for (const label of labelKey.split('\n')) {
            text.textContent = label
            widths.set(label, text.getComputedTextLength())
        }
        setLabelWidths(widths)
    }, [labelKey, chartWidth])

    const placed = chartWidth === null ? [] : placeMarkers(labelled, end, plotWidth, (label) => labelWidths.get(label) ?? estimateLabelWidth(label))
    const rows = placed.reduce((max, p) => Math.max(max, p.row + 1), 0)
    const placedByMarker = new Map(placed.map((p) => [p.marker, p]))
    const bodyId = `${testId}-body`

    return (
        <div
            ref={sectionRef}
            data-testid={testId}
            data-label-rows={rows}
            data-collapsed={collapsed ? 'true' : 'false'}
            data-dragging={layout?.dragging ? 'true' : undefined}
            className={styles.chart}
        >
            <ChartHeader title={title} bodyId={bodyId} layout={layout} controls={headerControls} />
            <div data-testid="chart-body" id={bodyId} hidden={collapsed}>
                {collapsed ? null : (
                    <>
                        <ResponsiveContainer width="100%" height={360} onResize={(width) => setChartWidth(width)}>
                            <LineChart
                                data={toChartRows(times, series, pinned)}
                                margin={{ top: CHART_MARGIN_PX + rows * LABEL_LINE_HEIGHT, right: CHART_MARGIN_PX, bottom: CHART_MARGIN_PX, left: CHART_MARGIN_PX }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatMinSec} />
                                <YAxis width={Y_AXIS_WIDTH} label={{ value: yLabel, angle: -90, position: 'insideLeft', textAnchor: 'middle' }} />
                                <Tooltip labelFormatter={(t) => formatMinSec(Number(t))} formatter={formatChartValue} />
                                {series.map((s, i) => (
                                    <Line
                                        key={s.key}
                                        dataKey={s.key}
                                        name={s.name}
                                        data-series={s.key}
                                        stroke={seriesColor(i)}
                                        dot={false}
                                        isAnimationActive={false}
                                        hide={isLineHidden(hidden, s.key)}
                                    />
                                ))}
                                {pinned?.series.map((s, i) => (
                                    <Line
                                        key={pinnedKey(s.key)}
                                        dataKey={pinnedKey(s.key)}
                                        name={`${s.name} (pinned)`}
                                        tooltipType="none"
                                        data-series={pinnedKey(s.key)}
                                        stroke={pinnedColor(series, s.key, i)}
                                        strokeDasharray="6 4"
                                        dot={false}
                                        connectNulls={false}
                                        isAnimationActive={false}
                                        hide={isLineHidden(hidden, s.key)}
                                    />
                                ))}
                                {highlight && highlight.from < highlight.to ? (
                                    <ReferenceArea
                                        x1={highlight.from}
                                        x2={highlight.to}
                                        fill={BAND_COLOR}
                                        fillOpacity={0.15}
                                        stroke="none"
                                        data-testid="chart-step-band"
                                        data-from={highlight.from}
                                        data-to={highlight.to}
                                    />
                                ) : null}
                                {highlight && highlight.from === highlight.to ? (
                                    <ReferenceLine
                                        x={highlight.from}
                                        stroke={BAND_COLOR}
                                        strokeWidth={2}
                                        data-testid="chart-step-band"
                                        data-from={highlight.from}
                                        data-to={highlight.to}
                                    />
                                ) : null}
                                {markers.map((marker) => {
                                    const place = placedByMarker.get(marker)
                                    return (
                                        <ReferenceLine
                                            key={`${marker.kind}:${marker.label}:${marker.at}`}
                                            x={marker.at}
                                            stroke={MARKER_COLORS[marker.kind]}
                                            data-testid="chart-marker"
                                            data-kind={marker.kind}
                                            data-label={marker.label}
                                            data-at={marker.at}
                                            label={
                                                place && {
                                                    value: markerLabel(marker),
                                                    position: place.side === 'left' ? 'insideTopLeft' : 'insideTopRight',
                                                    fill: MARKER_COLORS[marker.kind],
                                                    fontSize: LABEL_FONT_SIZE,
                                                    offset: 0,
                                                    dx: place.dx,
                                                    dy: (place.row - rows) * LABEL_LINE_HEIGHT,
                                                }
                                            }
                                        >
                                            {place ? null : <title>{markerLabel(marker)}</title>}
                                        </ReferenceLine>
                                    )
                                })}
                                {pinnedAgeUps.map((marker) => (
                                    <ReferenceLine
                                        key={`pinned:${marker.label}:${marker.at}`}
                                        x={marker.at}
                                        stroke={MARKER_COLORS['age-up']}
                                        strokeDasharray="6 4"
                                        data-testid="chart-pinned-marker"
                                        data-label={marker.label}
                                        data-at={marker.at}
                                    >
                                        <title>{`${marker.label} (pinned) ${formatMinSec(marker.at)}`}</title>
                                    </ReferenceLine>
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        <SeriesLegend
                            series={series}
                            pinned={pinned}
                            hidden={hidden}
                            onToggle={(key) => setHidden((h) => toggleHidden(h, key))}
                        />
                        <MarkerLegend markers={markers} active={active} onHover={setHoverKind} onFocusKind={setFocusKind} />
                        {pinnedLegendShown(pinned, hidden, pinnedAgeUps.length) && <PinnedLegend />}
                    </>
                )}
            </div>
            <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
                <text ref={measureRef} fontSize={LABEL_FONT_SIZE} />
            </svg>
        </div>
    )
}
