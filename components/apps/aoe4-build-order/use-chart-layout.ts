import { useEffect, useState } from 'react'
import { browserStorage } from './browser-storage'
import { type ChartId, type ChartLayout, DEFAULT_CHART_LAYOUT, moveChart, readChartLayout, toggleChartCollapsed, writeChartLayout } from './chart-layout'

export function useChartLayout(): { layout: ChartLayout; move(id: ChartId, direction: 'up' | 'down'): void; toggle(id: ChartId): void } {
    const [layout, setLayout] = useState<ChartLayout>(DEFAULT_CHART_LAYOUT)

    useEffect(() => {
        setLayout(readChartLayout(browserStorage()))
    }, [])

    function update(next: ChartLayout) {
        setLayout(next)
        writeChartLayout(browserStorage(), next)
    }

    return {
        layout,
        move: (id, direction) => update(moveChart(layout, id, direction)),
        toggle: (id) => update(toggleChartCollapsed(layout, id)),
    }
}
