import type { SaveBuildRequest, SaveBuildResponse } from '../../../lib/aoe4-build-order/saved-builds'

const GENERIC_FAILURE = 'The build could not be saved. Try again.'

function plural(count: number, unit: string): string {
    return `${count} ${unit}${count === 1 ? '' : 's'}`
}

function retryWait(retryAfter: string | null): string {
    const seconds = retryAfter !== null && /^\d+$/.test(retryAfter) ? Number(retryAfter) : 0
    if (seconds < 1) return 'later'
    return `in ${seconds < 60 ? plural(seconds, 'second') : plural(Math.ceil(seconds / 60), 'minute')}`
}

function firstIssueMessage(body: unknown): string | null {
    if (typeof body !== 'object' || body === null || !('issues' in body) || !Array.isArray(body.issues)) return null
    const first: unknown = body.issues[0]
    if (typeof first !== 'object' || first === null || !('message' in first) || typeof first.message !== 'string') return null
    return first.message
}

export function saveFailureMessage(status: number | null, retryAfter: string | null, body: unknown): string {
    switch (status) {
        case 400: {
            const message = firstIssueMessage(body)
            return message === null ? GENERIC_FAILURE : `The build could not be saved: ${message}`
        }
        case 413:
            return 'The build is too large to save.'
        case 429:
            return `Too many saves. Try again ${retryWait(retryAfter)}.`
        case 503:
            return 'Saving is unavailable right now. Try again later.'
        default:
            return GENERIC_FAILURE
    }
}

function isSaveBuildResponse(body: unknown): body is SaveBuildResponse {
    return typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string' && 'path' in body && typeof body.path === 'string'
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json()
    } catch {
        return undefined
    }
}

export async function postSavedBuild(request: SaveBuildRequest, signal?: AbortSignal): Promise<{ ok: true; response: SaveBuildResponse } | { ok: false; message: string }> {
    let response: Response
    try {
        response = await fetch('/api/aoe4-build-order/builds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(request),
            signal,
        })
    } catch {
        return { ok: false, message: saveFailureMessage(null, null, undefined) }
    }
    const body = await readJson(response)
    if ((response.status === 201 || response.status === 200) && isSaveBuildResponse(body)) return { ok: true, response: { id: body.id, path: body.path } }
    return { ok: false, message: saveFailureMessage(response.status, response.headers.get('Retry-After'), body) }
}
