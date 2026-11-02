import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'

export function lineCount(text: string): number {
    return text.split('\n').length
}

export function issueLines(issues: readonly BuildOrderIssue[]): number[] {
    const lines = new Set<number>()
    for (const { line } of issues) if (line !== undefined) lines.add(line)
    return [...lines].sort((a, b) => a - b)
}
