import { SAVED_NAME_MAX_CHARS } from '../../../lib/aoe4-build-order/saved-builds'
import { entryWithText, type LibraryEntry } from './build-library'

const EDITED_SUFFIX = ' (edited)'

export function savedBuildName(entries: readonly LibraryEntry[], text: string, selectedKey: string): string {
    const same = entryWithText(entries, text, selectedKey)
    if (same !== undefined) return same.name
    const selected = entries.find((entry) => entry.key === selectedKey)
    if (selected === undefined) return 'Custom build'
    const unedited = selected.name.endsWith(EDITED_SUFFIX) ? selected.name.slice(0, -EDITED_SUFFIX.length) : selected.name
    return `${unedited.slice(0, SAVED_NAME_MAX_CHARS - EDITED_SUFFIX.length)}${EDITED_SUFFIX}`
}
