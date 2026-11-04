import cn from 'classnames'

import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import styles from './workbench.module.css'

export function IssueList({ issues, rejected = false }: { issues: readonly BuildOrderIssue[]; rejected?: boolean }) {
    if (issues.length === 0) return null
    return (
        <div data-testid="build-order-issues" role="alert" className={cn(styles.issues, 'alert alert-danger mt-2 mb-0')}>
            {rejected ? (
                <p data-testid="build-order-issues-summary" className="mb-1">
                    {`Fix ${issues.length === 1 ? '1 issue' : `${issues.length} issues`} to run the simulation.`}
                </p>
            ) : null}
            <ul className="mb-0">
                {issues.map((issue, i) => (
                    <li key={i} data-testid="build-order-issue" data-code={issue.code} data-line={issue.line}>
                        <span>{issue.suggestion !== undefined ? `${issue.message}. ` : issue.message}</span>
                        {issue.suggestion !== undefined ? <span data-testid="build-order-issue-suggestion">{`Did you mean ${issue.suggestion}?`}</span> : null}
                    </li>
                ))}
            </ul>
        </div>
    )
}
