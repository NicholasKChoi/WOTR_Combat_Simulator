import { RESOURCE_KINDS, type ResourceKind, type SimulationResult } from '../../../lib/aoe4-build-order/model'
import type { ChartSeries } from './chart-rows'

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

export function perVillagerSeries(rates: Record<ResourceKind, number[]>, gatherers: Record<ResourceKind, number[]>): ChartSeries[] {
    return resourceSeries(rates).map((s) => ({
        ...s,
        values: s.values.map((rate, i) => {
            const count = gatherers[s.key as ResourceKind][i]
            return count > 0 ? rate / count : 0
        }),
    }))
}
