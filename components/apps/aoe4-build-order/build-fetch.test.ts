import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { loadJson, sendJson } from './build-fetch'
import { lastCall, reply, stubFetch } from './fetch-test-helpers'

const schema = z.object({ name: z.string() })
const VALUE = { name: 'Fast Castle' }

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('loadJson', () => {
    const aborted = new AbortController()
    aborted.abort()

    it.each<[string, () => Promise<Response>, AbortSignal, unknown]>([
        ['200 with a valid body', reply(VALUE), new AbortController().signal, { status: 'ok', value: VALUE }],
        ['404', reply({ error: 'none' }, 404), new AbortController().signal, { status: 'not-found' }],
        ['500', reply({ error: 'boom' }, 500), new AbortController().signal, { status: 'failed' }],
        ['503', reply({ error: 'down' }, 503), new AbortController().signal, { status: 'failed' }],
        ['200 with a body failing the schema', reply({ name: 3 }), new AbortController().signal, { status: 'failed' }],
        ['200 with a body that is not JSON', () => Promise.resolve(new Response('<html>', { status: 200 })), new AbortController().signal, { status: 'failed' }],
        ['a rejecting fetch', () => Promise.reject(new TypeError('offline')), new AbortController().signal, { status: 'failed' }],
        ['an already-aborted signal', reply(VALUE), aborted.signal, { status: 'failed' }],
    ])('%s', async (_label, respond, signal, expected) => {
        stubFetch(respond)
        expect(await loadJson('/x', schema, signal)).toStrictEqual(expected)
    })

    it('requests the path with Accept: application/json and the given signal', async () => {
        const fetch = stubFetch(reply(VALUE))
        const signal = new AbortController().signal
        await loadJson('/x/y', schema, signal)
        expect(fetch).toHaveBeenCalledTimes(1)
        const [url, init] = lastCall(fetch)
        expect(url).toBe('/x/y')
        expect(init.signal).toBe(signal)
        expect(new Headers(init.headers).get('Accept')).toBe('application/json')
    })
})

describe('sendJson', () => {
    const body = { a: 1, nested: { b: ['c'] } }

    it('sends the method, JSON body, default headers, extra headers and the signal', async () => {
        const fetch = stubFetch(reply({}))
        const signal = new AbortController().signal
        await sendJson('/x', { method: 'PUT', headers: { Authorization: 'Bearer abc', 'If-Match': '"3"' }, body }, signal)
        const [url, init] = lastCall(fetch)
        const headers = new Headers(init.headers)
        expect(url).toBe('/x')
        expect(init.method).toBe('PUT')
        expect(init.body).toBe(JSON.stringify(body))
        expect(init.signal).toBe(signal)
        expect(headers.get('Content-Type')).toBe('application/json')
        expect(headers.get('Accept')).toBe('application/json')
        expect(headers.get('Authorization')).toBe('Bearer abc')
        expect(headers.get('If-Match')).toBe('"3"')
    })

    it('sends only the default headers when none are given', async () => {
        const fetch = stubFetch(reply({}))
        await sendJson('/x', { method: 'POST', body })
        const headers = new Headers(lastCall(fetch)[1].headers)
        expect([...headers.keys()].sort()).toStrictEqual(['accept', 'content-type'])
    })

    const failed = { status: null, retryAfter: null, body: undefined }
    const aborted = new AbortController()
    aborted.abort()

    it.each<[string, () => Promise<Response>, AbortSignal | undefined, unknown]>([
        ['a JSON reply', reply({ id: 'x' }, 201), undefined, { status: 201, retryAfter: null, body: { id: 'x' } }],
        ['a reply with Retry-After', reply({}, 429, { 'Retry-After': '90' }), undefined, { status: 429, retryAfter: '90', body: {} }],
        ['a reply that is not JSON', () => Promise.resolve(new Response('<html>', { status: 502 })), undefined, { status: 502, retryAfter: null, body: undefined }],
        ['a rejecting fetch', () => Promise.reject(new TypeError('offline')), undefined, failed],
        ['an already-aborted signal', reply({}), aborted.signal, failed],
    ])('returns the reply for %s', async (_label, respond, signal, expected) => {
        stubFetch(respond)
        expect(await sendJson('/x', { method: 'POST', body }, signal)).toStrictEqual(expected)
    })
})
