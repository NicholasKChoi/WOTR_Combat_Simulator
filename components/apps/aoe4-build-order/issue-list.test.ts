import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BuildOrderIssue } from '../../../lib/aoe4-build-order/model'
import { IssueList } from './issue-list'

const unknownUnit: BuildOrderIssue = { code: 'unknown-id', message: 'line 2: unknown unit "knigt"', line: 2, suggestion: 'knight' }
const syntax: BuildOrderIssue = { code: 'syntax', message: 'line 3: expected a trigger or action, got end of line', line: 3 }

function itemTexts(issues: BuildOrderIssue[], omittedIssues?: number): string[] {
    const html = renderToStaticMarkup(createElement(IssueList, { issues, omittedIssues }))
    return [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map(([, inner]) => inner.replace(/<[^>]+>/g, ''))
}

function summary(issues: BuildOrderIssue[], omittedIssues?: number): string | null {
    const html = renderToStaticMarkup(createElement(IssueList, { issues, omittedIssues }))
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
    ])('summarises the issues: %#', (issues, text) => {
        expect(summary(issues)).toBe(text)
    })

    it('ends the list with the count of omitted issues', () => {
        expect(itemTexts([syntax], 3)).toEqual([syntax.message, '3 more issues not shown.'])
    })

    it.each([0, undefined])('adds no omitted item for %s', (omittedIssues) => {
        expect(itemTexts([syntax], omittedIssues)).toEqual([syntax.message])
    })

    it('counts only the listed issues in the summary', () => {
        expect(summary([syntax], 2)).toBe('Fix 1 issue to run the simulation.')
    })
})
