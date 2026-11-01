# SGS-031 implementer 4 (rework 2)

- Ticket: SGS-031 (respec 5). Branch `sgs-031-aoe4-build-move-ages`.
- Tip: **301b322** "Pin auto-houses off in the shared research effect runs", on 13ec441, on 37703f7, on origin/main ce342db. Not pushed, no PR.
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-031-aoe4-build-move-ages

## Required fix
- [x] `lib/aoe4-build-order/research.test.ts` > `technology effects apply from completion`, l.316-317:
  - `run([wheelbarrow], { game })` -> `run([wheelbarrow], { game, inputs: inputsFor(game, { autoHouses: false }) })`
  - `run([], { game })` -> `run([], { game, inputs: inputsFor(game, { autoHouses: false }) })`
  - Nothing else in the file changed (the describe's `simInputs` and the `run([], { game })` in `research shares the queue with production` are untouched). `git diff origin/main -- research.test.ts`: 2 lines removed, 2 added.

## Files touched this pass
- lib/aoe4-build-order/research.test.ts: the two shared-run pins.

## Checks (Node v24.22.2)
- `npm test`: 24 files, 652 passed, 0 failed.
- `npx tsc --noEmit`: clean.
- `npx next build`: succeeded.
- `npm run acceptance`: 209 passed.
- lint: the repo has no `lint` script, so it did not run.
- No new mutation checks: this pass adds no tests. It only pins inputs on existing ones.

## Final-criterion diff check
`git diff --stat origin/main -- '*.test.ts' '*.test.tsx'` lists houses.test.ts and simulate-construction.test.ts (new, this ticket's own), plus research.test.ts, simulate.acceptance.test.ts and simulate.test.ts. No other existing test file is touched. The three kinds of change to tests on main:
- (a) Seam test in simulate.test.ts: `leaves build and move waiting and blocking` removed. The no-handler `research` test is unchanged. The `stepHandlers.build` test handler saves `registered` and restores it in `finally`, and asserts `stepHandlers.build` is the registered function afterward.
- (b) The eight SGS-030 pins, each only adding `autoHouses: false` to the inputs of the run the test reads (from 13ec441, unchanged here). The supplyProvider test's `expect(countAt(def, 'villager', 80)).toBe(3)` becomes `expect(countAt(run([], { inputs: inputsFor(data, { autoHouses: false }) }), 'villager', 80)).toBe(3)`, the only changed `expect(` line. In tests that read more than one run (rally scope: `routed`, `slow`, `base`; supplyProvider: `result`; generated invariants: `result`/`again`), each run the test reads is pinned. No expected number, step list, start, game data or helper changed. The `<= 3` bound is kept.
- (c) research.test.ts: the two shared calls above.
- General-rule pins: none. No other test on main failed.

## Invariant check
`INPUT_DEFAULTS.autoHouses` is still `true`. No production code changed this pass.

## Out-of-scope findings
None.

## Status
needs_review
