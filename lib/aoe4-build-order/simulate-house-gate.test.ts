import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { BuildStart, BuildStep, GatherNodeId, SimulationResult } from './model'
import { simulateBuildOrder } from './simulate'
import { ENGLISH, at, editGameData, housesDone, inputsFor, run, sampleIndex } from './test-helpers'

const twoTowns = editGameData((parts) => {
    parts.civData.startingState.buildings.value = ['capital-town-center', 'town-center']
    parts.civData.startingState.resources.value = { food: 5000, wood: 200, gold: 0, stone: 0 }
})
const woodStart: BuildStart = { villagers: { wood: 6 }, rally: 'wood' }
const house = (from: GatherNodeId, extra: Partial<Extract<BuildStep, { action: 'build' }>> = {}): BuildStep => ({
    action: 'build',
    building: 'house',
    builders: 1,
    from,
    ...extra,
})
// Never fires: nobody gathers berries.
const onBerryRunOut = { trigger: { kind: 'depleted', node: 'berry' }, reaction: true } as const

interface HouseRun {
    result: SimulationResult
    done: number[]
}

function withHouses(steps: BuildStep[], inputs: object = {}): HouseRun {
    const { done, rules } = housesDone()
    const result = run(steps, { game: twoTowns, start: woodStart, rules, inputs: { durationSeconds: 700, ...inputs } })
    return { result, done }
}

const lateHouse = (inputs: object = {}) => withHouses([house('wood', { trigger: at(0) }), house('wood', { trigger: at(600) })], inputs)
const population = (result: SimulationResult, t: number) => result.spawnedPopulation[sampleIndex(result, t)]

// First sample at which population reaches the value it holds at `until`.
function heldSince(result: SimulationResult, until: number): number {
    const held = population(result, until)
    return result.times[result.spawnedPopulation.findIndex((p) => p === held)]
}

const autoHouseCodes = (result: SimulationResult) => result.warnings.map((w) => w.code).filter((code) => code.startsWith('auto-houses'))

function digest(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)
}

function digestTimeline(result: SimulationResult): string {
    const { spawnedPopulation, spent, steps, populationCapReachedAt, depletions, markers } = result
    return digest({ spawnedPopulation, spent, steps, populationCapReachedAt, depletions, markers })
}

describe('auto-houses with a late build-house step', () => {
    const off = lateHouse({ autoHouses: false })
    const on = lateHouse()
    const hold = heldSince(off.result, 595)

    it('blocks production at supply before the late step when auto-houses are off', () => {
        expect(hold).toBeLessThan(595 - 60)
        expect(population(on.result, 595)).toBeGreaterThan(population(off.result, 595))
        expect(population(off.result, 700)).toBeGreaterThan(population(off.result, 595))
        expect(off.done).toEqual([20, 620])
    })

    it('starts an auto-house before the late step and keeps population rising past the supply limit', () => {
        expect(population(on.result, hold + 5)).toBeGreaterThan(population(off.result, hold))
        expect(population(on.result, 595)).toBeGreaterThan(population(on.result, hold + 5))
        expect(on.result.steps[1].startedAt).toBe(600)
        expect(on.done.filter((t) => t > 20 && t < 600).length).toBeGreaterThan(0)
    })

    it('reports no auto-houses warning', () => {
        expect(autoHouseCodes(on.result)).toEqual([])
        expect(autoHouseCodes(off.result)).toEqual([])
    })

    it('returns deeply equal results for the same order and inputs', () => {
        expect(lateHouse().result).toEqual(on.result)
        expect(lateHouse({ autoHouses: false }).result).toEqual(off.result)
    })
})

describe('auto-houses with other house steps', () => {
    const none = withHouses([], { durationSeconds: 400 })

    it('gives an order without build-house steps auto-houses at 120, 220 and 320 s', () => {
        expect(none.done).toEqual([120, 220, 320])
        expect(digestTimeline(none.result)).toBe('679240f54895c11f')
    })

    it('start even when the only build house is a reaction that never fires', () => {
        const steps = [house('wood', onBerryRunOut)]
        const off = withHouses(steps, { durationSeconds: 400, autoHouses: false })
        const on = withHouses(steps, { durationSeconds: 400 })
        expect(on.result.steps[0].startedAt).toBeNull()
        expect(off.done).toEqual([])
        expect(on.done).toEqual(none.done)
        const limit = heldSince(off.result, 400)
        expect(population(on.result, limit + 5)).toBeGreaterThan(population(off.result, limit))
        expect(autoHouseCodes(on.result)).toEqual([])
    })

    it('count an explicit house started at the planner instant as under construction', () => {
        const firstStart = none.done[0] - 20
        const same = withHouses([house('wood', { trigger: at(firstStart) })], { durationSeconds: 400 })
        expect(same.result.steps[0].startedAt).toBe(firstStart)
        expect(same.done).toEqual(none.done)
    })
})

describe('prebuilt builds without a house hold', () => {
    // Digests of spawnedPopulation, spent, steps, populationCapReachedAt, depletions and markers at 1800 s.
    it.each([
        ['ENG 1TC', '32a982d42fa1e689'],
        ['ENG Spear/Longbow into MAA/Crossbow', '60e54bd7196e39e7'],
    ])('leaves %s unchanged', (name, pinned) => {
        const build = listBuilds().find((b) => b.name === name)!
        const result = simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 1800 }))
        expect(digestTimeline(result)).toBe(pinned)
    })
})
