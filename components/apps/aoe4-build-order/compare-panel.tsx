import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { type CompareRow, compareRows, keyNumbers } from './compare'

interface ComparePanelProps {
    current: SimulationResult | null
    pinned: SimulationResult | null
    onPin: () => void
    onUnpin: () => void
}

const DASH = '—'

function formatValue(row: CompareRow, value: number | null): string {
    if (value === null) return DASH
    return row.key.startsWith('military-') ? String(Math.round(value)) : formatMinSec(value)
}

function formatDelta(row: CompareRow): string {
    const { delta } = row
    if (delta === null) return DASH
    if (delta === 0) return '0'
    const magnitude = row.key.startsWith('military-') ? String(Math.round(Math.abs(delta))) : formatMinSec(Math.abs(delta))
    return `${delta > 0 ? '+' : '-'}${magnitude}`
}

export function ComparePanel({ current, pinned, onPin, onUnpin }: ComparePanelProps) {
    return (
        <div className="mb-3">
            <button type="button" data-testid="pin-run" className="btn btn-outline-secondary me-2" disabled={current === null} onClick={onPin}>
                Pin this run
            </button>
            <button type="button" data-testid="unpin-run" className="btn btn-outline-secondary" disabled={pinned === null} onClick={onUnpin}>
                Unpin
            </button>
            {current !== null && pinned !== null ? (
                <table data-testid="compare-key-numbers" className="table table-sm mt-3">
                    <thead>
                        <tr>
                            <th>Key number</th>
                            <th>Pinned</th>
                            <th>Current</th>
                            <th>Delta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {compareRows(keyNumbers(current), keyNumbers(pinned)).map((row) => (
                            <tr key={row.key} data-testid="compare-row" data-key={row.key}>
                                <td>{row.label}</td>
                                <td>{formatValue(row, row.pinned)}</td>
                                <td>{formatValue(row, row.current)}</td>
                                <td>{formatDelta(row)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : null}
        </div>
    )
}
