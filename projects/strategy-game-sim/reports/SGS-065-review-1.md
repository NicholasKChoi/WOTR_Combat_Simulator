# SGS-065 review 1

Verdict: **APPROVE**

Branch `sgs-065-aoe4-knight-longbow-no-idle` (local only; not on origin at review time), tip
e927f74e077fab409c4010d9a09e0ea7eae8cbd2, stacked on sgs-064 011755fc2b7804535ba6216b1b9337d13c917d6e
(which contains origin/main 3ff99c6). Reviewed `git diff 011755f..e927f74` (one commit, 6 files, +57/-15).
Commit author choinickolas@gmail.com. Node 24.22.2, ACCEPTANCE_PORT 3865.

## Blocking findings

None.

## Spec gaps

None blocking. Ticket wording defect: the AC `git grep -n "REACTION_COUNT" ... finds 0 after` cannot hold
literally, because Scope requires the new name `GOLD_REACTION_COUNT`, which contains that substring (2 hits).
`git grep -nw REACTION_COUNT` gives 0. Ticked on intent.

## Acceptance criteria

1. PASS. `"reaction"` count 6; step 62 (last) is `{trigger: depleted sheep, reaction, move all sheep -> farm}`.
2. PASS (see spec gap): `-w` grep 0; the 2 literal hits are `GOLD_REACTION_COUNT`, as Scope says.
3. PASS. Independent run via `simulateBuildOrder` at 1800 s and 3600 s: no `idle-arrival`, no `step-stuck`,
   0 waiting steps, 0 unstarted non-reaction steps; every `node-depleted` has `idleVillagers` 0
   (1800: gold, sheep, gold#2; 3600: plus gold#3..#5). Sheep reaction `startedAt` 997.8685357698769 =
   sheep `depletedAt` (armedAt same, completed 1002.87). New API test passes through the route.
4. PASS. 1200 s / 3600 s API tests now use `goldReactionSteps`; assertions otherwise unchanged; pass.
5. PASS. Per-build bar tests pass for all three builds; new `it.runIf(King)` 1800 s check in builds.test.ts.
6. PASS. Mutation (restored 011755f JSON, then reverted): builds.test.ts 1800 s test fails
   (`sheep: expected 4 to be +0`), simulate-house-warnings knight digest row fails, API 1800 s test fails
   (Expected 0, Received 4), API structure test fails, house-lead-time knight digest row fails.
7. PASS. "stalls at the cap" 0 hits in data/docs/README.md. README timings checked against the run:
   held warning step 24 (index 23) at 461.82 s = 7:42 for 21.24 s = 0:21 (1800 and 3600 s, one warning);
   farm blocks start 601.53 s (10:02), 840, 960, 1080 s; sheep 997.87 s = 16:38 (997.9 s); gold
   931.85 (15:32), 1477.30 (24:37), 2022.74 (33:43), 2568.19 (42:48), 3113.63 (51:54). All match.
8. PASS. `round-trips through the paste format` iterates every build with `toStrictEqual(build.steps)`,
   so it covers the sheep step; passes. No duplicate added (correct per ticket).
9. PASS. `tsc --noEmit` clean; jscpd 0 clones; vitest 1322 passed / 10 skipped; Playwright 579 passed;
   `next build` succeeds.
10. PASS. See invariants.

## Differential (sheep step removed vs shipped, 1800 s and 3600 s)

Top-level keys that differ: `gatherRates`, `floating`, `steps`, `warnings` only. `spawnedPopulation`,
`spent`, `depletions`, `populationCapReachedAt` (1302.8748761022916), markers etc. identical. In `steps`
every row other than the new index 62 is byte-identical. In `warnings` the only change is sheep
`node-depleted` `idleVillagers` 4 -> 0. Gold run-outs identical. So both digest re-pins
(simulate-house-warnings knight `69e8496d68bb2946 -> 46f521f50e92ca03`; house-lead-time spec knight
`steps`/`warnings` digests, with `cap`/`population`/`spent` unchanged) follow only from the added step.

## Invariants touched

- A1 holds: the change is a data step; no number in code.
- A2 holds: `spent` and the payment path unchanged (no spend in a move).
- A3 holds: tests assert exact equalities; repeated runs match.

## Bot reconciliation

`reviewBot.cli` empty; no bot run. No rulesFile.

## Non-blocking notes

- `lib/aoe4-build-order/simulate-house-warnings.test.ts:164` - convention - the added comment
  "The knight/longbow pin also covers its sheep run-out reaction..." explains the diff (why the pin moved)
  rather than a hidden constraint, and sits above the Spear/Longbow row, not the knight row it describes.
  Suggest dropping it (comment bar), or at least moving it beside the knight row.
- README "each has a `whenever <ref> runs out ...` reaction at the end of the list" is now qualified by
  the next sentence ("followed by one for the starting sheep"); accurate as a pair.

## Coverage

Files reviewed: all six in the diff; siblings compared: builds.test.ts existing runIf tests (lines 86-104,
`simulateTo` helper reused), the existing API spec tests (same `simulate` helper and Result type style),
docs/aoe4-build-order.md 878-886 (prebuilt-build bar statements still hold). REPO.md checklist: Every diff
(next build, page exercised via the acceptance page spec that pastes this build) and AoE4 build order
(no copied helper/constant; no engine rule change; no chart change). Combat/Starcraft/shared sections not
touched. Nothing unreviewed.
