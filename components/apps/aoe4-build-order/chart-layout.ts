import { z } from 'zod'

export const RESULT_CHART_IDS = ['chart-units-produced', 'chart-gather-rates', 'chart-gathered-resources', 'chart-floating-resources'] as const
export type ChartId = (typeof RESULT_CHART_IDS)[number]
export const KEY_RESULTS_PANEL_ID = 'key-results' as const
export type LayoutPanelId = ChartId | typeof KEY_RESULTS_PANEL_ID

export const CHART_LAYOUT_STORAGE_KEY = 'aoe4-build-order.chart-layout'

export interface ChartLayout {
    version: 1
    order: ChartId[]
    collapsed: LayoutPanelId[]
}

export const DEFAULT_CHART_LAYOUT: ChartLayout = { version: 1, order: [...RESULT_CHART_IDS], collapsed: [] }

export const storedChartLayoutSchema = z.object({
    version: z.literal(1),
    order: z.array(z.string()),
    collapsed: z.array(z.string()),
})

const isChartId = (id: string): id is ChartId => (RESULT_CHART_IDS as readonly string[]).includes(id)

const isPanelId = (id: string): id is LayoutPanelId => isChartId(id) || id === KEY_RESULTS_PANEL_ID

const uniqueIds = <T extends string>(ids: readonly string[], keep: (id: string) => id is T): T[] => [...new Set(ids.filter(keep))]

export function normalizeChartLayout(value: unknown): ChartLayout {
    const parsed = storedChartLayoutSchema.safeParse(value)
    if (!parsed.success) return { ...DEFAULT_CHART_LAYOUT, order: [...DEFAULT_CHART_LAYOUT.order] }
    const listed = uniqueIds(parsed.data.order, isChartId)
    const missing = RESULT_CHART_IDS.filter((id) => !listed.includes(id))
    return { version: 1, order: [...listed, ...missing], collapsed: uniqueIds(parsed.data.collapsed, isPanelId) }
}

export function readChartLayout(storage: Storage | null): ChartLayout {
    try {
        const raw = storage?.getItem(CHART_LAYOUT_STORAGE_KEY)
        if (raw) return normalizeChartLayout(JSON.parse(raw))
    } catch {}
    return normalizeChartLayout(null)
}

export function writeChartLayout(storage: Storage | null, layout: ChartLayout): void {
    try {
        storage?.setItem(CHART_LAYOUT_STORAGE_KEY, JSON.stringify({ version: layout.version, order: layout.order, collapsed: layout.collapsed }))
    } catch {}
}

export function moveChart(layout: ChartLayout, id: ChartId, direction: 'up' | 'down'): ChartLayout {
    const from = layout.order.indexOf(id)
    const to = direction === 'up' ? from - 1 : from + 1
    if (from < 0 || to < 0 || to >= layout.order.length) return { ...layout, order: [...layout.order], collapsed: [...layout.collapsed] }
    const order = [...layout.order]
    ;[order[from], order[to]] = [order[to], order[from]]
    return { ...layout, order, collapsed: [...layout.collapsed] }
}

export function moveChartByKey(layout: ChartLayout, id: ChartId, direction: 'up' | 'down'): { layout: ChartLayout; toIndex: number } | null {
    const toIndex = layout.order.indexOf(id) + (direction === 'up' ? -1 : 1)
    if (!layout.order.includes(id) || toIndex < 0 || toIndex >= layout.order.length) return null
    return { layout: moveChart(layout, id, direction), toIndex }
}

export function moveChartTo(layout: ChartLayout, id: ChartId, toIndex: number): ChartLayout {
    const copy = { ...layout, order: [...layout.order], collapsed: [...layout.collapsed] }
    if (!copy.order.includes(id)) return copy
    const order = copy.order.filter((other) => other !== id)
    order.splice(Math.min(Math.max(toIndex, 0), order.length), 0, id)
    return { ...copy, order }
}

export function toggleChartCollapsed(layout: ChartLayout, id: LayoutPanelId): ChartLayout {
    const collapsed = layout.collapsed.includes(id) ? layout.collapsed.filter((other) => other !== id) : [...layout.collapsed, id]
    return { ...layout, order: [...layout.order], collapsed }
}
