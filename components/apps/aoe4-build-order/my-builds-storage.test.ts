import { describe, expect, it } from 'vitest'
import { MY_BUILDS_MAX, MY_BUILDS_STORAGE_KEY, myBuildsAvailable, readMyBuilds, upsertMyBuild, type MyBuildEntry } from './my-builds-storage'

function fakeStorage(initial?: string): Storage & { keys(): string[] } {
    const map = new Map<string, string>(initial === undefined ? [] : [[MY_BUILDS_STORAGE_KEY, initial]])
    return {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => void map.set(key, value),
        removeItem: (key: string) => void map.delete(key),
        keys: () => [...map.keys()],
    } as unknown as Storage & { keys(): string[] }
}

const throwing = (): never => {
    throw new Error('blocked')
}
const throwingStorage = { getItem: throwing, setItem: throwing, removeItem: throwing } as unknown as Storage

const id = (n: number): string => `${n}`.padStart(22, 'a')
const SECRET = 'S'.repeat(43)

function entry(n: number, updatedAt: string, extra: Partial<MyBuildEntry> = {}): MyBuildEntry {
    return { id: id(n), name: `Build ${n}`, editSecret: SECRET, revision: 1, updatedAt, ...extra }
}

const stored = (builds: unknown[]): string => JSON.stringify({ version: 1, builds })
const ids = (builds: readonly MyBuildEntry[]): string[] => builds.map((build) => build.id)

describe('readMyBuilds', () => {
    it('reads back a valid value with the stored fields', () => {
        const one = entry(1, '2026-11-10T18:00:00Z')
        expect(readMyBuilds(fakeStorage(stored([one])))).toEqual([one])
    })

    it('sorts by parsed instant, newest first', () => {
        const earlier = entry(1, '2026-11-10T18:00:00Z')
        const later = entry(2, '2026-11-10T18:00:00.500Z')
        const newest = entry(3, '2026-11-11T00:00:00Z')
        expect(ids(readMyBuilds(fakeStorage(stored([earlier, later, newest]))))).toEqual([id(3), id(2), id(1)])
    })

    it('keeps the later updatedAt for a duplicate id', () => {
        const old = entry(1, '2026-11-10T10:00:00Z', { revision: 1 })
        const fresh = entry(1, '2026-11-10T12:00:00Z', { revision: 2 })
        expect(readMyBuilds(fakeStorage(stored([fresh, old])))).toEqual([fresh])
        expect(readMyBuilds(fakeStorage(stored([old, fresh])))).toEqual([fresh])
    })

    it('keeps the earlier stored element for a duplicate id with equal updatedAt', () => {
        const first = entry(1, '2026-11-10T10:00:00Z', { revision: 1 })
        const second = entry(1, '2026-11-10T10:00:00Z', { revision: 2 })
        expect(readMyBuilds(fakeStorage(stored([first, second])))).toEqual([first])
    })

    it('keeps the stored order for distinct ids with equal updatedAt', () => {
        const at = '2026-11-10T10:00:00Z'
        expect(ids(readMyBuilds(fakeStorage(stored([entry(2, at), entry(1, at), entry(3, at)]))))).toEqual([id(2), id(1), id(3)])
    })

    it('drops only the invalid elements', () => {
        const at = '2026-11-10T10:00:00Z'
        const good = entry(1, at)
        const bad = [
            entry(2, at, { editSecret: 'S'.repeat(42) }),
            entry(3, at, { id: 'a'.repeat(21) }),
            entry(4, at, { name: '' }),
            entry(5, at, { name: 'n'.repeat(101) }),
            entry(6, at, { revision: 0 }),
            entry(7, at, { updatedAt: 'yesterday' }),
            entry(8, at, { updatedAt: '2026-11-10T18:00:00+00:00' }),
            null,
        ]
        const edge = entry(9, at, { name: 'n'.repeat(100) })
        expect(readMyBuilds(fakeStorage(stored([bad[0], good, ...bad.slice(1), edge])))).toEqual([good, edge])
    })

    it.each([
        ['non-JSON text', '{nope'],
        ['version 2', '{"version":2,"builds":[]}'],
        ['a missing builds list', '{"version":1}'],
        ['null', 'null'],
    ])('returns [] and removes the key for %s', (_label, raw) => {
        const storage = fakeStorage(raw)
        expect(readMyBuilds(storage)).toEqual([])
        expect(storage.getItem(MY_BUILDS_STORAGE_KEY)).toBeNull()
    })

    it('returns [] for an absent key and a throwing storage', () => {
        expect(readMyBuilds(fakeStorage())).toEqual([])
        expect(readMyBuilds(throwingStorage)).toEqual([])
    })
})

describe('upsertMyBuild', () => {
    it('inserts a new id and writes it', () => {
        const storage = fakeStorage()
        const one = entry(1, '2026-11-10T10:00:00Z')
        expect(upsertMyBuild(storage, one)).toEqual({ builds: [one], persisted: true })
        expect(readMyBuilds(storage)).toEqual([one])
    })

    it('replaces an existing id', () => {
        const other = entry(2, '2026-11-10T09:00:00Z')
        const storage = fakeStorage(stored([entry(1, '2026-11-10T10:00:00Z'), other]))
        const next = entry(1, '2026-11-10T11:00:00Z', { revision: 2 })
        expect(upsertMyBuild(storage, next).builds).toEqual([next, other])
        expect(readMyBuilds(storage)).toEqual([next, other])
    })

    it('caps the list and evicts the oldest entry', () => {
        const base = Date.parse('2026-11-10T00:00:00Z')
        const full = Array.from({ length: MY_BUILDS_MAX }, (_, n) => entry(n + 1, new Date(base + n * 1000).toISOString()))
        const storage = fakeStorage(stored(full))
        const added = entry(99, new Date(base + MY_BUILDS_MAX * 1000).toISOString())
        const { builds } = upsertMyBuild(storage, added)
        expect(builds).toHaveLength(MY_BUILDS_MAX)
        expect(builds[0]).toEqual(added)
        expect(ids(builds)).not.toContain(id(1))
        expect(readMyBuilds(storage)).toHaveLength(MY_BUILDS_MAX)
    })

    it('reports persisted false and still returns the new list when setItem throws', () => {
        const one = entry(1, '2026-11-10T10:00:00Z')
        const storage = { getItem: () => null, setItem: throwing, removeItem: throwing } as unknown as Storage
        expect(upsertMyBuild(storage, one)).toEqual({ builds: [one], persisted: false })
    })

    it('writes exactly version and builds', () => {
        const storage = fakeStorage()
        upsertMyBuild(storage, entry(1, '2026-11-10T10:00:00Z'))
        const raw: unknown = JSON.parse(storage.getItem(MY_BUILDS_STORAGE_KEY) ?? 'null')
        expect(Object.keys(raw as object).sort()).toEqual(['builds', 'version'])
    })
})

describe('myBuildsAvailable', () => {
    it('is false for null', () => {
        expect(myBuildsAvailable(null)).toBe(false)
    })

    it('is true for working storage and leaves the stored list and no extra key', () => {
        const storage = fakeStorage(stored([entry(1, '2026-11-10T10:00:00Z')]))
        const before = storage.getItem(MY_BUILDS_STORAGE_KEY)
        expect(myBuildsAvailable(storage)).toBe(true)
        expect(storage.getItem(MY_BUILDS_STORAGE_KEY)).toBe(before)
        expect(storage.keys()).toEqual([MY_BUILDS_STORAGE_KEY])
    })

    it.each([
        ['setItem', { getItem: () => null, setItem: throwing, removeItem: () => undefined }],
        ['removeItem', { getItem: () => null, setItem: () => undefined, removeItem: throwing }],
    ])('is false when %s throws', (_label, storage) => {
        expect(myBuildsAvailable(storage as unknown as Storage)).toBe(false)
    })
})
