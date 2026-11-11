import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import cn from 'classnames'

import styles from './workbench.module.css'

export type WorkbenchTab = 'build' | 'results'

interface WorkbenchTabsProps {
    active: WorkbenchTab
    onSelect: (tab: WorkbenchTab) => void
    resultsEnabled: boolean
    split: boolean
    build: ReactNode
    results: ReactNode
}

const TAB_ORDER: readonly WorkbenchTab[] = ['build', 'results']

export function nextTab(key: string, active: WorkbenchTab, resultsEnabled: boolean): WorkbenchTab | null {
    const enabled = TAB_ORDER.filter((tab) => tab === 'build' || resultsEnabled)
    if (enabled.length < 2) return null
    const at = enabled.indexOf(active)
    switch (key) {
        case 'ArrowRight':
            return enabled[(at + 1) % enabled.length]
        case 'ArrowLeft':
            return enabled[(at - 1 + enabled.length) % enabled.length]
        case 'Home':
            return enabled[0]
        case 'End':
            return enabled[enabled.length - 1]
        default:
            return null
    }
}

export function WorkbenchTabs({ active, onSelect, resultsEnabled, split, build, results }: WorkbenchTabsProps) {
    const tabs = useRef<Partial<Record<WorkbenchTab, HTMLButtonElement | null>>>({})

    function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: WorkbenchTab) {
        const target = nextTab(event.key, tab, resultsEnabled)
        if (target === null) return
        event.preventDefault()
        onSelect(target)
        tabs.current[target]?.focus()
    }

    return (
        <div className={split ? styles.workbenchSplit : undefined} data-testid={split ? 'workbench-split' : undefined}>
            {!split && (
                <div role="tablist" data-testid="workbench-tabs" className="nav nav-tabs mb-3">
                    <button
                        type="button"
                        role="tab"
                        id="tab-build"
                        ref={(el) => {
                            tabs.current.build = el
                        }}
                        tabIndex={active === 'build' ? 0 : -1}
                        onKeyDown={(e) => onKeyDown(e, 'build')}
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
                        ref={(el) => {
                            tabs.current.results = el
                        }}
                        tabIndex={active === 'results' ? 0 : -1}
                        onKeyDown={(e) => onKeyDown(e, 'results')}
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
            )}
            <div className={split ? styles.column : undefined} data-testid={split ? 'build-column' : undefined}>
                <div
                    id="panel-build"
                    data-testid="panel-build"
                    role={split ? undefined : 'tabpanel'}
                    aria-labelledby={split ? undefined : 'tab-build'}
                    hidden={!split && active !== 'build'}
                >
                    {build}
                </div>
            </div>
            <div className={split ? styles.column : undefined} data-testid={split ? 'results-column' : undefined}>
                <div
                    id="panel-results"
                    data-testid="panel-results"
                    role={split ? undefined : 'tabpanel'}
                    aria-labelledby={split ? undefined : 'tab-results'}
                    hidden={!split && active !== 'results'}
                >
                    {results}
                </div>
            </div>
        </div>
    )
}
