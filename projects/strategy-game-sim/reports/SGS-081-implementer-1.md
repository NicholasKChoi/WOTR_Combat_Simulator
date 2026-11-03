# SGS-081 implementer 1: needs_spec

Branch `sgs-081-aoe4-retune-prebuilt-farms` (stacked on `sgs-080-aoe4-one-villager-per-farm` at `c8cca5f`), tip `e9571c3` (WIP commit, partial), worktree `$FACTORY_DIR/worktrees/sgs-081-aoe4-retune-prebuilt-farms`.

## Status: needs_spec

The spear/longbow build cannot meet the bars by farm steps alone.

### Evidence (spear/longbow, `english-spear-longbow-maa-crossbow.json`)
- On the 080 engine it produces about 146 villagers by 3600 s (`unitsProduced`), and the rallies to `farm` at 200 s, 380 s, the King's Palace and 760 s send nearly all of them to `farm` until the population cap (about 2176 s). The final `warnings` shows `farm-idle` with `idleVillagers` 141 (cumulative arrivals with no free farm).
- Meeting "every villager sent to farm finds a built farm" needs roughly 90 extra `build farm` steps (110 steps total; the schema cap is 200). I generated them with an iterating script that inserts farm blocks ahead of each first-idle instant, which reaches zero `farm-idle` at 1200, 1800 and 3600 s.
- That result breaks existing bars. The farms are paid from wood, and the build cannot afford them in time:
  - "starts every non-reaction step by 1200 s": 12 farm steps are still not started at 1200 s (a farm block placed 90 s ahead of need; later blocks placed closer to need fail identically, and farm steps pushed to 2299 s fail it too).
  - "reaches Castle" fails with an earlier lead: Castle is not reached by 1200 s (`ages` = [1, 2]). With the later placement, Castle is reached but the `man-at-arms` 681 s trigger needs about 709 s or later, and 1200 s start bar still fails.
- The tension: the "every non-reaction step has started by 1200 s" bar forces all farms for villagers that arrive up to 2176 s to be bought before 1200 s, which also conflicts with the ticket's tuning guideline and with the wood budget.
- Scope 1 also assumes the farm steps are the only change. One further point: the spear build's `mill ... then farm` builder is a farmer with no farm of its own, so one extra farm step whose builder returns to its source (`then` not `farm`) is needed; the ticket's "farm steps only" wording does not say the builder's `then` may differ.

### Decision needed
Choose one: (a) allow the rally-to-farm steps of the spear build to be changed or removed (for example stop the 760 s rally to farm and send later villagers to another node), (b) relax the "all steps started by 1200 s" bar for time-triggered farm blocks of that build, or (c) drop the spear build's one-farm-per-farmer requirement. The generated candidate (lead 90 s) is kept at `/tmp/s81/spear-tuned-lead90.json` (not committed; /tmp may be cleared).

## What is committed on the branch (partial)
- `lib/aoe4-build-order/builds.test.ts`: new per-build `it.each([1200, 1800, 3600])` case "leaves no villager waiting for a farm by %i s" asserting no `farm-idle` warning.
- `data/aoe4-build-order/builds/english-knight-longbow.json`: 11 added `build farm` steps (from wood, then wood) in four groups with time triggers 563, 634, 722, 942 s, placed before the step whose start follows the trigger. With them, the knight/longbow build passes every per-build case including the new one.
- `english-1tc.json`: no change needed; it already has no `farm-idle` at the three horizons.
- Not done: spear/longbow build, README, `docs/aoe4-build-order.md`, re-pinning of other tests (Scope 3), full-suite runs, lint, build. Knight/longbow README block times and the "step 24" house reference are therefore not updated yet.

## Tests run
`npx vitest run lib/aoe4-build-order/builds.test.ts`: with only the knight change, 4 failed (the three spear `farm-idle` cases and "reaches Castle", which is the failure 080 already listed), 35 passed, 10 skipped. No pre-existing test edited.

## Mutation check
The new case fails on the unmodified spear and knight builds (before the knight change: 6 of its cases failed), so it can fail for the right reason. No other mutations were made.

## Other
- Environment: Node v22.17.0 (the acceptance harness note says Node 24.x); `npm ci` run in the worktree. No processes left running.
- Committed message and files carry no ticket ids.
