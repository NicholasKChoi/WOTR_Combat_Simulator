# SGS-195 implementer 3 (re-spec 1)

Ticket SGS-195, branch sgs-195-marker-control, new tip 0d9591b604af77cce6dedc4ee07f9a2e4696b028 (was d570df7), checkout $FACTORY_DIR/worktrees/sgs-195-marker-control. Committed locally, not pushed.

## Files touched
- acceptance/aoe4-chart-layout.spec.ts: in the first/last-chart arrow-key test, the handle is scrolled to the column centre, then scrollTop is capped at max-40 so room exists above and below whatever follows the last chart; added `expect(handle).toBeInViewport()`. Both precondition assertions and every post-key assertion unchanged.
- acceptance/aoe4-split-scroll.spec.ts: the heading-size query is `[data-testid="chart-table"] h3` instead of `h3`; `toHaveLength(1)` kept.

## Tests
- Playwright: aoe4-chart-layout + aoe4-split-scroll, 46 passed, 0 failed.
- Searched acceptance/ for `h3` and `scrollIntoView`: other hits are aoe4-marker-labels (rewritten, passes), step-band, step-annotations, helpers; acceptance-test run 1 already ran those green on d570df7 and they were not touched.
- `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones.
- Unit/build not rerun: only spec files changed.

## Mutation check
- Dropped the `[data-testid="chart-table"]` scope (aoe4-split-scroll.spec.ts heading query): test failed on `Expected length: 1, Received length: 2 ["22.5px","18px"]`. Restored; test passes.
- Layout fix not mutated separately: its precondition assertions are unchanged and passed for the last chart (the failure from run 1).

## Pre-existing tests edited
Both specs above, as the ticket's re-spec 1 scope allows; no assertion removed or loosened.

## Other
Doc claims: none added. Unverified assumptions: none. Out-of-scope findings: none. No processes left running.

Status: needs_review
