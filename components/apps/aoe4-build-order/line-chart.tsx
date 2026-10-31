import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type ChartSeries, formatMinSec, seriesColor, toChartRows, toggleHidden } from './chart-rows'

interface SeriesChartProps {
    testId: string
    title: string
    yLabel: string
    times: number[]
    series: ChartSeries[]
}

export function SeriesChart({ testId, title, yLabel, times, series }: SeriesChartProps) {
    const [hidden, setHidden] = useState<Set<string>>(new Set())

    return (
        <div data-testid={testId}>
            <h3 className="h5">{title}</h3>
            <ResponsiveContainer width="100%" height={360}>
                <LineChart data={toChartRows(times, series)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatMinSec} />
                    <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
                    <Tooltip labelFormatter={(t) => formatMinSec(Number(t))} />
                    <Legend onClick={(d) => setHidden((h) => toggleHidden(h, String(d.dataKey)))} />
                    {series.map((s, i) => (
                        <Line
                            key={s.key}
                            dataKey={s.key}
                            name={s.name}
                            data-series={s.key}
                            stroke={seriesColor(i)}
                            dot={false}
                            isAnimationActive={false}
                            hide={hidden.has(s.key)}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
