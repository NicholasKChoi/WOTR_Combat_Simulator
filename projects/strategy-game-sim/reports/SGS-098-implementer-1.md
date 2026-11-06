# SGS-098 implementer report 1

- Ticket: SGS-098. Branch `sgs-098-delete-failing-aoe4-acceptance`, tip `4ac6a6a68cf42c78b499c6252fecda968d9d5f6a`, base origin/main 9328355.
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-098-delete-failing-aoe4-acceptance
- Status: needs_review

## Files (all under acceptance/)
- Deleted: aoe4-simulate-api-house-lead-time.spec.ts, aoe4-simulate-api-timelines.spec.ts, aoe4-simulate-api-veterancy-conversion.spec.ts.
- aoe4-simulate-api-contract.spec.ts: loop header now `for (const name of ['goldRunOut'])` (only edit to a surviving test).
- aoe4-simulate-api-depletion-engine.spec.ts: removed 6 listed tests, the whole "prebuilt English build against the pre-depletion engine" describe, now-unused `english1tc` import, `perVillagerRate` helper (+ its comment); import line trimmed to `buildOrderFrom, postSimulate`.
- aoe4-simulate-api-edges.spec.ts: removed the villager-only result-shape test.
- aoe4-simulate-api-house-warnings.spec.ts: removed the knight/longbow test and the `knightLongbow` import.
- aoe4-simulate-api-markers.spec.ts: removed the truncated-horizon research test.
- aoe4-simulate-api-spear-longbow-build.spec.ts: removed the 1200/3600 loop and the 1200 s gold test; removed `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS`, `MAN_AT_ARMS_START_SECONDS`, the comment above them, and the `steps` member of `Result`.
- aoe4-simulate-api-spend-population.spec.ts: removed 2 listed tests; import trimmed to `buildOrderFrom, postSimulate`.
- aoe4-simulate-api-triggers.spec.ts: removed the 2 listed tests plus `STARTED_AT` and its comment (used only by them). `english1tc` and `INFINITE_NODES` still used elsewhere in the file.
- acceptance/helpers.ts: removed `finalCount` and its comment (no remaining spec uses it; `git grep -w finalCount` now finds nothing). `INFINITE_NODES` and `buildOrderFrom` kept (still used by other specs).

## Counts
- Tests before (playwright --list on origin/main per ticket): 762 (734 pass + 28 fail). After: 734 in 47 files (was 50 files).
- Full `npm run acceptance` on branch: 734 passed, 0 failed, 0 flaky, none skipped.
- `npm test`: 48 files passed, 1511 passed, 10 skipped (pre-existing skips).
- `npx tsc --noEmit`: clean. `npm run lint:dup`: ran, no failure reported in the tail.
- `--list` shows "the goldRunOut request example returns the documented 200 body" and "at 3600 s each of the three gold deposits runs out...", and no "buildOrder request example" row.
- `git grep -nw` for the three spear/longbow constants under acceptance/: 0 matches. No `skip`/`fixme` in the diff. Added (+) lines: the loop header and two trimmed import lines only.
- Did not run `npx next build` (test-only change, no product code); the full-build stage is not reproduced.

## Pre-existing tests edited
Only the contract-spec loop header (ticket-permitted). No assertion or expected value changed.

## Doc claims
None added; no comments written.

## Mutation checks
Not applicable: no tests authored, only deleted.

## Invariant check
No product code, docs or data touched; no adjacent invariants.

## Deviations beyond the explicit list
- Deleted `finalCount` from helpers.ts (ticket's own rule: remove an export when no spec uses it; it was not in the "still used" list).
- Deleted unused `perVillagerRate` (depletion-engine) and `STARTED_AT` (triggers), per the unused-code rule.

## Out-of-scope findings
- `acceptance/helpers.ts` exports `Armies` and `AOE4_PAGE` with no importer outside helpers.ts (they are used inside it); untouched, pre-existing.
