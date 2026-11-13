# Suite report: batch SGS-142 to SGS-152 (merged lane batch)

Verdict: **PASS** on the merged result, with **one merge conflict** (SGS-142 vs SGS-152) that must be resolved before these branches land on main in any order that leaves both edits.

## Inputs

| Task | Branch | Tip SHA | Behind origin/main | Ahead of origin/main |
|------|--------|---------|--------------------|----------------------|
| SGS-142 | sgs-142-replace-named-missing-key-conflict | eb03b95 | 0 | 2 |
| SGS-143 | sgs-143-run-bar-focus-ring-height | d698acf | 0 | 1 |
| SGS-146 | sgs-146-chart-reorder-same-render | 16cbce6 | 0 | 1 |
| SGS-148 | sgs-148-islinehidden-pinned-prefix | f56d939 | 0 | 1 |
| SGS-152 | sgs-152-docs-pinned-color-blob-importers | 5f8a404 | 0 | 1 |

Base: origin/main at 41b3ed3 (`Pin the split layout's Tab order and document it (#152)`), fetched this run.

## Merge (scratch only, never pushed, never committed to a task branch)

Detached worktree at origin/main, tips merged with `git merge --no-ff --no-edit` in the order above.

- eb03b95 (SGS-142): clean.
- d698acf (SGS-143): clean.
- 16cbce6 (SGS-146): clean.
- f56d939 (SGS-148): clean.
- 5f8a404 (SGS-152): **CONFLICT in `ARCHITECTURE.md`**, the "AoE4 saved-build storage" row. Both tasks reworded the same long table cell, which is the only conflict hunk.
  - SGS-142 side (from eb03b95, commit 7b0aade): the `replaceNamed` sentence now says the store gives `conflict` for a precondition or not-found error, and for any other put error when `head` reports the key absent (`ifMatch` on a deleted blob raises a plain `BlobError`), and rethrows the put error otherwise.
  - SGS-152 side (5f8a404): corrects the importer sentence to "the only non-test source file that imports `@vercel/blob` (its tests and the live and acceptance harnesses import it too)" and shortens the `replaceNamed` sentence.
  - Scratch resolution: kept the SGS-142 side and applied the SGS-152 importer wording by hand (scratch commit a08866e). The `replaceNamed` text from SGS-152 was not carried over, so the merged row keeps SGS-142's wording there. The manager should decide which `replaceNamed` wording the owning ticket wants before the second of the two PRs lands.
- Result: merged tip **a08866e** (local scratch, not pushed). Merge commits b780330 (SGS-152) and 7ee582f (SGS-148) sit beneath it.

Merge outcome for main: whichever of SGS-142 or SGS-152 merges second will conflict in this row and must rebase. This is a finding, not a test failure.

## Unit suite (commands.unit = `npm test`, vitest run)

Run on merged a08866e, through run.sh, tee'd to `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-142-SGS-152-suite-1.unit.log`.

- Summary: `Test Files  81 passed | 1 skipped (82)`, `Tests  2512 passed | 15 skipped (2527)`. Exit 0.
- Failures: none. Since the merged run passed, no per-tip attribution run was needed.
- The skipped file and skipped tests were not investigated. The blob live test skips unless `BLOB_LIVE=1`, and `test:blob-live` was not run, as instructed.

## Codegen and tree state

- `commands.codegen` is empty; not run.
- `git status --porcelain` in the merged worktree: empty, before and after the unit run. No dirty tree.

## Environment

- Declared: `package.json` engines `node: 24.x`; no `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions`.
- Installed through run.sh with `commands.shellSetup`: node v24.22.2, npm 11.19.1. Matches the declared range, so no mismatch.
- Dependencies: `bash /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/bin/link-node-modules.sh .` (the first step of `commands.acceptanceSetup`, which the unit suite needs for `node_modules`). Linked from the nm-cache; the Playwright and Chromium part of acceptanceSetup was not run, since unit does not use it.
- run.sh was invoked by absolute path because `CLAUDE_PLUGIN_ROOT` is unset in this session.
- `.env.local` was not read or copied. `test:blob-live` was not run.

## Worktree

Scratch worktree at `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-142-SGS-152` is removed with `git worktree remove --force`, followed by `git worktree prune`. See the handback for the result.

## Findings for the manager

1. **Merge conflict, SGS-142 vs SGS-152**, `ARCHITECTURE.md` AoE4 saved-build storage row. Needs one of the two tasks rebased on the other, or a joint re-spec of the row's `replaceNamed` and importer sentences.
2. No test failures across the five-task combination.
