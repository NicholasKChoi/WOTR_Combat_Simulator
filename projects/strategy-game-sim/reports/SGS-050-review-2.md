# SGS-050 review 2 (rework 1)

Branch `sgs-050-aoe4-build-spear-longbow-maa-crossbow`, tip 501d2977a9baa3a97f5df5dee3bfa610d0a228c8, base 835aceb. The branch exists locally only and is not yet on origin. I reviewed it in my own detached worktree `worktrees/review-sgs-050`, which I have since removed. I did not modify the implementer worktree. This is a full re-review: all 4 changed files, plus the rework delta 9a8d2ef..501d297. The tip merges cleanly with main b5c68d2 (`git merge-tree`).

## Verdict: APPROVE

## Blocking findings

None.

## Required fixes (rework 1): verified

1. **Step order: fixed.**
   - The paste text now reads `22: @9:20 rally TC -> gold`, `23: @11:21 produce man-at-arms from barracks`, `24: produce crossbowman from archery-range`, `25: @12:40 rally TC -> farm`, then the three reactions.
   - Measured at 1200 s and at 3600 s:
     - Man-at-arms and crossbowman both have `armedAt` 681 and `startedAt` 681. Castle is reached at 680.311.
     - Spearman and longbowman steps complete at 681.
     - Gold run-outs: `gold` at 1218.396, `gold#2` at 1943.989, `gold#3` at 2669.581. `gold#4` and the others never run out.
     - Counts at 1200 s: spearman 10, longbowman 9, man-at-arms 34, crossbowman 22, villager 79.
     - Counts at 3600 s: spearman 10, longbowman 9, man-at-arms 46, crossbowman 30.
   - **The trigger now decides the start.** With the trigger deleted, man-at-arms starts at 568.58, before Castle. With the trigger set to 600, it starts at 605.16. In both cases the shape test fails.
2. **README: fixed.**
   - `data/aoe4-build-order/README.md:64-73` matches the measured build:
     - the trigger sentence (681 s against the Palace completing at 680.3 s);
     - "they start at 681 s and replace the spearman and longbowman orders, which stop there", which holds: those steps complete at 681 and their counts stay 10/9 through 3600 s;
     - the TC gold rally spans 130-200 s and 560-760 s, steps 8/9 and 22/25;
     - run-outs at 1218, 1944 and 2670 s;
     - three reactions, with `gold#4` not reached.
   - The entry quotes no unit counts.
3. **Shape test: fixed.**
   - `builds.test.ts:126-131` asserts three things: the man-at-arms time trigger is at or after Castle's `reachedAt`; `armedAt` equals the trigger seconds; `startedAt` is at least Castle's `reachedAt`.
   - The `?? Infinity` and `?? -1` fallbacks fail in the right direction. A missing trigger makes the first two assertions fail.
   - The test now uses `inputsFor` from `test-helpers.ts`, which addresses the review-1 note.

## Mutations (re-run by me on the tip, each restored with `git checkout` and verified clean)

| Mutation | Result |
|---|---|
| Rally `@12:40` moved back before man-at-arms (old order) | shape test fails: `expected 760 to be 681` (armedAt) |
| Man-at-arms trigger deleted | shape test fails: `568.58 >= 680.31` |
| Trigger set to 600 | shape test fails: `605.16 >= 680.31` |
| `produce man-at-arms` moved before `build kings-palace` | shape test fails: `expected 20 to be greater than 21` |
| `build kings-palace` removed | shape test fails; bar parts 1-3 and the gold-warning test fail at both horizons |
| First reaction (`gold`) removed | 3600 s gold bar fails at part 4 (`gold: expected false to be true`). Review 1 measured the part-5 severity `warning` on the previous tip, and the implementer measured it on this tip. |
| Last run-out reaction (`gold#3`) removed | 3600 s gold bar fails at part 4 (`gold#3`) |

## Spec gaps

None.

## Acceptance criteria

- **PASS, file and listing.** `listBuilds()` gives `['ENG 1TC', 'ENG Spear/Longbow into MAA/Crossbow']`. `git grep` finds 2 lines (the `builds.ts:3` import and `README.md:59`). `ls builds | wc -l` prints 2.
- **PASS, validates and round-trips.** The `validates` and paste round-trip tests pass for this build. The text has 3 `whenever ... runs out move all ...` lines, one per reaction.
- **PASS, prebuilt bar at 1200 s and 3600 s.**
  - Parametrized tests pass.
  - By hand: no `waiting` step, and every non-reaction step has started.
  - At 1200 s the 3 reactions are `not-reached` with `waitingOn: 'trigger'`.
  - At 3600 s the only warnings are 3 `node-depleted` with severity `info` and 0 idle villagers.
- **Part 4 non-vacuous: substance PASS, left unticked.** `gold` runs out at 1218.40, and every run-out deposit has its reaction starting at `depletedAt`. The PR body that must list these does not exist yet.
- **PASS, shape test.** See above.
- **Mutations: substance PASS, left unticked.** I ran all of them (table above). The criterion also requires the PR to state that each was run, and there is no PR yet.
- **PASS, no changed defaults.** `git diff --stat 835aceb -- rules aoe4world english-1tc.json` is empty.
- **PASS, README and docs.**
  - The README entry is accurate, and the paragraph above it uses the bar wording.
  - `docs/aoe4-build-order.md` is unchanged and names only ENG 1TC's reaction. The new build contradicts nothing in it.
- **PASS, gates (Node 24.22.2).**
  - `npm test`: 37 files, 997 passed, 2 skipped.
  - `npx tsc --noEmit`: clean.
  - `npm run lint:dup`: 0 clones.
  - `npm run acceptance` (port 3893): 522 passed.
  - `npx next build`: compiled successfully.
- **PASS, determinism.** Two runs at 1200 s and two at 3600 s gave identical JSON, `warnings` included.
- **PASS, no invariant regressions.**

I ticked all criteria except "Part 4 non-vacuous" and "Mutations", because each also requires PR-body content that does not exist yet. The manager or PR author should make sure the PR body lists:
- the three `depletedAt` values: 1218.40, 1943.99, 2669.58;
- that the file has 3 reactions;
- each mutation run.

## Invariants touched

- **A1 holds.** The code change is one import and one array entry. The only hard-coded number is the build-order `time` trigger, which the ticket allows.
- **A2 holds.** The engine is unchanged, and no step is `waiting`.
- **A3 holds.** Repeated runs are identical.
- **S1-S3, W\*, H\*:** not touched.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot was run.

## Review checklist (REPO.md)

- **Every diff.**
  - `next build` succeeds.
  - I ran `next dev` on port 3894 and stopped it afterwards. I confirmed the port is free and no process is left running.
  - `/apps/aoe4-build-order` lists both builds.
  - POSTing the build to `/api/aoe4-build-order/simulate` at 3600 s returns ages 1, 2 and 3 (Castle at 680.31), step 23 with `armedAt` and `startedAt` 681, and three `node-depleted` warnings with severity `info`.
- **AoE4 build order.**
  - No helper, constant or tolerance is copied: the test now uses `inputsFor`.
  - No engine rule changed.
  - No doc sentence is contradicted.
  - There are no chart changes.

## Non-blocking notes

- `data/aoe4-build-order/README.md:70` is 135 characters, while the rest of the entry wraps at about 110. Other lines in the file are long too (`:8`, `:12`), so this is cosmetic only.
- `builds.test.ts:129` asserts on the build data (the trigger is at or after Castle) as well as the simulation. It can still fail for a real reason (the trigger set too early), and the `startedAt` assertion also catches that, so it is acceptable.

## Coverage

- **Reviewed:** all 4 changed files (the build JSON, `builds.ts`, `builds.test.ts`, the README entry), plus `test-helpers.ts` exports. I ran a throwaway probe of the paste text and per-step timings at both horizons, and removed it before the gates.
- **Not reviewed:** I did not load the page at 1280 px, because there are no chart changes.
