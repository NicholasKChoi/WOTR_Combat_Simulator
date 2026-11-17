import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import type { TooltipProps } from 'recharts'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { ChartMarker } from '../../../lib/aoe4-build-order/model'
import {
    type ChartSeries,
    type PinnedSeries,
    formatChartValue,
    isLineHidden,
    pinnedColor,
    pinnedKey,
    seriesColor,
    toOffsetChartRows,
    toChartRows,
    toggleHidden,
    trueCount,
    type ChartRow,
    wholeNumberAxis,
} from './chart-rows'
import { MARKER_COLORS, type MarkerView, ageUpMarkers, estimateLabelWidth, labelledMarkers, markerLabel, placeMarkers, visibleMarkers } from './chart-markers'
import { type ChartControls, ChartHeaderRow } from './chart-header'
import { PinnedLegend, SeriesLegend, pinnedLegendShown } from './chart-legend'
import { ChartZoomBar } from './chart-zoom-bar'
import { type TimeWindow, rowsInWindow } from './chart-zoom'
import { type PlotBox, useChartZoom } from './use-chart-zoom'
import type { StepSpan } from './step-annotations'
import styles from './results.module.css'

const LABEL_LINE_HEIGHT = 14
const Y_AXIS_WIDTH = 110
// Lowers the x tick labels so the 0:00 label clears the y axis's bottom tick, which is centred on the axis line; the taller axis keeps them inside the chart.
const X_TICK_MARGIN_PX = 12
const X_AXIS_HEIGHT = 40
// Mirrors recharts' default chart margin.
const CHART_MARGIN_PX = 5
const LABEL_FONT_SIZE = 12
const BAND_COLOR = '#0d6efd'

const SELECTION_COLOR = '#6c757d'

const NO_MARKER_VIEW: MarkerView = { hidden: new Set(), labelKind: null }

const inWindow = (at: number, shown: TimeWindow) => at >= shown.from && at <= shown.to

function readGridBox(plot: HTMLElement | null): PlotBox | null {
    const rect = plot?.querySelector('.recharts-cartesian-grid')?.getBoundingClientRect()
    return rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null
}

// A band drawn over a window: its overlap with the window when it spans time, its own time when it is one point, null when it falls outside.
export function bandIn(band: StepSpan, shown: TimeWindow): StepSpan | null {
    if (band.from === band.to) return inWindow(band.from, shown) ? band : null
    const from = Math.max(band.from, shown.from)
    const to = Math.min(band.to, shown.to)
    return from < to ? { from, to } : null
}

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
    offsetLines?: boolean
    markerView?: MarkerView
}

const trueCountFormatter: TooltipProps<number | string | readonly (number | string)[], number | string>['formatter'] = (value, _name, item) =>
    item.payload && typeof item.dataKey === 'string' ? trueCount(item.payload as ChartRow, item.dataKey) : formatChartValue(value)

export function SeriesChart({ testId, title, yLabel, times, series, pinned, markers = [], pinnedMarkers = [], highlight = null, headerControls, layout, sectionRef, offsetLines = false, markerView = NO_MARKER_VIEW }: SeriesChartProps) {
    const [hidden, setHidden] = useState<Set<string>>(new Set())
    const [chartWidth, setChartWidth] = useState<number | null>(null)
    const end = Math.max(1, ...times, ...(pinned?.times ?? []))
    const plotWidth = Math.max(1, (chartWidth ?? 0) - Y_AXIS_WIDTH - 2 * CHART_MARGIN_PX)
    const [labelWidths, setLabelWidths] = useState<ReadonlyMap<string, number>>(new Map())
    const measureRef = useRef<SVGTextElement>(null)
    const collapsed = layout?.collapsed ?? false
    const plotElement = useRef<HTMLDivElement | null>(null)
    const zoom = useChartZoom(end, () => readGridBox(plotElement.current))
    const { shown, selection } = zoom
    const zoomed = zoom.window !== null
    const setPlotElement = useCallback(
        (element: HTMLDivElement | null) => {
            plotElement.current = element
            zoom.plotRef(element)
        },
        [zoom.plotRef],
    )
    const chartBody = useRef<HTMLDivElement>(null)
    const drawn = (list: readonly ChartMarker[]) => (zoomed ? list.filter((m) => inWindow(m.at, shown)) : list)
    const visible = drawn(visibleMarkers(markers, markerView.hidden))
    const labelled = labelledMarkers(visible, markerView.labelKind)
    const ageUpHidden = markerView.hidden.has('age-up') && ageUpMarkers(markers).length > 0
    const pinnedAgeUps = ageUpHidden ? [] : drawn(ageUpMarkers(pinnedMarkers))
    const labelKey = labelled.map(markerLabel).join('\n')

    useEffect(() => {
        const text = measureRef.current
        if (!text || labelKey === '' || collapsed) return
        const widths = new Map<string, number>()
        for (const label of labelKey.split('\n')) {
            text.textContent = label
            widths.set(label, text.getComputedTextLength())
        }
        setLabelWidths(widths)
    }, [labelKey, chartWidth, collapsed])

    const placed =
        chartWidth === null
            ? []
            : placeMarkers(labelled, shown.to - shown.from, plotWidth, (label) => labelWidths.get(label) ?? estimateLabelWidth(label), shown.from)
    const rows = placed.reduce((max, p) => Math.max(max, p.row + 1), 0)
    const placedByMarker = new Map(placed.map((p) => [p.marker, p]))
    const bodyId = `${testId}-body`
    const allRows = offsetLines ? toOffsetChartRows(times, series, pinned, hidden) : toChartRows(times, series, pinned)
    const chartRows = zoomed ? rowsInWindow(allRows, shown) : allRows
    const band = highlight && zoomed ? bandIn(highlight, shown) : highlight
    const yAxis = offsetLines ? wholeNumberAxis(chartRows, hidden) : undefined

    return (
        <tbody
            ref={sectionRef}
            data-testid={testId}
            data-label-rows={rows}
            data-collapsed={collapsed ? 'true' : 'false'}
            data-dragging={layout?.dragging ? 'true' : undefined}
            data-zoom-from={zoomed ? shown.from : undefined}
            data-zoom-to={zoomed ? shown.to : undefined}
            className={styles.chartGroup}
        >
            <ChartHeaderRow title={title} bodyId={bodyId} layout={layout} controls={headerControls} />
            <tr data-testid="chart-body-row" hidden={collapsed}>
                <td colSpan={4} className={styles.chartBodyCell}>
                    <div data-testid="chart-body" id={bodyId} hidden={collapsed} ref={chartBody}>
                        {collapsed ? null : (
                            <>
                                {zoomed ? (
                                    <ChartZoomBar
                                        title={title}
                                        shown={shown}
                                        end={end}
                                        onPan={zoom.panBy}
                                        onReset={() => {
                                            zoom.reset()
                                            chartBody.current?.closest('tbody')?.querySelector<HTMLElement>('[data-testid="chart-collapse"]')?.focus()
                                        }}
                                    />
                                ) : null}
                                <div data-testid="chart-plot" ref={setPlotElement} data-drag-mode={zoom.dragMode ?? undefined} className={styles.chartPlot} onPointerDown={zoom.onPointerDown}>
                                    <ResponsiveContainer width="100%" height={360} onResize={(width) => setChartWidth(width)}>
                                        <LineChart
                                            data={chartRows}
                                            margin={{ top: CHART_MARGIN_PX + rows * LABEL_LINE_HEIGHT, right: CHART_MARGIN_PX, bottom: CHART_MARGIN_PX, left: CHART_MARGIN_PX }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="t" type="number" domain={zoomed ? [shown.from, shown.to] : ['dataMin', 'dataMax']} allowDataOverflow={zoomed} tickFormatter={formatMinSec} tickMargin={X_TICK_MARGIN_PX} height={X_AXIS_HEIGHT} />
                                            <YAxis domain={yAxis?.domain} ticks={yAxis?.ticks} width={Y_AXIS_WIDTH} label={{ value: yLabel, angle: -90, position: 'insideLeft', textAnchor: 'middle' }} />
                                            <Tooltip labelFormatter={(t) => formatMinSec(Number(t))} formatter={offsetLines ? trueCountFormatter : formatChartValue} />
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
                                            {highlight && band && highlight.from < highlight.to ? (
                                                <ReferenceArea
                                                    x1={band.from}
                                                    x2={band.to}
                                                    fill={BAND_COLOR}
                                                    fillOpacity={0.15}
                                                    stroke="none"
                                                    data-testid="chart-step-band"
                                                    data-from={highlight.from}
                                                    data-to={highlight.to}
                                                />
                                            ) : null}
                                            {highlight && band && highlight.from === highlight.to ? (
                                                <ReferenceLine
                                                    x={highlight.from}
                                                    stroke={BAND_COLOR}
                                                    strokeWidth={2}
                                                    data-testid="chart-step-band"
                                                    data-from={highlight.from}
                                                    data-to={highlight.to}
                                                />
                                            ) : null}
                                            {visible.map((marker) => {
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
                                            {selection ? (
                                                <ReferenceArea
                                                    x1={selection.from}
                                                    x2={selection.to}
                                                    fill={SELECTION_COLOR}
                                                    fillOpacity={0.25}
                                                    stroke="none"
                                                    data-testid="chart-zoom-selection"
                                                />
                                            ) : null}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <SeriesLegend
                                    series={series}
                                    pinned={pinned}
                                    hidden={hidden}
                                    onToggle={(key) => setHidden((h) => toggleHidden(h, key))}
                                />
                                {pinnedLegendShown(pinned, hidden, pinnedAgeUps.length) && <PinnedLegend />}
                            </>
                        )}
                    </div>
                    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
                        <text ref={measureRef} fontSize={LABEL_FONT_SIZE} />
                    </svg>
                </td>
            </tr>
        </tbody>
    )
}
