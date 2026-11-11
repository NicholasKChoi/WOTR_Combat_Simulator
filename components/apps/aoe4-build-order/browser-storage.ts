export function browserStorage(): Storage | null {
    try {
        return window.localStorage
    } catch {
        return null
    }
}
