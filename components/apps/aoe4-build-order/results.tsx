import { useMemo, useState } from 'react'
import cn from 'classnames'

import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { resultMessages } from './messages'
import { InfoMessages, WarningMessages } from './message-lists'
import { StepTimeline } from './step-timeline'
import { stepSpan, timelineRows } from './step-timeline-rows'
import { SeriesChart } from './line-chart'
import { resourceSeries, unitSeries } from './result-series'
import styles from './workbench.module.css'

interface ResultsProps {
    result: SimulationResult
    pinned: SimulationResult | null
    text: string
    landmarks: readonly string[]
    stale: boolean
    infoExpanded: boolean
    onInfoToggle: () => void
}

export function Results({ result, pinned, text, landmarks, stale, infoExpanded, onInfoToggle }: ResultsProps) {
    const messages = resultMessages(result)
    const rows = useMemo(() => timelineRows(result.steps, text, landmarks), [result.steps, text, landmarks])
    const [active, setActive] = useState<{ result: SimulationResult; step: number } | null>(null)
    const activeStep = active?.result === result ? active.step : null
    const activeRow = rows.find((row) => row.step === activeStep)
    const highlight = activeRow ? stepSpan(activeRow, result.durationSeconds) : null
    return (
        <div>
            {stale ? (
                <div data-testid="results-stale" role="status" className={cn(styles.stale, 'alert alert-warning')}>
                    These results are from an earlier build or duration. Run again to update.
                </div>
            ) : null}
            <WarningMessages messages={messages.warning} />
            <InfoMessages messages={messages.info} expanded={infoExpanded} onToggle={onInfoToggle} />
            <div data-testid="results-split" className={styles.resultsSplit}>
                <div className={styles.timelineColumn}>
                    <StepTimeline
                        rows={rows}
                        activeStep={activeStep}
                        onActiveStepChange={(step) => setActive(step === null ? null : { result, step })}
                    />
                </div>
                <div className={styles.chartsColumn}>
                    <SeriesChart
                        testId="chart-units-produced"
                        title="Units produced"
                        yLabel="Units"
                        times={result.times}
                        highlight={highlight}
                        markers={result.markers}
                        series={unitSeries(result)}
                        pinnedMarkers={pinned?.markers}
                        pinned={pinned ? { times: pinned.times, series: unitSeries(pinned) } : undefined}
                    />
                    <SeriesChart
                        testId="chart-gather-rates"
                        title="Gather rates"
                        yLabel="Per minute"
                        times={result.times}
                        highlight={highlight}
                        markers={result.markers}
                        series={resourceSeries(result.gatherRates)}
                        pinnedMarkers={pinned?.markers}
                        pinned={pinned ? { times: pinned.times, series: resourceSeries(pinned.gatherRates) } : undefined}
                    />
                    <SeriesChart
                        testId="chart-gathered-resources"
                        title="Gathered resources"
                        yLabel="Resources"
                        times={result.times}
                        highlight={highlight}
                        markers={result.markers}
                        series={resourceSeries(result.gathered)}
                        pinnedMarkers={pinned?.markers}
                        pinned={pinned ? { times: pinned.times, series: resourceSeries(pinned.gathered) } : undefined}
                    />
                    <SeriesChart
                        testId="chart-floating-resources"
                        title="Floating resources"
                        yLabel="Resources"
                        times={result.times}
                        highlight={highlight}
                        markers={result.markers}
                        series={resourceSeries(result.floating)}
                        pinnedMarkers={pinned?.markers}
                        pinned={pinned ? { times: pinned.times, series: resourceSeries(pinned.floating) } : undefined}
                    />
                </div>
            </div>
        </div>
    )
}
