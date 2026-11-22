import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'

import styles from './workbench.module.css'

const VIEWPORT_MARGIN_PX = 8
const ANCHOR_GAP_PX = 4

interface Position {
    left: number
    top: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

type Rect = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>

export interface PlacementRects {
    anchor: Rect
    textarea: Rect
    popover: Rect
    viewport: { width: number; height: number }
}

export function placePopover({ anchor, textarea, popover, viewport }: PlacementRects): Position {
    const maxLeft = viewport.width - popover.width - VIEWPORT_MARGIN_PX
    const maxTop = viewport.height - popover.height - VIEWPORT_MARGIN_PX
    const beside = textarea.right + ANCHOR_GAP_PX
    if (beside <= maxLeft) return { left: beside, top: clamp(anchor.top, VIEWPORT_MARGIN_PX, maxTop) }
    const below = anchor.bottom + ANCHOR_GAP_PX
    const top = below <= maxTop ? below : anchor.top - ANCHOR_GAP_PX - popover.height
    return { left: clamp(anchor.left, VIEWPORT_MARGIN_PX, maxLeft), top: clamp(top, VIEWPORT_MARGIN_PX, maxTop) }
}

export function PopoverLines({ text }: { text: string }) {
    return (
        <>
            {text.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
            ))}
        </>
    )
}

// Rendered through a portal: the annotation column clips its children, and the editor's
// inline-size container would become the containing block of a fixed child.
export function AnnotationPopover({
    anchor,
    textarea,
    text,
}: {
    anchor: RefObject<HTMLElement | null>
    textarea: RefObject<HTMLElement | null>
    text: string
}) {
    const popoverRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<Position | null>(null)
    useLayoutEffect(() => {
        const update = () => {
            if (anchor.current !== null && textarea.current !== null && popoverRef.current !== null) {
                const { clientWidth, clientHeight } = document.documentElement
                setPosition(
                    placePopover({
                        anchor: anchor.current.getBoundingClientRect(),
                        textarea: textarea.current.getBoundingClientRect(),
                        popover: popoverRef.current.getBoundingClientRect(),
                        viewport: { width: clientWidth, height: clientHeight },
                    }),
                )
            }
        }
        update()
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => {
            window.removeEventListener('scroll', update, true)
            window.removeEventListener('resize', update)
        }
    }, [anchor, textarea, text])
    return createPortal(
        <div
            ref={popoverRef}
            data-testid="build-order-annotation-popover"
            className={styles.annotationPopover}
            style={position === null ? { visibility: 'hidden' } : position}
        >
            <PopoverLines text={text} />
        </div>,
        document.body,
    )
}
