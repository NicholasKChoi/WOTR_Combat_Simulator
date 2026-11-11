import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { isSavedBuildId, savedBuildSchema, type SavedBuild } from '../../../lib/aoe4-build-order/saved-builds'
import type { PrebuiltBuild } from './build-input'
import { loadJson } from './build-fetch'

type LoadResult = { status: 'ok'; saved: SavedBuild } | { status: 'not-found' } | { status: 'failed' }

export async function loadSavedBuild(id: string, signal: AbortSignal): Promise<LoadResult> {
    if (!isSavedBuildId(id)) return { status: 'not-found' }
    const result = await loadJson(`/api/aoe4-build-order/builds/${id}`, savedBuildSchema, signal)
    return result.status === 'ok' ? { status: 'ok', saved: result.value } : result
}

export function savedBuildOption(id: string, saved: SavedBuild): PrebuiltBuild {
    return { name: `${saved.buildOrder.name} (${id})`, text: formatBuildOrderText(saved.buildOrder), buildName: saved.buildOrder.name }
}
