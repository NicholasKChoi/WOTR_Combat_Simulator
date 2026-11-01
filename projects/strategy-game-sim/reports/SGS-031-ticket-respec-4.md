# SGS-031 ticket re-spec 4

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-031-aoe4-build-move-ages.md

## Finding

Re-spec 3 allowed `autoHouses: false` pins only on eight named SGS-030 tests. After SGS-032 merged (ce342db), two tests in `lib/aoe4-build-order/research.test.ts` > `technology effects apply from completion` fail with auto-houses on by default. They are `leaves gather rates unchanged before completion and applies the tech after it` and `changes neither population nor units produced`. Both read the describe's shared runs `result = run([wheelbarrow], { game })` and `plain = run([], { game })`.

## Changes

- Scope section 5 is renamed "Tests already on main". It adds an SGS-032 pin bullet that names the file, the describe and the two shared calls, and gives the exact replacement (`inputs: inputsFor(game, { autoHouses: false })`). Nothing else in that file may change. That includes the describe's `simInputs` and the `run([], { game })` in `research shares the queue with production` (l.365), which passes as is.
- Section 5 also gets a general rule: a test on main that fails only because auto-houses are on by default may get the same pin. "Only" means the pin alone fixes it. The implementer must list each such pin in its report. A failure that needs any other edit is needs_spec.
- Out of scope now allows exactly these edits: the Seam test and its helper, the eight SGS-030 pins, the research.test.ts pin, and pins under the general rule.
- Final criterion (respec 4, unchecked): it lists the three kinds of edit (a)/(b)/(c). The diff check now includes `research.test.ts` (exactly two lines change, l.316-317 on ce342db), plus a `--stat` check that no other existing test file changes beyond the reported pins. Clause (a) now says "an action with no registered handler" instead of "a `research` step", because SGS-032 registered `research` on main.
- `INPUT_DEFAULTS.autoHouses` stays `true`. No other criterion changed.

## Verification

- I applied the two-line pin in a throwaway worktree at 13ec441 and ran `npx vitest run`: 24 files, 652/652 tests pass. The worktree was removed afterwards.
- `git diff --stat origin/main -- '*.test.ts'` on the branch today lists houses.test.ts, simulate-construction.test.ts (new), simulate.acceptance.test.ts and simulate.test.ts. research.test.ts has no diff yet. This matches the criterion before the rework.

## Branch work that stands

All of branch `sgs-031-aoe4-build-move-ages` @ 13ec441 stands. The rework adds only the two-line pin.

## Owner gaps

None.
