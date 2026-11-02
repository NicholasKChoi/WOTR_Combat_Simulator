import { useMemo } from 'react'
import type { StepTiming } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import { formatStepTime, formatWaitBreakdown, timelineRows } from './step-timeline-rows'

interface StepTimelineProps {
    steps: StepTiming[]
    text: string
}

export function StepTimeline({ steps, text }: StepTimelineProps) {
    const rows = useMemo(() => timelineRows(steps, text), [steps, text])
    if (rows.length === 0) return null
    return (
        <div className="table-responsive mb-3">
            <table data-testid="step-timeline" className="table table-sm">
                <caption className="caption-top">Step timeline</caption>
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Started</th>
                        <th>Finished</th>
                        <th>Waited</th>
                        <th>Waited on</th>
                        <th>Stuck on</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.step}
                            data-testid="step-timeline-row"
                            data-step={row.step}
                            data-status={row.status}
                            data-flagged={row.flagged ? 'true' : undefined}
                            data-reaction={row.reaction ? 'true' : undefined}
                            className={row.flagged ? 'table-warning' : undefined}
                        >
                            <td>{row.label}</td>
                            <td>{formatStepTime(row.startedAt)}</td>
                            <td>{formatStepTime(row.completedAt)}</td>
                            <td>{formatMinSec(row.waitSeconds)}</td>
                            <td>{formatWaitBreakdown(row.waitBreakdown)}</td>
                            <td>{row.flagged ? row.waitingOn : null}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
