import cn from 'classnames'

import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { SimulationResult } from '../../../lib/aoe4-build-order/model'
import { type CompareRow, type KeyValue, compareRows, keyNumbers } from './compare'
import results from './results.module.css'
import workbench from './workbench.module.css'

interface ComparePanelProps {
    current: SimulationResult | null
    pinned: SimulationResult | null
    pinnedName: string | null
    alreadyPinned: boolean
    onPin: () => void
    onUnpin: () => void
}

const DASH = '—'
const MINUS = '−'

const isMilitary = (row: CompareRow): boolean => row.key.startsWith('military-')

function formatValue(row: CompareRow, value: KeyValue, run: SimulationResult): string {
    if (value.value !== null) return isMilitary(row) ? String(Math.round(value.value)) : formatMinSec(value.value)
    return value.reason === 'run-ended' ? `run ends at ${formatMinSec(run.durationSeconds)}` : 'not reached'
}

function formatDelta(row: CompareRow): string {
    const { delta } = row
    if (delta === null) return DASH
    if (delta === 0) return 'same'
    if (isMilitary(row)) return `${delta > 0 ? '+' : MINUS}${Math.round(Math.abs(delta))} resources`
    return `${formatMinSec(Math.abs(delta))} ${delta < 0 ? 'earlier' : 'later'}`
}

const DIRECTION_CLASS = { better: 'text-success', worse: 'text-danger', same: undefined } as const

export function ComparePanel({ current, pinned, pinnedName, alreadyPinned, onPin, onUnpin }: ComparePanelProps) {
    return (
        <div className="mb-3">
            <button type="button" data-testid="pin-run" className="btn btn-outline-secondary me-2" disabled={current === null || alreadyPinned} onClick={onPin}>
                Pin this run
            </button>
            <button type="button" data-testid="unpin-run" className="btn btn-outline-secondary" disabled={pinned === null} onClick={onUnpin}>
                Unpin
            </button>
            {pinned !== null && pinnedName !== null ? (
                <span data-testid="pinned-label" className={cn(workbench.pinnedLabel, 'ms-3')}>
                    Pinned: {pinnedName}, {formatMinSec(pinned.durationSeconds)}
                </span>
            ) : null}
            {current !== null && pinned !== null ? <CompareTable current={current} pinned={pinned} /> : null}
        </div>
    )
}

function CompareTable({ current, pinned }: { current: SimulationResult; pinned: SimulationResult }) {
    const rows = compareRows(keyNumbers(current), keyNumbers(pinned))
    if (rows.length === 0) return <p data-testid="compare-empty" className="mt-3">Nothing to compare yet</p>
    return (
        <div data-testid="compare-scroll" className={cn(results.scrollBox, 'mt-3')}>
            <table data-testid="compare-key-numbers" className={cn(results.scrolledTable, 'table table-sm')}>
                <thead>
                    <tr>
                        <th>Key number</th>
                        <th>Pinned</th>
                        <th>Current</th>
                        <th>Delta</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key} data-testid="compare-row" data-key={row.key} data-direction={row.direction ?? undefined}>
                            <td>{row.label}</td>
                            <td>{formatValue(row, row.pinned, pinned)}</td>
                            <td>{formatValue(row, row.current, current)}</td>
                            <td className={row.direction === null ? undefined : DIRECTION_CLASS[row.direction]}>{formatDelta(row)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
