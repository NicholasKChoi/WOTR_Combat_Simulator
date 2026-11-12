import { put } from '@vercel/blob'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { BLOB_SDK_RETRIES } from './blob-build-store'
import { buildStoreFromEnv } from './build-store'
import { listBuilds } from './builds'
import { saveBuildReply } from './builds-routes'
import { createNamedBuildReply, namedBuildReply } from './named-builds-routes'
import { buildOrderCatalog } from './schema'
import { ENGLISH } from './test-helpers'

// How the next put to a key kind (builds, named-builds, rate-limit) goes wrong. "retried": the response
// is lost and the SDK's retry runs into the write that landed. "dropped": the write lands, then the
// connection drops. "outage": nothing is written. "deleted": another client deletes the key first.
// A racer object: another client writes racer(sent) to the key first.
type Fault = 'retried' | 'dropped' | 'outage' | 'deleted' | { racer: (sent: string) => string }
type PutOptions = { allowOverwrite?: boolean; ifMatch?: string }

const blobs = new Map<string, { body: string; etag: string }>()
const faults = new Map<string, Fault[]>()
const blobState = { etags: 0, weakReadsAfterFault: false, weakReads: false, lastPutError: undefined as unknown }
const kindOf = (key: string) => key.split('/')[1]

vi.mock('@vercel/blob', async (importOriginal) => {
    const sdk = await importOriginal<typeof import('@vercel/blob')>()
    const store = (key: string, body: string) => {
        blobState.etags += 1
        blobs.set(key, { body, etag: `"e${blobState.etags}"` })
    }
    const write = (key: string, body: string, options: PutOptions) => {
        const existing = blobs.get(key)
        if (options.ifMatch === undefined) {
            if (existing && !options.allowOverwrite) throw new Error('This blob already exists')
        } else if (existing === undefined) {
            throw new sdk.BlobNotFoundError()
        } else if (existing.etag !== options.ifMatch) {
            throw new sdk.BlobPreconditionFailedError()
        }
        store(key, body)
    }
    const faultyWrite = (key: string, body: string, options: PutOptions) => {
        const fault = faults.get(kindOf(key))?.shift()
        if (fault !== undefined && blobState.weakReadsAfterFault) blobState.weakReads = true
        if (fault === 'outage') throw new Error('fetch failed')
        if (fault === 'deleted') blobs.delete(key)
        if (typeof fault === 'object') store(key, fault.racer(body))
        write(key, body, options)
        if (fault === 'retried') write(key, body, options)
        if (fault === 'dropped') throw new Error('socket hang up')
    }
    return {
        ...sdk,
        put: vi.fn(async (key: string, body: string, options: PutOptions) => {
            try {
                faultyWrite(key, body, options)
            } catch (error) {
                blobState.lastPutError = error
                throw error
            }
            return {}
        }),
        get: vi.fn(async (key: string) => {
            const found = blobs.get(key)
            if (found === undefined) return null
            const etag = blobState.weakReads ? `W/${found.etag}` : found.etag
            return { statusCode: 200, stream: new Response(found.body).body, headers: new Headers(), blob: { etag } }
        }),
        head: vi.fn(async (key: string) => {
            if (!blobs.has(key)) throw new sdk.BlobNotFoundError()
            return {}
        }),
    }
})

const BLOB_ENV = { NODE_ENV: 'test', BUILDS_STORE_ID: 'store_x', VERCEL: '1', VERCEL_ENV: 'preview' } as const
const catalog = buildOrderCatalog(ENGLISH)
const [firstBuild] = listBuilds()
const NOW = 1_000 * 3_600_000
const SAVE = { buildOrder: firstBuild, durationSeconds: 600 }
const EDIT = { buildOrder: { ...firstBuild, name: 'Edited opener' }, durationSeconds: 900 }
const CHANGED = { error: 'the build has changed since that revision' }
const STORAGE_DOWN = { error: 'storage is unavailable; try again later' }
const ID_FAILED = { error: 'the build id could not be created' }
const COUNTER_KEY = 'preview/rate-limit/saver.json'
const deps = { store: () => buildStoreFromEnv(BLOB_ENV), catalog, nowMs: NOW }

const otherEdit: Fault = { racer: (sent) => JSON.stringify({ ...JSON.parse(sent), updatedAt: '2000-01-01T00:00:00.000Z' }) }
const sameDataReordered: Fault = { racer: (sent) => JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(sent)).reverse())) }
const otherContent: Fault = { racer: () => '{"someone":"else"}' }
const concurrentBump: Fault = { racer: (sent) => JSON.stringify({ ...JSON.parse(sent), count: JSON.parse(sent).count + 5 }) }

const saveBuild = () => saveBuildReply({ method: 'POST', body: SAVE, clientKey: 'saver' }, deps)
const createNamed = () => createNamedBuildReply({ method: 'POST', body: SAVE, clientKey: 'creator' }, deps)
const updateNamed = (id: string, editSecret: string) =>
    namedBuildReply(
        { method: 'PUT', id, body: EDIT, authorization: `Bearer ${editSecret}`, ifMatch: '"1"', clientKey: 'editor' },
        { ...deps, env: 'preview' },
    )
const namedKey = (id: string) => `preview/named-builds/${id}.json`
const stored = (key: string) => JSON.parse(blobs.get(key)?.body ?? 'null')
const putsTo = (kind: string) => vi.mocked(put).mock.calls.filter(([key]) => kindOf(key) === kind)

function failNext(kind: string, ...queued: Fault[]) {
    faults.set(kind, queued)
}

async function namedBuildOnFile() {
    const reply = await createNamed()
    expect(reply.status).toBe(201)
    vi.mocked(put).mockClear()
    return reply.body as { id: string; editSecret: string }
}

let errorLog: MockInstance<typeof console.error>
beforeEach(() => {
    blobs.clear()
    faults.clear()
    Object.assign(blobState, { weakReadsAfterFault: false, weakReads: false, lastPutError: undefined })
    vi.mocked(put).mockClear()
    errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
    errorLog.mockRestore()
    vi.unstubAllEnvs()
})

const expectStorageDownFromPutError = () => {
    expect(blobState.lastPutError).toBeInstanceOf(Error)
    expect(errorLog).toHaveBeenCalledWith('builds: storage failed', blobState.lastPutError)
}

describe('the Blob store built from the deployment env', () => {
    it.each([
        ['unset', undefined, String(BLOB_SDK_RETRIES)],
        ['already set to 4', '4', '4'],
    ])('caps the SDK retries through VERCEL_BLOB_RETRIES only when it is %s', async (_label, before, after) => {
        vi.stubEnv('VERCEL_BLOB_RETRIES', before)
        expect(process.env.VERCEL_BLOB_RETRIES).toBe(before)
        await buildStoreFromEnv(BLOB_ENV)
        expect(process.env.VERCEL_BLOB_RETRIES).toBe(after)
    })
})

describe('PUT a named build when its Blob write fails', () => {
    it.each<[string, Fault, boolean, number]>([
        ['saves when the response is lost and the SDK retry answers 412', 'retried', false, 200],
        ['saves when the connection drops after the write lands', 'dropped', false, 200],
        ['answers 412 when another edit landed first', otherEdit, false, 412],
        ['answers 412 when the stored edit has the same data in another key order', sameDataReordered, false, 412],
        ['answers 412 when the SDK retry answers 412 and the read-back fails', 'retried', true, 412],
        ['answers 503 when the store is down', 'outage', false, 503],
        ['answers 503 with the put error when the connection drops and the read-back fails', 'dropped', true, 503],
    ])('%s', async (_label, fault, readBackFails, status) => {
        const { id, editSecret } = await namedBuildOnFile()
        failNext('named-builds', fault)
        blobState.weakReadsAfterFault = readBackFails
        const reply = await updateNamed(id, editSecret)
        expect(reply.status).toBe(status)
        if (status === 200) {
            expect(reply.body).toMatchObject({ id, revision: 2 })
            expect(stored(namedKey(id))).toMatchObject({ revision: 2, buildOrder: { name: 'Edited opener' } })
        }
        if (status === 412) expect(reply.body).toEqual(CHANGED)
        if (status === 503) {
            expect(reply.body).toEqual(STORAGE_DOWN)
            expectStorageDownFromPutError()
        }
    })

    it('answers 412 with one put on the etag it read when the build is deleted before the write, and recreates nothing', async () => {
        const { id, editSecret } = await namedBuildOnFile()
        const readEtag = blobs.get(namedKey(id))?.etag
        expect(readEtag).toMatch(/^"e\d+"$/)
        failNext('named-builds', 'deleted')
        const reply = await updateNamed(id, editSecret)
        expect(reply).toMatchObject({ status: 412, body: CHANGED })
        const puts = putsTo('named-builds')
        expect(puts).toHaveLength(1)
        expect(puts[0][2]).toMatchObject({ allowOverwrite: true, ifMatch: readEtag })
        expect(blobs.has(namedKey(id))).toBe(false)
    })
})

describe('saving a new build when its Blob create fails', () => {
    it.each<[string, () => ReturnType<typeof saveBuild>, string, Fault, boolean, number, object | null]>([
        ['POST builds answers 201 when the SDK retry runs into the write that landed', saveBuild, 'builds', 'retried', false, 201, null],
        ['POST builds answers 200 when another client stored the key first', saveBuild, 'builds', otherContent, false, 200, null],
        ['POST builds answers 200 when the write landed but the read-back fails', saveBuild, 'builds', 'dropped', true, 200, null],
        ['POST builds answers 503 when the store is down', saveBuild, 'builds', 'outage', false, 503, STORAGE_DOWN],
        ['POST named-builds answers 201 when the SDK retry runs into the write that landed', createNamed, 'named-builds', 'retried', false, 201, null],
        ['POST named-builds answers 500 when another client stored the id first', createNamed, 'named-builds', otherContent, false, 500, ID_FAILED],
        ['POST named-builds answers 503 when the store is down', createNamed, 'named-builds', 'outage', false, 503, STORAGE_DOWN],
    ])('%s', async (_label, save, kind, fault, readBackFails, status, body) => {
        failNext(kind, fault)
        blobState.weakReadsAfterFault = readBackFails
        const reply = await save()
        expect(reply.status).toBe(status)
        if (body !== null) expect(reply.body).toEqual(body)
        if (status === 503) expectStorageDownFromPutError()
    })
})

describe('the save rate counter when its Blob write fails', () => {
    it.each<[string, Fault]>([
        ['the SDK retry runs into the counter write that landed', 'retried'],
        ['the connection drops after the counter write lands', 'dropped'],
    ])('charges one save, with one counter put, when %s', async (_label, fault) => {
        failNext('rate-limit', fault)
        const reply = await saveBuild()
        expect(reply.status).toBe(201)
        expect(stored(COUNTER_KEY)).toMatchObject({ count: 1 })
        expect(putsTo('rate-limit')).toHaveLength(1)
    })

    it('answers 429 with Retry-After 1 after three counter puts when every attempt loses to a concurrent bump', async () => {
        failNext('rate-limit', concurrentBump, concurrentBump, concurrentBump, concurrentBump)
        const reply = await saveBuild()
        expect(reply).toMatchObject({ status: 429, headers: { 'Retry-After': '1' } })
        expect(putsTo('rate-limit')).toHaveLength(3)
        expect(putsTo('builds')).toHaveLength(0)
    })

    it('answers 503 and stores no build when the counter write fails and nothing landed', async () => {
        failNext('rate-limit', 'outage')
        const reply = await saveBuild()
        expect(reply).toMatchObject({ status: 503, body: STORAGE_DOWN })
        expectStorageDownFromPutError()
        expect(putsTo('builds')).toHaveLength(0)
    })
})
