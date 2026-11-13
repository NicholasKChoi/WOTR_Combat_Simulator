import type { NamedBuild } from '../../../lib/aoe4-build-order/named-builds'
import { formatBuildOrderText } from '../../../lib/aoe4-build-order/parse-text'
import { SAVED_NAME_MAX_CHARS, type SavedBuild } from '../../../lib/aoe4-build-order/saved-builds'
import { MY_BUILDS_MAX, type MyBuildEntry } from './my-builds-storage'

export type LibraryEntryKind = 'template' | 'mine' | 'shared' | 'link'

export interface LoadedVersion {
    text: string
    duration: string | null
    revision: number | null
}

export interface LibraryEntry {
    key: string
    kind: LibraryEntryKind
    name: string
    id: string | null
    loaded: LoadedVersion | null
}

export const LIBRARY_GROUPS: readonly { kind: readonly LibraryEntryKind[]; label: string }[] = [
    { kind: ['mine'], label: 'My builds' },
    { kind: ['shared', 'link'], label: 'Opened links' },
    { kind: ['template'], label: 'Templates' },
]

export const entryKey = {
    template: (name: string): string => `template:${name}`,
    named: (id: string): string => `named:${id}`,
    link: (id: string): string => `link:${id}`,
}

const EDITED_SUFFIX = ' (edited)'
const COPY_SUFFIX = ' (copy)'
const CUSTOM_BUILD_NAME = 'Custom build'

export function templateEntries(builds: readonly { name: string; text: string }[]): LibraryEntry[] {
    return builds.map((build) => ({
        key: entryKey.template(build.name),
        kind: 'template',
        name: build.name,
        id: null,
        loaded: { text: build.text, duration: null, revision: null },
    }))
}

export function mineEntries(stored: readonly MyBuildEntry[]): LibraryEntry[] {
    return stored.map((entry) => ({ key: entryKey.named(entry.id), kind: 'mine', name: entry.name, id: entry.id, loaded: null }))
}

export function linkEntry(id: string, saved: SavedBuild): LibraryEntry {
    return {
        key: entryKey.link(id),
        kind: 'link',
        name: saved.buildOrder.name,
        id,
        loaded: { text: formatBuildOrderText(saved.buildOrder), duration: String(saved.durationSeconds), revision: null },
    }
}

export function namedEntry(kind: 'mine' | 'shared', build: NamedBuild): LibraryEntry {
    return {
        key: entryKey.named(build.id),
        kind,
        name: build.buildOrder.name,
        id: build.id,
        loaded: { text: formatBuildOrderText(build.buildOrder), duration: String(build.durationSeconds), revision: build.revision },
    }
}

export function savedMineEntry(id: string, name: string, input: { text: string; duration: string }, revision: number): LibraryEntry {
    return { key: entryKey.named(id), kind: 'mine', name, id, loaded: { text: input.text, duration: input.duration, revision } }
}

export function withMyBuilds(list: readonly LibraryEntry[], mine: readonly LibraryEntry[]): LibraryEntry[] {
    const listed = new Map(list.map((entry) => [entry.key, entry]))
    const mineKeys = new Set(mine.map((entry) => entry.key))
    const kept = list.filter((entry) => !mineKeys.has(entry.key))
    return [...kept, ...mine.map((entry) => ({ ...entry, loaded: listed.get(entry.key)?.loaded ?? entry.loaded }))]
}

export function withCreatedEntry(list: readonly LibraryEntry[], entry: LibraryEntry, selectedKey: string): LibraryEntry[] {
    const others = list.filter((listed) => listed.key !== entry.key)
    const firstMine = others.findIndex((listed) => listed.kind === 'mine')
    const at = firstMine === -1 ? others.length : firstMine
    const placed = [...others.slice(0, at), entry, ...others.slice(at)]
    let excess = placed.filter((listed) => listed.kind === 'mine').length - MY_BUILDS_MAX
    const dropped = new Set<string>()
    for (let i = placed.length - 1; i >= 0 && excess > 0; i--) {
        const { key, kind } = placed[i]
        if (kind !== 'mine' || key === selectedKey) continue
        dropped.add(key)
        excess--
    }
    return placed.filter((listed) => !dropped.has(listed.key))
}

export function withLoadedEntry(list: readonly LibraryEntry[], entry: LibraryEntry): LibraryEntry[] {
    if (!list.some((listed) => listed.key === entry.key)) return [...list, entry]
    return list.map((listed) => {
        if (listed.key !== entry.key) return listed
        return listed.kind === 'mine' ? { ...listed, loaded: entry.loaded } : entry
    })
}

export function entryLabel(entry: LibraryEntry, edited: boolean): string {
    const base = entry.kind === 'shared' ? `${entry.name} (shared)` : entry.kind === 'link' ? `${entry.name} (${entry.id})` : entry.name
    return edited ? `${base}${EDITED_SUFFIX}` : base
}

export function isEdited(entry: LibraryEntry | undefined, live: { text: string; duration: string }): boolean {
    const loaded = entry?.loaded
    if (loaded === undefined || loaded === null) return false
    return live.text !== loaded.text || (loaded.duration !== null && live.duration !== loaded.duration)
}

export function copyName(name: string): string {
    const base = name.endsWith(EDITED_SUFFIX) ? name.slice(0, -EDITED_SUFFIX.length) : name
    return `${base.slice(0, SAVED_NAME_MAX_CHARS - COPY_SUFFIX.length)}${COPY_SUFFIX}`
}

// The entry whose loaded text is `text`, preferring the selected one when several share it.
function entryWithText(entries: readonly LibraryEntry[], text: string, selectedKey: string): LibraryEntry | undefined {
    const selected = entries.find((entry) => entry.key === selectedKey)
    return selected?.loaded?.text === text ? selected : entries.find((entry) => entry.loaded?.text === text)
}

export function runName(entries: readonly LibraryEntry[], text: string, selectedKey: string): string {
    const same = entryWithText(entries, text, selectedKey)
    if (same !== undefined) return same.name
    const selected = entries.find((entry) => entry.key === selectedKey)
    return selected === undefined ? CUSTOM_BUILD_NAME : `${selected.name}${EDITED_SUFFIX}`
}
