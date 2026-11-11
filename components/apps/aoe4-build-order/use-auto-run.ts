import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { BuildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { createAutoRunController, initialAutoRunState, type AutoRunController, type AutoRunState, type LiveInput } from './auto-run'
import { postSimulation } from './simulate-client'

interface AutoRunArgs extends LiveInput {
    catalog: BuildOrderCatalog
    hold: boolean
}

type AutoRun = AutoRunState & { flush(live?: LiveInput): void; retry(): void }

// The controller is created in an effect, never during render, so the prerendered HTML and the first
// client render come from initialAutoRunState alone and nothing is posted before hydration.
export function useAutoRun({ text, duration, selected, catalog, hold }: AutoRunArgs): AutoRun {
    const controller = useRef<AutoRunController | null>(null)
    const previous = useRef({ text, duration, selected, hold })
    const [state, setState] = useState<AutoRunState | null>(null)

    useEffect(() => {
        const created = createAutoRunController(
            { catalog, post: (request, signal) => postSimulation(request.buildOrder, request.inputs?.durationSeconds ?? 0, signal) },
            { text, duration, selected },
            hold,
            setState,
        )
        controller.current = created
        setState(created.getState())
        return () => {
            created.dispose()
            controller.current = null
        }
    }, [])

    useEffect(() => {
        const before = previous.current
        previous.current = { text, duration, selected, hold }
        const current = controller.current
        if (current === null) return
        if (before.text !== text || before.duration !== duration || before.selected !== selected) current.input({ text, duration, selected })
        if (before.hold && !hold) current.release()
    }, [text, duration, selected, hold])

    const snapshot = useMemo(() => state ?? initialAutoRunState({ text, duration, selected }, catalog), [state, text, duration, selected, catalog])
    const flush = useCallback((live?: LiveInput) => controller.current?.flush(live), [])
    const retry = useCallback(() => controller.current?.retry(), [])

    return { ...snapshot, flush, retry }
}
