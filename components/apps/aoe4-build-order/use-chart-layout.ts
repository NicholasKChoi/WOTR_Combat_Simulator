import { useEffect, useRef, useState } from 'react'
import { browserStorage } from './browser-storage'
import { type ChartId, type ChartLayout, type LayoutPanelId, DEFAULT_CHART_LAYOUT, moveChart, moveChartTo, readChartLayout, toggleChartCollapsed, writeChartLayout } from './chart-layout'

export interface ChartLayoutControls {
    layout: ChartLayout
    move(id: ChartId, direction: 'up' | 'down'): void
    moveTo(id: ChartId, toIndex: number): void
    toggle(id: LayoutPanelId): void
}

export function useChartLayout(): ChartLayoutControls {
    const [state, setState] = useState<{ layout: ChartLayout; loaded: boolean }>({ layout: DEFAULT_CHART_LAYOUT, loaded: false })
    const readLayout = useRef<ChartLayout | null>(null)

    useEffect(() => {
        const read = readChartLayout(browserStorage())
        readLayout.current = read
        setState({ layout: read, loaded: true })
    }, [])

    useEffect(() => {
        if (!state.loaded || state.layout === readLayout.current) return
        writeChartLayout(browserStorage(), state.layout)
    }, [state])

    const update = (change: (prev: ChartLayout) => ChartLayout) => setState((prev) => ({ ...prev, layout: change(prev.layout) }))

    return {
        layout: state.layout,
        move: (id, direction) => update((prev) => moveChart(prev, id, direction)),
        moveTo: (id, toIndex) => update((prev) => moveChartTo(prev, id, toIndex)),
        toggle: (id) => update((prev) => toggleChartCollapsed(prev, id)),
    }
}
