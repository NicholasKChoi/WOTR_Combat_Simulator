import { describe, expect, it } from 'vitest'
import { fakeStorage, throwingStorage } from './storage-test-helpers'

describe('throwingStorage', () => {
    it.each([
        ['getItem', () => throwingStorage.getItem('a')],
        ['setItem', () => throwingStorage.setItem('a', 'b')],
        ['removeItem', () => throwingStorage.removeItem('a')],
        ['clear', () => throwingStorage.clear()],
        ['key', () => throwingStorage.key(0)],
        ['length', () => throwingStorage.length],
    ])('throws from %s', (_member, use) => {
        expect(use).toThrow('blocked')
    })
})

describe('fakeStorage', () => {
    it('returns the seeded entries and null for a missing key', () => {
        const storage = fakeStorage({ a: '1', b: '2' })
        expect([storage.getItem('a'), storage.getItem('b'), storage.getItem('c')]).toEqual(['1', '2', null])
        expect(storage.keys()).toEqual(['a', 'b'])
        expect(storage.length).toBe(2)
        expect(storage.key(1)).toBe('b')
        expect(storage.key(2)).toBeNull()
    })

    it('reflects setItem, removeItem and clear in getItem, keys and length', () => {
        const storage = fakeStorage({ a: '1', b: '2' })
        storage.setItem('c', '3')
        expect([storage.getItem('c'), storage.keys(), storage.length]).toEqual(['3', ['a', 'b', 'c'], 3])
        storage.setItem('a', 'x')
        expect([storage.getItem('a'), storage.length]).toEqual(['x', 3])
        storage.removeItem('a')
        expect([storage.getItem('a'), storage.keys(), storage.length]).toEqual([null, ['b', 'c'], 2])
        storage.clear()
        expect([storage.getItem('b'), storage.keys(), storage.length]).toEqual([null, [], 0])
    })

    it('does not share entries between instances or with the seed record', () => {
        const seed = { a: '1' }
        const storage = fakeStorage(seed)
        storage.setItem('b', '2')
        expect(seed).toEqual({ a: '1' })
        expect(fakeStorage().keys()).toEqual([])
    })
})
