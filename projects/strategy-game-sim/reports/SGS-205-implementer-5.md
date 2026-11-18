# SGS-205 implementer report 5

- Ticket SGS-205, branch `sgs-205-help-modal-headings-larger`, tip `d5c37714fd36e0b5cd7d1f059fa666c4fcd00a7d`, base origin/main (636193d).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-205-help-modal-headings-larger`
- Status: needs_review

## Files
- `components/apps/aoe4-build-order/page-help.tsx`: `HelpSection` h3 class `h6` -> `h5`.
- `acceptance/aoe4-help-modal.spec.ts`: new test "every section heading is larger than the body text, smaller than the dialog title, and as large as a chart title".

## Measured (Chromium)
Paragraph 21.6px (the dialog's body is larger than the 18px page body), h6 heading 18px (base), h5 22.5px = chart title, dialog title (h4) 27px.

## Tests
- Help spec: 15/15 pass. Vitest: 2863 pass, 15 skipped, 0 fail. tsc clean, lint:dup 0 clones, `next build` ok. No codegen.
- No pre-existing test edited; `page-help.test.ts` untouched.

## Mutation / base checks
- h6 (the base): fails "larger than the body text", expected > 21.6, got 18.
- h4: fails "smaller than the dialog title", expected > 27, got 27.
- h5 with inline `fontSize: 24px`: fails "the chart title size", expected 22.5, got 24 (isolates the equality assertion, since no Bootstrap class fits strictly between body and title other than h5).
- All breaks undone; the commit holds only h5.

## Doc claims
None added. `docs/aoe4-build-order-ui.md` states no heading sizes; unchanged.

## Pinned outputs
None; the spec asserts relations between measured sizes, no literal.

## Invariants
No INVARIANTS regressions (UI class only). No new unverified assumptions beyond the ticket's.

## Out-of-scope findings
None. Note: the ticket Context says body text is 1rem/18px, but the dialog paragraphs measure 21.6px; the fix still holds (h5 22.5px > 21.6px), with little margin.
