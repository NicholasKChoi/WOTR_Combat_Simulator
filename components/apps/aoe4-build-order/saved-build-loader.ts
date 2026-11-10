import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { isSavedBuildId, savedBuildSchema, type SavedBuild } from '../../../lib/aoe4-build-order/saved-builds'
import type { PrebuiltBuild } from './build-input'

type LoadResult = { status: 'ok'; saved: SavedBuild } | { status: 'not-found' } | { status: 'failed' }

export async function loadSavedBuild(id: string, signal: AbortSignal): Promise<LoadResult> {
    if (!isSavedBuildId(id)) return { status: 'not-found' }
    try {
        const response = await fetch(`/api/aoe4-build-order/builds/${id}`, { headers: { Accept: 'application/json' }, signal })
        if (response.status === 404) return { status: 'not-found' }
        if (response.status !== 200) return { status: 'failed' }
        const parsed = savedBuildSchema.safeParse(await response.json())
        return parsed.success ? { status: 'ok', saved: parsed.data } : { status: 'failed' }
    } catch {
        return { status: 'failed' }
    }
}

export function savedBuildOption(id: string, saved: SavedBuild): PrebuiltBuild {
    return { name: `${saved.buildOrder.name} (${id})`, text: formatBuildOrderText(saved.buildOrder), buildName: saved.buildOrder.name }
}
