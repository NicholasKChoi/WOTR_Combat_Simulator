# SGS-050 implementer 2 (rework 1)

- Ticket: SGS-050, rework 1 (review-1 required fixes only).
- Branch: `sgs-050-aoe4-build-spear-longbow-maa-crossbow`, tip `501d2977a9baa3a97f5df5dee3bfa610d0a228c8` (one commit on top of 9a8d2ef; still on base 835aceb, not rebased).
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-050-aoe4-build-spear-longbow-maa-crossbow

## Required fixes

- [x] Moved `produce man-at-arms` (`@11:21`) and `produce crossbowman` to just before the `@12:40 rally capital-town-center -> farm` step (now step indexes 23, 24; the rally is 25). No other step changed.
- [x] README entry: the trigger sentence now says the two steps sit before the 12:40 rally so step order does not hold them back, start at 681 s, and replace the spearman/longbowman orders (which stop there); the rally span is "130 s to 200 s and from 560 s to 760 s, so no producer is rallied to gold at a run-out". Run-out times are unchanged and stay as quoted. The entry quotes no unit counts.
- [x] Shape test: added assertions that the man-at-arms `time` trigger is at or after Castle's `reachedAt`, that the step's `armedAt` equals the trigger seconds (fails if any earlier step holds it back, e.g. moving it after the 760 s rally), and that its `startedAt` is at or after Castle's `reachedAt`. Also switched the test to `inputsFor` from `test-helpers.ts` (review non-blocking note).

## Files touched

- `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json`: rally step moved after the two transition steps.
- `data/aoe4-build-order/README.md`: build entry transcription text corrected.
- `lib/aoe4-build-order/builds.test.ts`: shape test pins trigger-arming and Castle start; uses `inputsFor`.

## Measured results of the corrected build (default inputs, Node 24.22.2)

- Ages: Feudal 379 s, Castle 680.31 s.
- man-at-arms and crossbowman: `armedAt` 681, `startedAt` 681. Spearman and longbowman steps complete at 681.
- Counts at 1200 s: spearman 10, longbowman 9, man-at-arms 34, crossbowman 22, villager 79. At 3600 s: 10, 9, 46, 30, villager 98.
- Gold run-outs (3600 s): `gold` 1218.40, `gold#2` 1943.99, `gold#3` 2669.58; `gold#4` none. None by 1200 s. Three reactions in the file, each `startedAt === depletedAt`.
- Warnings at 3600 s: three `node-depleted`, severity `info`, 0 idle villagers. None at 1200 s.
- Determinism: two runs at 1200 s and at 3600 s serialize identically (warnings included).

## Tests

- `builds.test.ts`: 20 passed, 2 skipped.
- `npm test`: 37 files, 997 passed, 2 skipped.
- Pre-existing tests edited: none.

## Mutation checks (each on the corrected file, restored from a scratch copy, verified with `cmp`)

1. Move the two transition steps back after the 760 s rally: shape test fails (`expected 760 to be 681`, the armedAt assertion).
2. Delete the man-at-arms trigger: shape test fails (man-at-arms starts 568.58 < palace completion 680.31).
3. Move `produce man-at-arms` before `build kings-palace`: shape test fails.
4. Remove `build kings-palace`: shape test fails, plus bar parts 1-3 and gold-warning tests at both horizons.
5. Remove the first deposit reaction (`gold`): 3600 s gold bar test fails at part 4 (`gold: expected false to be true`); measured separately, a `node-depleted` severity-`warning` on `gold` (part 5).
6. Remove the last run-out deposit reaction (`gold#3`): 3600 s gold bar test fails at part 4 (`gold#3`); separately a severity-`warning` on `gold#3`.

## Gates

- codegen: not set.
- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.
- `npm run acceptance`: 522 passed.
- `npx next build`: not re-run this pass (data/test/README change only; review ran it on the previous tip).
- `git diff --stat 835aceb -- data/aoe4-build-order/rules data/aoe4-build-order/aoe4world data/aoe4-build-order/builds/english-1tc.json`: empty.
- No process left running; scratch test folder removed before commit.

## Invariants

- A1: holds; the only hard-coded number is the build-order trigger the ticket allows.
- A2: holds; no `waiting` step at either horizon.
- A3: holds; repeated runs equal.

## Out-of-scope findings

None.

## Status

`needs_review`
