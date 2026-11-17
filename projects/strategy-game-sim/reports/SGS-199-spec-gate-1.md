# SGS-199 spec gate 1

Ticket: tickets/SGS-199-page-help-modal.md. Read at origin/main (all three Depends-on tickets are drafts, so I read their ticket files for names).

**Verdict: NEEDS_SPEC**

## Gaps

1. **Scope, tests that assert the legend (wrong claim) - the dialog is always in the DOM, so a legend count of 0 is never true.**
   - Scope says `aoe4-results-split.spec.ts` has "a `step-kind-legend` count of 0 [that] stays true while the modal is closed". B-H9 and the unit test put the dialog, with `StepKindLegend` inside it, in the server HTML. `getByTestId` matches hidden elements, so the count is 1 on every page state.
   - These existing assertions fail as written:
     - `aoe4-results-split.spec.ts:55`: `toHaveCount(0)` for a build with no steps.
     - `aoe4-compact-view.spec.ts`: `legend(page)` `toHaveCount(0)` before the run and for `START_ONLY_BUILD`.
   - Today the legend renders only when `annotations !== null && steps.length > 0`. In the modal it is unconditional, so "with or without a result" and "no steps shows no legend" lose their meaning.
   - An implementer following Scope would keep a failing count-0 assertion.
   - Fix: state the rule as "no `step-kind-legend` outside `help-modal`" (for example `page.locator('[data-testid="step-kind-legend"]:not(dialog *)')` has count 0). Drop the legend half of "no steps shows no legend" and of the "no legend until the run lands" assertion, or turn them into that outside-modal check. Also say the legend count on the page is exactly 1, inside `help-modal`, in every state.

2. **Scope and criteria, how a section is identified - missing.**
   - "Seven sections ... each under its own heading", "the dialog's section headings are seven" and "the section names ..." (sections 4 and 5) need a stable selector.
   - The ticket gives no heading level or section testid, and the headings' wording is the implementer's. The `page-help.test.ts` "sections in order" assertion and the spec's section-4 and section-5 checks cannot be written without a guess.
   - Fix: Scope adds a testid. Each section is `section[data-testid=help-section]` with `aria-labelledby` pointing at its heading (`h3`), in B-H6 order. Tests address them by position (`nth(3)` is section 4, `nth(4)` is section 5), not by text. The modal's own title stays the `h2`.

3. **Criteria "Section 4" and "Section 5" - not testable as written.**
   - "A test fails if the section describes a feature the page does not have or omits one it has" has no observable test; it is an open-ended review judgement.
   - "The section describes that form" (the `still waiting for ...` text) has no check.
   - Fix for section 5: replace it with a feature table in the spec. Each row is a feature with a locator on the live page. Rows: the marker control's accessible name, the zoom bar's `Show earlier`, `Show later` and `Reset zoom` names, `chart-drag-handle` and `chart-collapse` accessible names, `chart-upgrade-dot` and `chart-pinned-upgrade-dot`, the series legend toggles, and the `chart-pinned-legend` dashed key. The spec reads each name from the page, then asserts section 5's text contains it. Name every control by its live accessible name, verbatim.
   - Fix for the no-caveat rule: the modal text matches none of `/coming|not yet|soon|incomplete|unavailable/i`.
   - Fix for section 4: with a live `step-blocked-by` reading `still waiting for ...`, section 4's text contains the literal `still waiting for`. That prefix is fixed in SGS-193.
   - Section 4 also contains the three causes, by shared nouns: `waiting`, `never reached` or `not reached`, and `60`.

4. **Criteria "Open" (B-H1) and "Placement" (B-H8) - vague quantities.**
   - "At most about 80% of the viewport" and "on the same line as the h1" are unbounded.
   - Fix: dialog height <= 0.8 x `innerHeight` + 1 px, at a short viewport where the content is taller than that. For the same line: `help-open`'s vertical centre lies within the `h1`'s top and bottom, and its left edge is >= the `h1`'s right edge (one evaluate, under `toPass`).

## Notes (non-blocking)

- Names check out against the Depends-on tickets and the base: `step-blocked-by`, `still waiting for Castle Age`, `chart-upgrade-dot` and `chart-pinned-upgrade-dot` (SGS-198), the zoom reset and pan names (SGS-197, `chart-zoom-reset`), and `chart-pinned-legend`, `chart-reorder-help`, `copy-saved-link-hint`, `pin-run` (on main). The design's names are used exactly.
- The modal's static text sits in the DOM in every state, and Playwright's `getByText` matches hidden nodes. At base, `aoe4-split-scroll.spec.ts:161` asserts `getByText('Build order', { exact: true })` has count 1, so a section heading of exactly `Build order` would break it. Existing specs that use broad text locators should be run after the change. The ticket's "tests that depend" rule covers only the legend.
- The `.warn` background lives in `step-annotation.module.css` (`.warn` plus `tbody > tr > td.warn`). Scope puts the swatch in `page-help.module.css` and says nothing about how it gets the same background. Say it reuses the class (export it, or use `annotationToneClass`) so the computed-background comparison holds.
- The `step-annotation.test.ts:157` `not.toContain('step-kind-legend')` check is already trivially true after the change. Drop it with the legend half of the other test (line 179 must change).
- A backdrop click on a native `dialog` targets the dialog element itself. If the dialog has padding, a click on the padding is inside the box. Say the handler compares the click coordinates to the dialog's rect (design B-H2: "outside the dialog's box"). The "click inside content does not close" test covers this.
- Risk low, On merge none, Unverified assumptions none, Diagrams, Invariants and docs-deferred-to-SGS-200 all hold. No overlap with other open tickets.
