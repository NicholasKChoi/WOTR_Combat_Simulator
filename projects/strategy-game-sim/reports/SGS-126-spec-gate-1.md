# SGS-126 spec gate 1

**Verdict: NEEDS_SPEC** (one small gap; everything else checks out)

## Gaps

1. Scope, pinned-run setup - the ticket says to "pin the default paste at the long duration the compare-table test already uses (`1200`)" and mentions `runOk` calls. `INPUT_DEFAULTS.durationSeconds` is 1200 (`lib/aoe4-build-order/schema.ts`, asserted in `schema.test.ts:961`), and `openPage` waits for the auto-run at the default build and default duration to be `current`. So `runOk(page, { duration: 1200 })` or `{ duration: 1200, text: DEFAULT_PASTE }` right after `openPage` changes nothing and posts no POST; `waitForRun` would time out. The compare-table test avoids this only because it changes the text to `NO_MILITARY_PASTE` first. An implementer following the ticket literally would guess wrong. Also unconfirmed: that `listBuilds()[0]` (the `DEFAULT_PASTE`) equals the text the page loads with. Proposed fix: state that the test pins the loaded run directly after `openPage` (`await openPage(page); await pin(page)`, no `runOk` for the pin), after confirming the loaded text equals `DEFAULT_PASTE`; otherwise pin after a `runOk` that really changes text or duration. Then `await runOk(page, { text: NO_MILITARY_PASTE })` makes the current run (the duration stays 1200). Drop the "current run's duration changes only if the harness needs it" wording.

## Checks passed

- Grounding: spec test at `acceptance/aoe4-build-order-pin-compare.spec.ts:152-169`, `legendItems` and `isLineHidden` in `chart-rows.ts`, `DEFAULT_PASTE`, `NO_MILITARY_PASTE`, `runOk`, `pin`, `path` all exist on `origin/main`. `sgs-118-acceptance-test-debt` branch exists.
- Criteria are observable; the mutation checks map to real assertions (`border-top-style`, final `toHaveCount(0)`, precondition). No stale pinned numbers.
- Invariants, contracts, dependencies, size, diagrams, On merge (`none`), Risk (low, test-only), Docs, input validation: no issues. Open questions: none.

## Notes

- The compare-table test (line 174) relies on the default build's military spend being non-zero at 1200 s; the implementer should still confirm that the default build produces a unit absent from `start -> sheep` at 1200 s (the stated precondition assert covers this).
