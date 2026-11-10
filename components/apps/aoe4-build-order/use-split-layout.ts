import { useSyncExternalStore } from 'react'

export const WORKBENCH_SPLIT_QUERY = '(min-width: 1200px)'

function subscribe(onChange: () => void): () => void {
    const query = window.matchMedia(WORKBENCH_SPLIT_QUERY)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(WORKBENCH_SPLIT_QUERY).matches
const getServerSnapshot = () => false

// False on the server and on the first client render, so hydration matches the static HTML.
export function useSplitLayout(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
