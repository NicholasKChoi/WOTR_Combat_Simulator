// Usage: node data/aoe4-build-order/check-freshness.mjs
// Compares aoe4world/english.json with the latest commit of its upstream repo. Read-only.
// Exit codes: 0 fresh, 1 stale, 2 upstream unreachable or answering with an error.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { KINDS, filterEnglish, getJson, rawKindUrl } from './snapshot-source.mjs'

export const EXIT_FRESH = 0
export const EXIT_STALE = 1
export const EXIT_UNREACHABLE = 2

const idsOf = (entries) => entries.map((entry) => entry.id)

function diffKind(kind, committed, upstream) {
    if (isDeepStrictEqual(committed, upstream)) {
        return null
    }
    const committedById = new Map(committed.map((entry) => [entry.id, entry]))
    const upstreamById = new Map(upstream.map((entry) => [entry.id, entry]))
    const added = idsOf(upstream).filter((id) => !committedById.has(id))
    const removed = idsOf(committed).filter((id) => !upstreamById.has(id))
    const changed = idsOf(upstream).filter(
        (id) => committedById.has(id) && !isDeepStrictEqual(committedById.get(id), upstreamById.get(id)),
    )
    return { kind, committedCount: committed.length, upstreamCount: upstream.length, added, removed, changed }
}

/** Stale means a kind's English entries differ in content or order; `source` and commit shas are ignored. */
export function compareSnapshot(snapshot, upstream) {
    const differing = KINDS.map((kind) => diffKind(kind, snapshot[kind], upstream[kind])).filter(Boolean)
    return { stale: differing.length > 0, differing }
}

function describeDiff({ kind, committedCount, upstreamCount, added, removed, changed }) {
    const parts = [`${committedCount} committed, ${upstreamCount} upstream`]
    if (added.length) parts.push(`added: ${added.join(', ')}`)
    if (removed.length) parts.push(`removed: ${removed.join(', ')}`)
    if (changed.length) parts.push(`changed: ${changed.join(', ')}`)
    if (!added.length && !removed.length && !changed.length) parts.push('same entries in a different order')
    return `  ${kind}: ${parts.join('; ')}`
}

/** Returns `{ code, message }`; never throws and never writes. */
export async function checkFreshness(snapshot, fetchImpl = fetch) {
    const { repo, commit } = snapshot.source
    let latest
    const upstream = {}
    try {
        const head = await getJson(`https://api.github.com/repos/${repo}/commits/HEAD`, fetchImpl)
        latest = head.sha
        for (const kind of KINDS) {
            const { data } = await getJson(rawKindUrl(latest, kind), fetchImpl)
            upstream[kind] = filterEnglish(data)
        }
    } catch (error) {
        return { code: EXIT_UNREACHABLE, message: `Could not check ${repo} for updates: ${error.message}` }
    }
    const { stale, differing } = compareSnapshot(snapshot, upstream)
    if (!stale) {
        return { code: EXIT_FRESH, message: `Snapshot is fresh: English entries at ${commit} match ${repo} at ${latest}.` }
    }
    const lines = [
        `Snapshot is stale: English entries at ${commit} differ from ${repo} at ${latest}.`,
        ...differing.map(describeDiff),
        'Refresh it with the steps under "Refreshing the snapshot" in data/aoe4-build-order/README.md.',
    ]
    return { code: EXIT_STALE, message: lines.join('\n') }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const file = join(dirname(fileURLToPath(import.meta.url)), 'aoe4world', 'english.json')
    const { code, message } = await checkFreshness(JSON.parse(readFileSync(file, 'utf8')))
    ;(code === EXIT_FRESH ? console.log : console.error)(message)
    process.exit(code)
}
