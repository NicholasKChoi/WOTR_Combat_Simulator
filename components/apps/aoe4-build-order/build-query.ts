import type { ParsedUrlQuery } from 'querystring'

import type { LibraryEntryKind } from './build-library'

export const NAMED_BUILD_QUERY_KEY = 'n'
export const SAVED_BUILD_QUERY_KEY = 'b'

export type InitialBuildQuery = { kind: 'named'; id: string } | { kind: 'link'; id: string } | { kind: 'none' }

function firstValue(value: string | string[] | undefined): string | undefined {
    const first = Array.isArray(value) ? value[0] : value
    return first === '' ? undefined : first
}

export function initialBuildQuery(query: ParsedUrlQuery): InitialBuildQuery {
    const named = firstValue(query[NAMED_BUILD_QUERY_KEY])
    if (named !== undefined) return { kind: 'named', id: named }
    const link = firstValue(query[SAVED_BUILD_QUERY_KEY])
    if (link !== undefined) return { kind: 'link', id: link }
    return { kind: 'none' }
}

export function nextBuildQuery(query: ParsedUrlQuery, entry: { kind: LibraryEntryKind; id: string | null }): ParsedUrlQuery {
    const next: ParsedUrlQuery = {}
    for (const [key, value] of Object.entries(query)) {
        if (key !== NAMED_BUILD_QUERY_KEY && key !== SAVED_BUILD_QUERY_KEY && value !== undefined) next[key] = value
    }
    if (entry.id === null) return next
    if (entry.kind === 'mine' || entry.kind === 'shared') next[NAMED_BUILD_QUERY_KEY] = entry.id
    else if (entry.kind === 'link') next[SAVED_BUILD_QUERY_KEY] = entry.id
    return next
}
