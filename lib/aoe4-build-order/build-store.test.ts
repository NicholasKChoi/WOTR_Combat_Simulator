import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BUILDS_LOCAL_DIR_DEFAULT, buildStoreFromEnv, createFileBuildStore, createMemoryBuildStore, type BuildStore, type CounterUpdate } from './build-store'

const blobFactory = vi.hoisted(() => ({ create: vi.fn(), imported: vi.fn() }))

vi.mock('./blob-build-store', () => {
    blobFactory.imported()
    return { createBlobBuildStore: blobFactory.create }
})

const ID = 'Zx3_k9-QaB0'
const OTHER_ID = 'Ab3_k9-QaB1'
const HOUR = 3_600_000
const W = 1_000 * HOUR

const processEnv = (values: Record<string, string | undefined>) => values as NodeJS.ProcessEnv

let dir: string

beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'build-store-'))
})

afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
})

const factories: [string, (env: string) => BuildStore][] = [
    ['memory', (env) => createMemoryBuildStore(env)],
    ['file', (env) => createFileBuildStore(dir, env)],
]

async function counts(store: BuildStore, clientKey: string, windows: number[]) {
    const results: (CounterUpdate | 'contended')[] = []
    for (const windowStart of windows) results.push(await store.bumpCounter(clientKey, windowStart))
    return results.map((result) => (result === 'contended' ? result : result.count))
}

describe.each(factories)('%s build store', (_label, makeStore) => {
    it('creates a build once and never overwrites it', async () => {
        const store = makeStore('development')
        expect(await store.putBuild(ID, JSON.stringify({ a: 1 }))).toBe('created')
        expect(await store.getBuild(ID)).toStrictEqual({ a: 1 })
        expect(await store.putBuild(ID, JSON.stringify({ a: 2 }))).toBe('exists')
        expect(await store.getBuild(ID)).toStrictEqual({ a: 1 })
    })

    it('reads an absent build as null', async () => {
        expect(await makeStore('development').getBuild(ID)).toBeNull()
    })

    it('deletes a stored build and accepts deleting an absent one', async () => {
        const store = makeStore('development')
        await store.putBuild(ID, '{}')
        await store.deleteBuild(ID)
        expect(await store.getBuild(ID)).toBeNull()
        await expect(store.deleteBuild(OTHER_ID)).resolves.toBeUndefined()
    })

    it('counts within a window and restarts in any other window', async () => {
        expect(await counts(makeStore('development'), 'c', [W, W, W, W + HOUR, W])).toStrictEqual([1, 2, 3, 1, 1])
    })

    it('keeps separate counters per client key', async () => {
        const store = makeStore('development')
        expect(await counts(store, 'a', [W, W])).toStrictEqual([1, 2])
        expect(await counts(store, 'b', [W])).toStrictEqual([1])
        expect(await counts(store, 'a', [W])).toStrictEqual([3])
    })

    it('shares neither builds nor counters between envs', async () => {
        const preview = makeStore('preview')
        const production = makeStore('production')
        await preview.putBuild(ID, '{"env":"preview"}')
        expect(await production.getBuild(ID)).toBeNull()
        expect(await production.putBuild(ID, '{"env":"production"}')).toBe('created')
        expect(await preview.getBuild(ID)).toStrictEqual({ env: 'preview' })
        expect(await counts(preview, 'c', [W, W])).toStrictEqual([1, 2])
        expect(await counts(production, 'c', [W])).toStrictEqual([1])
    })

    it('loses no update under ten concurrent bumps of one key', async () => {
        const store = makeStore('development')
        const results = await Promise.all(Array.from({ length: 10 }, () => store.bumpCounter('c', W)))
        expect(results).not.toContain('contended')
        expect(results.map((result) => (result === 'contended' ? 0 : result.count)).sort((a, b) => a - b)).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        expect(await store.bumpCounter('c', W)).toStrictEqual({ windowStart: W, count: 11 })
    })
})

describe('file build store layout', () => {
    it('writes builds to <dir>/<env>/builds/<id>.json', async () => {
        await createFileBuildStore(dir, 'preview').putBuild(ID, '{"x":1}')
        expect(readFileSync(path.join(dir, 'preview', 'builds', `${ID}.json`), 'utf8')).toBe('{"x":1}')
    })

    it('stores the window and count in the counter file', async () => {
        await createFileBuildStore(dir, 'development').bumpCounter('c', W)
        expect(JSON.parse(readFileSync(path.join(dir, 'development', 'rate-limit', 'c.json'), 'utf8'))).toStrictEqual({ windowStart: W, count: 1 })
    })

    it.each([
        ['leaves the directory', '../../../escaped'],
        ['stays inside but aliases another key', '../builds/aliased'],
    ])('rejects a client key that %s', async (_label, key) => {
        const inner = path.join(dir, 'inner')
        await expect(createFileBuildStore(inner, 'development').bumpCounter(key, W)).rejects.toThrow('not a plain path')
        expect(existsSync(path.join(dir, 'escaped.json'))).toBe(false)
        expect(existsSync(path.join(inner, 'development', 'builds', 'aliased.json'))).toBe(false)
    })

    it('rejects a client key of ../x without writing it', async () => {
        await expect(createFileBuildStore(dir, 'development').bumpCounter('../x', W)).rejects.toThrow('not a plain path')
        expect(existsSync(path.join(dir, 'development', 'x.json'))).toBe(false)
    })

    it.each([
        ['a build id', 'development', '../../../escaped'],
        ['an env', '..', 'escaped'],
    ])('rejects %s that leaves the directory', async (_label, env, id) => {
        const inner = path.join(dir, 'inner')
        await expect(createFileBuildStore(inner, env).putBuild(id, '{}')).rejects.toThrow('not a plain path')
        expect(existsSync(path.join(dir, 'escaped.json'))).toBe(false)
        expect(existsSync(path.join(dir, 'builds', 'escaped.json'))).toBe(false)
    })
})

describe('buildStoreFromEnv', () => {
    beforeEach(() => {
        blobFactory.create.mockReset()
        blobFactory.imported.mockReset()
        vi.resetModules()
    })

    it.each([
        ['unset', undefined],
        ['empty', ''],
    ])('uses BUILDS_LOCAL_DIR when BUILDS_STORE_ID is %s', async (_label, storeId) => {
        const store = await buildStoreFromEnv(processEnv({ BUILDS_STORE_ID: storeId, BUILDS_LOCAL_DIR: dir, VERCEL_ENV: 'preview' }))
        await store.putBuild(ID, '{}')
        expect(existsSync(path.join(dir, 'preview', 'builds', `${ID}.json`))).toBe(true)
        expect(blobFactory.imported).not.toHaveBeenCalled()
    })

    it.each([
        ['unset', {}],
        ['empty', { BUILDS_LOCAL_DIR: '' }],
    ])('uses the default directory when BUILDS_LOCAL_DIR is %s', async (_label, extra) => {
        const cwd = vi.spyOn(process, 'cwd').mockReturnValue(dir)
        try {
            const store = await buildStoreFromEnv(processEnv(extra))
            await store.putBuild(ID, '{}')
        } finally {
            cwd.mockRestore()
        }
        expect(existsSync(path.join(dir, BUILDS_LOCAL_DIR_DEFAULT, 'development', 'builds', `${ID}.json`))).toBe(true)
    })

    it.each([
        ['preview', 'preview'],
        ['production', 'production'],
        ['staging', 'development'],
    ])('creates the Blob store for VERCEL_ENV %s with env %s', async (vercelEnv, storage) => {
        const blobStore = createMemoryBuildStore()
        blobFactory.create.mockReturnValue(blobStore)
        expect(await buildStoreFromEnv(processEnv({ BUILDS_STORE_ID: 'store_x', VERCEL_ENV: vercelEnv }))).toBe(blobStore)
        expect(blobFactory.create).toHaveBeenCalledExactlyOnceWith('store_x', storage)
    })

    it('builds a fresh store for every explicit env', async () => {
        const env = processEnv({ BUILDS_LOCAL_DIR: dir })
        expect(await buildStoreFromEnv(env)).not.toBe(await buildStoreFromEnv(env))
    })

    describe('without an argument', () => {
        afterEach(() => {
            vi.unstubAllEnvs()
        })

        it('memoizes the store from process.env', async () => {
            vi.stubEnv('BUILDS_STORE_ID', 'store_x')
            blobFactory.create.mockImplementation(() => createMemoryBuildStore())
            const { buildStoreFromEnv: fresh } = await import('./build-store')
            expect(await fresh()).toBe(await fresh())
            expect(blobFactory.create).toHaveBeenCalledOnce()
        })

        it('does not memoize a failed import and tries again on the next call', async () => {
            vi.stubEnv('BUILDS_STORE_ID', 'store_x')
            vi.doMock('./blob-build-store', () => {
                throw new Error('blob import failed')
            })
            const { buildStoreFromEnv: fresh } = await import('./build-store')
            await expect(fresh()).rejects.toThrow()

            const working = createMemoryBuildStore()
            vi.doMock('./blob-build-store', () => ({ createBlobBuildStore: () => working }))
            expect(await fresh()).toBe(working)
        })
    })
})
