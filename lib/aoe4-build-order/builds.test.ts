import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import { loadGameData } from './data'
import { formatBuildOrderText, parseBuildOrderText } from './parse-text'
import { simulateBuildOrder } from './simulate'
import { resolveSimInputs, validateBuildOrder } from './validate'

const BUILDS_DIR = new URL('../../data/aoe4-build-order/builds/', import.meta.url)
const OWNER_BUILD_SOURCE = 'https://aoe4guides.com/builds/reinDv5vkVX6KUny571E'

const data = loadGameData('english')

describe('listBuilds', () => {
    it('lists every JSON file in the builds folder', () => {
        const files = readdirSync(BUILDS_DIR).filter((f) => f.endsWith('.json'))
        expect(files.length).toBeGreaterThan(0)
        expect(listBuilds()).toHaveLength(files.length)
    })

    it('includes the owner build', () => {
        expect(listBuilds().map((b) => b.source)).toContain(OWNER_BUILD_SOURCE)
    })

    it('returns a fresh array each call', () => {
        const first = listBuilds()
        first.pop()
        expect(listBuilds()).toHaveLength(first.length + 1)
    })
})

describe.each(listBuilds().map((build) => [build.name, build] as const))('prebuilt build %s', (_, build) => {
    it('is an English build with a source and a start rally', () => {
        expect(build.civ).toBe('english')
        expect(build.source).toBeTruthy()
        expect(build.start?.rally).toBeTruthy()
    })

    it('round-trips through the paste format', () => {
        const parsed = parseBuildOrderText(formatBuildOrderText(build))
        expect(parsed.ok).toBe(true)
        if (parsed.ok) {
            expect(parsed.order.start).toEqual(build.start)
            expect(parsed.order.steps).toEqual(build.steps)
        }
    })

    it('validates', () => {
        const result = validateBuildOrder(build, data)
        expect(result.ok === false ? result.issues : []).toEqual([])
    })

    it('completes or is still running every step at 3600 s', () => {
        const resolved = resolveSimInputs({ durationSeconds: 3600 }, data)
        if (resolved.ok === false) {
            throw new Error(JSON.stringify(resolved.issues))
        }
        const result = simulateBuildOrder(build, data, resolved.inputs)
        const stuck = result.steps.filter((s) => s.status !== 'completed' && s.status !== 'in-progress')
        expect(stuck).toEqual([])
        expect(result.steps).toHaveLength(build.steps.length)
    })
})
