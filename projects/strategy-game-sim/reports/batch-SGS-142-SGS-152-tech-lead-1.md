# Tech-lead gate: batch SGS-142 to SGS-152 (lane, Milestone none)

## Decision
**PASS - PRs opened.** No blockers and no untested hotspots. Five draft PRs, each based on `main` (lane tasks, no stacking).

## Opened PRs

| Task | Branch | Tip | PR | Base | Merge risk |
|------|--------|-----|----|------|------------|
| SGS-142 | sgs-142-replace-named-missing-key-conflict | eb03b95 | #153 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/153 | main | medium |
| SGS-143 | sgs-143-run-bar-focus-ring-height | d698acf | #154 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/154 | main | low |
| SGS-146 | sgs-146-chart-reorder-same-render | 16cbce6 | #155 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/155 | main | low |
| SGS-148 | sgs-148-islinehidden-pinned-prefix | f56d939 | #156 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/156 | main | low |
| SGS-152 | sgs-152-docs-pinned-color-blob-importers | 5f8a404 | #157 https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/157 | main | low |

Branches were not on origin before this gate; pushed with explicit refspecs, no new commits. Bodies set with `gh api -X PATCH` (gh pr edit is broken here). All PRs confirmed draft with base `main`.

### #153 (SGS-142)
## Merge risk
**medium** - changes the status the public named-builds PUT route answers for a build deleted mid-update (503 to 412), backward-compatible with the documented contract, and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/blob-build-store.ts:26-33`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/153/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR26-R33) and [`:122-131`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/153/files#diff-8983ebf0bbbd836e2f0138a9c6ca563aa1f654536775f0d33bd73e759486423dR122-R131) - if `headNotFound` treated any `head` failure as absent, a Blob outage during an update would be reported to the user as "someone else changed this build" instead of a storage error, and the client would discard or reload over an edit that could have been retried - check that only `BlobNotFoundError` from `head` yields `conflict` and that the original put error, not the head error, is rethrown - pinned by [`blob-build-store.test.ts`: maps an unrecognized put error when %s after one head of the key](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/153/files#diff-6375c5c56e9e5cc963070a4329abb7ed759574425ad034b72088afc40a8d3ce4R259-R274) and [`blob-lost-writes.acceptance.test.ts`: PUT a named build deleted before the write when put raises a plain BlobError](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/153/files#diff-9ea8ad94c8ad8f8a008227998d84e2c77428af1db2e38ce1896d99baadd4b549R199-R219)

Body also carries two Preview checks (the ticket's two unverified assumptions) and the note that the owner should rerun `npm run test:blob-live` after merge.

### #154 (SGS-143)
## Merge risk
**low** - a revert fully undoes it, it touches no public surface or critical path, and acceptance tests pin both behaviors.

## Review focus
No hotspots: a one-line CSS padding and the removal of a `Math.ceil`, both pinned by acceptance tests in real Chromium.

Body carries two Preview checks for the ticket's unverified browser-scroll assumptions.

### #155 (SGS-146)
## Merge risk
**low** - a revert fully undoes it, it touches no public surface or critical path, and unit and acceptance tests pin the changed behavior.

## Review focus
No hotspots: client-only reorder logic with no persistence format change; the position math is a pure helper pinned by unit tests and the mid-drag key rule by an acceptance test.

### #156 (SGS-148)
## Merge risk
**low** - a revert fully undoes it, it touches no public surface or critical path, and unit tests pin the lookup.

## Review focus
No hotspots: a signature narrowing with three call sites, all updated, and the type checker covers the TypeScript callers.

### #157 (SGS-152)
## Merge risk
**low** - a revert fully undoes it and it changes documentation only.

## Review focus
No hotspots: documentation-only change.

Body notes the textual conflict with #153 in the ARCHITECTURE.md saved-build storage row: merge #153 first, then rebase and keep both edits.

## What I reviewed
- Base origin/main 41b3ed3. Per-branch diffs `origin/main...<branch>`, each containing only its own task's commits (SGS-142 has 2 commits, the others 1). All commits authored as choinickolas@gmail.com.
- SGS-142: 5 files, +69/-19 (logic +13/-2 in blob-build-store.ts, ARCHITECTURE.md +1/-1, rest tests).
- SGS-143: 3 files, +55/-1 (logic +2/-1).
- SGS-146: 7 files, +79/-14 (logic +31/-13).
- SGS-148: 4 files, +15/-10 (logic +5/-5).
- SGS-152: 2 docs files, +4/-3.
- Checked INVARIANTS.md (A1-A3 not touched: no engine, data or timing code changed; S1-S3 unaffected), the criticalPaths list (no hunk in any listed symbol), gate reports simplify-1 (no trims) and suite-1 (PASS on scratch merge, 2512 tests passed).
- SGS-142 route mapping confirmed by the acceptance test: `conflict` answers 412 `CHANGED`; an outage with head failing still answers 503 and logs the put error, not the head error.
- SGS-148: grepped every `isLineHidden` caller; all three pass a plain series key, and pinned lines keep `pinned:<key>` as dataKey.
- SGS-146: `sessionActive` is set on pointer down (before the 4px threshold) and cleared in `finish`, matching the doc's new sentence.

## Blockers
None.

## Non-blocking notes
- SGS-146: the `latest` ref composition inside `useChartLayout` is not pinned directly (no component test setup; the ticket accepted the pure `moveChartByKey` helper as the test seam). A regression to reading `state.layout` in the hook would not fail a unit test. Low risk; client-only.
- SGS-142: the ticket text says the route answers "409"; the route and tests use 412 for `conflict`. The PR body states 412, which is the actual behavior.
- SGS-142/SGS-152 ARCHITECTURE.md conflict: merge #153 first, rebase #157, keep #153's `replaceNamed` sentence and #157's importer sentence (suite-1 scratch resolution did the same).
- The main checkout is on `debug/named-build-412-diagnostics` (commit c1d337f "DEBUG ... do not merge"); unrelated to this batch, untouched.
