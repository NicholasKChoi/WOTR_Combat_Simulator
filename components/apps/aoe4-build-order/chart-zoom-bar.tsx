import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { TimeWindow } from './chart-zoom'

export type PanDirection = 'earlier' | 'later'

interface ChartZoomBarProps {
    title: string
    shown: TimeWindow
    end: number
    onPan(direction: PanDirection): void
    onReset(): void
}

export function ChartZoomBar({ title, shown, end, onPan, onReset }: ChartZoomBarProps) {
    const atStart = shown.from <= 0
    const atEnd = shown.to >= end
    return (
        <div className="d-flex align-items-center gap-2 small mb-2" data-testid="chart-zoom-bar">
            <span data-testid="chart-zoom-range">
                {formatMinSec(shown.from)} to {formatMinSec(shown.to)}
            </span>
            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                data-testid="chart-zoom-pan-earlier"
                aria-label={`Show earlier in ${title} chart`}
                aria-disabled={atStart ? 'true' : undefined}
                onClick={() => !atStart && onPan('earlier')}
            >
                &larr;
            </button>
            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                data-testid="chart-zoom-pan-later"
                aria-label={`Show later in ${title} chart`}
                aria-disabled={atEnd ? 'true' : undefined}
                onClick={() => !atEnd && onPan('later')}
            >
                &rarr;
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" data-testid="chart-zoom-reset" aria-label={`Reset ${title} chart zoom`} onClick={onReset}>
                Reset zoom
            </button>
        </div>
    )
}
