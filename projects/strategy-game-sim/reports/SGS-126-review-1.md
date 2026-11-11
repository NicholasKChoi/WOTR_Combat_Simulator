# SGS-126 review 1

Verdict: APPROVE. Branch sgs-126-pin-compare-fixture, tip b7b1e78, diff against merge-base 086951e.

## Blocking findings
None.

## Acceptance criteria
- Target test passes: pass on the implementer's record (39/39 in the spec). I did not run acceptance, per the gate rules. unverified by me.
- No `runOk` before `pin`; asserts `build-order-text` `toHaveValue(DEFAULT_PASTE)`, pins, then `runOk({ text: NO_MILITARY_PASTE })`: pass (diff lines 151-156). The remaining `runOk` changes the text, so it posts.
- `only.length > 0` precondition kept: pass. It is untouched context after the edit.
- Mutation checks 1 to 3: implementer recorded all three, each failing at the expected assertion (`border-top-style` received solid; final `toHaveCount(0)` received 1; precondition received 0). Not re-run by me.
- Only the one spec changes, only the one test: pass (1 file, 2 insertions and 2 deletions). No helpers.ts or components changes.
- Invariants: none touched, test-only change.

## Linter
- The repo has no eslint config (`npx eslint` fails with "couldn't find eslint.config.*"), and package.json has only `lint:dup`. The implementer recorded `tsc --noEmit` clean and jscpd with 0 clones. I did not re-run them.

## Bot
Not run: I did not check whether REPO.md sets `reviewBot.cli`. No bot findings to reconcile.

## Conventions and correctness
- The edit matches sibling tests in the file: it uses the same `runOk` and `pin` helpers and the same `getByTestId` style (e.g. the `NO_MILITARY_PASTE` calls at the nearby tests).
- No doc or comment claims were added.
- The `toHaveValue` assertion checks the changed state. The default text must equal `DEFAULT_PASTE`, so it fails if the loaded default drifts.

## Non-blocking notes
- origin/main has moved to 14639c0 (chart collapse and reorder). The `chart-units-produced` test ids may be affected, so re-run this spec after the rebase. The implementer flagged the same risk.
- The ticket expects the spec to be run only once for verification. Rebase verification belongs to the PR stage.

## Coverage
Reviewed the full diff, the ticket, the implementer report, and the surrounding spec helpers. Not run: acceptance, UI inspection (no UI diff), the review bot.
