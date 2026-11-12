import { type ReactNode, useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { resultMessages } from './messages'
import { InfoMessages, WarningMessages } from './message-lists'
import { stepSpan } from './step-annotations'
import { SeriesChart } from './line-chart'
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
    const { layout, move, toggle } = chartLayout
    const container = useRef<HTMLDivElement>(null)
    const pendingFocus = useRef<{ id: ChartId; direction: 'up' | 'down' } | null>(null)
    const gatherRateSeries = (run: SimulationResult) => (perVillager ? perVillagerSeries(run.gatherRates, run.gatherers) : resourceSeries(run.gatherRates))

    useEffect(() => {
        const pending = pendingFocus.current
        pendingFocus.current = null
        if (!pending) return
        const button = (direction: 'up' | 'down') => container.current?.querySelector<HTMLButtonElement>(`[data-testid="${pending.id}"] [data-testid="chart-move-${direction}"]`)
        const pressed = button(pending.direction)
        const target = pressed?.disabled ? button(pending.direction === 'up' ? 'down' : 'up') : pressed
        target?.focus()
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

    return (
        <div ref={container} data-testid="results-last-good" className={cn(dimmed && styles.dimmed)} aria-describedby={describedByStatus ? 'auto-run-status' : undefined}>
            <WarningMessages messages={messages.warning} />
            <InfoMessages messages={messages.info} expanded={infoExpanded} onToggle={onInfoToggle} />
            {layout.order.map((id, index) => {
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
                        layout={{
                            collapsed: layout.collapsed.includes(id),
                            first: index === 0,
                            last: index === layout.order.length - 1,
                            onToggle: () => toggle(id),
                            onMove: (direction) => {
                                pendingFocus.current = { id, direction }
                                move(id, direction)
                            },
                        }}
                    />
                )
            })}
        </div>
    )
}
