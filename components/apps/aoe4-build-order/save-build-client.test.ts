import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import { postSavedBuild, saveFailureMessage } from './save-build-client'

const request = { buildOrder: listBuilds()[0], durationSeconds: 900 }
const GENERIC = 'The build could not be saved. Try again.'

describe('saveFailureMessage', () => {
    const issues = { issues: [{ code: 'out-of-range', message: 'name: 117 characters, more than 100' }, { code: 'invalid', message: 'second' }] }

    it.each<[string, number | null, string | null, unknown, string]>([
        ['400 with issues gives the first issue', 400, null, issues, 'The build could not be saved: name: 117 characters, more than 100'],
        ['400 with an empty issues array', 400, null, { issues: [] }, GENERIC],
        ['400 without a readable body', 400, null, undefined, GENERIC],
        ['400 whose issue has no message', 400, null, { issues: [{}] }, GENERIC],
        ['413', 413, null, undefined, 'The build is too large to save.'],
        ['429 with 1 second', 429, '1', undefined, 'Too many saves. Try again in 1 second.'],
        ['429 with 59 seconds', 429, '59', undefined, 'Too many saves. Try again in 59 seconds.'],
        ['429 with 60 seconds', 429, '60', undefined, 'Too many saves. Try again in 1 minute.'],
        ['429 with 61 seconds rounds minutes up', 429, '61', undefined, 'Too many saves. Try again in 2 minutes.'],
        ['429 with 3600 seconds', 429, '3600', undefined, 'Too many saves. Try again in 60 minutes.'],
        ['429 without a header', 429, null, undefined, 'Too many saves. Try again later.'],
        ['429 with a word', 429, 'abc', undefined, 'Too many saves. Try again later.'],
        ['429 with 0', 429, '0', undefined, 'Too many saves. Try again later.'],
        ['429 with a fraction', 429, '1.5', undefined, 'Too many saves. Try again later.'],
        ['503', 503, null, undefined, 'Saving is unavailable right now. Try again later.'],
        ['another status', 500, null, undefined, GENERIC],
        ['a network error', null, null, undefined, GENERIC],
    ])('%s', (_label, status, retryAfter, body, expected) => {
        expect(saveFailureMessage(status, retryAfter, body)).toBe(expected)
    })
})

describe('postSavedBuild', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    function stubFetch(respond: () => Promise<Response>) {
        const fetch = vi.fn(respond)
        vi.stubGlobal('fetch', fetch)
        return fetch
    }

    const saved = { id: 'Zx3_k9-QaB0', path: '/apps/aoe4-build-order?b=Zx3_k9-QaB0' }

    it('posts the request as JSON to the builds route', async () => {
        const fetch = stubFetch(() => Promise.resolve(new Response(JSON.stringify(saved), { status: 201 })))
        const signal = new AbortController().signal
        await postSavedBuild(request, signal)
        const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
        expect(url).toBe('/api/aoe4-build-order/builds')
        expect(init.method).toBe('POST')
        expect(init.body).toBe(JSON.stringify(request))
        expect(init.signal).toBe(signal)
    })

    const ok = (status: number) => () => Promise.resolve(new Response(JSON.stringify(saved), { status }))
    const notSave = (status: number) => () => Promise.resolve(new Response('{}', { status }))

    it.each<[string, () => Promise<Response>, Awaited<ReturnType<typeof postSavedBuild>>]>([
        ['201 is a success with the response body', ok(201), { ok: true, response: saved }],
        ['200 is a success with the response body', ok(200), { ok: true, response: saved }],
        [
            '429 with Retry-After maps to minutes',
            () => Promise.resolve(new Response('{}', { status: 429, headers: { 'Retry-After': '90' } })),
            { ok: false, message: 'Too many saves. Try again in 2 minutes.' },
        ],
        ['a rejecting fetch maps to the network message', () => Promise.reject(new TypeError('offline')), { ok: false, message: GENERIC }],
        ['a 201 whose body is not a save response is a failure', notSave(201), { ok: false, message: GENERIC }],
        ['a 200 whose body is not a save response is a failure', notSave(200), { ok: false, message: GENERIC }],
    ])('%s', async (_label, respond, expected) => {
        stubFetch(respond)
        expect(await postSavedBuild(request)).toStrictEqual(expected)
    })
})
