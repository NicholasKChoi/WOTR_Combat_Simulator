# SGS-199 ticket report 2 (re-spec 1)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-199-page-help-modal.md
Verified against origin/main 87f0cd7; Depends-on names read from the SGS-193, SGS-197 and SGS-198 ticket files and design/M11.md (C9, C12, C18, B-H1 to B-H9). ticket-lint passes.

## Summary

SGS-199 "Add the 'How this page works' help modal", component aoe4-build-order, M11, about 120 business-logic lines, Risk low. It depends on SGS-193, SGS-198 and SGS-197. Criteria cover B-H1 to B-H9 plus the unit test and the existing-test rewrite rule. Changed criteria are tagged `(respec 1)`, and `## Re-spec 1 - 2026-11-16` is appended. No diagram: one component, outside the control loop.

## Gate gaps folded in

1. **Legend count**: Scope now says the page holds exactly one `step-kind-legend`, inside `help-modal`, in every state. "Absent" becomes the check that no legend sits outside the modal (`:not([data-testid="help-modal"] *)`).
   - Rewrite rules cover each kind of check: visible or count-1 checks, count-0 and `not.toContain` checks, the "legend follows the parsed steps" half, and run-cell colour reads.
   - Examples confirmed at base: `aoe4-results-split.spec.ts` no-steps test, the `aoe4-compact-view.spec.ts` count-0 checks (before a result and for `START_ONLY_BUILD`), the `step-annotation.test.ts` legend tests, the `aoe4-step-annotations.spec.ts` `legendColors` helper and count, and `aoe4-build-order-knight-longbow-page.spec.ts` `toBeVisible`.
2. **Section selector**: each section is a `section[data-testid=help-section]` labelled by its own `h3`. Tests address sections by position, never by heading text.
3. **Sections 4 and 5**:
   - Section 4 must contain `still waiting for`, `waiting`, `never reached` or `not reached`, `60`, and `Blocked by`. The spec first asserts that a live `step-blocked-by` ends with the `still waiting for` tail.
   - Section 5 is a feature table. Each row reads its term from the live page first, then asserts the section contains it.
   - Deviation from the gate's wording: the accessible names are per chart (for example `Show earlier in <title> chart`, `Reorder <title> chart`), so the spec strips the chart title before matching instead of matching the full name verbatim. The design-fixed nouns `upgrade dot` and `unit line` are also rows.
   - The no-caveat check is now a regex. I narrowed the gate's `/coming|not yet|soon|.../` to `/coming soon|not yet (available|supported|shipped)|incomplete|unavailable/i` so that section 4 can still describe a step that has not been reached.
4. **Bounds**: the dialog height must be at most 0.8 x `innerHeight` + 1 px, at a viewport where the content is shown to overflow first. "Same line" means the button's vertical centre is within the `h1`'s top and bottom and its left edge is at or right of the `h1`'s right edge, read in one evaluate under `toPass`.

## Notes folded in

- `help-warn-tint` reuses the `.warn` class from `step-annotation.module.css` and copies no colour.
- A new rule covers the modal's hidden text colliding with existing page-wide `getByText` counts. Example: `aoe4-split-scroll.spec.ts` counts `getByText('Build order', { exact: true })` as 1.
- Backdrop close compares the click coordinates to the dialog's rect. A click on the dialog's padding must not close it, and a test checks that.
- The `step-annotation.test.ts` absence check moves to the render with annotations, so it can fail.

## Diagrams

None (single component, outside the control loop).

## Open questions

none

## Overlap

None with other open tickets. Docs stay deferred to SGS-200.
