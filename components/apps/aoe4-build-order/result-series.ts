import { RESOURCE_KINDS, type ResourceKind, type SimulationResult } from '../../../lib/aoe4-build-order/model'
import { type ChartSeries, type PinnedSeries, isLineHidden, valueAt } from './chart-rows'
import type { TimeWindow } from './chart-zoom'
import type { GatherRatesView, UnitsProducedView } from './chart-view-toggle'

const TIER_TEXT_GAP = 3

export function unitLineSeries(run: SimulationResult): ChartSeries[] {
    const lines = new Map<string, ChartSeries>()
    for (const u of run.unitsProduced) {
        const line = lines.get(u.baseId)
        if (line) line.values = line.values.map((v, i) => v + u.counts[i])
        else lines.set(u.baseId, { key: u.baseId, name: u.lineName, values: [...u.counts] })
    }
    return [...lines.values()]
}

export interface UpgradeDot {
    key: string
    label: string
    at: number
}

export function unitUpgradeDots(run: SimulationResult): UpgradeDot[] {
    const lines = new Set(unitLineSeries(run).map((s) => s.key))
    return run.markers.flatMap((m) => (m.unit !== undefined && lines.has(m.unit) ? [{ key: m.unit, label: m.label, at: m.at }] : []))
}

export interface PlacedUpgradeDot extends UpgradeDot {
    value: number
}

export function visibleUpgradeDots(
    dots: readonly UpgradeDot[],
    run: PinnedSeries,
    shown: TimeWindow,
    hidden: ReadonlySet<string>,
): PlacedUpgradeDot[] {
    return dots.flatMap((dot) => {
        const line = run.series.find((s) => s.key === dot.key)
        if (!line || isLineHidden(hidden, dot.key) || dot.at < shown.from || dot.at > shown.to) return []
        return [{ ...dot, value: valueAt(run.times, line.values, dot.at) }]
    })
}

export function upgradeTierName(upgradeId: string, unitId: string): string {
    const [first, ...rest] = upgradeId.split('-')
    if (rest.length + 1 <= unitId.split('-').length) return 'Upgrade'
    return first.charAt(0).toUpperCase() + first.slice(1)
}

export interface TierTextSlot {
    slot: number
    slots: number
}

// Dots drawn at one point (the same time and value, current or pinned) take consecutive slots in input order.
export function tierTextSlots(points: readonly { at: number; value: number }[]): TierTextSlot[] {
    const counts = new Map<string, number>()
    const keys = points.map((p) => `${p.at}:${p.value}`)
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
    const taken = new Map<string, number>()
    return keys.map((key) => {
        const slot = taken.get(key) ?? 0
        taken.set(key, slot + 1)
        return { slot, slots: counts.get(key) ?? 1 }
    })
}

export interface TierTextBounds {
    left: number
    top: number
    right: number
    bottom: number
}

export interface TierTextPlacement {
    x: number
    y: number
    anchor: 'start' | 'end'
}

export interface TierTextInput extends TierTextSlot {
    cx: number
    cy: number
    r: number
    width: number
    height: number
}

// x is the text's anchored edge and y its vertical centre. The text sits right of the dot and left of it when it would cross the right edge;
// the slots of one point stack around the dot's height, and the stack moves down or up as a whole to stay inside the top and bottom edges.
export function placeTierText({ cx, cy, r, slot, slots, width, height }: TierTextInput, bounds: TierTextBounds): TierTextPlacement {
    const gap = r + TIER_TEXT_GAP
    const fitsRight = cx + gap + width <= bounds.right
    const stackTop = cy - (slots * height) / 2
    const shift = Math.max(0, bounds.top - stackTop) - Math.max(0, stackTop + slots * height - bounds.bottom)
    return {
        x: fitsRight ? cx + gap : cx - gap,
        y: stackTop + shift + (slot + 0.5) * height,
        anchor: fitsRight ? 'start' : 'end',
    }
}

export function resourceSeries(byResource: Record<ResourceKind, number[]>): ChartSeries[] {
    return RESOURCE_KINDS.map((kind) => ({
        key: kind,
        name: kind.charAt(0).toUpperCase() + kind.slice(1),
        values: byResource[kind],
    }))
}

export function buildingSeries(result: SimulationResult): ChartSeries[] {
    return result.productionBuildings.map((b) => ({ key: b.baseId, name: b.name, values: b.counts }))
}

export function gatherRatesSeries(view: GatherRatesView, run: SimulationResult): ChartSeries[] {
    return resourceSeries(view === 'villagers' ? run.gatherers : run.gatherRates)
}

export function unitsProducedSeries(view: UnitsProducedView, run: SimulationResult): ChartSeries[] {
    return view === 'buildings' ? buildingSeries(run) : unitLineSeries(run)
}
