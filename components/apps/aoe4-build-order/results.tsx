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
import { perVillagerSeries, resourceSeries, unitSeries } from './result-series'
import styles from './workbench.module.css'

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
    const [perVillager, setPerVillager] = useState(false)
    const { layout, move, moveTo, toggle } = chartLayout
    const container = useRef<HTMLDivElement>(null)
    const reorderHelpId = useId()
    const focusAfterMove = useRef<ChartId | null>(null)
    const [orderStatus, setOrderStatus] = useState('')
    const gatherRateSeries = (run: SimulationResult) => (perVillager ? perVillagerSeries(run.gatherRates, run.gatherers) : resourceSeries(run.gatherRates))

    useEffect(() => {
        const id = focusAfterMove.current
        focusAfterMove.current = null
        if (id) container.current?.querySelector<HTMLButtonElement>(`[data-testid="${id}"] [data-testid="chart-drag-handle"]`)?.focus()
    }, [layout.order])

    const charts: Record<ChartId, { title: string; yLabel: string; series: (run: SimulationResult) => ReturnType<typeof unitSeries>; headerControls?: ReactNode }> = {
        'chart-units-produced': { title: 'Units produced', yLabel: 'Units', series: unitSeries },
        'chart-gather-rates': {
            title: 'Gather rates',
            yLabel: perVillager ? 'Per villager per minute' : 'Per minute',
            series: gatherRateSeries,
            headerControls: (
                <label className="form-check">
                    <input
                        type="checkbox"
                        data-testid="gather-rates-per-villager"
                        className="form-check-input"
                        checked={perVillager}
                        onChange={(e) => setPerVillager(e.target.checked)}
                    />
                    <span className="form-check-label">Per villager</span>
                </label>
            ),
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
