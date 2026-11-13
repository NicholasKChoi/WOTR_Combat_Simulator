import { type PointerEvent, useEffect, useRef, useState } from 'react'
import { dropIndexAt } from './chart-drag'
import type { ChartId } from './chart-layout'

const DRAG_THRESHOLD_PX = 4

export function useChartDrag(order: readonly ChartId[], onDrop: (id: ChartId, toIndex: number) => void) {
    const [dragging, setDragging] = useState<ChartId | null>(null)
    const sections = useRef(new Map<ChartId, HTMLElement>())
    const latest = useRef({ order, onDrop })
    latest.current = { order, onDrop }
    const session = useRef<(() => void) | null>(null)

    useEffect(() => () => session.current?.(), [])

    const targetIndex = (id: ChartId, pointerY: number): number => {
        const midpoints = latest.current.order.flatMap((other) => {
            const rect = other === id ? null : sections.current.get(other)?.getBoundingClientRect()
            return rect ? [rect.top + rect.height / 2] : []
        })
        return dropIndexAt(midpoints, pointerY)
    }

    const start = (id: ChartId, event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0 || !event.isPrimary || session.current) return
        const handle = event.currentTarget
        const { pointerId, clientX: startX, clientY: startY } = event
        const startIndex = latest.current.order.indexOf(id)
        let active = false
        try {
            handle.setPointerCapture(pointerId)
        } catch {
            return
        }

        const finish = () => {
            handle.removeEventListener('pointermove', onMove)
            handle.removeEventListener('pointerup', onUp)
            handle.removeEventListener('pointercancel', finish)
            handle.removeEventListener('lostpointercapture', finish)
            document.removeEventListener('keydown', onKey, true)
            if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
            session.current = null
            setDragging(null)
        }
        const onMove = (move: globalThis.PointerEvent) => {
            if (!active && Math.hypot(move.clientX - startX, move.clientY - startY) >= DRAG_THRESHOLD_PX) {
                active = true
                setDragging(id)
            }
        }
        const onUp = (up: globalThis.PointerEvent) => {
            const target = active ? targetIndex(id, up.clientY) : startIndex
            finish()
            if (target !== startIndex) latest.current.onDrop(id, target)
        }
        const onKey = (key: KeyboardEvent) => {
            if (key.key === 'Escape') finish()
        }

        handle.addEventListener('pointermove', onMove)
        handle.addEventListener('pointerup', onUp)
        handle.addEventListener('pointercancel', finish)
        handle.addEventListener('lostpointercapture', finish)
        document.addEventListener('keydown', onKey, true)
        session.current = finish
    }

    const sectionRef = (id: ChartId) => (element: HTMLElement | null) => {
        if (element) sections.current.set(id, element)
        else sections.current.delete(id)
    }

    return { dragging, start, sectionRef, sessionActive: () => session.current !== null }
}
