import { useState } from 'react'

export interface PrebuiltBuild {
    name: string
    text: string
}

interface BuildInputProps {
    builds: PrebuiltBuild[]
    text: string
    onTextChange: (text: string) => void
    duration: string
    onDurationChange: (duration: string) => void
    running: boolean
    onRun: () => void
}

export function BuildInput({ builds, text, onTextChange, duration, onDurationChange, running, onRun }: BuildInputProps) {
    const [selected, setSelected] = useState(builds[0]?.name ?? '')

    function selectBuild(name: string) {
        setSelected(name)
        const build = builds.find((b) => b.name === name)
        if (build) onTextChange(build.text)
    }

    return (
        <form
            className="row mb-2 pb-3 border-bottom border-info"
            noValidate
            onSubmit={(e) => {
                e.preventDefault()
                onRun()
            }}
        >
            <div className="col-md-6 mb-3">
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
            <div className="col-md-3 mb-3">
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
            <div className="col-12 mb-3">
                <label htmlFor="build-order-text">Build order</label>
                <textarea
                    id="build-order-text"
                    data-testid="build-order-text"
                    className="form-control font-monospace"
                    rows={16}
                    spellCheck={false}
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                />
            </div>
            <div className="col">
                <button type="submit" data-testid="run-simulation" className="btn btn-primary" disabled={running}>
                    Run simulation
                </button>
            </div>
        </form>
    )
}
