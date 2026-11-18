import { useEffect, type RefObject } from 'react'

const MARKER_CONTROL_HEIGHT_PROPERTY = '--aoe4-marker-control-height'

export function useMarkerControlHeight(ref: RefObject<HTMLElement | null>, present: boolean): void {
    useEffect(() => {
        const control = ref.current
        const section = control?.closest('section')
        if (!present || !control || !section || typeof ResizeObserver === 'undefined') return
        const write = () => section.style.setProperty(MARKER_CONTROL_HEIGHT_PROPERTY, `${control.getBoundingClientRect().height}px`)
        write()
        const observer = new ResizeObserver(write)
        observer.observe(control)
        return () => {
            observer.disconnect()
            section.style.removeProperty(MARKER_CONTROL_HEIGHT_PROPERTY)
        }
    }, [ref, present])
}
