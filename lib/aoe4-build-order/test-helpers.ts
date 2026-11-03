import type { CivRules } from './civ-rules'
import { buildGameData, loadGameData } from './data'
import type { BaseRules, CivData, GameData, Snapshot } from './data'
import type { EffectState } from './effects'
import { FINITE_GATHER_NODES, GATHER_NODES } from './model'
import type { BuildOrder, BuildStart, BuildStep, FiniteGatherNodeId, GatherNodeId, SimInputs, SimulationResult, Trigger, TripInputs } from './model'
import { resolveSimInputs } from './schema'
import { simulateBuildOrder, stepHandlers } from './simulate'
import type { StepHandler } from './simulate'

export const ENGLISH: GameData = loadGameData('english')

export interface Parts {
    snapshot: Snapshot
    base: BaseRules
    civData: CivData
}

export const at = (seconds: number): Trigger => ({ kind: 'time', seconds })

// Pins every shipped node amount to infinite.
export const INFINITE_NODES = Object.fromEntries(FINITE_GATHER_NODES.map((node) => [node, null])) as Record<FiniteGatherNodeId, null>

export function editGameData(edit: (parts: Parts) => void, from: GameData = ENGLISH): GameData {
    const entries = structuredClone([...from.byId.values()])
    const parts: Parts = {
        snapshot: {
            source: structuredClone(from.source),
            units: entries.filter((e) => e.type === 'unit'),
            buildings: entries.filter((e) => e.type === 'building'),
            technologies: entries.filter((e) => e.type === 'technology'),
            upgrades: entries.filter((e) => e.type === 'upgrade'),
        },
        base: structuredClone(from.base),
        civData: structuredClone(from.civData),
    }
    edit(parts)
    return buildGameData(from.civ, parts.snapshot, parts.base, parts.civData)
}

export function withStartFarms(farms: number, from: GameData = ENGLISH): GameData {
    return editGameData((parts) => void parts.civData.startingState.buildings.value.push(...Array<string>(farms).fill('farm')), from)
}

export function inputsFor(game: GameData, overrides: unknown = {}): SimInputs {
    const result = resolveSimInputs(overrides, game)
    if (result.ok === false) {
        throw new Error(JSON.stringify(result.issues))
    }
    return result.inputs
}

export function buildOrder(steps: BuildStep[], start: BuildStart = { rally: 'sheep' }): BuildOrder {
    return { civ: 'english', name: 'test', start, steps }
}

export function run(steps: BuildStep[], options: { game?: GameData; inputs?: unknown; rules?: CivRules; start?: BuildStart } = {}): SimulationResult {
    const game = options.game ?? ENGLISH
    return simulateBuildOrder(buildOrder(steps, options.start), game, inputsFor(game, options.inputs), options.rules)
}

export function sampleIndex(result: SimulationResult, t: number): number {
    const i = result.times.indexOf(t)
    if (i < 0) {
        throw new Error(`no sample at ${t}`)
    }
    return i
}

// Units of baseId produced by each sample, summed over its tiers.
export function series(result: SimulationResult, baseId: string): number[] {
    return result.times.map((_, i) => result.unitsProduced.reduce((sum, u) => (u.baseId === baseId ? sum + u.counts[i] : sum), 0))
}

export function countAt(result: SimulationResult, baseId: string, t: number): number {
    return series(result, baseId)[sampleIndex(result, t)]
}

// Installs a handler for action for the duration of fn, then puts back whatever was registered before.
export function withHandler<A extends BuildStep['action']>(action: A, handler: StepHandler<A>, fn: () => void): void {
    const handlers = stepHandlers as Record<string, unknown>
    const saved = handlers[action]
    handlers[action] = handler
    try {
        fn()
    } finally {
        if (saved === undefined) {
            delete handlers[action]
        } else {
            handlers[action] = saved
        }
    }
}

export function effectStateOf(overrides: Partial<EffectState> = {}): EffectState {
    return { data: ENGLISH, age: 1, buildings: new Map(), researched: new Set(), researchedIds: new Set(), coverage: {}, ...overrides }
}

// Each tech counts as researched at its lowest-age entry.
export function researchedOf(baseIds: readonly string[], data: GameData = ENGLISH): Pick<EffectState, 'researched' | 'researchedIds'> {
    return {
        researched: new Set(baseIds),
        researchedIds: new Set(baseIds.flatMap((baseId) => data.byBaseId.get(baseId)?.[0]?.id ?? [])),
    }
}

// Only trips is read by the trip model.
export function tripInputsOf(game: GameData): SimInputs {
    const trips = {} as Record<GatherNodeId, TripInputs>
    for (const node of GATHER_NODES) {
        const trip = game.base.gatherNodes[node].trip
        trips[node] = {
            walkSecondsCamp: trip.walkSecondsCamp.value,
            walkSecondsTownCenter: trip.walkSecondsTownCenter.value,
            dropOffSeconds: trip.dropOffSeconds.value,
        }
    }
    return { trips } as SimInputs
}
