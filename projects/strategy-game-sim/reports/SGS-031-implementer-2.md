# SGS-031 implementer pass 2 (rework, respec 3)

- Ticket: SGS-031. Branch `sgs-031-aoe4-build-move-ages`, tip `bde78f2` (on 1d514ee, base origin/main a714a23).
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-031-aoe4-build-move-ages

## Files touched
- lib/aoe4-build-order/simulate.test.ts: `autoHouses: false` pins in the 5 named tests (8 lines changed).
- lib/aoe4-build-order/simulate.acceptance.test.ts: pins at the wood-only describe-level `run` and in the generated-invariants test (3 lines changed).

## Pins, test by test
- `default English start` (pays villagers ... supply 10): the describe-level `run([])` now gets `inputs: inputsFor(data, { autoHouses: false })`. The other three tests in that describe share the run and still pass, because the pinned run matches SGS-030's behavior.
- `same instant` > routes the villager after...: pinned on its one run.
- `rally scope` > walks ...: pinned on all three runs (`routed`, `slow`, `base`; `base` becomes `inputsFor(fast, { walkSeconds: 10, autoHouses: false })`).
- `produce waits` > waits while the population would pass supply: pinned on its one run.
- `civ rules` > supplyProvider changes the supply: **deviation from the "pin the shared call" wording.** The failing assertion read the describe-level `def = run([])`. That run is also compared with `toEqual` in the `defaults to the english rules` test (`run([], { rules: NO_CIV_RULES })`). Pinning `def` would break that test unless it got a pin too, and Out of scope forbids that edit. So the pin went inside the named test: `result` gets `inputs: inputsFor(data, { autoHouses: false })`, and the `def` reference in `countAt(def, 'villager', 80)` becomes `run([], { inputs: inputsFor(data, { autoHouses: false }) })`. This is the same steps and start with no rules, which is what `def` was. The assertion and the expected 3 are unchanged, and `def` and its other users are untouched.
- acceptance `hand-computed timeline with a wood-only start`: one pin at the describe-level `run` (`inputs: inputsFor(woodStart, { autoHouses: false })`), which covers both tests.
- acceptance `invariants over generated build orders`: both `result` and `again` pinned with `inputsFor(barracksGame, { autoHouses: false })`. The `villagersAndScouts + MAA <= 3` bound is unchanged.

No assertion, expected number, step list, start, game data or helper changed. The default (`autoHouses` true) is unchanged. The Seam edit and `withHandler` from 1d514ee stay as they were.

## Tests
- `npm test`: 22 files, 595 passed, 0 failed (before: 8 failed). The vitest count is 595, not the 8+587 the manager quoted. The 8 previously failing tests are the 8 above, and all now pass.
- Invariants encoded: production stops at supply when auto-houses are off, and the same-instant, rally-walk and generated-order invariants hold under `autoHouses: false`.
- Mutation check: the failing run before the edit is the break. Without the pins, all 8 fail (8 failed / 516 passed in lib/aoe4-build-order). With them, all pass.

## Gates
- codegen: not set in REPO.md.
- `npx tsc --noEmit`: clean.
- `npx next build`: success.
- `npm run acceptance`: 209 passed.
- Prettier `--check` flags both test files, but it flagged simulate.test.ts at 1d514ee too, and Prettier is not a REPO.md gate. The files were left unformatted.
- `git diff --stat origin/main`: 7 files. This pass touches only the two test files. No stray tool changes. No processes left running.

## Invariant check
- The default `autoHouses: true` is unchanged.
- The tests that cover auto-houses being on are still the ticket's own criteria.

## Out-of-scope findings
None.

## Status
needs_review. The spec-gate or review should accept the civ rules test deviation described above.
