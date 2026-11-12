import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import type { SavedBuild } from '../../../lib/aoe4-build-order/saved-builds'
import { lastCall, reply, stubFetch } from './fetch-test-helpers'
import { loadSavedBuild } from './saved-build-loader'

const ID = 'Zx3_k9-QaB0'
const saved: SavedBuild = { version: 1, buildOrder: { ...listBuilds()[0], name: 'Fast Castle' }, durationSeconds: 900 }

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('loadSavedBuild', () => {
    it.each(['abc', 'Zx3_k9-QaB0X', 'Zx3_k9-QaB!'])('%s is not found without a request', async (id) => {
        const fetch = stubFetch(reply(saved))
        expect(await loadSavedBuild(id, new AbortController().signal)).toStrictEqual({ status: 'not-found' })
        expect(fetch).not.toHaveBeenCalled()
    })

    it('requests the build with the given signal', async () => {
        const fetch = stubFetch(reply(saved))
        const signal = new AbortController().signal
        await loadSavedBuild(ID, signal)
        expect(fetch).toHaveBeenCalledTimes(1)
        const [url, init] = lastCall(fetch)
        expect(url).toBe(`/api/aoe4-build-order/builds/${ID}`)
        expect(init.signal).toBe(signal)
        expect(new Headers(init.headers).get('Accept')).toBe('application/json')
    })

    it('returns the parsed record without the id key', async () => {
        stubFetch(reply({ ...saved, id: ID }))
        const result = await loadSavedBuild(ID, new AbortController().signal)
        expect(result).toStrictEqual({ status: 'ok', saved })
    })

    it.each<[string, string, () => Promise<Response>]>([
        ['a record of another version', 'failed', reply({ ...saved, version: 2 })],
        ['404', 'not-found', reply({ error: 'not found' }, 404)],
    ])('%s gives %s', async (_label, status, respond) => {
        stubFetch(respond)
        expect(await loadSavedBuild(ID, new AbortController().signal)).toStrictEqual({ status })
    })
})
