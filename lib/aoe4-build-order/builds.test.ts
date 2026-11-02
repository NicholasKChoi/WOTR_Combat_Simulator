import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import { loadGameData } from './data'
import { nodeKindOf } from './model'
import type { NodeRef } from './model'
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
            expect(parsed.order.start).toStrictEqual(build.start)
            expect(parsed.order.steps).toStrictEqual(build.steps)
        }
    })

    it.runIf(build.name.includes('1TC'))('prints its gold reaction as a whenever line', () => {
        expect(formatBuildOrderText(build).split('\n')).toContain('whenever gold runs out move all gold to gold#2')
    })

    it('validates', () => {
        const result = validateBuildOrder(build, data)
        expect(result.ok === false ? result.issues : []).toEqual([])
    })

    function simulateTo(durationSeconds: number) {
        const resolved = resolveSimInputs({ durationSeconds }, data)
        if (resolved.ok === false) {
            throw new Error(JSON.stringify(resolved.issues))
        }
        return simulateBuildOrder(build, data, resolved.inputs)
    }

    it.each([1200, 3600])('starts every non-reaction step and leaves no step waiting by %i s', (horizon) => {
        const result = simulateTo(horizon)
        expect(result.steps).toHaveLength(build.steps.length)
        expect(result.steps.filter((s) => s.status === 'waiting')).toEqual([])
        expect(result.steps.filter((s) => !build.steps[s.step].reaction && s.startedAt === null)).toEqual([])
        expect(result.steps.filter((s) => s.status === 'not-reached' && s.waitingOn !== 'trigger')).toEqual([])
    })

    it.each([1200, 3600])('moves every gatherer off a gold deposit at its run-out by %i s, with no gold warning', (horizon) => {
        const result = simulateTo(horizon)
        const gold = (node: string) => nodeKindOf(node as NodeRef) === 'gold'
        for (const { node, depletedAt } of result.depletions.filter((d) => gold(d.node) && d.depletedAt !== null)) {
            const leaving = build.steps.flatMap((step, i) => (step.reaction && step.action === 'move' && step.count === 'all' && step.from === node ? [result.steps[i]] : []))
            expect(leaving.some((s) => s.startedAt === depletedAt), node).toBe(true)
        }
        const goldWarnings = result.warnings.filter((w) => w.code !== 'step-stuck' && gold(w.node))
        expect(goldWarnings.filter((w) => w.severity === 'warning')).toEqual([])
    })

    it.runIf(build.name.includes('1TC'))('runs its first gold deposit dry by 3600 s and moves off it at that instant', () => {
        const result = simulateTo(3600)
        const gold = result.depletions.find((d) => d.node === 'gold')
        const second = result.depletions.find((d) => d.node === 'gold#2')
        const reactionIndex = build.steps.findIndex((step) => step.reaction)
        expect(gold?.depletedAt).not.toBeNull()
        expect(second?.depletedAt).toBeNull()
        expect(result.steps[reactionIndex].startedAt).toBe(gold?.depletedAt)
    })
})
