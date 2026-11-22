import cn from 'classnames'
import { useEffect, useRef, type RefObject, type SyntheticEvent } from 'react'

import type { BuildOrderLines } from '../../../lib/aoe4-build-order/model'
import annotationStyles from './step-annotation.module.css'
import { KIND_CLASS, StepTimes, annotationToneClass } from './step-annotation'
import { AnnotationPopover } from './annotation-popover'
import { annotationsByLine, gutterDetailText, hasPopover, type BuildAnnotations, type StepAnnotation } from './step-annotations'
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
    labelledBy: string
}

interface AnnotationLineProps {
    line: number
    annotation: StepAnnotation | null
    stale: boolean
    active: boolean
    textarea: RefObject<HTMLTextAreaElement | null>
    onActiveStepChange: (runStep: number | null) => void
}

function AnnotationLine({ line, annotation, stale, active, textarea, onActiveStepChange }: AnnotationLineProps) {
    const run = annotation?.run ?? null
    const lineRef = useRef<HTMLLIElement>(null)
    return (
        <li
            ref={lineRef}
            data-testid="build-order-line-annotation"
            data-line={line}
            data-kind={annotation?.kind}
            data-status={run?.status}
            data-flagged={run?.flagged ? 'true' : undefined}
            data-long-wait={run?.longWait ? 'true' : undefined}
            data-stale={annotation !== null && stale ? 'true' : undefined}
            data-gutter-active={active ? 'true' : undefined}
            className={cn(annotation !== null && [annotationStyles.kindBorder, KIND_CLASS[annotation.kind], annotationToneClass(run ?? undefined, stale)])}
            onPointerEnter={() => onActiveStepChange(run?.runStep ?? null)}
            onPointerLeave={() => onActiveStepChange(null)}
        >
            {run === null ? null : <StepTimes run={run} labelled={false} />}
            {annotation !== null && run !== null && active && hasPopover(run) ? (
                <AnnotationPopover anchor={lineRef} textarea={textarea} text={gutterDetailText(annotation)} />
            ) : null}
        </li>
    )
}

export function BuildTextEditor({ text, onChange, errorLines, annotations, lines, activeStep, onActiveStepChange, disabled = false, labelledBy }: BuildTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const typedText = useRef<string | null>(null)
    useEffect(() => {
        if (typedText.current !== text && textareaRef.current !== null) textareaRef.current.scrollLeft = 0
    }, [text])
    const rowCount = lineCount(text)
    const byLine = annotations === null ? null : annotationsByLine(annotations, lines.steps, rowCount)
    const onCaret = (e: SyntheticEvent<HTMLTextAreaElement>) => {
        const caretLine = lineCount(e.currentTarget.value.slice(0, e.currentTarget.selectionStart))
        onActiveStepChange(byLine?.[caretLine - 1]?.run?.runStep ?? null)
    }
    return (
        <div className="mb-3">
            <div data-testid="build-order-editor" className={styles.editor}>
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
                                    textarea={textareaRef}
                                    onActiveStepChange={onActiveStepChange}
                                />
                            )
                        })}
                    </ol>
                ) : null}
                <textarea
                    ref={textareaRef}
                    id="build-order-text"
                    aria-labelledby={labelledBy}
                    data-testid="build-order-text"
                    className={cn('form-control font-monospace', styles.textarea)}
                    rows={Math.max(8, rowCount)}
                    wrap="off"
                    spellCheck={false}
                    value={text}
                    disabled={disabled}
                    aria-busy={disabled ? 'true' : undefined}
                    onChange={(e) => {
                        typedText.current = e.target.value
                        onChange(e.target.value)
                    }}
                    onSelect={onCaret}
                    onKeyUp={onCaret}
                    onClick={onCaret}
                    onBlur={() => onActiveStepChange(null)}
                />
            </div>
        </div>
    )
}
