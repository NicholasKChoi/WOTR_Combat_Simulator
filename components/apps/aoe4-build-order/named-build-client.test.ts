import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import type { NamedBuild } from '../../../lib/aoe4-build-order/named-builds'
import { createNamedBuild, loadNamedBuild, updateNamedBuild } from './named-build-client'
import { lastCall, reply, stubFetch } from './fetch-test-helpers'

const ID = 'AAAAAAAAAAAAAAAAAAAAAA'
const SECRET = 'S'.repeat(43)
const request = { buildOrder: listBuilds()[0], durationSeconds: 900 }
const GENERIC = 'The build could not be saved. Try again.'
const build: NamedBuild = {
    version: 1,
    id: ID,
    buildOrder: request.buildOrder,
    durationSeconds: 900,
    revision: 2,
    createdAt: '2026-11-10T18:00:00.000Z',
    updatedAt: '2026-11-10T19:00:00.000Z',
}
const created = { id: ID, path: `/apps/aoe4-build-order?n=${ID}`, editSecret: SECRET, revision: 1, updatedAt: build.updatedAt }
const updated = { id: ID, path: created.path, revision: 3, updatedAt: build.updatedAt }

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('loadNamedBuild', () => {
    it.each(['A'.repeat(21), 'A'.repeat(23), 'Zx3_k9-QaB0'])('%s is not found without a request', async (id) => {
        const fetch = stubFetch(reply(build, 200))
        expect(await loadNamedBuild(id, new AbortController().signal)).toStrictEqual({ status: 'not-found' })
        expect(fetch).not.toHaveBeenCalled()
    })

    it('requests the named route with the given signal and returns the build', async () => {
        const fetch = stubFetch(reply(build, 200))
        const signal = new AbortController().signal
        expect(await loadNamedBuild(ID, signal)).toStrictEqual({ status: 'ok', build })
        const [url, init] = lastCall(fetch)
        expect(url).toBe(`/api/aoe4-build-order/named-builds/${ID}`)
        expect(init.signal).toBe(signal)
    })

    it('drops a secretHash the body still carries', async () => {
        stubFetch(reply({ ...build, secretHash: 'h'.repeat(43) }, 200))
        const result = await loadNamedBuild(ID, new AbortController().signal)
        expect(result).toStrictEqual({ status: 'ok', build })
    })

    it.each<[string, unknown, number, string]>([
        ['a body without revision', { ...build, revision: undefined }, 200, 'failed'],
        ['a body whose id is not a named id', { ...build, id: 'Zx3_k9-QaB0' }, 200, 'failed'],
        ['404', { error: 'none' }, 404, 'not-found'],
    ])('%s', async (_label, body, status, expected) => {
        stubFetch(reply(body, status))
        expect(await loadNamedBuild(ID, new AbortController().signal)).toStrictEqual({ status: expected })
    })
})

describe('createNamedBuild', () => {
    it('posts the request to the named-builds route with the signal', async () => {
        const fetch = stubFetch(reply(created, 201))
        const signal = new AbortController().signal
        expect(await createNamedBuild(request, signal)).toStrictEqual({ ok: true, response: created })
        const [url, init] = lastCall(fetch)
        expect(url).toBe('/api/aoe4-build-order/named-builds')
        expect(init.method).toBe('POST')
        expect(init.body).toBe(JSON.stringify(request))
        expect(init.signal).toBe(signal)
    })

    it.each<[string, unknown, number]>([
        ['a 200 with a valid body', created, 200],
        ['a 201 without editSecret', { ...created, editSecret: undefined }, 201],
        ['a 201 whose revision is not 1', { ...created, revision: 2 }, 201],
    ])('%s is a failure of kind other', async (_label, body, status) => {
        stubFetch(reply(body, status))
        expect(await createNamedBuild(request)).toStrictEqual({ ok: false, kind: 'other', message: GENERIC })
    })
})

describe('updateNamedBuild', () => {
    it('puts with the bearer secret and the quoted revision', async () => {
        const fetch = stubFetch(reply(updated, 200))
        const signal = new AbortController().signal
        expect(await updateNamedBuild(ID, SECRET, 2, request, signal)).toStrictEqual({ ok: true, response: updated })
        const [url, init] = lastCall(fetch)
        const headers = new Headers(init.headers)
        expect(url).toBe(`/api/aoe4-build-order/named-builds/${ID}`)
        expect(init.method).toBe('PUT')
        expect(init.body).toBe(JSON.stringify(request))
        expect(init.signal).toBe(signal)
        expect(headers.get('Authorization')).toBe(`Bearer ${SECRET}`)
        expect(headers.get('If-Match')).toBe('"2"')
    })

    it.each<[string, unknown, number]>([
        ['a 201 with a valid body', updated, 201],
        ['a 200 without revision', { ...updated, revision: undefined }, 200],
    ])('%s is a failure of kind other', async (_label, body, status) => {
        stubFetch(reply(body, status))
        expect(await updateNamedBuild(ID, SECRET, 2, request)).toStrictEqual({ ok: false, kind: 'other', message: GENERIC })
    })
})

describe('failures of create and update', () => {
    const CONFLICT = 'This build changed somewhere else. Choose it again to get the latest version, or save a copy.'
    const FORBIDDEN = 'You cannot edit this build here. Save a copy instead.'
    const GONE = 'This build no longer exists. Save a copy instead.'

    it.each<[string, () => Promise<Response>, string, string]>([
        ['412', reply({ error: 'stale' }, 412), 'conflict', CONFLICT],
        ['401', reply({ error: 'no' }, 401), 'forbidden', FORBIDDEN],
        ['403', reply({ error: 'no' }, 403), 'forbidden', FORBIDDEN],
        ['404', reply({ error: 'none' }, 404), 'not-found', GONE],
        ['400 with an issue', reply({ issues: [{ message: 'name: too long' }] }, 400), 'other', 'The build could not be saved: name: too long'],
        ['413', reply({ error: 'big' }, 413), 'other', 'The build is too large to save.'],
        ['429 with Retry-After 90', reply({ error: 'slow' }, 429, { 'Retry-After': '90' }), 'other', 'Too many saves. Try again in 2 minutes.'],
        ['503', reply({ error: 'down' }, 503), 'other', 'Saving is unavailable right now. Try again later.'],
        ['500', reply({ error: 'boom' }, 500), 'other', GENERIC],
        ['a rejecting fetch', () => Promise.reject(new TypeError('offline')), 'other', GENERIC],
    ])('%s', async (_label, respond, kind, message) => {
        const expected = { ok: false, kind, message }
        stubFetch(respond)
        expect(await createNamedBuild(request)).toStrictEqual(expected)
        expect(await updateNamedBuild(ID, SECRET, 2, request)).toStrictEqual(expected)
    })
})
