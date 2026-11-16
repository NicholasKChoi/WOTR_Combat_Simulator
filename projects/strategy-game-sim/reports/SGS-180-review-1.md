# SGS-180 review 1

Verdict: APPROVE. Tip f4d0c1b1db92b14d0d4d3453600217aaefad7e25, base main.

## Blocking findings
None.

## Acceptance criteria
1. Pass. grep of the three files finds no showTab, TABS_VIEWPORT, SPLIT_MIN_WIDTH, NARROW, workbench-tabs, tab-build, tab-results, aria-selected or tablist. `npx tsc --noEmit` passes (run in scratch).
2. Pass. Deleted cases are absent from split-layout and split-scroll (diff read); typecheck clean. I ran no spec (review rule), and rely on the implementer's per-file green record (1/1, 15/15, 4/4).
3. Pass. Every setViewportSize in the three files uses SPLIT_VIEWPORT, WIDE_VIEWPORT, SHORT_VIEWPORT (1280x720), or MIN_SUPPORTED_VIEWPORT (focus-ring case, helpers.ts:187, 1200x800).
4. Pass. split-layout keeps sideBySide, editorTopInside and lastGoodTopInside in one poll, plus scrollWidth <= SPLIT_VIEWPORT.width. The headings case keeps the firstElementChild checks and the sizes.build === sizes.results and charts length 1 assertions. Matches the implementer's mapping.
5. Pass. results-split keeps the wide and split rows with the units/results >= 0.95 poll; the wide-row sideways-scroll poll is untouched in the diff.
6. Pass. Removed showTab calls are followed by toBeVisible/toHaveCount reads (openResults: chart-units-produced visible; "no steps" case: chart visible then toHaveCount(0)). openLongBuild already waits on the run response.
7. Pass for lint:dup (0 clones, run here) and tsc. The acceptance runs are the implementer's record, unverified by me by design. `npm test` is unaffected (acceptance-only diff).
8. No invariants touched (no lib/ files in diff).

## Spec gaps
None.

## Conventions and correctness
Imports in all three files are all still used (counted each name). The kept `scrollWidth` helper in split-layout is still used. Renames match the ticket's intent. The headings case dedent keeps every assertion. No new tests added, so no test-quality findings. Doc claims: none added.

## Bot reconciliation
No reviewBot configured.

## Non-blocking notes
Pre-existing unused locals in other spec files (reported by the implementer) are out of scope.

## Coverage
Reviewed the full diff of the three spec files and aoe4-split-layout.spec.ts in full. No UI inspection (no UI code changed). Review checklist: REPO.md has no checklist section; not a blocker.
