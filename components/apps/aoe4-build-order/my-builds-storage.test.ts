import { describe, expect, it } from 'vitest'
import { MY_BUILDS_BACKUP_KEY, MY_BUILDS_MAX, MY_BUILDS_STORAGE_KEY, myBuildsAvailable, readMyBuilds, upsertMyBuild, type MyBuildEntry } from './my-builds-storage'
import { fakeStorage, throwingStorage } from './storage-test-helpers'

const id = (n: number): string => `${n}`.padStart(22, 'a')
const SECRET = 'S'.repeat(43)

function entry(n: number, updatedAt: string, extra: Partial<MyBuildEntry> = {}): MyBuildEntry {
    return { id: id(n), name: `Build ${n}`, editSecret: SECRET, revision: 1, updatedAt, ...extra }
}

const stored = (builds: unknown[]): string => JSON.stringify({ version: 1, builds })
const AT = '2026-11-10T10:00:00Z'

function recorded(entries: Record<string, string> = {}, overrides: Partial<Storage> = {}): { storage: ReturnType<typeof fakeStorage>; calls: string[] } {
    const storage = fakeStorage(entries)
    const calls: string[] = []
    const { getItem, setItem, removeItem } = storage
    Object.assign(storage, {
        getItem: (key: string) => (calls.push(`get:${key}`), getItem(key)),
        setItem: (key: string, value: string) => (calls.push(`set:${key}`), setItem(key, value)),
        removeItem: (key: string) => (calls.push(`remove:${key}`), removeItem(key)),
        ...overrides,
    })
    return { storage, calls }
}

const writesOf = (calls: readonly string[]): string[] => calls.filter((call) => !call.startsWith('get:'))

const unreadable: [string, string][] = [
    ['non-JSON text', '{nope'],
    ['version 2', '{"version":2,"builds":[]}'],
    ['a missing builds list', '{"version":1}'],
    ['null', 'null'],
]
const withInvalidElement = stored([entry(1, AT), entry(2, AT, { revision: 0 })])

const ids = (builds: readonly MyBuildEntry[]): string[] => builds.map((build) => build.id)

describe('readMyBuilds', () => {
    it('reads back a valid value with the stored fields', () => {
        const one = entry(1, '2026-11-10T18:00:00Z')
        expect(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([one]) }))).toEqual([one])
    })

    it('sorts by parsed instant, newest first', () => {
        const earlier = entry(1, '2026-11-10T18:00:00Z')
        const later = entry(2, '2026-11-10T18:00:00.500Z')
        const newest = entry(3, '2026-11-11T00:00:00Z')
        expect(ids(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([earlier, later, newest]) })))).toEqual([id(3), id(2), id(1)])
    })

    it('keeps the later updatedAt for a duplicate id', () => {
        const old = entry(1, '2026-11-10T10:00:00Z', { revision: 1 })
        const fresh = entry(1, '2026-11-10T12:00:00Z', { revision: 2 })
        expect(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([fresh, old]) }))).toEqual([fresh])
        expect(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([old, fresh]) }))).toEqual([fresh])
    })

    it('keeps the earlier stored element for a duplicate id with equal updatedAt', () => {
        const first = entry(1, '2026-11-10T10:00:00Z', { revision: 1 })
        const second = entry(1, '2026-11-10T10:00:00Z', { revision: 2 })
        expect(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([first, second]) }))).toEqual([first])
    })

    it('keeps the stored order for distinct ids with equal updatedAt', () => {
        const at = '2026-11-10T10:00:00Z'
        expect(ids(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([entry(2, at), entry(1, at), entry(3, at)]) })))).toEqual([id(2), id(1), id(3)])
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
        expect(readMyBuilds(fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([bad[0], good, ...bad.slice(1), edge]) }))).toEqual([good, edge])
    })

    it.each(unreadable)('returns [] and leaves the value untouched for %s', (_label, raw) => {
        const { storage, calls } = recorded({ [MY_BUILDS_STORAGE_KEY]: raw })
        expect(readMyBuilds(storage)).toEqual([])
        expect(storage.getItem(MY_BUILDS_STORAGE_KEY)).toBe(raw)
        expect(storage.keys()).toEqual([MY_BUILDS_STORAGE_KEY])
        expect(writesOf(calls)).toEqual([])
    })

    it('leaves a value with an invalid element untouched and returns the valid ones', () => {
        const { storage, calls } = recorded({ [MY_BUILDS_STORAGE_KEY]: withInvalidElement })
        expect(ids(readMyBuilds(storage))).toEqual([id(1)])
        expect(storage.getItem(MY_BUILDS_STORAGE_KEY)).toBe(withInvalidElement)
        expect(writesOf(calls)).toEqual([])
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
        const storage = fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([entry(1, '2026-11-10T10:00:00Z'), other]) })
        const next = entry(1, '2026-11-10T11:00:00Z', { revision: 2 })
        expect(upsertMyBuild(storage, next).builds).toEqual([next, other])
        expect(readMyBuilds(storage)).toEqual([next, other])
    })

    it('caps the list and evicts the oldest entry', () => {
        const base = Date.parse('2026-11-10T00:00:00Z')
        const full = Array.from({ length: MY_BUILDS_MAX }, (_, n) => entry(n + 1, new Date(base + n * 1000).toISOString()))
        const storage = fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored(full) })
        const added = entry(99, new Date(base + MY_BUILDS_MAX * 1000).toISOString())
        const { builds } = upsertMyBuild(storage, added)
        expect(builds).toHaveLength(MY_BUILDS_MAX)
        expect(builds[0]).toEqual(added)
        expect(ids(builds)).not.toContain(id(1))
        expect(readMyBuilds(storage)).toHaveLength(MY_BUILDS_MAX)
    })

    it('reports persisted false and still returns the new list when setItem throws', () => {
        const one = entry(1, '2026-11-10T10:00:00Z')
        const storage = Object.assign(fakeStorage(), { setItem: throwingStorage.setItem, removeItem: throwingStorage.removeItem })
        expect(upsertMyBuild(storage, one)).toEqual({ builds: [one], persisted: false })
    })

    it('writes exactly version and builds', () => {
        const storage = fakeStorage()
        upsertMyBuild(storage, entry(1, '2026-11-10T10:00:00Z'))
        const raw: unknown = JSON.parse(storage.getItem(MY_BUILDS_STORAGE_KEY) ?? 'null')
        expect(Object.keys(raw as object).sort()).toEqual(['builds', 'version'])
    })

    it.each([...unreadable, ['an invalid element', withInvalidElement]])('backs up %s verbatim before writing the list', (_label, raw) => {
        const { storage, calls } = recorded({ [MY_BUILDS_STORAGE_KEY]: raw })
        const result = upsertMyBuild(storage, entry(5, AT))
        expect(result.persisted).toBe(true)
        expect(ids(result.builds)).toContain(id(5))
        expect(storage.getItem(MY_BUILDS_BACKUP_KEY)).toBe(raw)
        expect(writesOf(calls)).toEqual([`set:${MY_BUILDS_BACKUP_KEY}`, `set:${MY_BUILDS_STORAGE_KEY}`])
        expect(readMyBuilds(storage)).toEqual(result.builds)
    })

    it('keeps an existing backup when a later unreadable value is replaced', () => {
        const { storage } = recorded({ [MY_BUILDS_STORAGE_KEY]: '{nope', [MY_BUILDS_BACKUP_KEY]: 'first' })
        const result = upsertMyBuild(storage, entry(5, AT))
        expect(result.persisted).toBe(true)
        expect(storage.getItem(MY_BUILDS_BACKUP_KEY)).toBe('first')
        expect(readMyBuilds(storage)).toEqual(result.builds)
    })

    it('writes no list and keeps the original value when the backup write throws', () => {
        const { storage, calls } = recorded({ [MY_BUILDS_STORAGE_KEY]: '{nope' })
        const setItem = storage.setItem
        storage.setItem = (key, value) => (key === MY_BUILDS_BACKUP_KEY ? throwingStorage.setItem(key, value) : setItem(key, value))
        const added = entry(5, AT)
        expect(upsertMyBuild(storage, added)).toEqual({ builds: [added], persisted: false })
        expect(storage.getItem(MY_BUILDS_STORAGE_KEY)).toBe('{nope')
        expect(calls).not.toContain(`set:${MY_BUILDS_STORAGE_KEY}`)
    })

    it.each([
        ['missing', {}],
        ['intact', { [MY_BUILDS_STORAGE_KEY]: stored([entry(1, AT)]) }],
    ])('touches no backup key over a %s value', (_label, seed) => {
        const { storage, calls } = recorded(seed)
        expect(upsertMyBuild(storage, entry(5, AT)).persisted).toBe(true)
        expect(calls.filter((call) => call.endsWith(MY_BUILDS_BACKUP_KEY))).toEqual([])
        expect(storage.keys()).toEqual([MY_BUILDS_STORAGE_KEY])
    })

    it('writes the list without touching the backup key when getItem throws', () => {
        const { storage, calls } = recorded({}, { getItem: throwingStorage.getItem })
        const added = entry(5, AT)
        expect(upsertMyBuild(storage, added)).toEqual({ builds: [added], persisted: true })
        expect(calls).toEqual([`set:${MY_BUILDS_STORAGE_KEY}`])
    })

    it('reports persisted false when getItem and the list write both throw', () => {
        const { storage } = recorded({}, { getItem: throwingStorage.getItem, setItem: throwingStorage.setItem })
        const added = entry(5, AT)
        expect(upsertMyBuild(storage, added)).toEqual({ builds: [added], persisted: false })
    })
})

describe('myBuildsAvailable', () => {
    it('is false for null', () => {
        expect(myBuildsAvailable(null)).toBe(false)
    })

    it('is true for working storage and leaves the stored list and no extra key', () => {
        const storage = fakeStorage({ [MY_BUILDS_STORAGE_KEY]: stored([entry(1, '2026-11-10T10:00:00Z')]) })
        const before = storage.getItem(MY_BUILDS_STORAGE_KEY)
        expect(myBuildsAvailable(storage)).toBe(true)
        expect(storage.getItem(MY_BUILDS_STORAGE_KEY)).toBe(before)
        expect(storage.keys()).toEqual([MY_BUILDS_STORAGE_KEY])
    })

    it.each([
        ['setItem', { setItem: throwingStorage.setItem }],
        ['removeItem', { removeItem: throwingStorage.removeItem }],
    ])('is false when %s throws', (_label, throwingMember) => {
        expect(myBuildsAvailable(Object.assign(fakeStorage(), throwingMember))).toBe(false)
    })
})
