import { BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installBlobFake } from './blob-fake-test-helpers'

const mocks = { put: vi.fn(), get: vi.fn(), head: vi.fn(), del: vi.fn() }
const KEY = 'preview/builds/k.json'
const bodyOf = async (key: string, options?: { useCache?: boolean }) => {
    const found = await mocks.get(key, options)
    return found === null ? null : { body: await new Response(found.stream).text(), etag: found.blob.etag as string }
}

describe('the shared Blob fake', () => {
    let fake: ReturnType<typeof installBlobFake>
    beforeEach(() => {
        fake = installBlobFake(mocks, { BlobNotFoundError, BlobPreconditionFailedError })
    })

    it('refuses a create over an existing key unless allowOverwrite, and keeps the body', async () => {
        await mocks.put(KEY, 'first', {})
        await expect(mocks.put(KEY, 'second', {})).rejects.toThrow('already exists')
        await expect(mocks.put(KEY, 'second', { allowOverwrite: false })).rejects.toThrow('already exists')
        expect(fake.body(KEY)).toBe('first')
        await mocks.put(KEY, 'third', { allowOverwrite: true })
        expect(fake.body(KEY)).toBe('third')
    })

    it('raises BlobNotFoundError for ifMatch on an absent key and stores nothing', async () => {
        await expect(mocks.put(KEY, 'x', { allowOverwrite: true, ifMatch: '"e1"' })).rejects.toBeInstanceOf(BlobNotFoundError)
        expect(fake.has(KEY)).toBe(false)
    })

    it('raises BlobPreconditionFailedError for a stale ifMatch and leaves the body unchanged', async () => {
        await mocks.put(KEY, 'first', {})
        const stale = fake.etag(KEY)
        await mocks.put(KEY, 'second', { allowOverwrite: true, ifMatch: stale })
        await expect(mocks.put(KEY, 'third', { allowOverwrite: true, ifMatch: stale })).rejects.toBeInstanceOf(BlobPreconditionFailedError)
        expect(fake.body(KEY)).toBe('second')
    })

    it('gives each write a quoted strong etag of the form "e<n>" that differs from the last', async () => {
        const seen: (string | undefined)[] = []
        await mocks.put(KEY, 'a', {})
        seen.push(fake.etag(KEY))
        await mocks.put(KEY, 'b', { allowOverwrite: true })
        seen.push(fake.etag(KEY))
        expect(seen).toStrictEqual(['"e1"', '"e2"'])
    })

    it('records the last put error', async () => {
        await mocks.put(KEY, 'a', {})
        const error = await mocks.put(KEY, 'b', {}).catch((rejected: unknown) => rejected)
        expect(fake.lastPutError).toBe(error)
    })

    it('reads a key back with the stored etag, weak when weakReads is set, and null when absent', async () => {
        expect(await bodyOf(KEY)).toBeNull()
        await mocks.put(KEY, 'a', {})
        expect(await bodyOf(KEY)).toStrictEqual({ body: 'a', etag: '"e1"' })
        fake.weakReads = true
        expect(await bodyOf(KEY)).toStrictEqual({ body: 'a', etag: 'W/"e1"' })
    })

    it('seeds a key under the etag given, which a later ifMatch must match', async () => {
        fake.seed(KEY, 'seed', '"fixed"')
        await expect(mocks.put(KEY, 'x', { allowOverwrite: true, ifMatch: '"e1"' })).rejects.toBeInstanceOf(BlobPreconditionFailedError)
        await mocks.put(KEY, 'y', { allowOverwrite: true, ifMatch: '"fixed"' })
        expect(fake.body(KEY)).toBe('y')
    })

    it('raises BlobNotFoundError from head and del for an absent key, and deletes a present one', async () => {
        await expect(mocks.head(KEY)).rejects.toBeInstanceOf(BlobNotFoundError)
        await expect(mocks.del(KEY)).rejects.toBeInstanceOf(BlobNotFoundError)
        await mocks.put(KEY, 'a', {})
        await expect(mocks.head(KEY)).resolves.toBeDefined()
        await mocks.del(KEY)
        expect(fake.has(KEY)).toBe(false)
    })

    it('fails head with headFailure when set, even for a present key', async () => {
        await mocks.put(KEY, 'a', {})
        fake.headFailure = new Error('head down')
        await expect(mocks.head(KEY)).rejects.toThrow('head down')
    })

    it('holds a get on the promise beforeRead returns', async () => {
        await mocks.put(KEY, 'a', {})
        let release = () => {}
        fake.beforeRead = () => new Promise<void>((resolve) => (release = resolve))
        let settled = false
        const read = mocks.get(KEY).then(() => (settled = true))
        await Promise.resolve()
        expect(settled).toBe(false)
        release()
        await read
        expect(settled).toBe(true)
    })

    it('lets aroundPut decide how many times the write runs', async () => {
        fake.aroundPut = (_key, _body, _options, write) => {
            write()
            write()
        }
        await mocks.put(KEY, 'a', { allowOverwrite: true })
        expect(fake.etag(KEY)).toBe('"e2"')
    })

    it('empties the store and the etag count on reset but keeps aroundPut', async () => {
        const around = vi.fn((_key: string, _body: string, _options: object, write: () => void) => write())
        fake.aroundPut = around
        await mocks.put(KEY, 'a', {})
        fake.reset()
        expect(fake.has(KEY)).toBe(false)
        await mocks.put(KEY, 'b', {})
        expect(fake.etag(KEY)).toBe('"e1"')
        expect(around).toHaveBeenCalledTimes(2)
    })

    describe('with the CDN cache', () => {
        beforeEach(() => {
            fake = installBlobFake(mocks, { BlobNotFoundError, BlobPreconditionFailedError }, { cdn: true })
        })

        it('serves the first body and etag unless the get passes useCache: false', async () => {
            await mocks.put(KEY, 'first', {})
            expect(await bodyOf(KEY)).toStrictEqual({ body: 'first', etag: '"e1"' })
            await mocks.put(KEY, 'second', { allowOverwrite: true })
            expect(await bodyOf(KEY)).toStrictEqual({ body: 'first', etag: '"e1"' })
            expect(await bodyOf(KEY, { useCache: false })).toStrictEqual({ body: 'second', etag: '"e2"' })
        })
    })
})
