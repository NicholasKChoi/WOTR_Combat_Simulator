# Batch 9 simplify

## SGS-100 (sgs-100-auto-run-controller)
- Rebased onto origin/main cleanly: 53d5c37 -> 6c4f90b561ba95c1843e0349bd1a22e39965596c.
- /simplify (reuse, simplification, efficiency, altitude, comment bar) over the diff against origin/main: no change warranted. The only comment (staleness by seq) states a hidden constraint; no single-call-site helper with an oversized doc; simulate-client extraction already dedupes the page's fetch/error parsing. No commit made.
- Checks after `npm ci` (node_modules lacked @vercel/blob from main): tsc clean, lint:dup 0 clones, vitest lib/aoe4-build-order 40 files / 1379 passed, 10 skipped.
- New tip: 6c4f90b561ba95c1843e0349bd1a22e39965596c (rebase only).

## SGS-102 (sgs-102-use-auto-run)
- BLOCKED. `git rebase --onto 6c4f90b 53d5c37 sgs-102-use-auto-run` conflicts in acceptance/helpers.ts (UU) while replaying e1e224a "Re-run the AoE4 build order simulation on edit". Aborted; branch untouched at 9cdb07ee974608c5c9a75293d786a31d4e6c4bfe, still based on old 53d5c37. Not resolved by hand. Simplify and checks not run.
- Cause: the saved-builds work merged to main also edits acceptance/helpers.ts.
- Needs the rebase agent / a resolution decision before SGS-102 simplify.

## sgs-102-use-auto-run (second pass)

Scope: 6c4f90b..HEAD (29 files), quality only plus the comment bar.

Changes: none. The hook, status-message module, page wiring, issue list and acceptance helpers are already tight; comments meet the bar; no duplicated helpers or dead code found (page imports all still used).

Checks: `npx tsc --noEmit` clean. No commit, so lint:dup, tests and acceptance not re-run.

New tip: a9ef8637422ba4209dd75b5dd8e777848d959f80 (unchanged). Not pushed.
