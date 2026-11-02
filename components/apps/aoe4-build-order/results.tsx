import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { resultMessages } from './messages'
import { InfoMessages, WarningMessages } from './message-lists'
import { SeriesChart } from './line-chart'
import { resourceSeries, unitSeries } from './result-series'

interface ResultsProps {
    result: SimulationResult
    infoExpanded: boolean
    onInfoToggle: () => void
}

export function Results({ result, infoExpanded, onInfoToggle }: ResultsProps) {
    const messages = resultMessages(result)
    return (
        <div>
            <WarningMessages messages={messages.warning} />
            <InfoMessages messages={messages.info} expanded={infoExpanded} onToggle={onInfoToggle} />
            <SeriesChart
                testId="chart-units-produced"
                title="Units produced"
                yLabel="Units"
                times={result.times}
                series={unitSeries(result)}
            />
            <SeriesChart
                testId="chart-gather-rates"
                title="Gather rates"
                yLabel="Per minute"
                times={result.times}
                series={resourceSeries(result.gatherRates)}
            />
            <SeriesChart
                testId="chart-floating-resources"
                title="Floating resources"
                yLabel="Resources"
                times={result.times}
                series={resourceSeries(result.floating)}
            />
        </div>
    )
}
