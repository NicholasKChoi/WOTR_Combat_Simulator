import cn from 'classnames'
import type { SyntheticEvent } from 'react'

import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'
import type { BuildOrderLines } from '../../../lib/aoe4-build-order/model'
import { KIND_CLASS, StepKindLegend, StepTimes, annotationToneClass } from './step-annotation'
import { annotationsByLine, type BuildAnnotations, type StepAnnotation } from './step-annotations'
import { lineCount } from './text-lines'
import styles from './workbench.module.css'

interface BuildTextEditorProps {
    text: string
    onChange: (text: string) => void
    errorLines: readonly number[]
    annotations: BuildAnnotations | null
    lines: BuildOrderLines
    activeStep: number | null
    onActiveStepChange: (runStep: number | null) => void
    disabled?: boolean
}

interface AnnotationLineProps {
    line: number
    annotation: StepAnnotation | null
    stale: boolean
    active: boolean
    onActiveStepChange: (runStep: number | null) => void
}

function AnnotationLine({ line, annotation, stale, active, onActiveStepChange }: AnnotationLineProps) {
    const run = annotation?.run ?? null
    return (
        <li
            data-testid="build-order-line-annotation"
            data-line={line}
            data-kind={annotation?.kind}
            data-status={run?.status}
            data-flagged={run?.flagged ? 'true' : undefined}
            data-long-wait={run?.longWait ? 'true' : undefined}
            data-stale={annotation !== null && stale ? 'true' : undefined}
            data-gutter-active={active ? 'true' : undefined}
            title={run === null ? undefined : `Waited ${formatMinSec(run.waitSeconds)}. Blocked by: ${run.blockedBy === '' ? 'nothing' : run.blockedBy}`}
            className={cn(annotation !== null && [styles.annotation, KIND_CLASS[annotation.kind], annotationToneClass(run ?? undefined, stale)])}
            onPointerEnter={() => onActiveStepChange(run?.runStep ?? null)}
            onPointerLeave={() => onActiveStepChange(null)}
        >
            {run === null ? null : <StepTimes run={run} />}
        </li>
    )
}

export function BuildTextEditor({ text, onChange, errorLines, annotations, lines, activeStep, onActiveStepChange, disabled = false }: BuildTextEditorProps) {
    const rowCount = lineCount(text)
    const byLine = annotations === null ? null : annotationsByLine(annotations, lines.steps, rowCount)
    const onCaret = (e: SyntheticEvent<HTMLTextAreaElement>) => {
        const caretLine = e.currentTarget.value.slice(0, e.currentTarget.selectionStart).split('\n').length
        onActiveStepChange(byLine?.[caretLine - 1]?.run?.runStep ?? null)
    }
    return (
        <div className="mb-3">
            <label htmlFor="build-order-text">Build order</label>
            {annotations !== null && lines.steps.length > 0 ? <StepKindLegend /> : null}
            <div className={styles.editor}>
                <ol data-testid="build-order-gutter" aria-hidden="true" className={styles.gutter}>
                    {Array.from({ length: rowCount }, (_, i) => (
                        <li
                            key={i}
                            data-testid="build-order-line-number"
                            data-line={i + 1}
                            data-error={errorLines.includes(i + 1) ? 'true' : undefined}
                        >
                            {i + 1}
                        </li>
                    ))}
                </ol>
                {annotations !== null && byLine !== null ? (
                    <ol data-testid="build-order-annotations" aria-hidden="true" className={styles.annotations}>
                        {byLine.map((annotation, i) => {
                            const runStep = annotation?.run?.runStep
                            return (
                                <AnnotationLine
                                    key={i}
                                    line={i + 1}
                                    annotation={annotation}
                                    stale={annotations.stale}
                                    active={activeStep !== null && runStep === activeStep}
                                    onActiveStepChange={onActiveStepChange}
                                />
                            )
                        })}
                    </ol>
                ) : null}
                <textarea
                    id="build-order-text"
                    data-testid="build-order-text"
                    className={cn('form-control font-monospace', styles.textarea)}
                    rows={Math.max(8, rowCount)}
                    wrap="off"
                    spellCheck={false}
                    value={text}
                    disabled={disabled}
                    aria-busy={disabled ? 'true' : undefined}
                    onChange={(e) => onChange(e.target.value)}
                    onSelect={onCaret}
                    onKeyUp={onCaret}
                    onClick={onCaret}
                    onBlur={() => onActiveStepChange(null)}
                />
            </div>
        </div>
    )
}
