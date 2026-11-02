import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { listBuilds } from './builds'
import type { BuildStart, BuildStep, GatherNodeId, SimulationResult, SimWarning } from './model'
import { simulateBuildOrder } from './simulate'
import { ENGLISH, at, editGameData, inputsFor, run } from './test-helpers'

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

// Production first hits the supply limit at 220 s; the second house opens the gate when it starts.
function lateHouse(second: Partial<Extract<BuildStep, { action: 'build' }>> = { trigger: at(300) }, inputs: object = {}, game = twoTowns): SimulationResult {
    return run([house('wood', { trigger: at(0) }), house('wood', second)], { game, start: woodStart, inputs: { durationSeconds: 400, ...inputs } })
}

function neverFiring(inputs: object = {}): SimulationResult {
    return run([house('wood', onBerryRunOut)], { game: twoTowns, start: woodStart, inputs: { durationSeconds: 400, ...inputs } })
}

type HouseWarning = Extract<SimWarning, { code: 'auto-houses-never-start' | 'auto-houses-held' }>

function houseWarnings(result: SimulationResult, code?: HouseWarning['code']): HouseWarning[] {
    return result.warnings.filter((w): w is HouseWarning => (code ? w.code === code : w.code.startsWith('auto-houses')))
}

function digest(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)
}

describe('auto-houses-never-start', () => {
    it('warns once when the last build house is a reaction that never fires', () => {
        expect(houseWarnings(neverFiring(), 'auto-houses-never-start')).toEqual([
            {
                code: 'auto-houses-never-start',
                severity: 'warning',
                message: 'auto-houses never start: they wait for step 1 (build house), a reaction that did not fire by 6:40, so no auto-house is built.',
                step: 0,
                at: 0,
            },
        ])
    })

    it('reads the last build house step, not the first', () => {
        const result = run([house('wood', onBerryRunOut), house('wood', { trigger: at(0) }), house('wood', onBerryRunOut)], { game: twoTowns, start: woodStart, inputs: { durationSeconds: 400 } })
        expect(houseWarnings(result, 'auto-houses-never-start').map((w) => w.step)).toEqual([2])
    })

    it.each([
        ['auto-houses are off', () => neverFiring({ autoHouses: false })],
        ['no build house step', () => run([], { game: twoTowns, start: woodStart, inputs: { durationSeconds: 400 } })],
        ['the last build house is not a reaction', () => lateHouse({ trigger: at(600) })],
    ])('is not emitted when %s', (_, simulate) => {
        expect(houseWarnings(simulate(), 'auto-houses-never-start')).toEqual([])
    })

    it('is not emitted for a reaction that fired and still waits on resources; step-stuck covers it', () => {
        const broke = editGameData((parts) => {
            parts.civData.startingState.resources.value = { food: 5000, wood: 0, gold: 0, stone: 0 }
        })
        const result = run([house('sheep', { trigger: at(10), reaction: true })], { game: broke, start: { villagers: { sheep: 6 }, rally: 'sheep' }, inputs: { durationSeconds: 400 } })
        expect(result.steps[0]).toMatchObject({ armedAt: 10, startedAt: null, waitingOn: 'resources' })
        expect(result.warnings.filter((w) => w.code === 'step-stuck').map((w) => w.step)).toEqual([0])
        expect(houseWarnings(result, 'auto-houses-never-start')).toEqual([])
    })
})

describe('auto-houses-held', () => {
    it('sums every interval from a blocked instant, starting at the first one', () => {
        expect(houseWarnings(lateHouse())).toEqual([
            {
                code: 'auto-houses-held',
                severity: 'warning',
                message: 'production was held at the supply limit for 1:20 from 3:40 while auto-houses waited for step 2 (build house) to start.',
                step: 1,
                at: 220,
                seconds: 80,
            },
        ])
    })

    it('counts a produce step waiting on population as a block', () => {
        const steps: BuildStep[] = [
            { action: 'pause', producer: 'capital-town-center' },
            { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1, trigger: at(30) },
            house('wood', { trigger: at(100) }),
        ]
        const result = run(steps, { start: { villagers: { wood: 9 }, rally: 'wood' }, inputs: { durationSeconds: 200 } })
        expect(result.steps[1].waitingOn).toBe('population')
        expect(houseWarnings(result).map(({ step, at, ...w }) => ({ step, at, seconds: 'seconds' in w ? w.seconds : null }))).toEqual([{ step: 2, at: 30, seconds: 170 }])
    })

    it('pins a late house on stock data', () => {
        const result = run([house('sheep', { trigger: at(300) })], { start: { rally: 'sheep' }, inputs: { durationSeconds: 400 } })
        expect(houseWarnings(result).map(({ code, step, at, ...w }) => ({ code, step, at, seconds: 'seconds' in w ? w.seconds : null }))).toEqual([
            { code: 'auto-houses-held', step: 0, at: 60, seconds: 240 },
        ])
    })

    it.each([
        [0, 1, 19],
        [5, 5, 20],
    ])('stops counting when an earlier house completing at the instant lets production start (house at %i)', (houseAt, heldAt, seconds) => {
        const steps: BuildStep[] = [
            { action: 'pause', producer: 'capital-town-center' },
            house('wood', { trigger: at(houseAt) }),
            { action: 'produce', producer: 'capital-town-center', unit: 'villager', count: 1, trigger: at(1) },
            house('wood', { trigger: at(150) }),
        ]
        const result = run(steps, { start: { villagers: { wood: 9 }, rally: 'wood' }, inputs: { durationSeconds: 200 } })
        expect(result.steps[2].waitSeconds).toBe(seconds)
        expect(houseWarnings(result).map(({ step, at, ...w }) => ({ step, at, seconds: 'seconds' in w ? w.seconds : null }))).toEqual([{ step: 3, at: heldAt, seconds }])
    })

    it.each([
        ['auto-houses are off', () => lateHouse(undefined, { autoHouses: false })],
        ['the gate is already open', () => run([house('wood', { trigger: at(0) })], { game: twoTowns, start: woodStart, inputs: { durationSeconds: 400 } })],
        ['the gate opens at the blocked instant', () => lateHouse({ trigger: at(220) })],
        ['supply is at maxPopCap', () => lateHouse(undefined, {}, editGameData((parts) => void (parts.base.maxPopCap.value = 30), twoTowns))],
        ['the only block is at the final instant', () => lateHouse(undefined, { durationSeconds: 220 })],
    ])('is not emitted when %s', (_, simulate) => {
        expect(houseWarnings(simulate(), 'auto-houses-held')).toEqual([])
    })

    it.each([
        ['the gate opens one wake after the block', () => lateHouse({ trigger: at(225) })],
        ['maxPopCap is one above supply', () => lateHouse(undefined, {}, editGameData((parts) => void (parts.base.maxPopCap.value = 31), twoTowns))],
        ['the run ends one wake after the block', () => lateHouse(undefined, { durationSeconds: 225 })],
    ])('is emitted when %s', (_, simulate) => {
        expect(houseWarnings(simulate(), 'auto-houses-held').map((w) => w.at)).toEqual([220])
    })
})

describe('auto-house warnings together', () => {
    it('a never-firing reaction house emits both, never-start first', () => {
        expect(houseWarnings(neverFiring()).map(({ code, step, at }) => ({ code, step, at }))).toEqual([
            { code: 'auto-houses-never-start', step: 0, at: 0 },
            { code: 'auto-houses-held', step: 0, at: 120 },
        ])
    })
})

describe('timing with the auto-house warnings', () => {
    // Digests of the same runs taken before the auto-house warnings existed.
    it('leaves the late-house run as it was before the warnings', () => {
        const { spawnedPopulation, spent, steps, populationCapReachedAt, depletions, markers } = lateHouse()
        expect(digest({ spawnedPopulation, spent, steps, populationCapReachedAt, depletions, markers })).toBe('67af1a20a5434d6f')
    })

    it.each([
        ['ENG 1TC', 'e7f2436b024f722f', null],
        ['ENG Spear/Longbow into MAA/Crossbow', 'e7b3cb8bc1ad4299', null],
        ["ENG Knight/Longbow (King's Palace)", '69e8496d68bb2946', { step: 23, at: 461.81904761904764, seconds: 21.236012345678944 }],
    ])('leaves every field of %s at 1800 s but warnings as it was', (name, pinned, held) => {
        const build = listBuilds().find((b) => b.name === name)!
        const { warnings, ...rest } = simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds: 1800 }))
        expect(digest(rest)).toBe(pinned)
        const auto = warnings.filter((w) => w.code.startsWith('auto-houses'))
        expect(auto).toEqual(held ? [expect.objectContaining({ code: 'auto-houses-held', ...held })] : [])
    })
})
