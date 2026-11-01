import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { SeriesChart } from './line-chart'
import { resourceSeries, unitSeries } from './result-series'

export function Results({ result }: { result: SimulationResult }) {
    return (
        <div>
            {result.notes.length > 0 ? (
                <div data-testid="simulation-notes" className="alert alert-info">
                    <ul className="mb-0">
                        {result.notes.map((n) => (
                            <li key={`${n.step}-${n.code}`}>
                                <code>{n.tech}</code>: {n.message}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
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
