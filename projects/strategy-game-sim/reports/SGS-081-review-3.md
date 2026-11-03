# SGS-081 review 3

Verdict: **REQUEST CHANGES**

Reviewed `2fc9593..f0fe3d6` in full against the current Scope and Acceptance criteria (respec 7). Detached worktree
`worktrees/review-sgs-081-r3` at local tip `f0fe3d6`, which is not yet pushed: `origin/sgs-081-aoe4-retune-prebuilt-farms`
is still at `2fc9593`. Base is the SGS-080 tip `c8cca5f`.

## Blocking findings

1. `data/aoe4-build-order/README.md:91-92` - contract (text) - The new sentence says "every farmer gets a farm of its
   own from a `build farm` step that takes a wood gatherer and puts it on the new farm". The file contradicts this.
   Steps 4-8 (`mill`, three farms `from: sheep, then: farm`, and a fourth farm `from: sheep, then: sheep`) take sheep
   gatherers, not wood gatherers. Why it matters: it is a doc sentence the diff adds that the build file contradicts.
   Direction: replace "Farms: every farmer gets a farm of its own from a `build farm` step that takes a wood gatherer
   and puts it on the new farm, so no rally sends a villager to `farm` and the Town Center and King's Palace keep
   sending new villagers to wood (and the Town Center, at the times above, to gold)." with:
   "Farms: every farmer gets a farm of its own from a `build farm` step. The mill builder and the three farm builders
   at the mill come from sheep, and a fourth `build farm` step from sheep (returning to sheep) gives the mill builder a
   farm; every later `build farm` step takes a wood gatherer and puts it on the new farm. No rally sends a villager to
   `farm`, so the Town Center and King's Palace keep sending new villagers to wood (and the Town Center, at the times
   above, to gold)."

2. `data/aoe4-build-order/README.md:85-86` - contract (text) - "The Town Center rallies to gold from 130 s to 200 s
   and from 560 s to 700 s, and to wood otherwise." The build's `start.rally` is `sheep`, and the first rally to wood
   is step 2 at `time` 20, so from 0 to 20 s the Town Center rallies to sheep, not wood. The "and to wood otherwise"
   clause is new in this diff. Direction: replace with "The Town Center rallies to sheep until 20 s, to gold from 130 s
   to 200 s and from 560 s to 700 s, and to wood otherwise."

3. `data/aoe4-build-order/README.md:100-102` - contract (text) - The sentence reads "the `produce` steps at 790 s (a
   `produce` step orders only buildings that exist when it starts, so they come after the buildings finish) give them
   men-at-arms and crossbowmen by `instance`". The parenthetical gives the rule for a step that names a building by
   `baseId`. Steps 50-56 name an `instance`, and an instance-scoped step waits while its instance does not exist
   (`docs/aoe4-build-order.md:190-191`, "It waits while no targeted instance exists"), so it cannot miss a building
   finished later. The 790 trigger also does not place the steps after the buildings: four of the seven targeted
   instances (barracks 6 and ranges 4 to 6) are not yet built at 790 s. The steps actually start at 862-895 s because
   earlier steps in the list hold them. A maintainer who reads the current text would think the trigger is what makes
   the steps cover the buildings. Direction: replace "At 700 s four more barracks and three more ranges are built from
   wood, and the `produce` steps at 790 s (a `produce` step orders only buildings that exist when it starts, so they
   come after the buildings finish) give them men-at-arms and crossbowmen by `instance`." with "At 700 s four more
   barracks and three more ranges are built from wood, and the `produce` steps at 790 s give them men-at-arms and
   crossbowmen by `instance` (a step that names an instance waits until that instance is built)."

4. `acceptance/aoe4-simulate-api-triggers.spec.ts:444-449` - test - The test is named "keeps every step start time of
   the infinite-node run", but `ownSteps` compares only `steps.slice(0, STARTED_AT.length)`, which is the first 24
   steps. Before the rebuild that was every non-reaction step. After it, the 16 added steps (indexes 24-39) are not
   compared between the finite and infinite runs, so the name now claims a check the assertions do not make. The diff
   edited this test (lines 448-449) without widening the comparison. `toHaveLength(english1tc.steps.length)` also
   replaced `STARTED_AT.length + 1`, which pinned "exactly one step after the pinned ones". The new form is close to
   always true, because the result has one entry per step. Direction: compare every non-reaction step and keep the 24
   pinned values, for example `const ownSteps = (r: typeof finite) => r.steps.slice(0, -1).map((s) => s.startedAt)`.
   The vitest twin (`simulate-triggers.test.ts:278-287`, `infinite.slice(0, -1)` vs `shipped.slice(0, -1)` at 3600 s)
   already passes this comparison on the same engine, so the fix will pass.

## Spec gaps

None that block. One note for the manager, outside this gate's verdict: Scope 4 deleted the spear/longbow
"through 1800 s no villager arrives at an empty resource or is stuck" test, saying its bars duplicate
`builds.test.ts`. They do not. The `idle-arrival`/`step-stuck` case in `builds.test.ts:128` is `runIf(King)` only.
Acceptance criterion 3 ("no `idle-arrival` or `step-stuck` warning through 1800 s" for spear/longbow) therefore has
no automated test now. I checked it by hand: it passes (see below).

## Focus points from the manager

- **spend-population re-pin: legitimate, not a weakening.** The default `durationSeconds` is 1200
  (`lib/aoe4-build-order/schema.ts:55`). At 1200 s the rebuilt 1TC reaches the 200 population cap
  (`populationCapReachedAt` 1123.51 s). That breaks the precondition of both tests: "is null while the cap is never
  reached" needs a run that stays under the cap, and "one unit ahead" needs every producer free to pay, which supply
  blocks. Moving both to 1000 s keeps the same exact assertions on a run that meets the precondition. The
  per-producer multiplier is the engine's real rule: each instance pays its next unit only once it has no paid unit
  left (`docs/aoe4-build-order.md:186-188`). The 1TC now has 3 barracks and 3 ranges, all finished by 605 s, and the
  baseId-wide `produce` steps 38/39 start at 640/663.8 s, after every instance exists, so each instance has a
  continuous order. With one barracks and one range the new formula reduces to the old one. The check is still exact
  equality (`toBe`), and the test name ("each continuous producer paid one unit ahead") now describes it more
  accurately than before.
- **Pins re-derived, no tolerance widened.** Every changed pin keeps its precision (`toBeCloseTo(..., 6)`/`9`, `toBe`,
  digests). I re-ran all of them on the tip: the 10 touched or index-dependent API specs gave 133 passed, and the full
  `acceptance/aoe4-*.spec.ts` suite gave 510 passed. The only weakened assertion I found is finding 4. Not a
  weakening, but noted: in `timelines.spec.ts:63` the appended `textiles` step now waits 0 s (it was 81 s) because
  the rebuilt bank is fuller. Four other pinned steps in that test still wait.
- **1TC frozen set.** I checked with a script over `2fc9593` and the tip. `steps.slice(0, 24)` deep-equals the old
  slice, and the other top-level fields (`civ`, `name`, `source`, `start`) are unchanged. The gold reaction is
  byte-identical, sits at index 40, and is the first `reaction: true` step. Indexes 24-39 (2 barracks, 2 ranges, 10
  farms from wood, `produce spearman`, `produce longbowman`) all carry `time` 420. No added step lacks a trigger.
- **README/design doc, choices not results.** `grep -cE '[0-9]+\.[0-9]+ s'` over the Prebuilt-builds section prints
  0, and no floor or cap number appears. The times quoted (681, 700, 790, 740/870/890/900, 210/320/380, 420) are all
  `time` trigger inputs in the files. The design-doc sentence (`docs/aoe4-build-order.md:968-969`) matches the
  `builds.test.ts` case.
- **Unit types at 3600 s** match the README for each build: 1TC villager, spearman, longbowman; spear/longbow
  villager, spearman, longbowman, man-at-arms, crossbowman; knight/longbow villager, knight, longbowman. Ages and
  landmarks are unchanged (spear: Council Hall to Feudal at 379 s, King's Palace to Castle at 680.31 s; 1TC: Abbey to
  Feudal at 262.57 s).

## Acceptance criteria (not ticked: verdict is REQUEST CHANGES)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `production-floors.ts` exact values; two importers; case shape; catches the 2fc9593 files | pass | File matches the table and 2000. `git grep -l production-floors -- lib acceptance` lists exactly the two files. The case uses `sampleIndex` once, `countAt`, `gatherRates.food[i]` and `floating.*[i]`. With the `2fc9593` build JSONs swapped in, the case fails for 1TC (spearman 36 < 39) and spear (villager 60 < 61) and passes for knight. |
| 2 | All three pass every per-build case | pass | `npm test`: 1349 passed, 10 skipped |
| 3 | Spear "reaches Castle" unchanged; no idle-arrival/step-stuck through 1800 s | pass | The case is unchanged and passes. Manual run at 1800 s: only `node-depleted gold` info, idle 0. No test covers the 1800 s part (see Spec gaps). |
| 4 | Plan kept; 1TC frozen slice; added steps triggered at 420 or later | pass | Script above; unit types listed above |
| 5 | Round-trip and validate | pass | Existing cases pass |
| 6 | Prebuilt-farms spec: loop kept, no `MAX_SPEAR_LONGBOW_STEPS`, one 1200 s floors case per build, lint:dup | pass | `git grep -c` prints nothing; 0 clones |
| 7 | Re-pins re-derived and listed | fail | Finding 4 (triggers spec comparison narrowed). The others pass. |
| 8 | README checks | fail | Findings 1-3. The regex check, no floor numbers, the spear wood-instead-of-farm text removed, the 1TC added-steps line, and the knight farm blocks (600/840/960/1080 x4 from wood to farm; 563x4, 634x2, 722x1, 942x4 wood-and-return; house step 24) all pass. |
| 9 | Design doc bar paragraph | pass | `docs/aoe4-build-order.md:968-969` |
| 10 | Report gives per-build 1200 s values | pass | Matches my run: spear food 1484.3, float 1281/1556/956/0; 1TC 755.5, 1691/1744/853/0; knight 1556.7, 1427/1460/98/0 |
| 11 | Diff stat scope | pass | Against `c8cca5f`: only the allowed files. `test-helpers.ts` is unchanged. |
| 12 | npm test, tsc, lint:dup, acceptance | pass | All run by me: tsc clean, 0 clones, 1349 passed, aoe4 acceptance 510 passed. `npx next build` also succeeds. |
| 13 | No invariant regressions | pass | See below |

## Invariants

- A1 holds. No game number in code. `production-floors.ts` holds test-only quality constants and nothing in the
  engine imports it.
- A2 holds. No step is `waiting` at 1200 s or 3600 s for any build, so every spend was paid when affordable.
- A3 holds. There is no engine change, and the hard-coded `man-at-arms` trigger (681) is at least the Castle instant
  (680.31) and `armedAt` equals 681.

## Lint

`npx tsc --noEmit` is clean and `npm run lint:dup` finds 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Non-blocking notes

- Two rebuilt builds reach the 200 population cap before 1200 s: 1TC at 1123.5 s and spear/longbow at 1168.2 s. The
  villager orders stay continuous, as Scope 1 requires, but supply stops production. 1TC villagers sit exactly on
  the floor (50 = 50), with no margin. Not a bar violation, and the floating cap is met, so this is not the needs_spec
  case Scope 2 describes. The owner may want to know.
- `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts:42` ("at 1200 s no gold deposit has run out") passes with
  `gold` running out at 1200.65 s, a 0.65 s margin. Any small retune will flip it.
- 1TC README "the second pair of `produce` steps sits after the buildings and covers them" (`README.md:70-72`). This
  holds in the run (the steps start at 640/663.8 s, and the last range finishes at 605.2 s), but list position does
  not guarantee it. It depends on the timing. The knight entry uses the same phrasing.
- Spear steps 10, 14 and 31 all rally the Town Center to wood with no other rally between them. This is redundant but
  pre-existing (old steps 10/14/20).
- `builds.test.ts:81` builds the unit list as `[['villager', ...], ...Object.entries(...)]`, while the spec
  (`prebuilt-farms.spec.ts:55`) uses `Object.entries({ villager, ...military })`. They are equivalent. Either one in
  both places would read better.

## Coverage

Reviewed: every file in `2fc9593..f0fe3d6` (3 build JSONs, README, design doc, `production-floors.ts`,
`builds.test.ts`, `simulate-house-warnings.test.ts`, `simulate-triggers.test.ts`, and the 7 acceptance specs). I also
read the unchanged knight file to compare it with the README. Ran: tsc, lint:dup, `npm test`, a scratch vitest probe
(removed) for per-step timings, warnings, ages and unit types, the floors case against the `2fc9593` build files, the
full `acceptance/aoe4-*.spec.ts` suite, and `npx next build`. There is no UI change, so no screenshots. The page
flows ran through the aoe4 page acceptance specs. REPO.md "Every diff" and "AoE4 build order" checklist sections
applied: no helper or tolerance was copied between `lib/aoe4-build-order/` modules, and the engine-rule doc check is
covered by finding 3.
