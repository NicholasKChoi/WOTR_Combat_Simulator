import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendReply, type ReplyTarget } from './api-route'
import { listBuilds } from './builds'
import { createMemoryBuildStore, type BuildStore } from './build-store'
import { saveBuildReply, savedBuildReply } from './builds-routes'
import { SAVE_RATE_LIMIT } from './save-rate-limit'
import { SAVED_BUILD_MAX_BYTES, checkSaveBuildRequest, savedBuildId, savedBuildPath } from './saved-builds'
import { buildOrderCatalog } from './schema'
import { ENGLISH } from './test-helpers'

const catalog = buildOrderCatalog(ENGLISH)
const [firstBuild] = listBuilds()
const HOUR = 3_600_000
const NOW = 1_000 * HOUR
const VALID = { buildOrder: firstBuild, durationSeconds: 600 }
const STORAGE_DOWN = { status: 503, body: { error: 'storage is unavailable; try again later' } }
const NOT_FOUND = { status: 404, body: { error: 'no saved build with that id' } }
const ID = 'AbCdEfGhIjK'

afterEach(() => {
    vi.restoreAllMocks()
})

const getterFor = (store: BuildStore) => vi.fn(() => Promise.resolve(store))
const rejectingGetter = () => vi.fn(() => Promise.reject(new Error('no blob')))
const withBroken = (store: BuildStore, broken: Partial<BuildStore>): BuildStore => ({ ...store, ...broken })

function save(store: BuildStore | (() => Promise<BuildStore>), body: unknown = VALID, options: { method?: string; clientKey?: string; nowMs?: number } = {}) {
    return saveBuildReply(
        { method: options.method ?? 'POST', body, clientKey: options.clientKey ?? 'client' },
        { store: typeof store === 'function' ? store : getterFor(store), catalog, nowMs: options.nowMs ?? NOW },
    )
}

function read(store: BuildStore | (() => Promise<BuildStore>), method: string | undefined, id: unknown, env = 'development') {
    return savedBuildReply({ method, id }, { store: typeof store === 'function' ? store : getterFor(store), env })
}

async function savedRecord(store: BuildStore) {
    const reply = await save(store)
    return { reply, id: (reply.body as { id: string }).id }
}

describe('saveBuildReply, before any store call', () => {
    it('answers 405 with Allow: POST for GET and never asks for the store', async () => {
        const store = vi.fn(() => Promise.resolve(createMemoryBuildStore()))
        expect(await save(store, VALID, { method: 'GET' })).toStrictEqual({
            status: 405,
            headers: { Allow: 'POST' },
            body: { error: 'method GET is not allowed; use POST' },
        })
        expect(store).not.toHaveBeenCalled()
    })

    const tooLong = { ...firstBuild, name: 'n'.repeat(101) }
    const bigSource = { ...firstBuild, source: '€'.repeat(30_000) }
    it.each([
        ['an array body', [], 400],
        ['an unknown unit id', { buildOrder: { ...firstBuild, steps: [{ action: 'produce', producer: 'capital-town-center', unit: 'knigt' }] }, durationSeconds: 600 }, 400],
        ['a duration of 59', { ...VALID, durationSeconds: 59 }, 400],
        ['a name of 101 characters', { buildOrder: tooLong, durationSeconds: 600 }, 400],
        ['a record over the byte cap', { buildOrder: bigSource, durationSeconds: 600 }, 413],
    ])('answers %s with the check error, calling no store and spending no slot', async (_label, body, status) => {
        const checked = checkSaveBuildRequest(body, catalog)
        if (checked.ok) throw new Error('expected the body to be refused')
        const store = createMemoryBuildStore()
        const bumpCounter = vi.spyOn(store, 'bumpCounter')
        const getter = getterFor(store)
        expect(await save(getter, body)).toStrictEqual({ status, body: checked.error })
        expect(getter).not.toHaveBeenCalled()
        expect(bumpCounter).not.toHaveBeenCalled()
    })

    it('words the 413 as the byte count against the cap', async () => {
        const reply = await save(createMemoryBuildStore(), { buildOrder: bigSource, durationSeconds: 600 })
        expect(reply.body).toStrictEqual({ error: expect.stringMatching(new RegExp(`^saved build: \\d+ bytes, more than ${SAVED_BUILD_MAX_BYTES}$`)) })
    })

    it('saves a valid build after 31 invalid bodies from the same client', async () => {
        const store = createMemoryBuildStore()
        for (let index = 0; index < SAVE_RATE_LIMIT.maxSaves + 1; index += 1) expect((await save(store, [])).status).toBe(400)
        expect((await save(store)).status).toBe(201)
    })
})

describe('saveBuildReply, storage failures', () => {
    it('answers 503 when the store getter rejects', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(await save(rejectingGetter())).toStrictEqual(STORAGE_DOWN)
        expect(error).toHaveBeenCalledOnce()
    })

    it.each([
        ['bumpCounter', { bumpCounter: () => Promise.reject(new Error('counter down')) }],
        ['putBuild', { putBuild: () => Promise.reject(new Error('put down')) }],
        ['bumpCounter synchronously', { bumpCounter: () => { throw new Error('counter threw') } }],
    ])('answers 503, not a rejection, when %s throws, and logs the error value', async (_label, broken) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(await save(withBroken(createMemoryBuildStore(), broken))).toStrictEqual(STORAGE_DOWN)
        expect(error).toHaveBeenCalledOnce()
        expect(error.mock.calls[0].at(-1)).toBeInstanceOf(Error)
        expect(JSON.stringify(error.mock.calls)).not.toContain('client')
    })
})

describe('saveBuildReply, rate limit', () => {
    it('allows saves 1 to 30 from one client and refuses the 31st with Retry-After and no put', async () => {
        const store = createMemoryBuildStore()
        const putBuild = vi.spyOn(store, 'putBuild')
        for (let index = 0; index < SAVE_RATE_LIMIT.maxSaves; index += 1) expect((await save(store)).status).not.toBe(429)
        putBuild.mockClear()
        expect(await save(store)).toStrictEqual({
            status: 429,
            headers: { 'Retry-After': '3600' },
            body: { error: 'too many saves from this client; try again later' },
        })
        expect(putBuild).not.toHaveBeenCalled()
    })

    it('answers Retry-After for the time left in the window', async () => {
        const store = createMemoryBuildStore()
        for (let index = 0; index < SAVE_RATE_LIMIT.maxSaves; index += 1) await save(store)
        expect((await save(store, VALID, { nowMs: NOW + 1_800_000 })).headers).toStrictEqual({ 'Retry-After': '1800' })
    })

    it('answers 429 with Retry-After 1 when the counter is contended', async () => {
        const reply = await save(withBroken(createMemoryBuildStore(), { bumpCounter: async () => 'contended' }))
        expect(reply).toStrictEqual({ status: 429, headers: { 'Retry-After': '1' }, body: { error: 'too many saves from this client; try again later' } })
    })

    it('keeps a separate budget per client key', async () => {
        const store = createMemoryBuildStore()
        for (let index = 0; index <= SAVE_RATE_LIMIT.maxSaves; index += 1) await save(store, VALID, { clientKey: 'a' })
        expect((await save(store, VALID, { clientKey: 'a' })).status).toBe(429)
        expect((await save(store, VALID, { clientKey: 'b' })).status).toBe(200)
    })
})

describe('saveBuildReply, stored result', () => {
    it('answers 201 with the id and path of the first save and stores the record', async () => {
        const store = createMemoryBuildStore()
        const { reply } = await savedRecord(store)
        const checked = checkSaveBuildRequest(VALID, catalog)
        if (!checked.ok) throw new Error('expected a valid body')
        const id = await savedBuildId(checked.record)
        expect(reply).toStrictEqual({ status: 201, body: { id, path: savedBuildPath(id) } })
        expect(await store.getBuild(id)).toStrictEqual(checked.record)
    })

    it('answers 200 with the same body for a repeat save, keeps the stored value and spends a slot', async () => {
        const store = createMemoryBuildStore()
        const first = await savedRecord(store)
        const stored = await store.getBuild(first.id)
        const putBuild = vi.spyOn(store, 'putBuild')
        const repeat = await save(store)
        expect(repeat).toStrictEqual({ status: 200, body: first.reply.body })
        expect(await store.getBuild(first.id)).toStrictEqual(stored)
        expect(putBuild).toHaveBeenCalledOnce()
        for (let index = 0; index < SAVE_RATE_LIMIT.maxSaves - 2; index += 1) await save(store)
        expect((await save(store)).status).toBe(429)
    })
})

describe('savedBuildReply, methods', () => {
    it.each(['development', 'preview'])('answers 405 for PUT in %s with Allow: GET, DELETE', async (env) => {
        expect(await read(createMemoryBuildStore(), 'PUT', ID, env)).toStrictEqual({
            status: 405,
            headers: { Allow: 'GET, DELETE' },
            body: { error: 'method PUT is not allowed; use GET or DELETE' },
        })
    })

    it('answers 405 for DELETE in production and deletes nothing', async () => {
        const store = createMemoryBuildStore()
        const { id } = await savedRecord(store)
        expect(await read(store, 'DELETE', id, 'production')).toStrictEqual({
            status: 405,
            headers: { Allow: 'GET' },
            body: { error: 'method DELETE is not allowed; use GET' },
        })
        expect((await read(store, 'GET', id, 'production')).status).toBe(200)
    })

    it('answers 405 for a missing method without asking for the store', async () => {
        const getter = getterFor(createMemoryBuildStore())
        expect((await read(getter, undefined, ID)).status).toBe(405)
        expect(getter).not.toHaveBeenCalled()
    })
})

describe.each(['GET', 'DELETE'])('savedBuildReply, %s', (method) => {
    it.each([
        ['a short id', 'abc'],
        ['a 12-character id', 'AbCdEfGhIjKl'],
        ['no id', undefined],
        ['an array id', [ID]],
    ])('answers 404 for %s with no store getter call', async (_label, id) => {
        const getter = getterFor(createMemoryBuildStore())
        expect(await read(getter, method, id)).toStrictEqual(NOT_FOUND)
        expect(getter).not.toHaveBeenCalled()
    })

    it('answers 503 when the store getter rejects', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(await read(rejectingGetter(), method, ID)).toStrictEqual(STORAGE_DOWN)
    })

    it('answers 503 and logs when the store throws', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {})
        const broken = withBroken(createMemoryBuildStore(), { getBuild: () => Promise.reject(new Error('get down')), deleteBuild: () => Promise.reject(new Error('delete down')) })
        expect(await read(broken, method, ID)).toStrictEqual(STORAGE_DOWN)
        expect(error).toHaveBeenCalledOnce()
    })
})

describe('savedBuildReply, GET', () => {
    it('answers 404 for a valid id that is absent', async () => {
        expect(await read(createMemoryBuildStore(), 'GET', ID)).toStrictEqual(NOT_FOUND)
    })

    it('answers 500 when the stored value fails the record schema', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const store = createMemoryBuildStore()
        await store.putBuild(ID, JSON.stringify({ version: 2 }))
        expect(await read(store, 'GET', ID)).toStrictEqual({ status: 500, body: { error: 'the stored build could not be read' } })
    })

    it('answers 200 with the stored record plus its id and the immutable cache header', async () => {
        const store = createMemoryBuildStore()
        const { id } = await savedRecord(store)
        const reply = await read(store, 'GET', id)
        expect(reply.status).toBe(200)
        expect(reply.headers).toStrictEqual({ 'Cache-Control': 'public, max-age=31536000, immutable' })
        expect(reply.body).toStrictEqual({ ...(await store.getBuild(id) as object), id })
    })
})

describe('savedBuildReply, DELETE', () => {
    function recordingTarget() {
        const target = { status: vi.fn(() => target), setHeader: vi.fn(), json: vi.fn(), end: vi.fn() }
        return target
    }

    it('answers 204 with no body for a stored id, and a following GET answers 404', async () => {
        const store = createMemoryBuildStore()
        const { id } = await savedRecord(store)
        const reply = await read(store, 'DELETE', id)
        expect(reply).toStrictEqual({ status: 204 })
        const target = recordingTarget()
        sendReply(target as unknown as ReplyTarget, reply)
        expect(target.end).toHaveBeenCalledOnce()
        expect(target.json).not.toHaveBeenCalled()
        expect(await read(store, 'GET', id)).toStrictEqual(NOT_FOUND)
    })

    it('answers 204 for a valid id that is absent', async () => {
        expect(await read(createMemoryBuildStore(), 'DELETE', ID)).toStrictEqual({ status: 204 })
    })
})
