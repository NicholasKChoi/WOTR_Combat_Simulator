import { useEffect, useRef, useState } from 'react'
import { browserStorage } from './browser-storage'
import { type ChartId, type ChartLayout, type LayoutPanelId, DEFAULT_CHART_LAYOUT, moveChartByKey, moveChartTo, readChartLayout, toggleChartCollapsed, writeChartLayout } from './chart-layout'

export interface ChartLayoutControls {
    layout: ChartLayout
    move(id: ChartId, direction: 'up' | 'down'): number | null
    moveTo(id: ChartId, toIndex: number): void
    toggle(id: LayoutPanelId): void
}

export function useChartLayout(): ChartLayoutControls {
    const [state, setState] = useState<{ layout: ChartLayout; loaded: boolean }>({ layout: DEFAULT_CHART_LAYOUT, loaded: false })
    const readLayout = useRef<ChartLayout | null>(null)
    const latest = useRef(state.layout)

    useEffect(() => {
        const read = readChartLayout(browserStorage())
        readLayout.current = read
        latest.current = read
        setState({ layout: read, loaded: true })
    }, [])

    useEffect(() => {
        if (!state.loaded || state.layout === readLayout.current) return
        writeChartLayout(browserStorage(), state.layout)
    }, [state])

    const apply = (next: ChartLayout) => {
        latest.current = next
        setState((prev) => ({ ...prev, layout: next }))
    }

    return {
        layout: state.layout,
        move: (id, direction) => {
            const moved = moveChartByKey(latest.current, id, direction)
            if (!moved) return null
            apply(moved.layout)
            return moved.toIndex
        },
        moveTo: (id, toIndex) => apply(moveChartTo(latest.current, id, toIndex)),
        toggle: (id) => apply(toggleChartCollapsed(latest.current, id)),
    }
}
