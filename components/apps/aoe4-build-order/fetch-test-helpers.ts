import { vi } from 'vitest'

export function stubFetch(respond: (init?: RequestInit) => Promise<Response>) {
    const fetch = vi.fn((_url: string, init?: RequestInit) => (init?.signal?.aborted ? Promise.reject(new DOMException('aborted', 'AbortError')) : respond(init)))
    vi.stubGlobal('fetch', fetch)
    return fetch
}

export function lastCall(fetch: ReturnType<typeof stubFetch>): [string, RequestInit] {
    return fetch.mock.calls.at(-1) as unknown as [string, RequestInit]
}

export const reply = (body: unknown, status = 200, headers?: Record<string, string>) => () => Promise.resolve(new Response(JSON.stringify(body), { status, headers }))
