import { useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { type ChartSeries, type PinnedSeries, pinnedKey, seriesColor, toChartRows, toggleHidden } from './chart-rows'

interface SeriesChartProps {
    testId: string
    title: string
    yLabel: string
    times: number[]
    series: ChartSeries[]
    pinned?: PinnedSeries
}

export function SeriesChart({ testId, title, yLabel, times, series, pinned }: SeriesChartProps) {
    const [hidden, setHidden] = useState<Set<string>>(new Set())

    return (
        <div data-testid={testId}>
            <h3 className="h5">{title}</h3>
            <ResponsiveContainer width="100%" height={360}>
                <LineChart data={toChartRows(times, series, pinned)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatMinSec} />
                    <YAxis width={110} label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
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
                    {pinned?.series.map((s, i) => {
                        const current = series.findIndex((c) => c.key === s.key)
                        return (
                            <Line
                                key={pinnedKey(s.key)}
                                dataKey={pinnedKey(s.key)}
                                name={`${s.name} (pinned)`}
                                data-series={pinnedKey(s.key)}
                                stroke={seriesColor(current >= 0 ? current : series.length + i)}
                                strokeDasharray="6 4"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                                hide={hidden.has(pinnedKey(s.key))}
                            />
                        )
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
