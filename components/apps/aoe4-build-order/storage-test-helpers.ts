export function fakeStorage(entries: Record<string, string> = {}): Storage & { keys(): string[] } {
    const map = new Map<string, string>(Object.entries(entries))
    return {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => void map.set(key, value),
        removeItem: (key: string) => void map.delete(key),
        clear: () => map.clear(),
        key: (index: number) => [...map.keys()][index] ?? null,
        get length() {
            return map.size
        },
        keys: () => [...map.keys()],
    }
}

const blocked = (): never => {
    throw new Error('blocked')
}

export const throwingStorage: Storage = {
    getItem: blocked,
    setItem: blocked,
    removeItem: blocked,
    clear: blocked,
    key: blocked,
    get length(): number {
        return blocked()
    },
}
