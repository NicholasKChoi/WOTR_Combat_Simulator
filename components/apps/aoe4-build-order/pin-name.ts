import type { PrebuiltBuild } from './build-input'

export function pinName(builds: readonly PrebuiltBuild[], text: string, selected: string): string {
    if (builds.length === 0) return 'Custom build'
    return builds.find((build) => build.text === text)?.name ?? `${selected} (edited)`
}
