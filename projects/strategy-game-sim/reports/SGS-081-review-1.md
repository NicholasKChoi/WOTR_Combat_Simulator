# SGS-081 review 1: REQUEST CHANGES

Branch `sgs-081-aoe4-retune-prebuilt-farms` at 70aa21a, diff against `sgs-080-aoe4-one-villager-per-farm` (c8cca5f; the
branch sits on that tip). Two commits, 11 files. The branch is not on origin, so I reviewed it from the local ref.

## Blocking findings

1. `data/aoe4-build-order/README.md:97-100` (knight/longbow entry) together with
   `data/aoe4-build-order/builds/english-knight-longbow.json` steps 31-40. Category: contract (text).
   The diff edits the sentence "Farms are added in blocks of four at 10:00, 14:00, 16:00 and 18:00 (`time` 600, 840,
   960 and 1080)", but the code no longer adds the 10:00 block at 10:00. The diff puts the `time 563` group (steps
   31-34) before the third stable (step 37), which moves the stable's start to 628.6 s, and puts the `time 634` pair
   (steps 38-39) ahead of the `time 600` block (step 40). The 10:00 block now arms at 645.5 s (when step 39 starts)
   and starts at 655.4 s. On the SGS-080 base it armed and started at 600/601.5 s. So the `time 600` trigger never
   decides anything, and in the paste text an `@10:00` step comes after an `@10:34` step. The same entry already
   explains a delay like this for the 5:30 rally ("waits behind the 5:15 farm block, so it fires after 5:30"), so a
   reader takes "at 10:00" as when the farms go down.
   Direction (text only, no re-pin needed): replace "Farms are added in blocks of four at 10:00, 14:00, 16:00 and
   18:00 (`time` 600, 840, 960 and 1080), each built by wood gatherers who farm them, and in smaller groups of
   wood-and-return farms at `time` 563 (four), 634 (two), 722 (one) and 942 (four). Every farm step feeds food." with:
   "Farms are added in blocks of four at 10:00, 14:00, 16:00 and 18:00 (`time` 600, 840, 960 and 1080), each built by
   wood gatherers who farm them; the 10:00 block sits after the third stable and the 10:34 pair in the list, so it
   waits for both of them to start. Smaller groups of wood-and-return farms come at `time` 563 (four), 634 (two), 722
   (one) and 942 (four)."
   Alternative: reorder the data so the triggers read in time order, by moving steps 38-39 after step 43. I tried
   this: `builds.test.ts` still passes (39 passed). The block would still arm only once the stable starts, at about
   628 s, and the house-lead-time and house-warnings digests would need re-deriving. If you take this route, the
   README must still not claim 10:00 unless the block actually starts then.

## Spec gaps

None. One wording conflict, settled by Scope: AC3 says "with the 681 s trigger", while Scope says to change the
value only if the "reaches Castle" case fails. It does fail. On the SGS-080 base the build already reached Castle at
772.3 s against the 681 s trigger, and on this branch it reaches Castle at 756.435 s. So 757 is the derived value (the
whole second after the King's Palace completes), not a loosening. The README criterion already allows for this ("681 s
trigger unless Scope changed it").

## Acceptance criteria

Not ticked, because the verdict is REQUEST CHANGES. Each one checked:

- PASS. No `farm-idle` at 1200/1800/3600 s for all three builds: the new `it.each` in `builds.test.ts:76-78` passes.
  The implementer reports the mutation (760 s rally back to farm fails it). The case uses `simulateTo` and filters
  on the code, so it can fail.
- PASS. Existing per-build cases are unchanged in meaning: `builds.test.ts` has only the 4 added lines, and all of
  its cases pass.
- PASS. Spear rallies: the 200, 380 and 760 s TC rallies, the King's Palace rally and the `gold#3` reaction now go
  to `wood`. One `build farm` was added (step 8, sheep then sheep), for 30 steps in total (the report says 29). There
  is no `idle-arrival` or `step-stuck` through 1800 s: at 1200 s the warnings are `[]`, and at 1800 s the only one is
  an info `node-depleted` for gold. Castle is reached at 756.4 s, so before 1200 s. `man-at-arms` arms at 757 and
  starts at 767.6, which is at or after Castle. The 681 s wording is covered under Spec gaps.
- PASS. Reactions find farms: knight's sheep reaction starts at 997.9 s, after the 942 s group completes at
  953-958 s. Spear's `gold#3` reaction now moves to wood, so the criterion is vacuous there. There is no
  `farm-idle` at 3600 s.
- PASS. Round-trip and validates cases pass.
- PASS. Re-pins are derived, not loosened. Every edited pin is still an exact `toBe`/`toEqual` (the `toBeCloseTo`
  in the spear spec was already there), and each new value matches what the stacked engine outputs (suite green).
  The knight `held` object (step 23, 461.819) is unchanged and matches the run. The `i < 21 || i > 23` filter still
  targets the three pre-palace houses (steps 21-23 are houses). The rewritten spear 1200 s test is not looser: it
  goes from "only gold has run out at 1114.09, and one info warning" to "no gold deposit has run out (all
  `depletedAt` null), and `warnings` is `[]`". That is still an exact pin of the new output. I confirmed the first
  gold run-out moved to 1322.95 s, so it falls outside 1200 s. `warnings: []` is stricter than before, since it also
  shuts out `farm-idle`, `idle-arrival` and house warnings. See notes for the coverage it drops.
- PASS. SGS-080's failing shipped-build assertions now pass: the full unit and acceptance suites are green.
- FAIL as written until finding 1 is fixed. The README grep for `[0-9]+\.[0-9]+ s` prints 0, no simulated instant
  is quoted, and the inputs (757 s, 4:00/5:00/6:00, reaction counts, 1TC Omitted times) are still there. But the
  knight farm block sentence the diff edits is contradicted by the data for the 10:00 block.
- PASS (the knight half depends on finding 1). The opening paragraph has the farm rule and the `farm-idle` bar. The
  knight block times (600/840/960/1080) and group times (563/634/722/942, with counts 4/2/1/4) match the JSON triggers.
- PASS. `docs/aoe4-build-order.md:968` has the `farm-idle` sentence.
- PASS. Diff stat: the three JSONs (1TC untouched), README, docs, `builds.test.ts`, and five pinning test files, all
  listed in the implementer report. No non-test file under `lib/aoe4-build-order/` changes.
- PASS. Gates I ran myself: `npx tsc --noEmit` OK, `npm run lint:dup` reports 0 clones, `npm test` gives 1346 passed
  and 10 skipped, `npx playwright test acceptance/aoe4-` gives 497 passed, and `npx next build` is OK.
- PASS. No invariant regressions (see the next section).

## Invariants touched

- A1: holds. Data-only change, no literals in code. Every new number is a non-negative integer in the build JSON.
- A2: holds. No step is `waiting` at 1200/3600 s, and every non-reaction step starts by 1200 s (cases pass). The
  farm steps are paid like any build.
- A3: holds. The hard-coded `man-at-arms` trigger was re-checked and moved to 757, the whole second after Castle
  (756.435). The diff adds nothing nondeterministic. The ordering of steps 31-40 is a documentation issue
  (finding 1), not nondeterminism.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty. No bot ran.

## Non-blocking notes

- `english-spear-longbow-maa-crossbow.json` step 14 (`@260 rally capital-town-center to wood`) is now a no-op,
  because step 10 at 200 s already rallies to wood. The ticket forbids changing non-farm steps, so I left it. A
  maintainer may ask about it. A README sentence could say the 260 s rally is kept from the source order.
- The spear spec's 1200 s test no longer pins the first gold run-out time, and no remaining test pins any
  spear gold `depletedAt` (the 3600 s test only checks not-null). If that coverage matters, add an exact pin at
  1800 s (`gold` at 1322.9532256509663, from this run).
- The knight README sentence "Every farm step feeds food." is filler. Drop it, which the text in finding 1 already
  does. The same goes for "; it feeds food" in the spear Farms paragraph (`README.md:80`).
- Line wrapping: `docs/aoe4-build-order.md:968` is about 170 characters and leaves "ENG 1TC" alone on line 969.
  `README.md:45` also runs past the roughly 105-column wrap of its neighbours. It renders the same. Reflow if you
  are already editing.
- Castle in the spear build moves from the SGS-080 base's 772 s to 756 s on this branch. Against main's pre-080
  681 s it is later, because wood replaces the farm rallies. The bars hold, and the ticket rules out economic
  optimization.
- The knight README claim "The groups are placed ahead of the villagers sent to farm by the Town Center rally ... and
  by the sheep reaction, so each of them finds a built farm" holds as an outcome: there is no `farm-idle` at any
  horizon, and the 942 s group completes before the sheep reaction at 997.9 s. The implementer did not check it group
  by group, and neither did I beyond that.
- The implementer report gives the spear step count as 29. It is 30.

## Coverage

- Reviewed: every file in the diff. I ran all three builds on the branch and the knight and spear builds from the
  SGS-080 base, at 1200/1800/3600 s, and compared step arm/start/complete times, ages, depletions and warnings
  (scratch probe test, deleted). I also tried the step 38-39 reorder (reverted).
- Ran: tsc, lint:dup, npm test, the aoe4 acceptance specs (497), and next build. My first acceptance attempt with a
  symlinked `node_modules` failed in next dev (ENOENT build-manifest). It passed after a real `npm ci`. That was an
  environment issue, not a code issue.
- REPO.md checklist: "Every diff" next build was run. The touched page loads through the aoe4 UI acceptance specs,
  which pass; I did not click through `npm run dev` by hand. In the AoE4 section, no helper was copied, the docs bar
  sentence matches the code, and no UI changed, so no screenshots were needed.
- Node is v22 (the harness expects 24). Everything still ran.
