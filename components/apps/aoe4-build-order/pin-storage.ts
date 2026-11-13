export const PIN_STORAGE_KEY = 'aoe4-build-order.pinned-run'

export interface StoredPin {
    version: 1
    name: string
    text: string
    durationSeconds: number
}

function isStoredPin(value: unknown): value is StoredPin {
    if (typeof value !== 'object' || value === null) return false
    const pin = value as Record<string, unknown>
    return pin.version === 1 && typeof pin.name === 'string' && typeof pin.text === 'string' && typeof pin.durationSeconds === 'number' && Number.isFinite(pin.durationSeconds)
}

export function readStoredPin(storage: Storage): StoredPin | null {
    try {
        const raw = storage.getItem(PIN_STORAGE_KEY)
        if (raw === null) return null
        try {
            const value: unknown = JSON.parse(raw)
            if (isStoredPin(value)) return { version: 1, name: value.name, text: value.text, durationSeconds: value.durationSeconds }
        } catch {}
    } catch {}
    return null
}

export function writeStoredPin(storage: Storage, pin: StoredPin): void {
    try {
        storage.setItem(PIN_STORAGE_KEY, JSON.stringify(pin))
    } catch {}
}

export function clearStoredPin(storage: Storage): void {
    try {
        storage.removeItem(PIN_STORAGE_KEY)
    } catch {}
}
