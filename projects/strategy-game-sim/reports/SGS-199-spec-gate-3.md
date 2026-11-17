# SGS-199 spec gate 3

Ticket: tickets/SGS-199-page-help-modal.md (re-spec 2). Code read at origin/main after `git fetch origin`; Depends-on tickets (SGS-193, SGS-197, SGS-198) read as ticket files. No scratch checkout used.

**Verdict: READY**

Both gate-2 gaps are closed:
- The existing-test rule and the "Existing tests" criterion now cover any page-wide locator or `querySelectorAll` count, set or size comparison. The `h3` font-size set in `acceptance/aoe4-split-scroll.spec.ts` (lines 172 and 176) is named as an example, along with scoping it to exclude `help-modal`.
- The Section 5 drag-handle and caret terms now remove the title with one adjacent space, or compare whitespace-normalized and case-insensitive. The caret verb is read from live state, and the section must hold `collapse` or `expand`.

## Checks this pass

- Every legend site in the ticket exists at base: `build-text-editor.tsx:70`, `step-table.tsx:313`, `step-annotation.tsx:27`, `step-annotation.test.ts:157` and `:179`, and the four acceptance specs (`aoe4-compact-view`, `aoe4-step-annotations`, `aoe4-results-split`, `aoe4-build-order-knight-longbow-page`). The ticket gives these as examples and tells the implementer to search again.
- `.warn, tbody > tr > td.warn` exists in `step-annotation.module.css`, and Scope already handles the specificity of a swatch outside a `td`.
- `<h1>` sits inside `.pageSection` before `BuildInput` in `pages/apps/aoe4-build-order.tsx` (lines 333-335), so the heading-row change is grounded.
- I searched `acceptance/aoe4-*.spec.ts` for other page-wide dependents of the new always-in-DOM dialog and the new Tab stop. None breaks.
  - Tab-order walks (`aoe4-split-tab-order`, `aoe4-marker-labels`, `aoe4-my-builds`, `aoe4-build-order-step-band`) all start from a focused element, not the page top.
  - No spec uses `getByRole('dialog')`, `locator('h1')` on this page, or a page-wide `button` count.
  - The remaining page-wide `querySelectorAll` calls are scoped by `data-testid`, so the dialog does not join them.
- Dependency names match their tickets: `chart-zoom-reset`, `chart-upgrade-dot` and `chart-pinned-upgrade-dot` match SGS-197 and SGS-198. The `still waiting for <what>` tail matches SGS-193.
- Risk (low), Invariants, Unverified assumptions, On merge (`none`), Diagrams, docs deferred to SGS-200 (the doc statements are named there) and size (about 120 LOC) all hold. No overlap with an open ticket, and no open question.

## Notes (non-blocking)

- SGS-193 also defines a `still waiting on <cause>` fallback for a step with no `waitingFor`. SGS-199's Section 4 criterion asserts the literal `still waiting for` on a live `step-blocked-by`. The spec must build the waiting step so it has a `waitingFor`; the ticket's wording ("names what it waited for") already implies this.
- SGS-193 is still `needs_spec` (Q133 open), and its tail wording may change. SGS-199 reads the tail from the live page and asserts only the `still waiting for` prefix, so any reword of the tail needs a re-check here. Dependency ordering already holds.
- The Section 5 rows for the series legend heading (`Series`) and marker heading (`Markers`) hold trivially because ordinary prose contains those words. They are harmless.
- The heading row adds height above the run bar. No existing spec I found asserts an exact page offset, but the implementer should watch `aoe4-min-width` and the run-bar height specs when running the suite.
