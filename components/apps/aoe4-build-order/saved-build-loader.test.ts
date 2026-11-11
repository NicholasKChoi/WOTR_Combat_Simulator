import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBuilds } from '../../../lib/aoe4-build-order/builds'
import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import type { SavedBuild } from '../../../lib/aoe4-build-order/saved-builds'
import { buildOrderCatalog } from '../../../lib/aoe4-build-order/schema'
import { ENGLISH } from '../../../lib/aoe4-build-order/test-helpers'
import { textToBuildOrder } from '../../../lib/aoe4-build-order/text-to-build'
import { loadSavedBuild, savedBuildOption } from './saved-build-loader'

const ID = 'Zx3_k9-QaB0'
const saved: SavedBuild = { version: 1, buildOrder: { ...listBuilds()[0], name: 'Fast Castle' }, durationSeconds: 900 }

function stubFetch(respond: (init?: RequestInit) => Promise<Response>) {
    const fetch = vi.fn((_url: string, init?: RequestInit) => respond(init))
    vi.stubGlobal('fetch', fetch)
    return fetch
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('savedBuildOption', () => {
    const option = savedBuildOption(ID, saved)

    it('labels the option with the id but keeps the stored name as the build name', () => {
        expect(option.name).toBe(`Fast Castle (${ID})`)
        expect(option.buildName).toBe('Fast Castle')
    })

    it('carries the canonical text, which converts back to the saved order', () => {
        expect(option.text).toBe(formatBuildOrderText(saved.buildOrder))
        const reopened = textToBuildOrder(option.text, buildOrderCatalog(ENGLISH))
        expect(reopened.ok && reopened.order.steps).toStrictEqual(saved.buildOrder.steps)
    })
})

describe('loadSavedBuild', () => {
    const json = (body: unknown, status = 200) => () => Promise.resolve(new Response(JSON.stringify(body), { status }))

    it.each(['abc', 'Zx3_k9-QaB0X', 'Zx3_k9-QaB!'])('%s is not found without a request', async (id) => {
        const fetch = stubFetch(json(saved))
        expect(await loadSavedBuild(id, new AbortController().signal)).toStrictEqual({ status: 'not-found' })
        expect(fetch).not.toHaveBeenCalled()
    })

    it('requests the build with the given signal', async () => {
        const fetch = stubFetch(json(saved))
        const signal = new AbortController().signal
        await loadSavedBuild(ID, signal)
        expect(fetch).toHaveBeenCalledTimes(1)
        const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
        expect(url).toBe(`/api/aoe4-build-order/builds/${ID}`)
        expect(init.signal).toBe(signal)
        expect(new Headers(init.headers).get('Accept')).toBe('application/json')
    })

    it('returns the parsed record without the id key', async () => {
        stubFetch(json({ ...saved, id: ID }))
        const result = await loadSavedBuild(ID, new AbortController().signal)
        expect(result).toStrictEqual({ status: 'ok', saved })
    })

    it.each<[string, string, () => Promise<Response>]>([
        ['a record of another version', 'failed', json({ ...saved, version: 2 })],
        ['404', 'not-found', json({ error: 'not found' }, 404)],
    ])('%s gives %s', async (_label, status, respond) => {
        stubFetch(respond)
        expect(await loadSavedBuild(ID, new AbortController().signal)).toStrictEqual({ status })
    })
})
