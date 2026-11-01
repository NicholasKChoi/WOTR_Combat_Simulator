# SGS-026 implementer 1

- Ticket: SGS-026 (add rally step, build order start, line map types)
- Branch: sgs-026-aoe4-model-rally-start-types (base origin/main 68e004a)
- Tip: 3726128509e9aca3c7f895f52feb2c52103e0a76 (author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-026-aoe4-model-rally-start-types
- Not pushed, no PR.

## Files touched
- lib/aoe4-build-order/model.ts: adds the `rally` BuildStep variant, `BuildOrder.start?: BuildStart` (between `source?` and `steps`), `BuildStart`, and `BuildOrderLines`, and rewrites the `produce` comment to the design wording. Field names, optionality and types match the design/M2.md Contracts block exactly.
- lib/aoe4-build-order/data.acceptance.test.ts: export-list test title says 18; `BuildOrderLines` and `BuildStart` are inserted in sorted order. The no-runtime-export assertion is unchanged.
- lib/aoe4-build-order/model.test.ts (new): the criterion-2 type-level check. `tsc --noEmit` covers it because tsconfig includes `**/*.ts`. It has a valid `BuildOrder` with `start: { villagers: { sheep: 4, wood: 2 }, rally: 'sheep' }` and the time-30 rally step, plus a rally step without `to` under `@ts-expect-error`. I followed the existing "rejects Map mutation at compile time" pattern in data.acceptance.test.ts. The `it` makes no runtime assertion, because only tsc can fail it, and a comment in the file says so.

## Tests
- `npm test`: 10 files, 128 tests, all pass.
- `npx tsc --noEmit`: exit 0.
- What the tests check: the `rally` step requires `to` and accepts `trigger`, `walkSeconds`, `producer`. `BuildOrder.start` takes a partial GatherNodeId-keyed villager split and a rally. model.ts exports exactly the 18 types and no runtime code.

## Mutation checks
Each break was made after committing, then reverted with `git checkout`. The tree was clean afterwards and tsc passed again.
- Made `to` optional on the rally variant: tsc failed with TS2578 (unused `@ts-expect-error`) in model.test.ts.
- Removed `start?: BuildStart` from BuildOrder: tsc failed with TS2353 ('start' does not exist).
- Removed the rally variant: tsc failed with TS2322 ('"rally"' not assignable).
- Narrowed `BuildStart.villagers` to `Record<'farm', number>`: tsc failed with TS2353 ('sheep' does not exist).
- Un-exported `BuildStart`: the export-list test failed (1 failed, 21 passed).
- Appended `export const x = 1` to model.ts: the export-list test failed (1 failed, 21 passed).
- Process note: my first round of mutations ran before committing, so `git checkout` reset model.ts to base. I noticed when tsc went red, reapplied the edits, verified them, committed, and redid every mutation above. Nothing broken was committed.

## Gates
- codegen: not set in REPO.md.
- build: `npm ci` passed, then `npx next build` exit 0.
- lint (`npx tsc --noEmit`): exit 0.
- unit (`npm test`): passes, as above.
- `git grep -nE "^export (const|function|class|enum)" -- lib/aoe4-build-order/model.ts`: no matches.
- `git diff --stat 68e004a` shows only the 3 files above. No lockfile or next-env changes, and the worktree is clean.
- No processes left running.

## Invariant check
- A1 (game numbers only from data files): no numbers added to non-test code. Upheld.
- A2 and A3: types only, no simulation logic. Not affected.
- S1: no cross-app imports. Upheld.

## Out-of-scope findings
- docs/aoe4-build-order.md is stale: the `produce` row still says rally is required for villagers, and the BuildOrder JSON shape has no `start`. The ticket says SGS-025 owns this.

## Status
needs_review
