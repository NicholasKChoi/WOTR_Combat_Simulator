import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendReply } from './api-route'
import { listBuilds } from './builds'
import { createMemoryBuildStore, type BuildStore, type CounterResult } from './build-store'
import {
    editSecretHash,
    namedBuildPath,
    newEditSecret,
    newNamedBuildId,
    storedNamedBuildSchema,
    type RandomBytes,
} from './named-builds'
import { createNamedBuildReply, namedBuildReply } from './named-builds-routes'
import { INVALID_SAVE_BODIES, getterFor, recordingTarget, rejectingGetter, withBroken } from './route-test-support'
import { SAVE_RATE_LIMIT } from './save-rate-limit'
import { checkSaveBuildRequest } from './saved-builds'
import { buildOrderCatalog } from './schema'
import { ENGLISH } from './test-helpers'

const catalog = buildOrderCatalog(ENGLISH)
const [firstBuild] = listBuilds()
const HOUR = 3_600_000
const NOW = 1_000 * HOUR
const LATER = NOW + 60_000
const VALID = { buildOrder: firstBuild, durationSeconds: 600 }
const RENAMED = { buildOrder: { ...firstBuild, name: 'Renamed opener' }, durationSeconds: 900 }
const ID = 'AbCdEfGhIjKlMnOpQrStUv'
const WRONG_SECRET = 'A'.repeat(43)
const STORAGE_DOWN = { status: 503, body: { error: 'storage is unavailable; try again later' } }
const NOT_FOUND = { status: 404, body: { error: 'no named build with that id' } }
const ID_FAILED = { status: 500, body: { error: 'the build id could not be created' } }
const UNREADABLE = { status: 500, body: { error: 'the stored build could not be read' } }
const CHANGED = { status: 412, body: { error: 'the build has changed since that revision' } }
const MISMATCH = { status: 403, body: { error: 'the edit secret does not match' } }
const TOO_MANY = { status: 429, headers: { 'Retry-After': '3600' }, body: { error: 'too many saves from this client; try again later' } }

const INVALID_BODIES: [string, unknown, number][] = [['a string body', 'build', 400], ...INVALID_SAVE_BODIES]

afterEach(() => {
    vi.restoreAllMocks()
})

const fixedRandom: RandomBytes = (count) => Uint8Array.from({ length: count }, (_, index) => (index * 7 + count) % 256)
const bearer = (secret: string) => `Bearer ${secret}`
const silenceErrors = () => vi.spyOn(console, 'error').mockImplementation(() => {})

function checkedError(body: unknown) {
    const checked = checkSaveBuildRequest(body, catalog)
    if (checked.ok) throw new Error('expected the body to be refused')
    return checked.error
}

function loggedStrings(calls: unknown[][]) {
    return calls.flat().flatMap((value) => {
        if (typeof value === 'string') return [value]
        if (value instanceof Error) return [value.message, String(value.stack)]
        return [JSON.stringify(value) ?? '']
    })
}

// Every bumpCounter result, so a test reads the client's counter without spending a slot.
function countingStore(inner: BuildStore = createMemoryBuildStore()) {
    const results: CounterResult[] = []
    const store: BuildStore = {
        ...inner,
        bumpCounter: vi.fn(async (clientKey: string, windowStart: number, limit: number) => {
            const result = await inner.bumpCounter(clientKey, windowStart, limit)
            results.push(result)
            return result
        }),
    }
    const counter = () => {
        const last = results.findLast((result) => typeof result === 'object')
        return last === undefined ? 0 : last.count
    }
    return { store, results, counter }
}

type StoreOrGetter = BuildStore | (() => Promise<BuildStore>)
const asGetter = (store: StoreOrGetter) => (typeof store === 'function' ? store : getterFor(store))

function create(store: StoreOrGetter, body: unknown = VALID, options: { method?: string; clientKey?: string; nowMs?: number; random?: RandomBytes } = {}) {
    return createNamedBuildReply(
        { method: options.method ?? 'POST', body, clientKey: options.clientKey ?? 'client' },
        { store: asGetter(store), catalog, nowMs: options.nowMs ?? NOW, random: options.random },
    )
}

interface NamedOptions {
    method?: string | undefined
    body?: unknown
    authorization?: string
    ifMatch?: string
    env?: string | null
    nowMs?: number
    clientKey?: string
}

function named(store: StoreOrGetter, id: unknown, options: NamedOptions = {}) {
    return namedBuildReply(
        {
            method: 'method' in options ? options.method : 'GET',
            id,
            body: 'body' in options ? options.body : VALID,
            authorization: options.authorization,
            ifMatch: options.ifMatch,
            clientKey: options.clientKey ?? 'client',
        },
        { store: asGetter(store), catalog, env: options.env === undefined ? 'development' : options.env, nowMs: options.nowMs ?? NOW },
    )
}

function put(store: StoreOrGetter, id: unknown, secret: string, options: NamedOptions = {}) {
    return named(store, id, { authorization: bearer(secret), ifMatch: '"1"', nowMs: LATER, ...options, method: 'PUT' })
}

async function created(store: BuildStore, options: { clientKey?: string } = {}) {
    const reply = await create(store, VALID, options)
    const body = reply.body as { id: string; editSecret: string }
    return { reply, id: body.id, editSecret: body.editSecret }
}

async function storedValue(store: BuildStore, id: string) {
    return (await store.getNamed(id))?.value as Record<string, unknown>
}

async function exhaust(store: BuildStore, clientKey = 'client') {
    for (let index = 0; index < SAVE_RATE_LIMIT.maxSaves; index += 1) await create(store, VALID, { clientKey })
}

describe('createNamedBuildReply, before any store call', () => {
    it('answers 405 with Allow: POST for GET and never asks for the store', async () => {
        const getter = getterFor(createMemoryBuildStore())
        expect(await create(getter, VALID, { method: 'GET' })).toStrictEqual({
            status: 405,
            headers: { Allow: 'POST' },
            body: { error: 'method GET is not allowed; use POST' },
        })
        expect(getter).not.toHaveBeenCalled()
    })

    it.each(INVALID_BODIES)('answers %s with the check error, calling no store and spending no slot', async (_label, body, status) => {
        const { store } = countingStore()
        const getter = getterFor(store)
        expect(await create(getter, body)).toStrictEqual({ status, body: checkedError(body) })
        expect(getter).not.toHaveBeenCalled()
        expect(store.bumpCounter).not.toHaveBeenCalled()
    })

    it.each([
        ['for every request', (): Uint8Array => {
            throw new Error('no entropy')
        }],
        ['only for the edit secret', (count: number) => {
            if (count === 32) throw new Error('no entropy')
            return new Uint8Array(count)
        }],
    ])('answers 500 before the store when random throws %s, and logs the cause', async (_label, random) => {
        const error = silenceErrors()
        const { store } = countingStore()
        const getter = getterFor(store)
        expect(await create(getter, VALID, { random })).toStrictEqual(ID_FAILED)
        expect(error).toHaveBeenCalledExactlyOnceWith('builds: id generation failed', new Error('no entropy'))
        expect(getter).not.toHaveBeenCalled()
        expect(store.bumpCounter).not.toHaveBeenCalled()
    })
})

describe('createNamedBuildReply, store rows', () => {
    it('answers 503 when the store getter rejects', async () => {
        silenceErrors()
        expect(await create(rejectingGetter())).toStrictEqual(STORAGE_DOWN)
    })

    it('answers 429 with Retry-After once the client spent its slots, writing neither the counter nor a build', async () => {
        const { store, results } = countingStore()
        await exhaust(store)
        const createNamed = vi.spyOn(store, 'createNamed')
        expect(await create(store)).toStrictEqual(TOO_MANY)
        expect(createNamed).not.toHaveBeenCalled()
        expect(results.at(-1)).toBe('refused')
        expect(await store.bumpCounter('client', NOW, SAVE_RATE_LIMIT.maxSaves + 1)).toStrictEqual({ windowStart: NOW, count: SAVE_RATE_LIMIT.maxSaves + 1 })
    })

    it('answers 503 when createNamed throws', async () => {
        silenceErrors()
        expect(await create(withBroken(createMemoryBuildStore(), { createNamed: () => Promise.reject(new Error('put down')) }))).toStrictEqual(STORAGE_DOWN)
    })

    it('answers 500 for an id collision, logs it, and does not try again', async () => {
        const error = silenceErrors()
        const createNamed = vi.fn(async () => 'exists' as const)
        expect(await create(withBroken(createMemoryBuildStore(), { createNamed }))).toStrictEqual(ID_FAILED)
        expect(error).toHaveBeenCalledExactlyOnceWith('builds: named id collision')
        expect(createNamed).toHaveBeenCalledOnce()
    })
})

describe('createNamedBuildReply, created', () => {
    it('answers 201 with the id and secret of the injected random, ETag "1" and the stored record', async () => {
        const store = createMemoryBuildStore()
        const reply = await create(store, VALID, { random: fixedRandom })
        const id = newNamedBuildId(fixedRandom)
        const editSecret = newEditSecret(fixedRandom)
        expect(id).not.toBe(editSecret.slice(0, id.length))
        const updatedAt = new Date(NOW).toISOString()
        expect(reply).toStrictEqual({ status: 201, headers: { ETag: '"1"' }, body: { id, path: namedBuildPath(id), editSecret, revision: 1, updatedAt } })

        const found = await store.getNamed(id)
        const stored = storedNamedBuildSchema.parse(found?.value)
        expect(stored).toMatchObject({ revision: 1, createdAt: updatedAt, updatedAt, secretHash: await editSecretHash(editSecret) })
        expect(JSON.stringify(found?.value)).not.toContain(editSecret)
    })

    it('stores the checked record alongside the revision fields', async () => {
        const store = createMemoryBuildStore()
        const { id } = await created(store)
        const checked = checkSaveBuildRequest(VALID, catalog)
        if (!checked.ok) throw new Error('expected a valid body')
        expect(await storedValue(store, id)).toMatchObject(JSON.parse(checked.json))
    })

    it('gives two ids and two secrets for the same body posted twice', async () => {
        const store = createMemoryBuildStore()
        const first = await created(store)
        const second = await created(store)
        expect(second.reply.status).toBe(201)
        expect(second.id).not.toBe(first.id)
        expect(second.editSecret).not.toBe(first.editSecret)
    })

    it('sends the ETag header and the body through sendReply', async () => {
        const reply = await create(createMemoryBuildStore(), VALID, { random: fixedRandom })
        const { target, calls } = recordingTarget<NonNullable<typeof reply.body>>()
        sendReply(target, reply)
        expect(calls).toStrictEqual(['status 201', 'header ETag="1"', 'header Content-Type=application/json; charset=utf-8', `end ${JSON.stringify(reply.body)}`])
    })
})

describe('namedBuildReply, methods', () => {
    it.each([
        ['development', 'GET, PUT, DELETE', 'GET or PUT or DELETE'],
        ['preview', 'GET, PUT, DELETE', 'GET or PUT or DELETE'],
        ['production', 'GET, PUT', 'GET or PUT'],
        [null, 'GET, PUT', 'GET or PUT'],
    ])('answers 405 for PATCH in %s with Allow: %s and never asks for the store', async (env, allow, listed) => {
        const getter = getterFor(createMemoryBuildStore())
        expect(await named(getter, ID, { method: 'PATCH', env })).toStrictEqual({
            status: 405,
            headers: { Allow: allow },
            body: { error: `method PATCH is not allowed; use ${listed}` },
        })
        expect(getter).not.toHaveBeenCalled()
    })

    it.each(['production', null])('answers 405 for DELETE in %s and deletes nothing', async (env) => {
        const store = createMemoryBuildStore()
        const { id } = await created(store)
        const deleteNamed = vi.spyOn(store, 'deleteNamed')
        expect(await named(store, id, { method: 'DELETE', env })).toStrictEqual({
            status: 405,
            headers: { Allow: 'GET, PUT' },
            body: { error: 'method DELETE is not allowed; use GET or PUT' },
        })
        expect(deleteNamed).not.toHaveBeenCalled()
        expect((await named(store, id, { env })).status).toBe(200)
    })

    it('answers 405 for a missing method', async () => {
        expect((await named(createMemoryBuildStore(), ID, { method: undefined })).status).toBe(405)
    })
})

describe.each(['GET', 'PUT', 'DELETE'])('namedBuildReply, %s with an invalid id', (method) => {
    it.each([
        ['a 21-character id', ID.slice(1)],
        ['a saved-build id', 'AbCdEfGhIjK'],
        ['no id', undefined],
        ['an array id', [ID]],
    ])('answers 404 for %s with no store getter call', async (_label, id) => {
        const getter = getterFor(createMemoryBuildStore())
        expect(await named(getter, id, { method })).toStrictEqual(NOT_FOUND)
        expect(getter).not.toHaveBeenCalled()
    })
})

describe('namedBuildReply, PUT before any store call', () => {
    it('answers 401 with WWW-Authenticate: Bearer when Authorization and If-Match are both missing', async () => {
        const getter = getterFor(createMemoryBuildStore())
        expect(await named(getter, ID, { method: 'PUT' })).toStrictEqual({
            status: 401,
            headers: { 'WWW-Authenticate': 'Bearer' },
            body: { error: 'an edit secret is required' },
        })
        expect(getter).not.toHaveBeenCalled()
    })

    it.each([
        ['a Basic scheme', `Basic ${WRONG_SECRET}`],
        ['a short secret', bearer('A'.repeat(42))],
    ])('answers 401 for %s', async (_label, authorization) => {
        expect((await named(createMemoryBuildStore(), ID, { method: 'PUT', authorization, ifMatch: '"1"' })).status).toBe(401)
    })

    it('answers 428, not 400, for a valid secret with no If-Match and an invalid body', async () => {
        const getter = getterFor(createMemoryBuildStore())
        expect(await put(getter, ID, WRONG_SECRET, { ifMatch: undefined, body: [] })).toStrictEqual({
            status: 428,
            body: { error: 'If-Match with the current revision is required' },
        })
        expect(getter).not.toHaveBeenCalled()
    })

    it.each(['1', '"0"', 'W/"1"'])('answers 428 for If-Match %s', async (ifMatch) => {
        expect((await put(createMemoryBuildStore(), ID, WRONG_SECRET, { ifMatch })).status).toBe(428)
    })

    it.each(INVALID_BODIES)('answers %s with both headers with the check error, touching neither the store nor the counter', async (_label, body, status) => {
        const { store } = countingStore()
        const getter = getterFor(store)
        expect(await put(getter, ID, WRONG_SECRET, { body })).toStrictEqual({ status, body: checkedError(body) })
        expect(getter).not.toHaveBeenCalled()
        expect(store.bumpCounter).not.toHaveBeenCalled()
    })
})

describe('namedBuildReply, PUT store rows', () => {
    it('answers 503 when the store getter rejects', async () => {
        silenceErrors()
        expect(await put(rejectingGetter(), ID, WRONG_SECRET)).toStrictEqual(STORAGE_DOWN)
    })

    it('answers 429 for an exhausted slot before reading the build, even with a wrong secret', async () => {
        const { store, results } = countingStore()
        const { id } = await created(store)
        await exhaust(store)
        const getNamed = vi.spyOn(store, 'getNamed')
        const replaceNamed = vi.spyOn(store, 'replaceNamed')
        expect(await put(store, id, WRONG_SECRET, { nowMs: NOW })).toStrictEqual(TOO_MANY)
        expect(getNamed).not.toHaveBeenCalled()
        expect(replaceNamed).not.toHaveBeenCalled()
        expect(results.at(-1)).toBe('refused')
    })

    it('answers 503 when getNamed throws', async () => {
        silenceErrors()
        expect(await put(withBroken(createMemoryBuildStore(), { getNamed: () => Promise.reject(new Error('get down')) }), ID, WRONG_SECRET)).toStrictEqual(STORAGE_DOWN)
    })

    it('answers 404 for a well-formed id that is absent', async () => {
        expect(await put(createMemoryBuildStore(), ID, WRONG_SECRET)).toStrictEqual(NOT_FOUND)
    })

    it('answers 500 for a stored value that fails the schema, and logs no part of it', async () => {
        const error = silenceErrors()
        const marker = 'M'.repeat(40) + 'XyZ'
        const store = createMemoryBuildStore()
        const { id } = await created(store)
        await store.deleteNamed(id)
        await store.createNamed(id, JSON.stringify({ ...VALID, version: 1, revision: 0, createdAt: new Date(NOW).toISOString(), updatedAt: new Date(NOW).toISOString(), secretHash: `${marker}!` }))
        expect(await put(store, id, marker)).toStrictEqual(UNREADABLE)
        expect(error).toHaveBeenCalledOnce()
        expect(error.mock.calls[0][0]).toBe('builds: stored build failed its schema')
        expect(loggedStrings(error.mock.calls).filter((value) => value.includes(marker))).toStrictEqual([])
    })

    it('answers 403 for a wrong secret with a stale If-Match, so revisions stay hidden from non-owners', async () => {
        const store = createMemoryBuildStore()
        const { id } = await created(store)
        const replaceNamed = vi.spyOn(store, 'replaceNamed')
        expect(await put(store, id, WRONG_SECRET, { ifMatch: '"7"' })).toStrictEqual(MISMATCH)
        expect(replaceNamed).not.toHaveBeenCalled()
    })

    it('answers 412 for the right secret with a stale If-Match and writes nothing', async () => {
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        const before = await store.getNamed(id)
        expect(await put(store, id, editSecret, { ifMatch: '"2"' })).toStrictEqual(CHANGED)
        expect(await store.getNamed(id)).toStrictEqual(before)
    })

    it('answers 412 when another write lands between the read and the swap, and keeps that write', async () => {
        const inner = createMemoryBuildStore()
        const { id, editSecret } = await created(inner)
        const competitor = JSON.stringify({ ...(await storedValue(inner, id)), revision: 2, buildOrder: RENAMED.buildOrder })
        const replaceNamed = vi.fn(async (key: string, json: string, etag: string) => {
            await inner.replaceNamed(key, competitor, etag)
            return inner.replaceNamed(key, json, etag)
        })
        expect(await put(withBroken(inner, { replaceNamed }), id, editSecret)).toStrictEqual(CHANGED)
        expect(replaceNamed).toHaveBeenCalledOnce()
        expect(await storedValue(inner, id)).toStrictEqual(JSON.parse(competitor))
    })

    it.each(['getNamed', 'bumpCounter'] as const)('answers 503, not 412, and logs it when %s rejects a weak etag', async (method) => {
        const error = silenceErrors()
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        const weak = new Error(`Blob read of preview/named-builds/${id}.json returned a weak etag W/"abc", which ifMatch cannot use`)
        expect(await put(withBroken(store, { [method]: () => Promise.reject(weak) }), id, editSecret)).toStrictEqual(STORAGE_DOWN)
        expect(error).toHaveBeenCalledExactlyOnceWith('builds: storage failed', weak)
    })

    it('answers 412 for a stale revision and for a store conflict, logging each with its own line, the id and no secret', async () => {
        async function logged412(wrap: (store: BuildStore) => BuildStore, ifMatch: string) {
            const store = createMemoryBuildStore()
            const { id, editSecret } = await created(store)
            const hash = await editSecretHash(editSecret)
            const error = silenceErrors()
            expect(await put(wrap(store), id, editSecret, { ifMatch })).toStrictEqual(CHANGED)
            expect(error).toHaveBeenCalledOnce()
            const strings = loggedStrings(error.mock.calls)
            expect(strings.some((value) => value.includes(id))).toBe(true)
            expect(strings.filter((value) => value.includes(editSecret) || value.includes(hash))).toStrictEqual([])
            const [[line]] = error.mock.calls
            error.mockRestore()
            return line
        }
        const stale = await logged412((store) => store, '"2"')
        const conflict = await logged412((store) => withBroken(store, { replaceNamed: async () => 'conflict' as const }), '"1"')
        expect(stale).not.toBe(conflict)
    })

    it('answers 503 when replaceNamed throws', async () => {
        silenceErrors()
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        expect(await put(withBroken(store, { replaceNamed: () => Promise.reject(new Error('swap down')) }), id, editSecret)).toStrictEqual(STORAGE_DOWN)
    })
})

describe('namedBuildReply, PUT replaced', () => {
    it('answers 200 with ETag "2" and stores the new build, keeping createdAt and secretHash', async () => {
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        const before = await storedValue(store, id)
        const updatedAt = new Date(LATER).toISOString()
        expect(await put(store, id, editSecret, { body: RENAMED })).toStrictEqual({
            status: 200,
            headers: { ETag: '"2"' },
            body: { id, path: namedBuildPath(id), revision: 2, updatedAt },
        })
        const checked = checkSaveBuildRequest(RENAMED, catalog)
        if (!checked.ok) throw new Error('expected a valid body')
        expect(await storedValue(store, id)).toStrictEqual({
            ...checked.record,
            revision: 2,
            createdAt: before.createdAt,
            updatedAt,
            secretHash: before.secretHash,
        })
    })

    it('answers 412 when the same request is repeated', async () => {
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        expect((await put(store, id, editSecret, { body: RENAMED })).status).toBe(200)
        expect(await put(store, id, editSecret, { body: RENAMED })).toStrictEqual(CHANGED)
    })

    it('makes a new revision for content equal to the stored content', async () => {
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        await put(store, id, editSecret)
        const reply = await put(store, id, editSecret, { ifMatch: '"2"' })
        expect(reply.status).toBe(200)
        expect(reply.headers).toStrictEqual({ ETag: '"3"' })
        expect((await storedValue(store, id)).revision).toBe(3)
    })
})

describe('namedBuildReply, PUT slot accounting', () => {
    let current: BuildStore = createMemoryBuildStore()
    const store = () => current
    async function counted() {
        const counting = countingStore()
        const { id, editSecret } = await created(counting.store)
        return { ...counting, id, editSecret }
    }

    type Created = { id: string; editSecret: string }
    it.each([
        ['a 404 for an absent id', ({ editSecret }: Created) => put(store(), ID, editSecret), 404],
        ['a 403 for a wrong secret', ({ id }: Created) => put(store(), id, WRONG_SECRET), 403],
        ['a 412 for a stale revision', ({ id, editSecret }: Created) => put(store(), id, editSecret, { ifMatch: '"5"' }), 412],
        ['a 200', ({ id, editSecret }: Created) => put(store(), id, editSecret), 200],
    ])('spends one slot on %s', async (_label, request, status) => {
        const counting = await counted()
        current = counting.store
        expect((await request(counting)).status).toBe(status)
        expect(counting.counter()).toBe(2)
    })

    it.each([
        ['a 401', { authorization: undefined }, 401],
        ['a 428', { ifMatch: undefined }, 428],
        ['a 400', { body: [] }, 400],
    ])('spends no slot on %s', async (_label, options, status) => {
        const { store: counted_, counter, id, editSecret } = await counted()
        expect((await put(counted_, id, editSecret, options)).status).toBe(status)
        expect(counter()).toBe(1)
        expect(counted_.bumpCounter).toHaveBeenCalledOnce()
    })
})

describe('namedBuildReply, GET and DELETE', () => {
    it.each(['GET', 'DELETE'])('answers 503 for %s when the store getter rejects', async (method) => {
        silenceErrors()
        expect(await named(rejectingGetter(), ID, { method })).toStrictEqual(STORAGE_DOWN)
    })

    it.each(['GET', 'DELETE'])('answers 503 for %s when the store throws', async (method) => {
        silenceErrors()
        const broken = withBroken(createMemoryBuildStore(), {
            getNamed: () => Promise.reject(new Error('get down')),
            deleteNamed: () => Promise.reject(new Error('delete down')),
        })
        expect(await named(broken, ID, { method })).toStrictEqual(STORAGE_DOWN)
    })

    it('answers 404 for a GET of an absent id', async () => {
        expect(await named(createMemoryBuildStore(), ID)).toStrictEqual(NOT_FOUND)
    })

    it('answers 500 for a GET of a stored value that fails the schema, and logs once', async () => {
        const error = silenceErrors()
        const store = createMemoryBuildStore()
        await store.createNamed(ID, JSON.stringify({ ...VALID, version: 1, revision: 1 }))
        expect(await named(store, ID)).toStrictEqual(UNREADABLE)
        expect(error).toHaveBeenCalledExactlyOnceWith('builds: stored build failed its schema', expect.any(Error))
    })

    it('answers 200 for a created build with no-store, its revision ETag and every stored field but secretHash', async () => {
        const store = createMemoryBuildStore()
        const { id } = await created(store)
        const reply = await named(store, id)
        const { secretHash: _secretHash, ...shown } = await storedValue(store, id)
        expect(reply).toStrictEqual({ status: 200, headers: { 'Cache-Control': 'no-store', ETag: '"1"' }, body: { ...shown, id } })
        expect(Object.keys(reply.body as object)).not.toContain('secretHash')
        expect(Object.keys(reply.body as object)).toEqual(expect.arrayContaining(['id', 'revision', 'createdAt', 'updatedAt']))
    })

    it('answers the latest revision after an update', async () => {
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        await named(store, id)
        await put(store, id, editSecret, { body: RENAMED })
        const reply = await named(store, id)
        expect(reply.headers).toStrictEqual({ 'Cache-Control': 'no-store', ETag: '"2"' })
        expect(reply.body).toMatchObject({ revision: 2, buildOrder: { name: 'Renamed opener' } })
    })

    it('answers 204 for a DELETE in development, and a following GET answers 404', async () => {
        const store = createMemoryBuildStore()
        const { id } = await created(store)
        const reply = await named(store, id, { method: 'DELETE' })
        expect(reply).toStrictEqual({ status: 204 })
        const { target } = recordingTarget<NonNullable<typeof reply.body>>()
        sendReply(target, reply)
        expect(target.end).toHaveBeenCalledOnce()
        expect(target.json).not.toHaveBeenCalled()
        expect(await named(store, id)).toStrictEqual(NOT_FOUND)
    })

    it('answers 204 for a DELETE of an absent id', async () => {
        expect(await named(createMemoryBuildStore(), ID, { method: 'DELETE' })).toStrictEqual({ status: 204 })
    })

    it.each([
        ['a GET of a stored build', 'GET', true],
        ['a GET of an absent id', 'GET', false],
        ['a DELETE', 'DELETE', true],
    ])('spends no slot on %s', async (_label, method, existing) => {
        const { store, counter } = countingStore()
        const { id } = await created(store)
        await named(store, existing ? id : ID, { method })
        expect(counter()).toBe(1)
        expect(store.bumpCounter).toHaveBeenCalledOnce()
    })
})

describe('named build routes and the edit secret', () => {
    it('never logs the secret or its hash on create, update, 403 or 412', async () => {
        const spies = (['error', 'warn', 'info', 'log'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}))
        const store = createMemoryBuildStore()
        const { id, editSecret } = await created(store)
        const hash = await editSecretHash(editSecret)
        expect((await put(store, id, editSecret)).status).toBe(200)
        expect((await put(store, id, WRONG_SECRET, { ifMatch: '"2"' })).status).toBe(403)
        expect((await put(store, id, editSecret, { ifMatch: '"1"' })).status).toBe(412)
        const logged = spies.flatMap((spy) => loggedStrings(spy.mock.calls))
        expect(logged.filter((value) => value.includes(editSecret) || value.includes(hash))).toStrictEqual([])
    })
})
