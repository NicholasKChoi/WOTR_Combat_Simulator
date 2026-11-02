import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'

export function IssueList({ issues }: { issues: readonly BuildOrderIssue[] }) {
    if (issues.length === 0) return null
    return (
        <div data-testid="build-order-issues" role="alert" className="alert alert-danger mt-2 mb-0">
            <ul className="mb-0">
                {issues.map((issue, i) => (
                    <li key={i} data-testid="build-order-issue" data-code={issue.code} data-line={issue.line}>
                        {issue.message}
                    </li>
                ))}
            </ul>
        </div>
    )
}
