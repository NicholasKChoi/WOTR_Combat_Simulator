import { BlobNotFoundError, BlobPreconditionFailedError, del, get, head, put } from '@vercel/blob'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBlobBuildStore } from './blob-build-store'

vi.mock('@vercel/blob', async (importOriginal) => {
    const original = await importOriginal<typeof import('@vercel/blob')>()
    return { ...original, put: vi.fn(), get: vi.fn(), head: vi.fn(), del: vi.fn() }
})

const STORE_ID = 'store_x'
const ID = 'Zx3_k9-QaB0'
const BUILD_KEY = `preview/builds/${ID}.json`
const COUNTER_KEY = 'preview/rate-limit/c.json'
const NAMED_ID = 'Nm3_k9-QaB0Nm3_k9-QaB0'
const NAMED_KEY = `preview/named-builds/${NAMED_ID}.json`
const PUT_OPTIONS = { access: 'private', addRandomSuffix: false, contentType: 'application/json', storeId: STORE_ID }
const W = 3_600_000 * 1_000
const LIMIT = 30

const store = () => createBlobBuildStore(STORE_ID, 'preview')

function found(value: unknown, etag = 'etag-1') {
    return { statusCode: 200, stream: new Response(JSON.stringify(value)).body, headers: new Headers(), blob: { etag } } as unknown as Awaited<ReturnType<typeof get>>
}

const counterPuts = () => vi.mocked(put).mock.calls.map(([key, body, options]) => ({ key, body: JSON.parse(body as string), options }))

beforeEach(() => {
    vi.mocked(put).mockReset().mockResolvedValue({} as Awaited<ReturnType<typeof put>>)
    vi.mocked(get).mockReset().mockResolvedValue(null)
    vi.mocked(head).mockReset().mockRejectedValue(new BlobNotFoundError())
    vi.mocked(del).mockReset().mockResolvedValue(undefined)
})

describe('putBuild', () => {
    it('creates the blob privately, without a suffix or overwrite', async () => {
        expect(await store().putBuild(ID, '{"a":1}')).toBe('created')
        expect(put).toHaveBeenCalledExactlyOnceWith(BUILD_KEY, '{"a":1}', {
            access: 'private',
            addRandomSuffix: false,
            allowOverwrite: false,
            contentType: 'application/json',
            storeId: STORE_ID,
        })
    })

    it('reports exists when put fails and the blob is there', async () => {
        vi.mocked(put).mockRejectedValue(new Error('already exists'))
        vi.mocked(head).mockResolvedValue({} as Awaited<ReturnType<typeof head>>)
        expect(await store().putBuild(ID, '{}')).toBe('exists')
        expect(head).toHaveBeenCalledExactlyOnceWith(BUILD_KEY, { storeId: STORE_ID })
    })

    it('rethrows the put error when the blob is not there', async () => {
        const putError = new Error('service down')
        vi.mocked(put).mockRejectedValue(putError)
        vi.mocked(head).mockRejectedValue(new Error('head failed'))
        await expect(store().putBuild(ID, '{}')).rejects.toBe(putError)
    })
})

describe('getBuild', () => {
    it.each([
        ['get returns null', () => vi.mocked(get).mockResolvedValue(null)],
        ['get throws BlobNotFoundError', () => vi.mocked(get).mockRejectedValue(new BlobNotFoundError())],
    ])('reads an absent build as null when %s', async (_label, arrange) => {
        arrange()
        expect(await store().getBuild(ID)).toBeNull()
    })

    it('parses a present build', async () => {
        vi.mocked(get).mockResolvedValue(found({ version: 1 }))
        expect(await store().getBuild(ID)).toStrictEqual({ version: 1 })
        expect(get).toHaveBeenCalledExactlyOnceWith(BUILD_KEY, { access: 'private', storeId: STORE_ID })
    })

    it('propagates any other get error', async () => {
        vi.mocked(get).mockRejectedValue(new Error('service down'))
        await expect(store().getBuild(ID)).rejects.toThrow('service down')
    })
})

describe('deleteBuild', () => {
    it('deletes the build key', async () => {
        await expect(store().deleteBuild(ID)).resolves.toBeUndefined()
        expect(del).toHaveBeenCalledExactlyOnceWith(BUILD_KEY, { storeId: STORE_ID })
    })

    it('propagates BlobNotFoundError from del', async () => {
        const notFound = new BlobNotFoundError()
        vi.mocked(del).mockRejectedValue(notFound)
        await expect(store().deleteBuild(ID)).rejects.toBe(notFound)
    })
})

describe('createNamed', () => {
    it('creates the named blob without overwrite or ifMatch', async () => {
        expect(await store().createNamed(NAMED_ID, '{"a":1}')).toBe('created')
        expect(put).toHaveBeenCalledExactlyOnceWith(NAMED_KEY, '{"a":1}', { ...PUT_OPTIONS, allowOverwrite: false })
    })

    it('reports exists when put fails and the blob is there', async () => {
        vi.mocked(put).mockRejectedValue(new Error('already exists'))
        vi.mocked(head).mockResolvedValue({} as Awaited<ReturnType<typeof head>>)
        expect(await store().createNamed(NAMED_ID, '{}')).toBe('exists')
        expect(head).toHaveBeenCalledExactlyOnceWith(NAMED_KEY, { storeId: STORE_ID })
    })

    it('rethrows the put error when head fails', async () => {
        const putError = new Error('service down')
        vi.mocked(put).mockRejectedValue(putError)
        vi.mocked(head).mockRejectedValue(new Error('head failed'))
        await expect(store().createNamed(NAMED_ID, '{}')).rejects.toBe(putError)
    })
})

describe('getNamed', () => {
    it('reads the value and the blob etag without the cache', async () => {
        vi.mocked(get).mockResolvedValue(found({ revision: 3 }, 'etag-3'))
        expect(await store().getNamed(NAMED_ID)).toStrictEqual({ value: { revision: 3 }, etag: 'etag-3' })
        expect(get).toHaveBeenCalledExactlyOnceWith(NAMED_KEY, { access: 'private', storeId: STORE_ID, useCache: false })
    })

    it.each([
        ['get returns null', () => vi.mocked(get).mockResolvedValue(null)],
        ['get throws BlobNotFoundError', () => vi.mocked(get).mockRejectedValue(new BlobNotFoundError())],
    ])('reads an absent named build as null when %s', async (_label, arrange) => {
        arrange()
        expect(await store().getNamed(NAMED_ID)).toBeNull()
    })

    it('propagates any other get error', async () => {
        vi.mocked(get).mockRejectedValue(new Error('service down'))
        await expect(store().getNamed(NAMED_ID)).rejects.toThrow('service down')
    })
})

describe('replaceNamed', () => {
    it('puts once with overwrite and the caller etag as ifMatch', async () => {
        expect(await store().replaceNamed(NAMED_ID, '{"revision":2}', 'etag-1')).toBe('replaced')
        expect(put).toHaveBeenCalledExactlyOnceWith(NAMED_KEY, '{"revision":2}', { ...PUT_OPTIONS, allowOverwrite: true, ifMatch: 'etag-1' })
    })

    const serviceDown = new Error('service down')
    it.each([
        ['BlobPreconditionFailedError', new BlobPreconditionFailedError(), 'conflict'],
        ['BlobNotFoundError', new BlobNotFoundError(), 'conflict'],
        ['any other error', serviceDown, serviceDown],
    ])('maps a put rejecting with %s after one put and no read', async (_label, putError, expected) => {
        vi.mocked(put).mockRejectedValue(putError)
        const result = store().replaceNamed(NAMED_ID, '{"revision":2}', 'etag-1')
        if (expected instanceof Error) await expect(result).rejects.toBe(expected)
        else expect(await result).toBe(expected)
        expect(put).toHaveBeenCalledOnce()
        expect(head).not.toHaveBeenCalled()
        expect(get).not.toHaveBeenCalled()
    })
})

describe('deleteNamed', () => {
    it.each([
        ['succeeds', () => vi.mocked(del).mockResolvedValue(undefined)],
        ['throws BlobNotFoundError', () => vi.mocked(del).mockRejectedValue(new BlobNotFoundError())],
    ])('deletes the named key once and resolves when del %s', async (_label, arrange) => {
        arrange()
        await expect(store().deleteNamed(NAMED_ID)).resolves.toBeUndefined()
        expect(del).toHaveBeenCalledExactlyOnceWith(NAMED_KEY, { storeId: STORE_ID })
    })

    it('propagates any other del error', async () => {
        vi.mocked(del).mockRejectedValue(new Error('service down'))
        await expect(store().deleteNamed(NAMED_ID)).rejects.toThrow('service down')
    })
})

describe('bumpCounter', () => {
    it('creates an absent counter without overwrite or ifMatch', async () => {
        expect(await store().bumpCounter('c', W, LIMIT)).toStrictEqual({ windowStart: W, count: 1 })
        expect(get).toHaveBeenCalledExactlyOnceWith(COUNTER_KEY, { access: 'private', storeId: STORE_ID, useCache: false })
        expect(counterPuts()).toStrictEqual([
            {
                key: COUNTER_KEY,
                body: { windowStart: W, count: 1 },
                options: { access: 'private', addRandomSuffix: false, contentType: 'application/json', storeId: STORE_ID, allowOverwrite: false },
            },
        ])
    })

    it.each([
        ['the same window', { windowStart: W, count: 7 }, 8],
        ['an older window', { windowStart: W - 3_600_000, count: 7 }, 1],
    ])('updates a counter from %s through ifMatch', async (_label, stored, count) => {
        vi.mocked(get).mockResolvedValue(found(stored, 'etag-7'))
        expect(await store().bumpCounter('c', W, LIMIT)).toStrictEqual({ windowStart: W, count })
        expect(counterPuts()).toStrictEqual([
            {
                key: COUNTER_KEY,
                body: { windowStart: W, count },
                options: { access: 'private', addRandomSuffix: false, contentType: 'application/json', storeId: STORE_ID, allowOverwrite: true, ifMatch: 'etag-7' },
            },
        ])
    })

    it('refuses the 31st bump at limit 30 without a put, so limit 31 then counts 31', async () => {
        let stored: string | null = null
        vi.mocked(get).mockImplementation(async () => (stored === null ? null : found(JSON.parse(stored))))
        vi.mocked(put).mockImplementation(async (_key, body) => {
            stored = body as string
            return {} as Awaited<ReturnType<typeof put>>
        })
        const blob = store()
        for (let index = 0; index < LIMIT; index += 1) await blob.bumpCounter('c', W, LIMIT)
        expect(JSON.parse(stored ?? 'null')).toStrictEqual({ windowStart: W, count: LIMIT })
        vi.mocked(put).mockClear()
        expect(await blob.bumpCounter('c', W, LIMIT)).toBe('refused')
        expect(put).not.toHaveBeenCalled()
        expect(await blob.bumpCounter('c', W, LIMIT + 1)).toStrictEqual({ windowStart: W, count: LIMIT + 1 })
    })

    it('retries a changed etag with the etag of the new read', async () => {
        vi.mocked(get).mockResolvedValueOnce(found({ windowStart: W, count: 1 }, 'etag-1')).mockResolvedValueOnce(found({ windowStart: W, count: 2 }, 'etag-2'))
        vi.mocked(put).mockRejectedValueOnce(new BlobPreconditionFailedError())
        expect(await store().bumpCounter('c', W, LIMIT)).toStrictEqual({ windowStart: W, count: 3 })
        expect(counterPuts().map(({ body, options }) => [body.count, options.ifMatch])).toStrictEqual([
            [2, 'etag-1'],
            [3, 'etag-2'],
        ])
    })

    it('reports contended after three changed etags', async () => {
        for (const etag of ['etag-1', 'etag-2', 'etag-3']) vi.mocked(get).mockResolvedValueOnce(found({ windowStart: W, count: 1 }, etag))
        vi.mocked(put).mockRejectedValue(new BlobPreconditionFailedError())
        expect(await store().bumpCounter('c', W, LIMIT)).toBe('contended')
        expect(get).toHaveBeenCalledTimes(3)
        expect(counterPuts().map(({ options }) => options.ifMatch)).toStrictEqual(['etag-1', 'etag-2', 'etag-3'])
    })

    it('retries a create that lost to another writer', async () => {
        vi.mocked(get).mockResolvedValueOnce(null).mockResolvedValueOnce(found({ windowStart: W, count: 1 }, 'etag-1'))
        vi.mocked(put).mockRejectedValueOnce(new Error('already exists'))
        vi.mocked(head).mockResolvedValue({} as Awaited<ReturnType<typeof head>>)
        expect(await store().bumpCounter('c', W, LIMIT)).toStrictEqual({ windowStart: W, count: 2 })
        expect(put).toHaveBeenCalledTimes(2)
    })

    it.each([
        ['an update', () => vi.mocked(get).mockResolvedValue(found({ windowStart: W, count: 1 }))],
        ['a create', () => vi.mocked(get).mockResolvedValue(null)],
    ])('propagates any other put error on %s after one attempt', async (_label, arrange) => {
        arrange()
        vi.mocked(put).mockRejectedValue(new Error('service down'))
        await expect(store().bumpCounter('c', W, LIMIT)).rejects.toThrow('service down')
        expect(put).toHaveBeenCalledOnce()
    })
})
