import { z } from 'zod'

import { EDIT_SECRET_PATTERN, NAMED_BUILD_ID_PATTERN } from '../../../lib/aoe4-build-order/named-builds'
import { SAVED_NAME_MAX_CHARS } from '../../../lib/aoe4-build-order/saved-builds'

export const MY_BUILDS_STORAGE_KEY = 'aoe4-build-order.my-builds'
export const MY_BUILDS_MAX = 50
export const MY_BUILDS_BACKUP_KEY = 'aoe4-build-order.my-builds.backup'

const PROBE_KEY = 'aoe4-build-order.my-builds-probe'

const myBuildEntrySchema = z.object({
    id: z.string().regex(NAMED_BUILD_ID_PATTERN),
    name: z.string().min(1).max(SAVED_NAME_MAX_CHARS),
    editSecret: z.string().regex(EDIT_SECRET_PATTERN),
    revision: z.number().int().min(1),
    updatedAt: z.string().datetime(),
})

export const storedMyBuildsSchema = z.object({
    version: z.literal(1),
    builds: z.array(myBuildEntrySchema),
})

export type MyBuildEntry = z.infer<typeof storedMyBuildsSchema>['builds'][number]

const storedShapeSchema = z.object({ version: z.literal(1), builds: z.array(z.unknown()) })

function newestFirst(entries: readonly MyBuildEntry[]): MyBuildEntry[] {
    return [...entries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function dedupeById(entries: readonly MyBuildEntry[]): MyBuildEntry[] {
    const winner = new Map<string, number>()
    entries.forEach((entry, index) => {
        const kept = winner.get(entry.id)
        if (kept === undefined || Date.parse(entry.updatedAt) > Date.parse(entries[kept].updatedAt)) winner.set(entry.id, index)
    })
    return entries.filter((entry, index) => winner.get(entry.id) === index)
}

interface StoredValue {
    raw: string
    valid: MyBuildEntry[]
    intact: boolean
}

function readStored(storage: Storage): StoredValue | null {
    const raw = storage.getItem(MY_BUILDS_STORAGE_KEY)
    if (raw === null) return null
    let elements: unknown[] = []
    try {
        const shape = storedShapeSchema.safeParse(JSON.parse(raw))
        if (shape.success) elements = shape.data.builds
        else return { raw, valid: [], intact: false }
    } catch {
        return { raw, valid: [], intact: false }
    }
    const valid = elements.flatMap((element) => {
        const parsed = myBuildEntrySchema.safeParse(element)
        return parsed.success ? [parsed.data] : []
    })
    return { raw, valid, intact: valid.length === elements.length }
}

export function readMyBuilds(storage: Storage): MyBuildEntry[] {
    try {
        const value = readStored(storage)
        return value === null ? [] : newestFirst(dedupeById(value.valid))
    } catch {
        return []
    }
}

function backUpUnreadable(storage: Storage, raw: string): boolean {
    try {
        if (storage.getItem(MY_BUILDS_BACKUP_KEY) === null) storage.setItem(MY_BUILDS_BACKUP_KEY, raw)
        return true
    } catch {
        return false
    }
}

export function upsertMyBuild(storage: Storage, entry: MyBuildEntry): { builds: MyBuildEntry[]; persisted: boolean } {
    let stored: StoredValue | null = null
    try {
        stored = readStored(storage)
    } catch {}
    const others = stored === null ? [] : newestFirst(dedupeById(stored.valid)).filter((existing) => existing.id !== entry.id)
    const builds = newestFirst([entry, ...others]).slice(0, MY_BUILDS_MAX)
    if (stored !== null && !stored.intact && !backUpUnreadable(storage, stored.raw)) return { builds, persisted: false }
    try {
        storage.setItem(MY_BUILDS_STORAGE_KEY, JSON.stringify({ version: 1, builds }))
        return { builds, persisted: true }
    } catch {
        return { builds, persisted: false }
    }
}

export function myBuildsAvailable(storage: Storage | null): boolean {
    if (storage === null) return false
    try {
        storage.setItem(PROBE_KEY, '1')
        storage.removeItem(PROBE_KEY)
        return true
    } catch {
        return false
    }
}
