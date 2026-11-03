import { useMemo } from 'react'
import cn from 'classnames'

import type { StepTiming } from '../../../lib/aoe4-build-order/model'
import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import styles from './results.module.css'
import { formatStepTime, timelineRows, type TimelineRow } from './step-timeline-rows'

const finishedText = (row: TimelineRow): string => (row.status === 'in-progress' ? 'ongoing' : formatStepTime(row.completedAt))

interface StepTimelineProps {
    steps: StepTiming[]
    text: string
}

export function StepTimeline({ steps, text }: StepTimelineProps) {
    const rows = useMemo(() => timelineRows(steps, text), [steps, text])
    if (rows.length === 0) return null
    return (
        <div data-testid="step-timeline-scroll" className={cn(styles.scrollBox, 'mb-3')}>
            <table data-testid="step-timeline" className={cn(styles.scrolledTable, 'table table-sm')}>
                <caption className="caption-top">Step timeline</caption>
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Started</th>
                        <th>Finished</th>
                        <th>Waited</th>
                        <th>Blocked by</th>
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
                            data-long-wait={row.longWait ? 'true' : undefined}
                            data-reaction={row.reaction ? 'true' : undefined}
                            className={row.flagged || row.longWait ? 'table-warning' : undefined}
                        >
                            <td>{row.label}</td>
                            <td>{formatStepTime(row.startedAt)}</td>
                            <td>{finishedText(row)}</td>
                            <td>{formatMinSec(row.waitSeconds)}</td>
                            <td>{row.blockedBy}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
