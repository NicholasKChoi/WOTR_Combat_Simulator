import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import cn from 'classnames'

import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { resultMessages } from './messages'
import { InfoMessages, WarningMessages } from './message-lists'
import { stepSpan } from './step-annotations'
import { SeriesChart } from './line-chart'
import { useChartDrag } from './use-chart-drag'
import type { ChartId } from './chart-layout'
import type { ChartLayoutControls } from './use-chart-layout'
import { ChartViewToggle, type ChartView, type GatherRatesView, type UnitsProducedView } from './chart-view-toggle'
import { gatherRatesSeries, resourceSeries, unitSeries, unitsProducedSeries } from './result-series'
import styles from './workbench.module.css'

const GATHER_RATES_VIEWS: readonly ChartView<GatherRatesView>[] = [
    { value: 'rate', label: 'Rate' },
    { value: 'villagers', label: 'Villagers' },
]
const UNITS_PRODUCED_VIEWS: readonly ChartView<UnitsProducedView>[] = [
    { value: 'units', label: 'Units' },
    { value: 'buildings', label: 'Buildings' },
]

interface ResultsProps {
    result: SimulationResult
    pinned: SimulationResult | null
    activeStep: number | null
    dimmed: boolean
    describedByStatus: boolean
    infoExpanded: boolean
    onInfoToggle: () => void
    chartLayout: ChartLayoutControls
}

export function Results({ result, pinned, activeStep, dimmed, describedByStatus, infoExpanded, onInfoToggle, chartLayout }: ResultsProps) {
    const messages = resultMessages(result)
    const highlight = activeStep === null ? null : stepSpan(result.steps[activeStep], result.durationSeconds)
    const [gatherRatesView, setGatherRatesView] = useState<GatherRatesView>('rate')
    const [unitsProducedView, setUnitsProducedView] = useState<UnitsProducedView>('units')
    const { layout, move, moveTo, toggle } = chartLayout
    const container = useRef<HTMLDivElement>(null)
    const reorderHelpId = useId()
    const focusAfterMove = useRef<ChartId | null>(null)
    const [orderStatus, setOrderStatus] = useState('')

    useEffect(() => {
        const id = focusAfterMove.current
        focusAfterMove.current = null
        if (id) container.current?.querySelector<HTMLButtonElement>(`[data-testid="${id}"] [data-testid="chart-drag-handle"]`)?.focus()
    }, [layout.order])

    const charts: Record<ChartId, { title: string; yLabel: string; series: (run: SimulationResult) => ReturnType<typeof unitSeries>; headerControls?: ReactNode }> = {
        'chart-units-produced': {
            title: 'Units produced',
            yLabel: unitsProducedView === 'buildings' ? 'Buildings' : 'Count',
            series: (run) => unitsProducedSeries(unitsProducedView, run),
            headerControls: <ChartViewToggle name="Units produced" views={UNITS_PRODUCED_VIEWS} value={unitsProducedView} onChange={setUnitsProducedView} />,
        },
        'chart-gather-rates': {
            title: 'Gather rates',
            yLabel: gatherRatesView === 'villagers' ? 'Villagers' : 'Per minute',
            series: (run) => gatherRatesSeries(gatherRatesView, run),
            headerControls: <ChartViewToggle name="Gather rates" views={GATHER_RATES_VIEWS} value={gatherRatesView} onChange={setGatherRatesView} />,
        },
        'chart-gathered-resources': { title: 'Gathered resources', yLabel: 'Resources', series: (run) => resourceSeries(run.gathered) },
        'chart-floating-resources': { title: 'Floating resources', yLabel: 'Resources', series: (run) => resourceSeries(run.floating) },
    }

    const placeChart = (id: ChartId, toIndex: number, apply: () => void) => {
        focusAfterMove.current = id
        apply()
        setOrderStatus(`${charts[id].title} moved to position ${toIndex + 1} of ${layout.order.length}`)
    }
    const drag = useChartDrag(layout.order, (id, toIndex) => placeChart(id, toIndex, () => moveTo(id, toIndex)))
    const moveByKey = (id: ChartId, direction: 'up' | 'down') => {
        const toIndex = layout.order.indexOf(id) + (direction === 'up' ? -1 : 1)
        if (toIndex < 0 || toIndex >= layout.order.length) return
        placeChart(id, toIndex, () => move(id, direction))
    }

    return (
        <div ref={container} data-testid="results-last-good" className={cn(dimmed && styles.dimmed)} aria-describedby={describedByStatus ? 'auto-run-status' : undefined}>
            <WarningMessages messages={messages.warning} />
            <InfoMessages messages={messages.info} expanded={infoExpanded} onToggle={onInfoToggle} />
            <p data-testid="chart-reorder-help" id={reorderHelpId} className="visually-hidden">
                Drag a chart&apos;s handle, or use the up and down arrow keys on it, to reorder the charts.
            </p>
            <p data-testid="chart-order-status" role="status" className="visually-hidden">
                {orderStatus}
            </p>
            {layout.order.map((id) => {
                const chart = charts[id]
                return (
                    <SeriesChart
                        key={id}
                        testId={id}
                        title={chart.title}
                        yLabel={chart.yLabel}
                        times={result.times}
                        highlight={highlight}
                        markers={result.markers}
                        series={chart.series(result)}
                        pinnedMarkers={pinned?.markers}
                        pinned={pinned ? { times: pinned.times, series: chart.series(pinned) } : undefined}
                        headerControls={chart.headerControls}
                        sectionRef={drag.sectionRef(id)}
                        layout={{
                            collapsed: layout.collapsed.includes(id),
                            dragging: drag.dragging === id,
                            reorderHelpId,
                            onToggle: () => toggle(id),
                            onMoveKey: (direction) => moveByKey(id, direction),
                            onHandlePointerDown: (event) => drag.start(id, event),
                        }}
                    />
                )
            })}
        </div>
    )
}
