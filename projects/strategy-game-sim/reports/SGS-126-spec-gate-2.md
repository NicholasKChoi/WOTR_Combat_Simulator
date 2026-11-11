# SGS-126 spec gate 2

**Verdict: READY**

## Gap from gate 1: closed

Scope now pins the `openPage`-loaded run directly, after asserting the `build-order-text` field has value `DEFAULT_PASTE`. It makes no `runOk` before `pin`, then calls `runOk(page, { text: NO_MILITARY_PASTE })`. The text changes, so a POST is made.

I checked this against `origin/main`:

- `openPage` waits for the auto-run to be `current` at the default build and default duration, so a no-op `runOk` would time out. The ticket avoids that.
- `DEFAULT_PASTE = formatBuildOrderText(listBuilds()[0])` (spec line 11). Other tests already assert the loaded text equals it (spec line 442), and the new `toHaveValue(DEFAULT_PASTE)` assert in the ticket covers the rest.
- `NO_MILITARY_PASTE` is `'start -> sheep'` (spec line 12).
- The compare-table test (spec line 178) already runs `DEFAULT_PASTE` at 1200 s, which supports the pinned run having military units that the current run lacks.
- The existing test body is at spec lines 152-169. Its `only` computation, `runOk` and `pin` helpers, and the assertions after the precondition all exist as the ticket describes.

## Other checks

- Criteria are observable. The three mutation checks map to real assertions: the `border-top-style` dashed check, the final `toHaveCount(0)`, and the precondition or item count. No stale pinned numbers.
- Test-only change in one spec file, about 10 lines. Risk is low and Invariants is `none`. On merge is `none`. Open questions: none. Docs, diagrams and input validation do not apply.
- The re-spec does not conflict with the pending `sgs-118-acceptance-test-debt` branch, because the ticket limits edits to this test's body.

## Notes

- Criterion 2 ("no `runOk` call leaves both text and duration unchanged") is a property of the test and can be reviewed by reading it. No change needed.
