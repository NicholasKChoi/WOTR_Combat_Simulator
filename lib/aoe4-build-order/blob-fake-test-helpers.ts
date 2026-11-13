import type { Mock } from 'vitest'

// An in-memory stand-in for the @vercel/blob calls the build store makes. It must not import the SDK (the
// vi.mock factory that installs it runs while the SDK is being imported), so the factory passes the SDK's
// error classes in.
export interface BlobFakeErrors {
    BlobNotFoundError: new () => Error
    BlobPreconditionFailedError: new () => Error
}

export interface BlobPutOptions {
    allowOverwrite?: boolean
    ifMatch?: string
}

type BlobMock = Mock<(...args: never[]) => unknown>
export interface BlobMocks {
    put: BlobMock
    get: BlobMock
    head: BlobMock
    del: BlobMock
}

export interface BlobFakeOptions {
    // Serves the first body and etag seen for a key to every get, unless the caller passes useCache: false.
    cdn?: boolean
}

interface Stored {
    body: string
    etag: string
}

export interface BlobFake {
    // Gets return the etag prefixed `W/`, as a compressed response carries it.
    weakReads: boolean
    headFailure: Error | undefined
    // Runs at the start of every get. Returning a promise holds the get until it settles; returning
    // undefined adds no await.
    beforeRead: ((key: string) => Promise<void> | undefined) | undefined
    // Replaces the plain write of every put; call write() for the real write rules.
    aroundPut: ((key: string, body: string, options: BlobPutOptions, write: () => void) => void) | undefined
    lastPutError: unknown
    body: (key: string) => string | undefined
    etag: (key: string) => string | undefined
    has: (key: string) => boolean
    // Writes a key under the write rules.
    write: (key: string, body: string, options: BlobPutOptions) => void
    // Writes a key unconditionally with a fresh etag.
    store: (key: string, body: string) => void
    // Writes a key unconditionally under an etag the caller picks.
    seed: (key: string, body: string, etag: string) => void
    remove: (key: string) => void
    // Empties the store and clears everything but aroundPut.
    reset: () => void
}

let installed: BlobFake | undefined

export function blobFake(): BlobFake {
    if (installed === undefined) throw new Error('installBlobFake has not run; call it from the vi.mock factory of @vercel/blob')
    return installed
}

export function installBlobFake(mocks: BlobMocks, errors: BlobFakeErrors, { cdn = false }: BlobFakeOptions = {}): BlobFake {
    const blobs = new Map<string, Stored>()
    const cdnCopies = new Map<string, Stored>()
    let writes = 0

    const fake: BlobFake = {
        weakReads: false,
        headFailure: undefined,
        beforeRead: undefined,
        aroundPut: undefined,
        lastPutError: undefined,
        body: (key) => blobs.get(key)?.body,
        etag: (key) => blobs.get(key)?.etag,
        has: (key) => blobs.has(key),
        seed: (key, body, etag) => {
            blobs.set(key, { body, etag })
        },
        store: (key, body) => {
            writes += 1
            fake.seed(key, body, `"e${writes}"`)
        },
        write: (key, body, { allowOverwrite, ifMatch }) => {
            const existing = blobs.get(key)
            if (ifMatch === undefined) {
                if (existing && !allowOverwrite) throw new Error('This blob already exists')
            } else if (existing === undefined) {
                throw new errors.BlobNotFoundError()
            } else if (existing.etag !== ifMatch) {
                throw new errors.BlobPreconditionFailedError()
            }
            fake.store(key, body)
        },
        remove: (key) => {
            blobs.delete(key)
        },
        reset: () => {
            blobs.clear()
            cdnCopies.clear()
            writes = 0
            Object.assign(fake, { weakReads: false, headFailure: undefined, beforeRead: undefined, lastPutError: undefined })
        },
    }

    mocks.put.mockImplementation((async (key: string, body: string, options: BlobPutOptions) => {
        try {
            const write = () => fake.write(key, body, options)
            if (fake.aroundPut === undefined) write()
            else fake.aroundPut(key, body, options, write)
        } catch (error) {
            fake.lastPutError = error
            throw error
        }
        return {}
    }) as never)
    mocks.get.mockImplementation((async (key: string, options?: { useCache?: boolean }) => {
        const hold = fake.beforeRead?.(key)
        if (hold !== undefined) await hold
        const fresh = blobs.get(key)
        if (fresh === undefined) return null
        if (cdn && !cdnCopies.has(key)) cdnCopies.set(key, fresh)
        const served = cdn && options?.useCache !== false ? cdnCopies.get(key)! : fresh
        const etag = fake.weakReads ? `W/${served.etag}` : served.etag
        return { statusCode: 200, stream: new Response(served.body).body, headers: new Headers(), blob: { etag } }
    }) as never)
    mocks.head.mockImplementation((async (key: string) => {
        if (fake.headFailure) throw fake.headFailure
        if (!blobs.has(key)) throw new errors.BlobNotFoundError()
        return {}
    }) as never)
    mocks.del.mockImplementation((async (key: string) => {
        if (!blobs.delete(key)) throw new errors.BlobNotFoundError()
    }) as never)

    installed = fake
    return fake
}
