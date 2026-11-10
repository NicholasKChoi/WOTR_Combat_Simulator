import cn from 'classnames'

import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import styles from './results.module.css'
import annotationStyles from './step-annotation.module.css'
import { KIND_CLASS, StepKindBadge, StepKindLegend } from './step-annotation'
import { finishedText, formatStepTime, type TimelineRow } from './step-annotations'

interface StepTimelineProps {
    rows: TimelineRow[]
    activeStep: number | null
    onActiveStepChange: (step: number | null) => void
}

export function StepTimeline({ rows, activeStep, onActiveStepChange }: StepTimelineProps) {
    if (rows.length === 0) return null
    return (
        <div className="mb-3">
            <StepKindLegend testId="step-timeline-legend" />
            <div data-testid="step-timeline-scroll" className={styles.scrollBox}>
                <table data-testid="step-timeline" className={cn(styles.scrolledTable, 'table table-sm')}>
                    <caption className="caption-top">Step timeline</caption>
                    <thead>
                        <tr>
                            <th>Started</th>
                            <th>Finished</th>
                            <th>Step</th>
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
                                data-kind={row.kind}
                                data-status={row.status}
                                data-flagged={row.flagged ? 'true' : undefined}
                                data-long-wait={row.longWait ? 'true' : undefined}
                                data-reaction={row.reaction ? 'true' : undefined}
                                data-active={row.step === activeStep ? 'true' : undefined}
                                className={cn({ 'table-warning': row.flagged || row.longWait, 'table-active': row.step === activeStep })}
                                tabIndex={0}
                                onPointerEnter={() => onActiveStepChange(row.step)}
                                onPointerLeave={() => onActiveStepChange(null)}
                                onFocus={() => onActiveStepChange(row.step)}
                                onBlur={() => onActiveStepChange(null)}
                            >
                                <td className={cn(styles.timeCell, KIND_CLASS[row.kind], annotationStyles.kindBorder)}>{formatStepTime(row.startedAt)}</td>
                                <td className={styles.timeCell}>{finishedText(row)}</td>
                                <td className={row.kind === 'age-up' ? 'fw-bold' : undefined}>
                                    <StepKindBadge kind={row.kind} />
                                    {row.label}
                                </td>
                                <td>{formatMinSec(row.waitSeconds)}</td>
                                <td>{row.blockedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
