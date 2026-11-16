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

function place(anchor: DOMRect, popover: DOMRect): Position {
    const viewport = document.documentElement
    const below = anchor.bottom + ANCHOR_GAP_PX
    const fitsBelow = below + popover.height <= viewport.clientHeight - VIEWPORT_MARGIN_PX
    const top = fitsBelow ? below : anchor.top - ANCHOR_GAP_PX - popover.height
    return {
        left: clamp(anchor.left, VIEWPORT_MARGIN_PX, viewport.clientWidth - popover.width - VIEWPORT_MARGIN_PX),
        top: clamp(top, VIEWPORT_MARGIN_PX, viewport.clientHeight - popover.height - VIEWPORT_MARGIN_PX),
    }
}

// Rendered through a portal: the annotation column clips its children, and the editor's
// inline-size container would become the containing block of a fixed child.
export function AnnotationPopover({ anchor, text }: { anchor: RefObject<HTMLElement | null>; text: string }) {
    const popoverRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<Position | null>(null)
    useLayoutEffect(() => {
        const update = () => {
            if (anchor.current !== null && popoverRef.current !== null) {
                setPosition(place(anchor.current.getBoundingClientRect(), popoverRef.current.getBoundingClientRect()))
            }
        }
        update()
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => {
            window.removeEventListener('scroll', update, true)
            window.removeEventListener('resize', update)
        }
    }, [anchor, text])
    return createPortal(
        <div
            ref={popoverRef}
            data-testid="build-order-annotation-popover"
            className={styles.annotationPopover}
            style={position === null ? { visibility: 'hidden' } : position}
        >
            {text}
        </div>,
        document.body,
    )
}
