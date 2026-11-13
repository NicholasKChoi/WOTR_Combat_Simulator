import { useEffect, type RefObject } from 'react'

const RUN_BAR_HEIGHT_PROPERTY = '--aoe4-run-bar-height'

export function useRunBarHeight(ref: RefObject<HTMLElement | null>): void {
    useEffect(() => {
        const form = ref.current
        const section = form?.closest('section')
        if (!form || !section || typeof ResizeObserver === 'undefined') return
        const write = () => {
            const margin = parseFloat(getComputedStyle(form).marginBottom) || 0
            section.style.setProperty(RUN_BAR_HEIGHT_PROPERTY, `${form.getBoundingClientRect().height + margin}px`)
        }
        write()
        const observer = new ResizeObserver(write)
        observer.observe(form)
        return () => {
            observer.disconnect()
            section.style.removeProperty(RUN_BAR_HEIGHT_PROPERTY)
        }
    }, [ref])
}
