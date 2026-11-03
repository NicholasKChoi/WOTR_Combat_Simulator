import type { Ref } from 'react'
import cn from 'classnames'

import styles from './workbench.module.css'

export interface PrebuiltBuild {
    name: string
    text: string
}

export type EditorView = 'text' | 'table'

interface BuildInputProps {
    builds: PrebuiltBuild[]
    selected: string
    onSelectedChange: (name: string) => void
    onTextChange: (text: string) => void
    duration: string
    onDurationChange: (duration: string) => void
    running: boolean
    onRun: () => void
    view: EditorView
    onViewChange: (view: EditorView) => void
    formRef?: Ref<HTMLFormElement>
}

const VIEWS: { view: EditorView; label: string }[] = [
    { view: 'text', label: 'Text' },
    { view: 'table', label: 'Table' },
]

export function BuildInput({ builds, selected, onSelectedChange, onTextChange, duration, onDurationChange, running, onRun, view, onViewChange, formRef }: BuildInputProps) {
    function selectBuild(name: string) {
        onSelectedChange(name)
        const build = builds.find((b) => b.name === name)
        if (build) onTextChange(build.text)
    }

    return (
        <form
            ref={formRef}
            data-testid="run-bar"
            className={cn(styles.runBar, 'd-flex flex-wrap align-items-end gap-3 py-2 mb-3 border-bottom border-info')}
            noValidate
            onSubmit={(e) => {
                e.preventDefault()
                onRun()
            }}
        >
            <div>
                <label htmlFor="build-order-select">Prebuilt build</label>
                <select
                    id="build-order-select"
                    data-testid="build-order-select"
                    className="form-select"
                    value={selected}
                    onChange={(e) => selectBuild(e.target.value)}
                >
                    {builds.map((b) => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="duration-seconds">Duration (seconds)</label>
                <input
                    type="number"
                    id="duration-seconds"
                    data-testid="duration-seconds"
                    className="form-control"
                    value={duration}
                    step={1}
                    onChange={(e) => onDurationChange(e.target.value)}
                />
            </div>
            <button type="submit" data-testid="run-simulation" className="btn btn-primary" disabled={running}>
                Run simulation
            </button>
            <div className="btn-group" role="group" aria-label="Editor view">
                {VIEWS.map(({ view: option, label }) => (
                    <button
                        key={option}
                        type="button"
                        data-testid={`editor-view-${option}`}
                        aria-pressed={view === option}
                        className={cn('btn btn-outline-secondary', view === option && 'active')}
                        onClick={() => onViewChange(option)}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </form>
    )
}
