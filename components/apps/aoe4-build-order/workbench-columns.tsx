import cn from 'classnames'
import type { ReactNode } from 'react'

import styles from './workbench.module.css'

export function WorkbenchColumns({ build, results }: { build: ReactNode; results: ReactNode }) {
    return (
        <div className={styles.workbenchSplit} data-testid="workbench-split">
            <div className={styles.column} data-testid="build-column">
                <div data-testid="panel-build">{build}</div>
            </div>
            <div className={cn(styles.column, styles.resultsColumn)} data-testid="results-column">
                <div data-testid="panel-results">{results}</div>
            </div>
        </div>
    )
}
