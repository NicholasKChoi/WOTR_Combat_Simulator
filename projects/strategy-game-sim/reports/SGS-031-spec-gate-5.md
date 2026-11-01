# SGS-031 spec gate 5

Verdict: NEEDS_SPEC (two small wording gaps; no owner decision needed; the implementation work itself is unambiguous)

Checked on branch sgs-031-aoe4-build-move-ages @ 13ec441. origin/main is ce342db (the same sha, so the branch is rebased onto it).

## What resolves
- research.test.ts: `describe('technology effects apply from completion')` is at l.311. `const result = run([wheelbarrow], { game })` is l.316 and `const plain = run([], { game })` is l.317. `run` takes `options.inputs` and `inputsFor(game, partial)` exists (l.49), so the stated replacement compiles. The describe's `simInputs` (l.314) and `research shares the queue with production` (l.362) are separate and need no edit.
- The pin is NOT yet on the branch. `git diff --stat origin/main` shows no research.test.ts. This matches "remaining work is the two-line pin".
- All 8 SGS-030 pins are on 13ec441. By file: simulate.test.ts has default English start, same instant, rally scope (3 runs), produce waits and civ rules supplyProvider; simulate.acceptance.test.ts has wood-only start (shared `result`) and invariants (`result` and `again`). The `<= 3` bound is untouched.
- `git diff --stat origin/main -- '*.test.ts' '*.test.tsx'` lists houses.test.ts and simulate-construction.test.ts (new) plus the two existing files. This is well-formed against ce342db.

## Gaps
1. Section 5 / final criterion, diff check - the 8th-pin edit in `civ rules > supplyProvider changes the supply a building gives` changes an `expect(` line (simulate.test.ts l.632: `expect(countAt(def, 'villager', 80)).toBe(3)` became `expect(countAt(run([], { inputs: inputsFor(data, { autoHouses: false }) }), 'villager', 80)).toBe(3)`). The reason is that `def` is a describe-level default run (l.610) also used by other tests, so it cannot be pinned at its definition. The ticket says "no `expect(` line changed", and also "at that shared call", so the criterion's diff check fails on correct work. Proposed fix: say the supplyProvider test's `def` comparison is replaced by an inline `run([], { inputs: inputsFor(data, { autoHouses: false }) })` (or a local const in that test), and that this one `expect(` line may change only by that substitution of the run argument, with the same expected number 3. Reword the check to "no expected number, step list or helper changed".
2. Section 5 Seam bullet vs clause (a) (the contradiction the re-spec author flagged) - the bullet says "Keep the `research` case as it is: a `research` step reports `waiting`", but on ce342db SGS-032 registered `research`. The main test is already `leaves an action with no registered handler waiting and blocking` (deletes `handlers.research` and restores it), and what remains to do is only dropping the `build`/`move` test and restoring `stepHandlers.build` (`registered`). Proposed fix: rewrite the first bullet as "the `build` and `move` cases are removed; the no-handler test that temporarily deletes `stepHandlers.research` stays as on main", and make the Seam bullet and clause (a) say the same thing ("an action with no registered handler"). The Scope intro "SGS-030's Seam test asserts a `build`, a `move` and a `research` step each report `waiting`" is also stale on ce342db.

## Notes
- Clause (c) and the general rule are well-formed. The 652/652 claim should be re-confirmed after the pin is committed, since the pin is not on the branch.
- The diff check "exactly two lines change (l.316-317 on ce342db)" is correct.
- Criterion 146 is the only unchecked box. Everything else is [x] and unaffected.
