import cn from 'classnames'

import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import styles from './step-annotation.module.css'
import { STEP_KINDS, finishedText, formatStepTime, type StepAnnotation, type StepKind, type StepRun } from './step-annotations'

export const KIND_CLASS: Record<StepKind, string> = {
    'age-up': styles.kindAgeUp,
    research: styles.kindResearch,
    military: styles.kindMilitary,
    villager: styles.kindVillager,
    building: styles.kindBuilding,
    economy: styles.kindEconomy,
    other: styles.kindOther,
}

const LEGEND_KINDS = (Object.keys(STEP_KINDS) as StepKind[]).filter((kind) => STEP_KINDS[kind] !== null)

export function StepKindBadge({ kind }: { kind: StepKind }) {
    const label = STEP_KINDS[kind]
    return label === null ? null : (
        <span data-testid="step-kind-badge" data-kind={kind} className={cn(styles.badge, KIND_CLASS[kind])}>
            {label}
        </span>
    )
}

export function StepKindLegend({ testId = 'step-kind-legend' }: { testId?: string }) {
    return (
        <div data-testid={testId} className={styles.legendRow}>
            {LEGEND_KINDS.map((kind) => (
                <span key={kind} data-kind={kind} className={cn(styles.badge, KIND_CLASS[kind])}>
                    {STEP_KINDS[kind]}
                </span>
            ))}
        </div>
    )
}

export function annotationToneClass(run: StepRun | undefined, stale: boolean): string {
    const warn = run !== undefined && (run.status === 'not-reached' || run.status === 'waiting' || run.flagged || run.longWait)
    return cn(warn && styles.warn, stale && styles.stale)
}

export function StepTimes({ run }: { run: StepRun }) {
    return (
        <span className={styles.times}>
            <span data-testid="step-started">{formatStepTime(run.startedAt)}</span>
            <span data-testid="step-finished">{finishedText(run)}</span>
        </span>
    )
}

export function StepRunCell({ annotation, stale }: { annotation: StepAnnotation; stale: boolean }) {
    const { kind, run } = annotation
    return (
        <td
            data-testid="step-run"
            data-stale={stale ? 'true' : undefined}
            className={cn(styles.runCell, styles.kindBorder, KIND_CLASS[kind], annotationToneClass(run ?? undefined, stale))}
        >
            <StepKindBadge kind={kind} />
            {run === null ? null : (
                <>
                    <StepTimes run={run} />
                    <div data-testid="step-waited">{formatMinSec(run.waitSeconds)}</div>
                    <div data-testid="step-blocked-by">{run.blockedBy}</div>
                </>
            )}
        </td>
    )
}
