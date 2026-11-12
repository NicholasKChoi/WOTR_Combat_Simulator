import { RESOURCE_KINDS, type ResourceKind, type SimulationResult } from '../../../lib/aoe4-build-order/model'
import type { ChartSeries } from './chart-rows'
import type { GatherRatesView, UnitsProducedView } from './chart-view-toggle'

export function unitSeries(result: SimulationResult): ChartSeries[] {
    return result.unitsProduced.map((u) => ({
        key: u.unitId,
        name: `${u.name} (tier ${u.tier})`,
        values: u.counts,
    }))
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
    return view === 'buildings' ? buildingSeries(run) : unitSeries(run)
}
