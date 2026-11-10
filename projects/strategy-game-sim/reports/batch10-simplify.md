# Batch 10 simplify

## SGS-104 (sgs-104-split-layout)
- Tip: 32d9d29be00937f22311c5592497c0ba085d671d (unchanged)
- Trim: none. Diff reviewed (use-split-layout.ts, workbench-tabs.tsx, workbench.module.css, page, helpers, docs); comments meet the bar, no reuse or simplification worth the churn.
- Checks: tsc clean, lint:dup 0 clones.

## SGS-105 (sgs-105-save-and-open-by-link)
- Rebased with `git rebase --onto 32d9d29 5b29e9e` (merge-base was 5b29e9e). New tip before trim 1653d27; final tip **c016f92e3089747e8e1f1d6edbfcb350f2229278**.
- Conflicts (all resolved mechanically, nothing dropped):
  - acceptance/helpers.ts (commit 1): kept both; openSavedBuild first, then 104's viewport constants and the showTab comment.
  - docs/aoe4-build-order.md, run bar paragraph (commit 1): kept 104's side-by-side/tabs text, layered 105's "build select (... saved build)", "Save build button", and "No run selects a tab (one exception ...)" wording on it.
  - docs/aoe4-build-order.md, narrow-layout area (commit 1): kept 105's saving section followed by 104's "At 1800 px and wider ..." line.
  - docs/aoe4-build-order.md (commit "Move the saving section ..."): dropped the saving section from the old location (the commit moves it), kept 104's "At 1800 px" line; the section appears exactly once.
- Trim: components/apps/aoe4-build-order/save-build-client.ts:64 return the type-guarded body instead of rebuilding {id, path}. Committed c016f92.
- Checks (top of stack): tsc clean, lint:dup 0 clones, npm test 62 files / 1857 passed, 10 skipped.
- Not pushed, no PRs.
