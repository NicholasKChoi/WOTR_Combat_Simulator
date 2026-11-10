import { useMemo, useState } from 'react'
import cn from 'classnames'

import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { resultMessages } from './messages'
import { InfoMessages, WarningMessages } from './message-lists'
import { StepTimeline } from './step-timeline'
import { stepSpan, timelineRows } from './step-annotations'
import { SeriesChart } from './line-chart'
import { perVillagerSeries, resourceSeries, unitSeries } from './result-series'
import styles from './workbench.module.css'

interface ResultsProps {
    result: SimulationResult
    pinned: SimulationResult | null
    text: string
    landmarks: readonly string[]
    dimmed: boolean
    describedByStatus: boolean
    infoExpanded: boolean
    onInfoToggle: () => void
}

export function Results({ result, pinned, text, landmarks, dimmed, describedByStatus, infoExpanded, onInfoToggle }: ResultsProps) {
    const messages = resultMessages(result)
    const rows = useMemo(() => timelineRows(result.steps, text, landmarks), [result.steps, text, landmarks])
    const [active, setActive] = useState<{ result: SimulationResult; step: number } | null>(null)
    const activeStep = active?.result === result ? active.step : null
    const activeTiming = activeStep === null ? undefined : result.steps[activeStep]
    const highlight = activeTiming ? stepSpan(activeTiming, result.durationSeconds) : null
    const [perVillager, setPerVillager] = useState(false)
    const gatherRateSeries = (run: SimulationResult) => (perVillager ? perVillagerSeries(run.gatherRates, run.gatherers) : resourceSeries(run.gatherRates))
    return (
        <div data-testid="results-last-good" className={cn(dimmed && styles.dimmed)} aria-describedby={describedByStatus ? 'auto-run-status' : undefined}>
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
                        yLabel={perVillager ? 'Per villager per minute' : 'Per minute'}
                        times={result.times}
                        highlight={highlight}
                        markers={result.markers}
                        series={gatherRateSeries(result)}
                        pinnedMarkers={pinned?.markers}
                        pinned={pinned ? { times: pinned.times, series: gatherRateSeries(pinned) } : undefined}
                        headerControls={
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
                        }
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
