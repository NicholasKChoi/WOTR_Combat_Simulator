import { describe, expect, it } from 'vitest'
import { PIN_STORAGE_KEY, clearStoredPin, readStoredPin, writeStoredPin, type StoredPin } from './pin-storage'
import { fakeStorage, throwingStorage } from './storage-test-helpers'

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
        expect(readStoredPin(fakeStorage({ [PIN_STORAGE_KEY]: JSON.stringify({ ...pin, result: {} }) }))).toEqual(pin)
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
    ])('reads %s as no pin and leaves the stored value', (_label, raw) => {
        const storage = fakeStorage({ [PIN_STORAGE_KEY]: raw })
        expect(readStoredPin(storage)).toBeNull()
        expect(storage.getItem(PIN_STORAGE_KEY)).toBe(raw)
    })

    it('replaces an unreadable value on the next write', () => {
        const storage = fakeStorage({ [PIN_STORAGE_KEY]: '{nope' })
        expect(readStoredPin(storage)).toBeNull()
        writeStoredPin(storage, pin)
        expect(readStoredPin(storage)).toEqual(pin)
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
