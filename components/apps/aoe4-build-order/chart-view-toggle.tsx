export interface ChartView<V extends string> {
    value: V
    label: string
}

export type GatherRatesView = 'rate' | 'villagers'
export type UnitsProducedView = 'units' | 'buildings'

interface ChartViewToggleProps<V extends string> {
    name: string
    views: readonly ChartView<V>[]
    value: V
    onChange: (value: V) => void
}

export function ChartViewToggle<V extends string>({ name, views, value, onChange }: ChartViewToggleProps<V>) {
    return (
        <div role="group" data-testid="chart-view-toggle" aria-label={`${name} view`} className="btn-group btn-group-sm">
            {views.map((view) => (
                <button
                    key={view.value}
                    type="button"
                    data-testid="chart-view-option"
                    data-view={view.value}
                    aria-pressed={view.value === value}
                    className={view.value === value ? 'btn btn-secondary' : 'btn btn-outline-secondary'}
                    onClick={() => view.value !== value && onChange(view.value)}
                >
                    {view.label}
                </button>
            ))}
        </div>
    )
}
