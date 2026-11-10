import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryBuildStore, type BuildStore } from './build-store'
import { SAVE_RATE_LIMIT, clientKey, takeSaveSlot } from './save-rate-limit'

const HOUR = 3_600_000
const W = 1_000 * HOUR

async function takeSlots(store: BuildStore, key: string, count: number, nowMs = W) {
    const results: Awaited<ReturnType<typeof takeSaveSlot>>[] = []
    for (let index = 0; index < count; index += 1) results.push(await takeSaveSlot(store, key, nowMs))
    return results
}

const storeWith = (bumpCounter: BuildStore['bumpCounter']): BuildStore => ({ ...createMemoryBuildStore(), bumpCounter })

describe('takeSaveSlot', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('allows saves 1 to 30 in a window and refuses the 31st and 32nd', async () => {
        const results = await takeSlots(createMemoryBuildStore(), 'c', 32)
        expect(results.slice(0, 30)).toStrictEqual(Array(30).fill({ ok: true }))
        expect(results.slice(30).map((result) => result.ok)).toStrictEqual([false, false])
    })

    it.each([
        [0, 3600],
        [1_800_000, 1800],
        [1_800_001, 1800],
        [HOUR - 1, 1],
    ])('refuses at window start + %i ms with retryAfterSeconds %i', async (offset, retryAfterSeconds) => {
        const store = createMemoryBuildStore()
        await takeSlots(store, 'c', 30, W)
        expect(await takeSaveSlot(store, 'c', W + offset)).toStrictEqual({ ok: false, retryAfterSeconds })
    })

    it('allows saves again in the next window', async () => {
        const store = createMemoryBuildStore()
        await takeSlots(store, 'c', 31, W)
        expect(await takeSaveSlot(store, 'c', W + HOUR)).toStrictEqual({ ok: true })
    })

    it('keeps a separate budget per client key', async () => {
        const store = createMemoryBuildStore()
        await takeSlots(store, 'a', 31)
        expect(await takeSaveSlot(store, 'b', W)).toStrictEqual({ ok: true })
    })

    it('passes the window start for the time to the store', async () => {
        const bumpCounter = vi.fn(async (_key: string, windowStart: number) => ({ windowStart, count: 1 }))
        await takeSaveSlot(storeWith(bumpCounter), 'c', W + 1_234_567)
        expect(bumpCounter).toHaveBeenCalledExactlyOnceWith('c', W)
    })

    it('refuses for one second when the counter is contended', async () => {
        expect(await takeSaveSlot(storeWith(async () => 'contended'), 'c', W)).toStrictEqual({ ok: false, retryAfterSeconds: 1 })
    })

    it('rejects when the store fails', async () => {
        const failing = storeWith(async () => {
            throw new Error('store down')
        })
        await expect(takeSaveSlot(failing, 'c', W)).rejects.toThrow('store down')
    })

    it('has frozen numbers that no environment variable changes', async () => {
        expect(Object.isFrozen(SAVE_RATE_LIMIT)).toBe(true)
        vi.stubEnv('BUILDS_SAVE_LIMIT', '1000')
        vi.stubEnv('SAVE_RATE_LIMIT', '1000')
        const results = await takeSlots(createMemoryBuildStore(), 'c', 31)
        expect(results.map((result) => result.ok).lastIndexOf(true)).toBe(29)
    })
})

const request = (forwarded?: string | string[], remoteAddress?: string) => ({ headers: forwarded === undefined ? {} : { 'x-forwarded-for': forwarded }, socket: { remoteAddress } })

describe('clientKey', () => {
    it.each([
        ['an address', request('1.2.3.4')],
        ['a non-IP string', request('spec-a')],
        ['no source at all', request()],
    ])('is 16 url-safe characters for %s', async (_label, req) => {
        expect(await clientKey(req)).toMatch(/^[A-Za-z0-9_-]{16}$/)
    })

    it('uses only url-safe characters across many sources', async () => {
        const keys = await Promise.all(Array.from({ length: 100 }, (_, index) => clientKey(request(`10.0.0.${index}`))))
        expect(keys.filter((key) => !/^[A-Za-z0-9_-]{16}$/.test(key))).toStrictEqual([])
    })

    it.each([
        ['a list, taking its first entry', request('1.2.3.4, 10.0.0.1')],
        ['a padded header', request(' 1.2.3.4 ')],
        ['an array header, taking its first element', request(['1.2.3.4', '5.6.7.8'])],
        ['the socket address when the header is missing', request(undefined, '1.2.3.4')],
        ['the socket address when the header is empty', request('', '1.2.3.4')],
        ['the header over the socket address', request('1.2.3.4', '9.9.9.9')],
    ])('equals the key of 1.2.3.4 for %s', async (_label, req) => {
        expect(await clientKey(req)).toBe(await clientKey(request('1.2.3.4')))
    })

    it.each([
        ['a different address', request('1.2.3.5')],
        ['the unknown fallback', request()],
    ])('differs from the key of 1.2.3.4 for %s', async (_label, req) => {
        expect(await clientKey(req)).not.toBe(await clientKey(request('1.2.3.4')))
    })

    it('uses unknown when neither header nor socket address is there', async () => {
        expect(await clientKey(request())).toBe(await clientKey(request('unknown')))
    })

    it('never contains the raw source, even one that is already 16 url-safe characters', async () => {
        const source = 'client-abcdefghi'
        expect(await clientKey(request(source))).not.toContain(source)
        expect(await clientKey(request(undefined, source))).not.toContain(source)
    })

    it('accepts non-IP strings and tells them apart', async () => {
        expect(await clientKey(request('spec-a'))).not.toBe(await clientKey(request('spec-b')))
    })
})
