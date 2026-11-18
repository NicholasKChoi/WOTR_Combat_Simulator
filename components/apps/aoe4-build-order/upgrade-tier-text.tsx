import { usePlotArea, useXAxisScale, useYAxisScale } from 'recharts'
import { estimateLabelWidth } from './chart-markers'
import { placeTierText, tierTextSlots } from './result-series'

export interface TierTextSpec {
    at: number
    value: number
    r: number
    text: string
}

interface UpgradeTierTextProps {
    texts: readonly TierTextSpec[]
    index: number
    color: string
    fontSize: number
    opacity: number
    testId: string
    series: string
    label: string
}

// Rendered through a ReferenceDot's label prop. Every text on the chart is laid out together, from the axis scales the dots are drawn with, so each text clears the others.
export function UpgradeTierText({ texts, index, color, fontSize, opacity, testId, series, label }: UpgradeTierTextProps) {
    const plot = usePlotArea()
    const xScale = useXAxisScale()
    const yScale = useYAxisScale()
    if (!plot || !xScale || !yScale) return null
    const height = fontSize + 2
    const bounds = { left: plot.x, top: plot.y, right: plot.x + plot.width, bottom: plot.y + plot.height }
    const dots = texts.map((t) => ({ cx: xScale(t.at) ?? 0, cy: yScale(t.value) ?? 0, r: t.r, width: estimateLabelWidth(t.text) }))
    const placement = placeTierText(dots[index], tierTextSlots(dots, height, bounds)[index], height, bounds)
    const { at, text } = texts[index]
    return (
        <text
            x={placement.x}
            y={placement.y}
            textAnchor={placement.anchor}
            dominantBaseline="central"
            fontSize={fontSize}
            fill={color}
            stroke="#fff"
            strokeWidth={3}
            paintOrder="stroke"
            opacity={opacity}
            data-testid={testId}
            data-series={series}
            data-label={label}
            data-at={at}
        >
            {text}
        </text>
    )
}
