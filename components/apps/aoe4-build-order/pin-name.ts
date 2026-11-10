import { SAVED_NAME_MAX_CHARS } from '../../../lib/aoe4-build-order/saved-builds'
import type { PrebuiltBuild } from './build-input'

const EDITED_SUFFIX = ' (edited)'

export function pinName(builds: readonly PrebuiltBuild[], text: string, selected: string): string {
    if (builds.length === 0) return 'Custom build'
    return builds.find((build) => build.text === text)?.name ?? `${selected} (edited)`
}

export function savedBuildName(builds: readonly PrebuiltBuild[], text: string, selected: string): string {
    if (builds.length === 0) return 'Custom build'
    const same = builds.find((build) => build.text === text)
    if (same !== undefined) return same.buildName ?? same.name
    const base = builds.find((build) => build.name === selected)?.buildName ?? selected
    const unedited = base.endsWith(EDITED_SUFFIX) ? base.slice(0, -EDITED_SUFFIX.length) : base
    return `${unedited.slice(0, SAVED_NAME_MAX_CHARS - EDITED_SUFFIX.length)}${EDITED_SUFFIX}`
}
