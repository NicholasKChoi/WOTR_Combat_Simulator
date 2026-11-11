# SGS-117 implementer report 1

Ticket SGS-117, branch `sgs-117-unit-test-debt`, tip `afd034c`, worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-117-unit-test-debt`. Base origin/main b3da879. Status: needs_review.

## Files
- vitest.config.mts: `test.css` include `.module.css`, `non-scoped`.
- components/apps/aoe4-build-order/auto-run.ts: export `settledFields`, new export `initialAutoRunState`; controller initial state uses it.
- components/apps/aoe4-build-order/use-auto-run.ts: `firstPaintState` removed, uses `initialAutoRunState`; dropped `textToBuildOrder`/`durationError` imports; comment renamed.
- auto-run.test.ts: equal-input case asserts `history` length unchanged.
- saved-build-loader.test.ts: `stubFetch` passes `init` to `respond`; abort case uses a signal-aware stub, live signal gives `ok`, aborted gives `failed`.
- step-annotations.test.ts: new case, text equal and `selected` differs, `startedAt` 1/11/21 per row.
- lib/aoe4-build-order/simulate-house-gate.test.ts: new assertion `population(on,595) > population(off,595)` replaces the by-construction one; test renamed to "gives an order without build-house steps auto-houses at 120, 220 and 320 s"; `withHouses` uses shared `housesDone`.
- simulate-construction.test.ts: removed `housesDone` local and the `done.slice(0, 2)` assertion; the "stop at maxPopCap" test also uses the shared recorder (it had a third copy).
- test-helpers.ts: exported `housesDone`.
- data/aoe4-build-order/README.md: knight-longbow sentence.

## Tests
`npm test`: 63 files pass, 1973 passed, 13 skipped (baseline 1972 plus the new case). `npx tsc --noEmit` ok; `npm run lint:dup` 0 clones; `next build` ok. Codegen: none configured.

Pre-existing tests edited because of the CSS setting: none; the full suite passed unchanged after the config change. `step-annotation.test.ts` "keys the two tones to different class names" already asserts both keys are strings, non-empty and different, so with real class maps it fails for a missing key; not edited. Pre-existing tests edited otherwise: the equal-input case, the abort case and `stubFetch` (all per ticket), the house-gate and construction tests (per ticket).

## Mutation checks (each undone)
- Rename `.stale` to `.staleX` in step-annotation.module.css: `annotationToneClass > keys the two tones to different class names` fails with `expected 'undefined' to be 'string'` (also the two "stale" rows).
- Remove the `Object.is` guard in `update` (auto-run.ts): equal-input case fails, `expected [...] to have a length of 3 but got 4`.
- Drop `signal` from the fetch call in saved-build-loader.ts: abort case fails, `expected { status: 'ok', ... } to strictly equal { status: 'failed' }` (the signal-passing case fails too).
- Swap the `selected` check before the text check in `alignedRuns`: new case fails, `expected [ null, null, null ] to deeply equal [ 1, 11, 21 ]`.
- House gate: `off = lateHouse()` with other assertions of the case removed: `expected 65 to be greater than 65` at the new assertion. File restored from backup.

## Doc claims
README: "The groups are placed ahead of the villagers the sheep reaction sends to farm, so each of them finds a built farm." True: the only reaction sending villagers to farm is the sheep `move all sheep to farm` at the end of english-knight-longbow.json, after every farm group. `git grep "Town Center rally to farm" -- data` finds nothing.
Compared against the JSON and found true, unchanged: Feudal via `abbey-of-kings`, Castle via `build kings-palace`; rally to gold at 330 after the 315 farm pair; palace rally to wood; rally to wood after the palace and at 720; three stables, two archery ranges, second longbowman produce after the second range; explicit house blocks; farm blocks of four at 600/840/960/1080 (`then` farm, from wood); 563 four and 634 two (`then` wood); 740 one and 942 four (`then` farm); the 600 block after third stable and the 634 pair; blacksmith techs after the palace; veteran-longbowmen and Castle techs after `produce knight`; five gold deposits with reactions, `gold#5` to wood; the sheep reaction. No other line changed.

## Pinned outputs
None added.

## Invariants
No INVARIANTS touched; `initialAutoRunState` returns the same field values as before (`serverIssues` is the shared empty array via `CLEARED`, equal to the old `[]`).

## Notes
- I accidentally ran `git checkout` on auto-run.ts after a mutation, which reverted my uncommitted edits; I reapplied them and reran the full suite, build and lint afterwards (results above are post-reapply).
- A branch `sgs-117-unit-test-debt` already existed at origin/main with no commits; I attached a worktree to it.

## Out-of-scope findings
None.
