import type { z } from 'zod'

export type LoadJsonResult<T> = { status: 'ok'; value: T } | { status: 'not-found' } | { status: 'failed' }

export interface JsonReply {
    status: number | null
    retryAfter: string | null
    body: unknown
}

export async function loadJson<T>(path: string, schema: z.ZodType<T>, signal: AbortSignal): Promise<LoadJsonResult<T>> {
    try {
        const response = await fetch(path, { headers: { Accept: 'application/json' }, signal })
        if (response.status === 404) return { status: 'not-found' }
        if (response.status !== 200) return { status: 'failed' }
        const parsed = schema.safeParse(await response.json())
        return parsed.success ? { status: 'ok', value: parsed.data } : { status: 'failed' }
    } catch {
        return { status: 'failed' }
    }
}

export async function sendJson(
    path: string,
    init: { method: 'POST' | 'PUT'; headers?: Record<string, string>; body: unknown },
    signal?: AbortSignal,
): Promise<JsonReply> {
    let response: Response
    try {
        response = await fetch(path, {
            method: init.method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init.headers },
            body: JSON.stringify(init.body),
            signal,
        })
    } catch {
        return { status: null, retryAfter: null, body: undefined }
    }
    let body: unknown
    try {
        body = await response.json()
    } catch {
        body = undefined
    }
    return { status: response.status, retryAfter: response.headers.get('Retry-After'), body }
}
