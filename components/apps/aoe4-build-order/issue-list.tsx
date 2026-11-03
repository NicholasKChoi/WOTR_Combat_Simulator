import cn from 'classnames'

import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import styles from './workbench.module.css'

export function IssueList({ issues }: { issues: readonly BuildOrderIssue[] }) {
    if (issues.length === 0) return null
    return (
        <div data-testid="build-order-issues" role="alert" className={cn(styles.issues, 'alert alert-danger mt-2 mb-0')}>
            <ul className="mb-0">
                {issues.map((issue, i) => (
                    <li key={i} data-testid="build-order-issue" data-code={issue.code} data-line={issue.line}>
                        <span>{issue.message}</span>
                        {issue.suggestion !== undefined ? (
                            <span data-testid="build-order-issue-suggestion" className="ms-2">
                                {`did you mean ${issue.suggestion}?`}
                            </span>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    )
}
