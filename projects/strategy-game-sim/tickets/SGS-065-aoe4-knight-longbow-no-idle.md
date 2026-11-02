# SGS-065: Knight + longbow build has no idle villager through 1800 s

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.6
- **Priority**: medium
- **Risk**: standard
  <!-- Data and test change in one component; no public surface or critical path edit; adjacent to A1/A3 (data file, deterministic run). Not low: it restates numbers other tickets change and edits an API spec. -->
- **Invariants**: A1 (the fix is a build data step, no number in code), A3 (same build and data give the same timings; the 1800 s checks are exact-run assertions)
- **LOC estimate**: ~5 business-logic-equivalent (one reaction step in `data/aoe4-build-order/builds/english-knight-longbow.json`; README prose and test edits excluded)
- **Depends on**: SGS-062, SGS-064
- **On merge**: none
- **Source**: M4.6; `design/M4.md` "Build data (M4.6)", "Docs and OpenAPI" (M4.6 row); measured on origin/main (see Context)

## Context

On origin/main the knight + longbow build (`data/aoe4-build-order/builds/english-knight-longbow.json`) has five gold run-out reactions and none for the starting sheep. At 1800 s the sheep run out at 997.87 s (`node-depleted`, severity `warning`) with 4 villagers idle there. Measured in a throwaway worktree on origin/main at 1800 s: the base build has that one idle warning, no `idle-arrival` and no `step-stuck`; appending `whenever sheep runs out move all sheep to farm` (and the same with `wood`) gives sheep `idleVillagers` 0, no `idle-arrival`, no `step-stuck`, no unstarted non-reaction step, and the same gold run-outs (`gold` 931.85 s, `gold#2` 1477.30 s). M4.6 requires that to hold after SGS-062 (veterancy conversion) and SGS-064 (lead-window house planning) land, with the README restated.

## Scope

All paths are in the repo; the design leaves two choices to this ticket and they are fixed here.

**Build data (`data/aoe4-build-order/builds/english-knight-longbow.json`)**

- Append one step after the five gold reactions (the end of the list):
  `{ "trigger": { "kind": "depleted", "node": "sheep" }, "reaction": true, "action": "move", "count": "all", "from": "sheep", "to": "farm" }`, which pastes as `whenever sheep runs out move all sheep to farm`. Target decision: `farm`. Reason: the sheep gatherers are food gatherers and the build's farms (every later farm block) are the food economy; both `farm` and `wood` measured with no idle on origin/main, so this is a choice, not a fix. The build then has 6 reactions: the five gold reactions in node order, then sheep.
- Keep the three explicit pre-palace `build house` steps (the ones between the second `build archery-range` and `rally kings-palace`). Dropping them moves the gold run-outs and every README timing for no required gain; after SGS-064 they are no longer needed to avoid a stall, and the README says so (below).
- If, after SGS-062 and SGS-064, the check below fails with the farm reaction (an `idle-arrival`, a non-zero `idleVillagers` on a run-out at or before 1800 s, or a `step-stuck`), stop and report the failing node and instant instead of adding steps: the design fixes the remedy at a sheep reaction.

**API spec (`acceptance/aoe4-simulate-api-knight-longbow-build.spec.ts`)**

- `REACTION_COUNT` (2 lines today: declaration and use) asserts the five gold reactions are the last five steps. With a sixth reaction it fails. Replace it with a gold count (`GOLD_REACTION_COUNT = GOLD_NODES.length`) and make the test assert: the last six steps are all reactions, the five before the last are the gold reactions in `GOLD_NODES` order, and the last is the sheep reaction (`from: 'sheep'`, `to: 'farm'`).
- Derive `reactionSteps` for the 1200 s and 3600 s tests from the gold reactions only (filter on `from` in `GOLD_NODES`), because the sheep reaction runs at 997.87 s and the 1200 s test asserts `later` reactions are `not-reached`. Their assertions stay as they are for gold.
- Add a test at `durationSeconds: 1800`: no warning with code `idle-arrival`, no `step-stuck`, no step `waiting`, every `node-depleted` warning whose node has `depletedAt <= 1800` has `idleVillagers` 0 (this includes `sheep`, `gold`, `gold#2`), and the sheep reaction step's `startedAt` equals the sheep `depletedAt`.

**Unit test (`lib/aoe4-build-order/builds.test.ts`)**

- The per-build bar tests (1200 s and 3600 s) stay and must pass with the new step. Add, for the knight + longbow build only (`it.runIf(build.name.includes('King'))`, like the blacksmith test), the same 1800 s check as above through `simulateBuildOrder`, and one that the paste round trip keeps the sheep reaction (the existing paste round-trip test covers it if it iterates every build; check, do not duplicate).

**README (`data/aoe4-build-order/README.md`, the `english-knight-longbow` entry, lines 75-96 on origin/main)**

- Rewrite the sentence at lines 81-83 ("Three houses are built before the King's Palace: auto-houses count the palace's supply as soon as it is under construction, so without them population stalls at the cap until the palace completes."). After SGS-064 that reason is false. State only what is true: three explicit houses are built before the King's Palace, and the build keeps them. Do not claim they prevent a stall.
- Add the sheep reaction: the sheep run out at the time measured on the final code, a reaction at the end of the list moves all sheep gatherers to farms, and no villager is idle through 1800 s. Fix "each has a `whenever <ref> runs out ...` reaction at the end of the list" to say the gold reactions are followed by the sheep one.
- Restate every number in the entry against the final code at default inputs: gold run-out times at 3600 s (15:32, 24:37, 33:43, 42:48, 51:54 on origin/main; SGS-064 may move them), the 10:02 farm-block start, and any other timing. Add the 1800 s tier counts from the final code (the design expects `longbowman-3` 66 at 1800 s after SGS-062) only if the entry quotes counts after this edit; do not invent a count it did not have. The implementer lists every number changed and the measurement run.
- `docs/aoe4-build-order.md` line 843 names builds only; no edit expected. Grep `docs/`, `README.md` and `data/aoe4-build-order/README.md` for "knight", "sheep" and "pre-palace" and fix any sentence the change contradicts.

**Out of scope:** dropping the three pre-palace houses; any engine, schema, OpenAPI or UI change; adding or changing reactions for other builds; the SGS-062 and SGS-064 work itself.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `git grep -c '"reaction"' -- data/aoe4-build-order/builds/english-knight-longbow.json` gives 5 today and 6 after; the sixth is the last step, with `trigger.node` `sheep`, `from` `sheep`, `to` `farm`.
- [ ] `git grep -n "REACTION_COUNT" -- acceptance lib docs` finds 2 lines today (both in `aoe4-simulate-api-knight-longbow-build.spec.ts`) and 0 after the change.
- [ ] Through `POST /api/aoe4-build-order/simulate` at `durationSeconds: 1800`, on the final code: no `idle-arrival` warning, no `step-stuck`, no waiting step, and `idleVillagers` 0 on every `node-depleted` whose `depletedAt <= 1800`; the sheep reaction's `startedAt` equals the sheep `depletedAt`. On origin/main without the sheep reaction the sheep `node-depleted` has `idleVillagers` 4, so the test fails on the old build.
- [ ] The five gold reactions keep their 1200 s and 3600 s assertions: at 1200 s only the first gold reaction ran and the later four are `not-reached` with `waitingOn: 'trigger'`; at 3600 s each starts at its deposit run-out instant.
- [ ] `builds.test.ts` per-build bar tests pass for all three builds, and the knight + longbow 1800 s check is in `builds.test.ts`.
- [ ] Mutation check: deleting the sheep reaction from the knight + longbow JSON makes the new 1800 s API test and the new `builds.test.ts` 1800 s test fail (sheep `idleVillagers` 4 on the base). The tests are new, so the implementer runs it in a throwaway worktree.
- [ ] `git grep -n "stalls at the cap" -- data docs README.md` finds 1 line today (`data/aoe4-build-order/README.md` 83) and 0 after; the README entry states the sheep reaction and its `farm` target, and every timing in it matches a run of the final code (the report lists each).
- [ ] The build's paste text round-trips: `formatBuildOrderText` then `parseBuildOrderText` returns the same `steps` including the sheep reaction.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` pass; the report lists every test edited and why.
- [ ] No INVARIANTS.md regressions

## Open questions

None. The design's two choices are fixed above: sheep target `farm`, pre-palace houses kept (README reason reworded). Both are build-data judgments the design assigned to this ticket; flag to the owner only if they prefer `wood` or dropping the houses.
