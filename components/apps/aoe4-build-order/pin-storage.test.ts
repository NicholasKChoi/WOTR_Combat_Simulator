import { describe, expect, it } from 'vitest'
import { PIN_STORAGE_KEY, clearStoredPin, readStoredPin, writeStoredPin, type StoredPin } from './pin-storage'

function fakeStorage(initial?: string): Storage {
    const map = new Map<string, string>(initial === undefined ? [] : [[PIN_STORAGE_KEY, initial]])
    return {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => void map.set(key, value),
        removeItem: (key: string) => void map.delete(key),
    } as Storage
}

const throwing = (): never => {
    throw new Error('blocked')
}
const throwingStorage = { getItem: throwing, setItem: throwing, removeItem: throwing } as unknown as Storage

const pin: StoredPin = { version: 1, name: 'ENG 1TC', text: 'start -> sheep', durationSeconds: 1200 }

describe('pin storage', () => {
    it('reads back what was written', () => {
        const storage = fakeStorage()
        writeStoredPin(storage, pin)
        expect(readStoredPin(storage)).toEqual(pin)
    })

    it('reads null when the key is absent', () => {
        expect(readStoredPin(fakeStorage())).toBeNull()
    })

    it('ignores extra fields', () => {
        expect(readStoredPin(fakeStorage(JSON.stringify({ ...pin, result: {} })))).toEqual(pin)
    })

    it.each([
        ['invalid JSON', '{nope'],
        ['a non-object', '5'],
        ['null', 'null'],
        ['version 2', JSON.stringify({ ...pin, version: 2 })],
        ['a numeric name', JSON.stringify({ ...pin, name: 3 })],
        ['a numeric text', JSON.stringify({ ...pin, text: 3 })],
        ['a missing duration', JSON.stringify({ version: 1, name: 'a', text: 'b' })],
        ['a null duration', JSON.stringify({ ...pin, durationSeconds: null })],
        ['an infinite duration', '{"version":1,"name":"a","text":"b","durationSeconds":1e999}'],
        ['a string duration', JSON.stringify({ ...pin, durationSeconds: '1200' })],
    ])('drops %s and removes the key', (_label, raw) => {
        const storage = fakeStorage(raw)
        expect(readStoredPin(storage)).toBeNull()
        expect(storage.getItem(PIN_STORAGE_KEY)).toBeNull()
    })

    it('clears the key', () => {
        const storage = fakeStorage()
        writeStoredPin(storage, pin)
        clearStoredPin(storage)
        expect(storage.getItem(PIN_STORAGE_KEY)).toBeNull()
    })

    it('never throws on a storage that throws', () => {
        expect(readStoredPin(throwingStorage)).toBeNull()
        expect(() => writeStoredPin(throwingStorage, pin)).not.toThrow()
        expect(() => clearStoredPin(throwingStorage)).not.toThrow()
    })
})
