import { usePlotArea } from 'recharts'
import { estimateLabelWidth } from './chart-markers'
import { type TierTextSlot, placeTierText } from './result-series'

interface UpgradeTierTextProps extends TierTextSlot {
    text: string
    color: string
    fontSize: number
    opacity: number
    testId: string
    series: string
    label: string
    at: number
    viewBox?: { x?: number; y?: number; width?: number; height?: number }
}

// Rendered through a ReferenceDot's label prop, which hands the dot's own bounding box as viewBox.
export function UpgradeTierText({ text, color, fontSize, opacity, testId, series, label, at, slot, slots, viewBox }: UpgradeTierTextProps) {
    const plot = usePlotArea()
    const { x = 0, y = 0, width = 0, height = 0 } = viewBox ?? {}
    if (!plot || width === 0) return null
    const placement = placeTierText(
        { cx: x + width / 2, cy: y + height / 2, r: width / 2, slot, slots, width: estimateLabelWidth(text), height: fontSize + 2 },
        { left: plot.x, top: plot.y, right: plot.x + plot.width, bottom: plot.y + plot.height },
    )
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
