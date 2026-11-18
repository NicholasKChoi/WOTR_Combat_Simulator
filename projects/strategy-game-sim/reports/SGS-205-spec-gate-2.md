# SGS-205 spec gate (report 2)

Verdict: NEEDS_SPEC

Checked at origin/main. Ticket: tickets/SGS-205-help-modal-headings-larger-than-body.md

## Gaps

1. Acceptance criteria 2 - "no heading-size rule is added to `page-help.module.css`" is a search/read criterion over code, and "the section headings match the size the page gives other h3 section titles (the chart titles)" has no test. An implementer could satisfy criterion 1 with any size between 18px and the title size and still pass, and a reviewer can only confirm the match by reading. Proposed fix: move the match into the regression spec: on the same page, measure the computed font size of a chart title (the `h3` in `chart-header.tsx`) and assert each help section heading equals it. Keep the "use shared Bootstrap classes, no new font-size rule" text in Scope only, not as a criterion.

## Verified

- Scope: `HelpSection` renders `<h3 id={id} className="h6">`; `help-title` is an `h2.h4`; chart titles are `h3.h5` (`chart-header.tsx:53`); `page-help.module.css` has no font-size rule. All as the ticket says.
- Base state: `styles/global.css` sets html/body `font-size: 18px`; `.h6` is 1rem = 18px, equal to the paragraph size, so the "fails at the base" claim holds (strictly-larger fails on equality).
- Title above section headings: `.h4` (1.5rem, or calc(1.275rem + .3vw) below 1200px) stays above `.h5` (1.25rem) at every width; the page has a 1200 px floor anyway.
- Existing tests: `page-help.test.ts` and `aoe4-help-modal.spec.ts` do not pin the section heading class. The only `h6` pin is `chart-legend.test.ts:51` (Markers `h3.h6`), which is out of scope and unchanged. The ticket's search claim holds.
- Docs, invariants (none), contracts, dependencies, size, diagrams, On merge (`none`), risk (`low`, no critical path or strong-model trigger), input validation (none), open questions (none), throwaway overlap (SGS-203/204 touch other files), unverified assumptions (listed, and the spec's computed-style check covers it): no gaps.

## Notes

- The Unverified assumptions line says "1rem body size"; the real value is 18px (root and body), since rem is 18px. Not blocking, as the spec measures computed sizes.
