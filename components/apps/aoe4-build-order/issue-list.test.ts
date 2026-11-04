import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import { IssueList } from './issue-list'

const unknownUnit: BuildOrderIssue = { code: 'unknown-id', message: 'line 2: unknown unit "knigt"', line: 2, suggestion: 'knight' }
const syntax: BuildOrderIssue = { code: 'syntax', message: 'line 3: expected a trigger or action, got end of line', line: 3 }

function itemTexts(issues: BuildOrderIssue[], rejected?: boolean): string[] {
    const html = renderToStaticMarkup(createElement(IssueList, { issues, rejected }))
    return [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, inner]) => inner.replace(/<[^>]+>/g, ''))
}

function summary(issues: BuildOrderIssue[], rejected?: boolean): string | null {
    const html = renderToStaticMarkup(createElement(IssueList, { issues, rejected }))
    return /data-testid="build-order-issues-summary"[^>]*>(.*?)<\/p>/.exec(html)?.[1] ?? null
}

describe('IssueList', () => {
    it('joins a suggestion to the message with a full stop', () => {
        expect(itemTexts([unknownUnit])).toEqual(['line 2: unknown unit &quot;knigt&quot;. Did you mean knight?'])
    })

    it('joins a suggestion after a message that already ends in punctuation', () => {
        expect(itemTexts([{ ...unknownUnit, message: 'unknown unit (knigt)' }])).toEqual(['unknown unit (knigt). Did you mean knight?'])
    })

    it('adds nothing to an issue without a suggestion', () => {
        const html = renderToStaticMarkup(createElement(IssueList, { issues: [syntax] }))
        expect(itemTexts([syntax])).toEqual([syntax.message])
        expect(html).not.toContain('build-order-issue-suggestion')
    })

    it.each([
        [[syntax], 'Fix 1 issue to run the simulation.'],
        [[syntax, unknownUnit], 'Fix 2 issues to run the simulation.'],
    ])('summarises a rejected run: %#', (issues, text) => {
        expect(summary(issues, true)).toBe(text)
    })

    it('has no summary before a rejected run', () => {
        expect(summary([syntax])).toBeNull()
    })
})
