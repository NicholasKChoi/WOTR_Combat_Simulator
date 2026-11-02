import type { ReactNode } from 'react'
import cn from 'classnames'

export type WorkbenchTab = 'build' | 'results'

interface WorkbenchTabsProps {
    active: WorkbenchTab
    onSelect: (tab: WorkbenchTab) => void
    resultsEnabled: boolean
    build: ReactNode
    results: ReactNode
}

export function WorkbenchTabs({ active, onSelect, resultsEnabled, build, results }: WorkbenchTabsProps) {
    return (
        <>
            <div role="tablist" data-testid="workbench-tabs" className="nav nav-tabs mb-3">
                <button
                    type="button"
                    role="tab"
                    id="tab-build"
                    data-testid="tab-build"
                    aria-selected={active === 'build'}
                    aria-controls="panel-build"
                    className={cn('nav-link', active === 'build' && 'active')}
                    onClick={() => onSelect('build')}
                >
                    Build
                </button>
                <button
                    type="button"
                    role="tab"
                    id="tab-results"
                    data-testid="tab-results"
                    aria-selected={active === 'results'}
                    aria-controls="panel-results"
                    className={cn('nav-link', active === 'results' && 'active')}
                    disabled={!resultsEnabled}
                    onClick={() => onSelect('results')}
                >
                    Results
                </button>
            </div>
            <div role="tabpanel" id="panel-build" data-testid="panel-build" aria-labelledby="tab-build" hidden={active !== 'build'}>
                {build}
            </div>
            <div
                role="tabpanel"
                id="panel-results"
                data-testid="panel-results"
                aria-labelledby="tab-results"
                hidden={active !== 'results'}
            >
                {results}
            </div>
        </>
    )
}
