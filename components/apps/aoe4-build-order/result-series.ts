import type { ResourceKind, SimulationResult } from '../../../lib/aoe4-build-order/model'
import type { ChartSeries } from './chart-rows'

const RESOURCE_ORDER: readonly ResourceKind[] = ['food', 'wood', 'gold', 'stone']

export function unitSeries(result: SimulationResult): ChartSeries[] {
    return result.unitsProduced.map((u) => ({
        key: u.unitId,
        name: `${u.name} (tier ${u.tier})`,
        values: u.counts,
    }))
}

export function resourceSeries(byResource: Record<ResourceKind, number[]>): ChartSeries[] {
    return RESOURCE_ORDER.map((kind) => ({
        key: kind,
        name: kind.charAt(0).toUpperCase() + kind.slice(1),
        values: byResource[kind],
    }))
}
