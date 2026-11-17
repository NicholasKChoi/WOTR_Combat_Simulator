import { type PointerEvent, useCallback, useRef, useState } from 'react'
import { DRAG_THRESHOLD_PX } from './chart-drag'
import { type TimeWindow, clampWindow, panStepSeconds, panWindow, timeAtX, zoomTo } from './chart-zoom'
import type { PanDirection } from './chart-zoom-bar'

export interface PlotBox {
    left: number
    top: number
    width: number
    height: number
}

export type ZoomDragMode = 'select' | 'pan'

const insidePlot = (plot: PlotBox, x: number, y: number) => x >= plot.left && x <= plot.left + plot.width && y >= plot.top && y <= plot.top + plot.height

export function useChartZoom(end: number, readPlot: () => PlotBox | null) {
    const [stored, setStored] = useState<TimeWindow | null>(null)
    const [selection, setSelection] = useState<TimeWindow | null>(null)
    const [dragMode, setDragMode] = useState<ZoomDragMode | null>(null)
    const [seenEnd, setSeenEnd] = useState(end)
    if (seenEnd !== end) {
        setSeenEnd(end)
        setStored(clampWindow(stored, end))
    }

    const shown = clampWindow(stored, end) ?? { from: 0, to: end }
    const latest = useRef({ end, stored, shown, readPlot })
    latest.current = { end, stored, shown, readPlot }
    const session = useRef<((restore: boolean) => void) | null>(null)

    const plotRef = useCallback((element: HTMLElement | null) => {
        if (!element) session.current?.(true)
    }, [])

    const onPointerDown = (event: PointerEvent<HTMLElement>) => {
        if (event.button !== 0 || !event.isPrimary || session.current) return
        const { end: gameEnd, stored: startWindow, shown: startShown } = latest.current
        const plot = latest.current.readPlot()
        if (!plot || !insidePlot(plot, event.clientX, event.clientY)) return
        const mode: ZoomDragMode = event.shiftKey ? 'pan' : 'select'
        if (mode === 'pan' && !clampWindow(startWindow, gameEnd)) return
        const holder = event.currentTarget
        const { pointerId, clientX: startX, clientY: startY } = event
        const startTime = timeAtX(startX, plot, startShown)
        try {
            holder.setPointerCapture(pointerId)
        } catch {
            return
        }
        let active = false

        const finish = (restore: boolean) => {
            holder.removeEventListener('pointermove', onMove)
            holder.removeEventListener('pointerup', onUp)
            holder.removeEventListener('pointercancel', onCancel)
            holder.removeEventListener('lostpointercapture', onCancel)
            document.removeEventListener('keydown', onKey, true)
            if (holder.hasPointerCapture(pointerId)) holder.releasePointerCapture(pointerId)
            session.current = null
            setSelection(null)
            setDragMode(null)
            if (restore && mode === 'pan') setStored(startWindow)
        }
        const onCancel = () => finish(true)
        const onMove = (move: globalThis.PointerEvent) => {
            if (!active) {
                if (Math.hypot(move.clientX - startX, move.clientY - startY) < DRAG_THRESHOLD_PX) return
                active = true
                setDragMode(mode)
            }
            if (mode === 'select') {
                const at = timeAtX(move.clientX, plot, startShown)
                setSelection({ from: Math.min(startTime, at), to: Math.max(startTime, at) })
            } else {
                const span = startShown.to - startShown.from
                setStored(panWindow(startShown, -((move.clientX - startX) / plot.width) * span, gameEnd))
            }
        }
        const onUp = (up: globalThis.PointerEvent) => {
            finish(false)
            if (!active || mode !== 'select') return
            const next = zoomTo(startTime, timeAtX(up.clientX, plot, startShown), gameEnd)
            if (next) setStored(next)
        }
        const onKey = (key: KeyboardEvent) => {
            if (key.key === 'Escape') finish(true)
        }

        holder.addEventListener('pointermove', onMove)
        holder.addEventListener('pointerup', onUp)
        holder.addEventListener('pointercancel', onCancel)
        holder.addEventListener('lostpointercapture', onCancel)
        document.addEventListener('keydown', onKey, true)
        session.current = finish
    }

    const panBy = (direction: PanDirection) => {
        const current = clampWindow(stored, end)
        if (!current) return
        const step = panStepSeconds(current)
        setStored(panWindow(current, direction === 'earlier' ? -step : step, end))
    }

    return { window: stored, shown, selection, dragMode, plotRef, onPointerDown, panBy, reset: () => setStored(null) }
}
