# SGS-184 review 2 (delta, rework 1)

Verdict: **APPROVE**

Branch sgs-184-one-desktop-layout-width-floor, tip 9b06cb95dcdd1a35c54ace13e17528c307321f97. Delta reviewed: `git diff 09023924..HEAD` (one commit, 9b06cb9, two acceptance spec files only; no production code changed).

## Blocking findings

None.

## Spec gaps

None.

## Rework 1 Required fixes

1. `aoe4-min-width.spec.ts`: landed. The resize loop (lines 82-90) is now inside `expectNoRun` (`acceptance/helpers.ts:227`). That helper registers the request listener before the action and waits `AUTO_RUN_DEBOUNCE_MS + 500` after it (helpers.ts:235), so a debounced run started by the last resize falls inside the window. Both 1280x800 literals are now `SPLIT_VIEWPORT` (lines 70 and 85). The hand-rolled listener, the `posts` array, and the now-unused `isSimulatePost` import are gone. No 1280 literal remains in the file. Pass.
2. `aoe4-split-layout.spec.ts`: landed. `holdNextSimulate` is registered before `goto` (line 83). The test asserts status is not `current` before reading `before` (line 87), the column lookups use `?.` and return null (lines 75-81), and both lefts are asserted non-null (line 89). It releases through `waitForRun(page, async () => release())`, which registers the response wait first, then the before/after comparison runs. While the route is held, no simulate response can land, so `before` is always read before any result. The case can now fail:
   - The Results column is mounted only once a result exists: `before` has a null, line 89 fails. The implementer recorded this mutation failing at that assertion.
   - The column shifts after the result: the `toEqual(before)` comparison fails.
   - The release-before-request ordering is safe: the gate is a resolved promise, so a later request passes at once (helpers.ts:202-212).
   Pass.

The change touches nothing outside these two cases: the diff has no other hunks.

## Acceptance criteria

The delta changes no criterion tagged `(rework 1)` except the two Required fixes above, and both pass. The other criteria stand as passed in review 1 at 09023924, because the production code is unchanged since then.

## Test files across the branch

`git diff origin/main...HEAD` on test paths:
- `acceptance/aoe4-min-width.spec.ts`, `acceptance/aoe4-split-layout.spec.ts`, `acceptance/helpers.ts`, `step-annotation.test.ts`, `workbench-tabs.test.ts`.
- Only the two specs changed since 09023924. The rest are as approved in review 1.
- No test was deleted or weakened in this rework.

## Invariants touched

None in the delta (test-only change).

## Lint

`npx tsc --noEmit && npm run lint:dup` in the scratch: tsc clean, jscpd 0 clones across 160 files.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty. Skipped.

## UI inspection

Skipped: delta mode, and the delta changes no UI.

## Non-blocking notes

None.

## Coverage

- Reviewed: the full delta 09023924..9b06cb9, `acceptance/helpers.ts:186-240` (`SPLIT_VIEWPORT`, `holdRequests`, `holdNextSimulate`, `waitForRun`, `expectNoRun`), the sibling use of `holdNextSimulate` in `acceptance/aoe4-auto-run-contract.spec.ts:39-56`, and implementer report 2.
- Acceptance tests were not run, per the gate rules.
