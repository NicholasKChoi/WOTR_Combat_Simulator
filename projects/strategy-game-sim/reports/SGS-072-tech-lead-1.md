# SGS-072 tech-lead 1

Decision: NO BLOCKERS. Draft PR opened.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80 (draft). Base `main`, head `sgs-072-aoe4-pin-persistence-label` at dc301b1ae8eb0cde32c1fcaeb969f6a544201042. Pushed with no new commits, and the body was set through `gh api` PATCH.

## Merge risk
**medium** - adds a persisted browser-storage format (`StoredPin` version 1) that later versions of the page must keep reading. It is backward-compatible, and a revert only leaves a key the old page ignores.

## Review focus
- `pages/apps/aoe4-build-order.tsx:110-133` - a stored pin whose re-run always answers 5xx (for example an engine error that repeats on the same inputs) is kept and POSTed again on every page load, and the user cannot clear it with Unpin because no pin is shown. Only pinning another run replaces it. Every load with a stored pin also costs one bounded simulation on the server. Check that keeping the key on 5xx is acceptable, versus dropping it after a failure.

## What I reviewed
- Range: origin/main c7ca461..dc301b1, 4 commits, 10 files, +595/-26 in total. Reviewable business logic is +161/-21 across the page, pin-storage.ts, pin-name.ts, compare-panel.tsx, results.tsx and build-input.tsx. The rest is tests and docs.
- Against: INVARIANTS (S1, S3, A1-A3), CONTEXT (no open questions), the ticket, and the implementer reports 1 and 2.
- Invariants:
  - S1 holds: imports stay inside the app.
  - S3 holds: the restore goes through `textToBuildOrder` (20000-character cap) and the route's input bounds.
  - A3 holds: "already pinned" is decided on inputs.
- Stored data: build text, name and duration. No personal data. The size is bounded by what the user saved, and the 20000-character cap applies on restore.
- Hydration: the restore runs in an effect after mount. There is no storage access during render, and an acceptance test checks for hydration warnings.
- Failure paths match the ticket: invalid value, conversion failure and 400 clear the key; network failure and 5xx keep it.
- Race: the `pinTouched` ref is checked both before and after `response.json()`, and tests cover a Pin and an Unpin made before a delayed restore.
- No API, schema or critical-path change.

## Non-blocking notes
- A stored pin that fails with 5xx every time is retried on every load forever, and Unpin cannot clear it because no pin is shown. Pinning another run, or clearing site data, is the only way out. Consider dropping it after one or more failed restores in a later ticket.
- In dev Strict Mode the restore POSTs twice: the effect runs twice and the cancelled flag drops the first response. Production is not affected.
- Pre-existing tests edited: none. The rework's retitle and strengthened step were in tests that this branch added.

## PR body as set
## Summary
The AoE4 build order page's pinned run now survives a reload and carries a name. Pinning stores the run's inputs (build text, duration, name; never the result) in `localStorage` under `aoe4-build-order.pinned-run`. After mount, the page reads that value and re-runs it through the same converter and simulate route as Run. The pin's label reads `Pinned: <name>, <m:ss>`. The name is set at Run time: the prebuilt build's name when the text matches one exactly, `<selected> (edited)` otherwise, and `Custom build` when no prebuilt builds exist. "Pin this run" is disabled while the shown run's text and duration equal the pin's. A shown result whose text or duration was edited after its Run gets a stale notice until the edit is reverted or the next Run.

Failure behavior:
- **Bad stored value** (invalid JSON, wrong version, wrong or missing field): the key is removed and no pin is shown.
- **Stored text no longer converts:** the key is removed and no request is sent.
- **Restore returns 400:** the key is removed. No pin and no error are shown.
- **Network failure or 5xx:** the key is kept. No pin and no error are shown, and the next load tries again.
- **Pin or Unpin clicked before the restore lands:** the user's action wins and the restore response is dropped.
- **Storage unavailable** (the getter or any method throws, private mode, quota): Run and Pin work in memory and nothing persists.

Non-goals:
- No sync across tabs (last write wins, no `storage` listener).
- The restore does not switch tabs.
- No route, API, OpenAPI or engine change.

## Merge risk
**medium** - adds a persisted browser-storage format (`StoredPin` version 1) that later versions of the page must keep reading. It is backward-compatible, and a revert only leaves a key the old page ignores.

## Review focus
- [`pages/apps/aoe4-build-order.tsx:110-133`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR110-R133) - a stored pin whose re-run always answers 5xx (for example an engine error that repeats on the same inputs) is kept and POSTed again on every page load, and the user cannot clear it with Unpin because no pin is shown. Only pinning another run replaces it. Every load with a stored pin also costs one bounded simulation on the server. Check that keeping the key on 5xx is acceptable, versus dropping it after a failure.

## Reviewer guide
Reviewable change: +161/-21 LoC (excluded: acceptance and unit tests, docs)
- [`pages/apps/aoe4-build-order.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188b) - a run snapshot (text, duration, name) replaces the stored result text, and a pin object replaces the pinned result. Also adds `alreadyPinned`, `stale`, the restore-on-load effect (runs after mount, so no hydration mismatch, with a cancelled flag for Strict Mode) and the `pinTouched` ref that lets a user Pin or Unpin win over a late restore. Run and the restore share one `postSimulation` helper. Verify that every failure path that clears the result also clears `run`.
- [`components/apps/aoe4-build-order/pin-storage.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-29e48296ceb062ecb9f4b5fc5f1b8aa67f185d23e974608707cd25ab8760a4be) - read, write and clear for the stored pin. A hand check covers the four flat fields (version 1, string name, string text, finite duration) and removes any invalid value. None of the three functions throws. The stored text gets no size check here: on restore it goes through `textToBuildOrder` (20000-character cap) and the route's input bounds, the same as pasted text.
- [`components/apps/aoe4-build-order/compare-panel.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-61680fa5df67fdcf5c518fcd1dd40b6e53c6b0f7814ac92bd21359984f966a75) - new `pinnedName` and `alreadyPinned` props. Adds the `pinned-label` span and disables `pin-run` when the shown run is already the pin.
- [`components/apps/aoe4-build-order/pin-name.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-9bec8d2335492a5b9a456ca42c7f01d191998e289850454d949b63f0701757ee) - the naming rule: exact text match to a prebuilt build, else `<selected> (edited)`, else `Custom build`.
- [`components/apps/aoe4-build-order/build-input.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-065b1092304163be85d5b9e16478ea2a2e7b50d83b38b32954341b0311467bc9) - the build select is now controlled (`selected` and `onSelectedChange`) so the page knows which prebuilt was selected at Run time.
- [`components/apps/aoe4-build-order/results.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/80/files#diff-52bb6320b9e8071b4d8a22dfe3afab52c78cd000cb29ebf1f3b422243765b64f) - new `stale` prop. When it is true, the `results-stale` notice shows above the charts.

Tests:
- Existing tests edited: none. Every pre-existing test keeps its code and expected values. The existing `pin-run` clicks in `aoe4-build-order-m3-flow.spec.ts` and `aoe4-build-order.spec.ts` still find the button enabled.
- New unit tests: `pin-storage.test.ts` checks write-then-read, the absent key, ignored extra fields, a 10-row table of invalid values that are dropped and removed, clear, and a throwing storage. `pin-name.test.ts` has 5 rows for the naming rule.
- New acceptance tests in `acceptance/aoe4-build-order-pin-compare.spec.ts`:
  - A reload keeps the pin and re-runs it with one POST, with no hydration warning.
  - The label names the prebuilt, marks an edit, and stays fixed after later select, text and Run changes.
  - A restored pin shows its stored name.
  - Pin is disabled while the shown run equals the pin.
  - The stale notice shows when the text or duration changes and clears on revert or Run.
  - Pin and Unpin write through to storage.
  - Bad stored values are dropped: invalid JSON, version 2, a missing field, a wrong-typed name, a null duration, oversized text, and a rejected duration.
  - A non-converting stored text is dropped without a request.
  - A 400 restore drops the stored pin and a 500 restore keeps it.
  - With `localStorage` unavailable, or with every method throwing, Run and Pin still work and nothing persists.
  - A Run that finishes before a delayed restore keeps its result.
  - A Pin or an Unpin made before the restore lands wins.

## Invariants and scope
- No change to the simulate route, its request or response, the OpenAPI spec, the engine or the data files.
- The restored pin uses the same converter and route caps as a pasted build, so a tampered storage value cannot reach the engine without bounds.
- "Already pinned" is decided on inputs (text and duration) because the same inputs always give the same result.
- New code imports only from this app's own `lib/` and `components/` folders.
- The stored value holds only build text, a name and a duration. It contains no personal data.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01TtL2k5ibgJmbvwcSBpZN7e
