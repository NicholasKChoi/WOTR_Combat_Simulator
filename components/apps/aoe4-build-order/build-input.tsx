import cn from 'classnames'
import type { RefObject } from 'react'

import type { CreateNamedBuildResponse, UpdateNamedBuildResponse } from '../../../lib/aoe4-build-order/named-builds'
import type { TextToBuildResult } from '../../../lib/aoe4-build-order/text-to-build'
import type { AutoRunStatus, LiveInput } from './auto-run'
import { autoRunStatusMessage } from './auto-run-status'
import { LIBRARY_GROUPS, entryLabel, type LibraryEntry } from './build-library'
import { SaveBuild } from './save-build'
import styles from './workbench.module.css'

export type EditorView = 'text' | 'table'

interface BuildInputProps {
    entries: LibraryEntry[]
    selected: string
    edited: boolean
    onBuildSelect: (key: string) => void
    duration: string
    onDurationChange: (duration: string) => void
    durationError: string | null
    status: AutoRunStatus
    settled: LiveInput
    conversion: TextToBuildResult
    hasResult: boolean
    busy?: boolean
    entry: LibraryEntry | undefined
    editSecret: string | null
    onCreated: (response: CreateNamedBuildResponse, input: LiveInput, name: string) => void
    onUpdated: (response: UpdateNamedBuildResponse, input: LiveInput) => void
    onSubmit: () => void
    view: EditorView
    onViewChange: (view: EditorView) => void
    viewDisabled?: boolean
    runBarRef: RefObject<HTMLFormElement | null>
}

const VIEWS: { view: EditorView; label: string }[] = [
    { view: 'text', label: 'Text' },
    { view: 'table', label: 'Table' },
]

export function BuildInput({ entries, selected, edited, onBuildSelect, duration, onDurationChange, durationError, status, settled, conversion, hasResult, busy = false, entry, editSecret, onCreated, onUpdated, onSubmit, view, onViewChange, viewDisabled = false, runBarRef }: BuildInputProps) {
    return (
        <form
            ref={runBarRef}
            data-testid="run-bar"
            className={cn(styles.runBar, 'd-flex flex-wrap align-items-end gap-3 py-2 mb-3 border-bottom border-info')}
            noValidate
            onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
            }}
        >
            <div className={styles.runField}>
                <label htmlFor="build-order-select">Build</label>
                <select
                    id="build-order-select"
                    data-testid="build-order-select"
                    className="form-select"
                    value={selected}
                    disabled={busy}
                    aria-busy={busy ? 'true' : undefined}
                    data-edited={edited ? 'true' : 'false'}
                    onChange={(e) => onBuildSelect(e.target.value)}
                >
                    {LIBRARY_GROUPS.map((group) => {
                        const members = entries.filter((entry) => group.kind.includes(entry.kind))
                        if (members.length === 0) return null
                        return (
                            <optgroup key={group.label} label={group.label}>
                                {members.map((entry) => (
                                    <option key={entry.key} value={entry.key}>
                                        {entryLabel(entry, edited && entry.key === selected)}
                                    </option>
                                ))}
                            </optgroup>
                        )
                    })}
                </select>
            </div>
            <div className={styles.runField}>
                <label htmlFor="duration-seconds">Duration (seconds)</label>
                <input
                    type="number"
                    id="duration-seconds"
                    data-testid="duration-seconds"
                    className={cn('form-control', durationError !== null && 'is-invalid')}
                    value={duration}
                    step={1}
                    disabled={busy}
                    aria-busy={busy ? 'true' : undefined}
                    aria-invalid={durationError !== null ? 'true' : undefined}
                    aria-describedby={durationError !== null ? 'duration-error' : undefined}
                    onChange={(e) => onDurationChange(e.target.value)}
                />
                {durationError !== null ? (
                    <div id="duration-error" data-testid="duration-error" className="invalid-feedback">
                        {durationError}
                    </div>
                ) : null}
            </div>
            <div className="btn-group" role="group" aria-label="Editor view">
                {VIEWS.map(({ view: option, label }) => (
                    <button
                        key={option}
                        type="button"
                        data-testid={`editor-view-${option}`}
                        aria-pressed={view === option}
                        disabled={viewDisabled}
                        className={cn('btn btn-outline-secondary', view === option && ['active', styles.activeView])}
                        onClick={() => onViewChange(option)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <SaveBuild
                status={status}
                settled={settled}
                conversion={conversion}
                busy={busy}
                entry={entry}
                editSecret={editSecret}
                edited={edited}
                onCreated={onCreated}
                onUpdated={onUpdated}
            />
            <p id="auto-run-status" data-testid="auto-run-status" role="status" data-status={status} className={styles.autoRunStatus}>
                {autoRunStatusMessage(status, hasResult)}
            </p>
        </form>
    )
}
