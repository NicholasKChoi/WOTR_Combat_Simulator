import { RESOURCE_KINDS, type ResourceKind, type SimulationResult } from '../../../lib/aoe4-build-order/model'
import { type ChartSeries, type PinnedSeries, isLineHidden, valueAt } from './chart-rows'
import type { TimeWindow } from './chart-zoom'
import type { GatherRatesView, UnitsProducedView } from './chart-view-toggle'

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
