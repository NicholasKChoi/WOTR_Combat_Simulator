# SGS-102 review 2 (delta, rework 1: batch gate rebase)

Verdict: APPROVE

- Previously approved tip: 9cdb07ee974608c5c9a75293d786a31d4e6c4bfe (base 53d5c37), review 1
- New tip: a9ef8637422ba4209dd75b5dd8e777848d959f80 (base 6c4f90b561ba95c1843e0349bd1a22e39965596c)
- Reviewed in the detached worktree worktrees/review-sgs-102-use-auto-run-2, which has since been removed

## Blocking findings

None.

## Delta checked

- `git range-diff 53d5c37..9cdb07e 6c4f90b..a9ef863`: commits 2 and 3 are identical (`=`). Commit 1 differs only by the context line `import { randomUUID } from 'crypto'` at the top of `acceptance/helpers.ts`, which comes from main.
- Diff of the two whole-branch diffs (`git diff 53d5c37 9cdb07e` against `git diff 6c4f90b a9ef863`): apart from blob index lines and hunk offsets, the only difference is that same `randomUUID` context line. Both diffs touch the same 29 files, +1021/-585.
- 6c4f90b is an ancestor of a9ef863.
- Main's builds helpers are intact: the tail of `acceptance/helpers.ts` from `BUILDS_PATH` to the end (`BUILDS_PATH`, `buildPath`, `uniqueClient`, `postBuild`, `postBuildRaw`) is byte-identical between 6c4f90b and a9ef863. The resolved import block keeps `randomUUID` (main), adds `type Response` to the Playwright import, and adds the `AUTO_RUN_DEBOUNCE_MS, type AutoRunStatus` import from `../components/apps/aoe4-build-order/auto-run` (the branch). That file exists at the tip.

## Checks on a9ef863

- `npx tsc --noEmit`: clean. (The first run used a symlinked node_modules that lacked `@vercel/blob`, a dependency main added, and failed for that reason only. After `npm ci` in the worktree it was clean. The implementer hit the same thing.)
- `npm run lint:dup`: 0 clones.
- `npx vitest run`: 59 files, 1802 passed, 10 skipped. This matches the implementer report.
- I did not rerun `npm run acceptance`. The implementer reports 794 passed, 0 failed. The branch's own diff is the same as at the tip that passed acceptance-test 1.

## Acceptance criteria

- Rework 1, "Rebase onto 6c4f90b ... keep both main's builds helpers and this branch's changes. Change nothing else.": pass (evidence above). Already ticked.
- Rework 1, "tsc, lint:dup, unit suite and full acceptance suite pass on the new tip": tsc, lint:dup and the unit suite pass, as I verified myself. For acceptance I am relying on the implementer report. Already ticked.
- All other criteria: unchanged from review 1. The branch's own diff is the same, so I did not re-check them.

## Invariants

S1, S3 and A3 still hold. The only new code is a merged import line from main, which does not touch any write or data path.

## Bot reconciliation

Delta mode, with an import-only conflict resolution, so the bot was not rerun. The delta has no new code to raise findings against.

## Non-blocking notes

- `sgs-102-use-auto-run` is not on origin (`git ls-remote --heads origin` does not list it). I reviewed the local ref. Push it before opening the PR.
- Review worktrees that symlink the main checkout's node_modules will fail tsc on `@vercel/blob` until the main checkout runs `npm install`.

## Coverage

Reviewed: the range-diff, the full branch-diff comparison, and `acceptance/helpers.ts` at both tips. Not reviewed: the acceptance suite (not rerun) and `next build` (not rerun; no source change in this pass).
