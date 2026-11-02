import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { resultMessages } from './messages'
import { InfoMessages, WarningMessages } from './message-lists'
import { StepTimeline } from './step-timeline'
import { SeriesChart } from './line-chart'
import { resourceSeries, unitSeries } from './result-series'

interface ResultsProps {
    result: SimulationResult
    pinned: SimulationResult | null
    text: string
    infoExpanded: boolean
    onInfoToggle: () => void
}

export function Results({ result, pinned, text, infoExpanded, onInfoToggle }: ResultsProps) {
    const messages = resultMessages(result)
    return (
        <div>
            <WarningMessages messages={messages.warning} />
            <InfoMessages messages={messages.info} expanded={infoExpanded} onToggle={onInfoToggle} />
            <StepTimeline steps={result.steps} text={text} />
            <SeriesChart
                testId="chart-units-produced"
                title="Units produced"
                yLabel="Units"
                times={result.times}
                markers={result.markers}
                series={unitSeries(result)}
                pinned={pinned ? { times: pinned.times, series: unitSeries(pinned) } : undefined}
            />
            <SeriesChart
                testId="chart-gather-rates"
                title="Gather rates"
                yLabel="Per minute"
                times={result.times}
                markers={result.markers}
                series={resourceSeries(result.gatherRates)}
                pinned={pinned ? { times: pinned.times, series: resourceSeries(pinned.gatherRates) } : undefined}
            />
            <SeriesChart
                testId="chart-floating-resources"
                title="Floating resources"
                yLabel="Resources"
                times={result.times}
                markers={result.markers}
                series={resourceSeries(result.floating)}
                pinned={pinned ? { times: pinned.times, series: resourceSeries(pinned.floating) } : undefined}
            />
        </div>
    )
}
