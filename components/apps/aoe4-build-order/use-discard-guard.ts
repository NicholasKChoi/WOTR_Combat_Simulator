import { useEffect } from 'react'

export function blockUnload(event: BeforeUnloadEvent): void {
    event.preventDefault()
    event.returnValue = ''
}

export function useDiscardGuard(edited: boolean): void {
    useEffect(() => {
        if (!edited) return undefined
        window.addEventListener('beforeunload', blockUnload)
        return () => window.removeEventListener('beforeunload', blockUnload)
    }, [edited])
}
