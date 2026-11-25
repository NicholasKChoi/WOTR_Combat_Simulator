import { RESOURCE_KINDS, type ResourceKind, type SimulationResult } from '../../../lib/aoe4-build-order/model'
import { type ChartSeries, type PinnedSeries, isLineHidden, valueAt } from './chart-rows'
import type { ChartTimeMark } from './chart-markers'
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

export interface TierTextDot {
    cx: number
    cy: number
    r: number
    width: number
}

// A text's row in its group's stack, and the pixel height the stack is centred on.
export interface TierTextSlot {
    slot: number
    slots: number
    centre: number
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

// x is the text's anchored edge and y its vertical centre. The text sits right of the dot and left of it when it would cross the right edge;
// a group's texts stack in rows of `height` around its centre, and the stack moves down or up as a whole to stay inside the top and bottom edges.
export function placeTierText({ cx, r, width }: TierTextDot, { slot, slots, centre }: TierTextSlot, height: number, bounds: TierTextBounds): TierTextPlacement {
    const gap = r + TIER_TEXT_GAP
    const fitsRight = cx + gap + width <= bounds.right
    const stackTop = centre - (slots * height) / 2
    const shift = Math.max(0, bounds.top - stackTop) - Math.max(0, stackTop + slots * height - bounds.bottom)
    return {
        x: fitsRight ? cx + gap : cx - gap,
        y: stackTop + shift + (slot + 0.5) * height,
        anchor: fitsRight ? 'start' : 'end',
    }
}

export function tierTextBox(dot: TierTextDot, slot: TierTextSlot, height: number, bounds: TierTextBounds): TierTextBounds {
    const { x, y, anchor } = placeTierText(dot, slot, height, bounds)
    const left = anchor === 'start' ? x : x - dot.width
    return { left, right: left + dot.width, top: y - height / 2, bottom: y + height / 2 }
}

export const boxesIntersect = (a: TierTextBounds, b: TierTextBounds) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

// One stack per group, centred on its dots' mean height, with the topmost dot's text in the top row.
function groupSlots(dots: readonly TierTextDot[], groupOf: readonly number[]): TierTextSlot[] {
    const slots: TierTextSlot[] = dots.map((dot) => ({ slot: 0, slots: 1, centre: dot.cy }))
    for (const group of new Set(groupOf)) {
        const members = dots.flatMap((_, i) => (groupOf[i] === group ? [i] : [])).sort((a, b) => dots[a].cy - dots[b].cy || a - b)
        const centre = members.reduce((sum, i) => sum + dots[i].cy, 0) / members.length
        members.forEach((i, slot) => (slots[i] = { slot, slots: members.length, centre }))
    }
    return slots
}

// Texts start alone beside their dots; any two in different groups whose boxes intersect merge their groups, until no two boxes intersect.
export function tierTextSlots(dots: readonly TierTextDot[], height: number, bounds: TierTextBounds): TierTextSlot[] {
    const groupOf = dots.map((_, i) => i)
    for (;;) {
        const slots = groupSlots(dots, groupOf)
        const boxes = dots.map((dot, i) => tierTextBox(dot, slots[i], height, bounds))
        const clash = boxes.flatMap((a, i) => boxes.flatMap((b, j) => (j > i && groupOf[i] !== groupOf[j] && boxesIntersect(a, b) ? [[i, j]] : [])))[0]
        if (!clash) return slots
        const [from, to] = [groupOf[clash[1]], groupOf[clash[0]]]
        groupOf.forEach((g, i) => (groupOf[i] = g === from ? to : g))
    }
}

export function resourceSeries(byResource: Record<ResourceKind, number[]>): ChartSeries[] {
    return RESOURCE_KINDS.map((kind) => ({
        key: kind,
        name: kind.charAt(0).toUpperCase() + kind.slice(1),
        values: byResource[kind],
    }))
}

export const populationSeries = (run: SimulationResult): ChartSeries[] => [{ key: 'population', name: 'Population', values: run.spawnedPopulation }]

export const populationCapMark = (run: SimulationResult): ChartTimeMark | null =>
    run.populationCapReachedAt === null ? null : { at: run.populationCapReachedAt, label: 'Population cap' }

export function buildingSeries(result: SimulationResult): ChartSeries[] {
    return result.productionBuildings.map((b) => ({ key: b.baseId, name: b.name, values: b.counts }))
}

export function gatherRatesSeries(view: GatherRatesView, run: SimulationResult): ChartSeries[] {
    return resourceSeries(view === 'villagers' ? run.gatherers : run.gatherRates)
}

export function unitsProducedSeries(view: UnitsProducedView, run: SimulationResult): ChartSeries[] {
    return view === 'buildings' ? buildingSeries(run) : unitLineSeries(run)
}
