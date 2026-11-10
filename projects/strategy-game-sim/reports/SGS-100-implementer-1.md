# SGS-100 implementer report 1

## Ticket, branch, tip, worktree

- Ticket: SGS-100 (risk high)
- Branch: `sgs-100-auto-run-controller`, based on origin/main `1e6d6c2`
- Tip: `77f1a6c5d2ab26250986409315192e08c61656cb`
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-100-auto-run-controller`
- Does not depend on SGS-099. The repo-root checkout was not touched.

## Files touched

- `components/apps/aoe4-build-order/auto-run.ts` (new, 247 lines): a framework-free controller with debounce, held/release, fire rules 1 to 5, abort and seq staleness, retry and dispose, plus `durationError`, `requestKey` and `AUTO_RUN_DEBOUNCE_MS`.
- `components/apps/aoe4-build-order/simulate-client.ts` (new, 27 lines): `postSimulation(buildOrder, durationSeconds, signal?)`, `readRejection(response)` and `simulationFailureMessage(status)`.
- `pages/apps/aoe4-build-order.tsx` (edited): the local `postSimulation` is removed. The page imports the client, and `errorMessages` uses `readRejection` and `simulationFailureMessage`. The page behaves as before.
- `components/apps/aoe4-build-order/auto-run.test.ts` (new): 71 tests.
- `components/apps/aoe4-build-order/simulate-client.test.ts` (new): 13 tests.

Diff against base: 5 files, 990 insertions and 22 deletions. Nothing else changed: no lockfile, no docs, no stray files.

## Tests

`npx vitest run` on the two new files: 84 passed, 0 failed. The full suite (`npm test`) passed: 50 files, 1595 passed, 10 skipped.

Invariants the tests encode:
- **S3, only valid requests are posted.**
  - Invalid text or duration takes rule 1: no post, any in-flight request is aborted, status `invalid`.
  - `durationError` rows cover blank input, non-integer input, below min, above max, the bounds themselves and whitespace.
- **A3, determinism.** The controller uses no `Date.now` and no randomness. The tests run on fake timers, and staleness comes from a sequence counter, not from wall-clock time.
- **Debounce.** It waits 500 ms after the last `input`, and every `input` restarts the timer. `flush` fires at once and clears the timer (checked with `getTimerCount` 0). While held, nothing fires until `release`. `release` when not held is a no-op, tested with a pending input.
- **Rule 1** (invalid): aborts the in-flight request, sets `invalid` and clears `rejectedKey`.
- **Rule 2** (same key as the in-flight request): no new post.
- **Rule 3** (same key as the shown result): aborts the other in-flight request, sets status `current`, clears `rejectedKey` and keeps `shown` when it is unchanged.
- **Rule 4** (same key as the rejected request): no post, and the server issues are kept.
- **Rule 5** (otherwise): aborts the previous request and posts with a new signal. Status is `running` with no result yet, `updating` when a result exists.
- **Rule order.** Rule 1 comes before rule 2, rule 2 comes before rule 5, and rule 3 aborts a request with a different key.
- **Superseded responses are dropped.** The check runs after `post` settles and again after the body read, for 200 and 400, whether the request was superseded by an edit or by dispose. `json` is never called on a stale response.
- **`shown` is the input captured when the request was posted,** not the input settled when the response arrives.
- **Outcomes.**
  - A readable 400 gives `rejected` with its issues and omitted count.
  - An unreadable 400, a 500, a network error or an AbortError that was not requested gives `failed` with the matching message, and the previous result is kept.
- **`retry`** only works when the status is `failed`.
- **`dispose`** aborts the in-flight request, clears the timer and turns every later call into a no-op.
- **simulate-client.**
  - `postSimulation`: URL, method, headers, body, signal passed or absent, and an aborted signal rejecting with an AbortError.
  - `readRejection`: a 7-row table covering a valid body, omitted count missing or not a number, non-JSON, null, empty issues, non-array issues and missing issues.
  - `simulationFailureMessage`: both message strings.

## Pre-existing tests edited

None.

## Doc claims

- `auto-run.ts:send`, comment: "Staleness is by seq, not by AbortError: a post that ignores its signal still resolves." This holds because `send` drops an outcome when `seq !== mine`, and `abortInflight` increments `seq`. The tests "superseded responses" use a stubbed post that ignores its signal and resolves anyway; that late response is dropped.
- No docs changed. ARCHITECTURE.md has no per-file entries for this app.

## Pinned outputs

None. The ticket did not ask for any engine output to be pinned.

## Mutation checks

A scratch script applied 43 mutants one at a time, ran both test files on each and restored the source after each run. All 43 were caught on the final run. Some examples:
- Removing the blank check.
- Letting `selected` leak into the key.
- `onChange` firing during create.
- Firing while held.
- A leading-edge fire, and a timer that does not restart.
- `flush` keeping the timer.
- `release` firing when not held.
- Rule 1, 3 or 4 not aborting or not clearing.
- Removing rule 2 or rule 4.
- Dropping either staleness check.
- Treating an AbortError as silent.
- A failure leaving `inflight` set.
- `retry` working in any status.
- `dispose` not aborting or keeping the timer.
- `input` working after dispose.
- An unreadable 400 treated as rejected.
- `shown` taken from the input settled at response time.
- Rule 5 always reporting `running`.
- A 400 or a failure clearing the result.
- A shared AbortController.
- Any status counting as a result.
- In simulate-client: the signal, URL, body and content type, the omitted-count default, empty, null and non-array issues, and both message strings.

The first run had survivors. Each was fixed by strengthening the test, or by removing code that turned out to be redundant: an extra `rejectedKey` clear in `apply`, and a `!disposed` check in `isLatest` that the seq bump already covers.

Equivalent mutants that no test can catch:
- Dropping `Number.isInteger` in `durationError`: `outOfRange` already rejects non-integers, because `durationSeconds` is integer-bounded in SIM_INPUT_BOUNDS.
- Writing the bounds in the message as literals (60 and 3600): the values are equal.

## Gates

- codegen: not set in REPO.md.
- `npx tsc --noEmit`: OK.
- `npx next build`: OK on Node v24.22.2, after `npm ci` in the worktree.
- Lint, `npm run lint:dup`: 0 clones.
- Unit, `npm test`: 1595 passed, 10 skipped, 0 failed.
- Acceptance, `npm run acceptance`: 734 passed, 0 failed (Playwright, chromium). The webServer stopped on its own after the run.
- Grep checks:
  - The two new modules use no react, next, window or document.
  - `function postSimulation` exists only in simulate-client.ts.
  - The page has no `fetch(`.

## Invariant check

- **S3 upheld.** A request is built only when the conversion is ok and `durationError` is null.
- **A3 upheld.** No clock and no randomness.
- **Page behaviour unchanged.** The page posts the same request and shows the same rejection and failure messages, including "N more issues not shown."

Two rule-order rows in the criteria cannot be reached through the public API:
- A key equal to both `inflightKey` and `resultRequestKey`.
- A key equal to both `resultRequestKey` and `rejectedKey`.

The reason: rule 5 never posts a key equal to `resultRequestKey`, because rule 3 catches it first. And a 200 or 400 clears `inflight` when it sets `resultRequestKey` or `rejectedKey`. The code checks the rules in the specified order, so those rows would resolve correctly. They are just not testable without internals.

## Out-of-scope findings

None.

## Status

needs_review
