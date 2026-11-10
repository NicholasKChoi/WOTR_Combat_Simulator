# SGS-104 implementer pass 2

Status: needs_review. Branch sgs-104-split-layout, tip 7e05a8aa9b24b179358c63c6e397a782d7d4859a (parent bca1d06). Worktree: .claude/code-factory/worktrees/sgs-104-split-layout.

## Changes
- acceptance/aoe4-step-table.spec.ts (rule 6): wide half now asserts start-villagers-count left edge > start-field-rally left edge (both rects from one evaluate, under toPass). Step-row check and 390 px half unchanged. Mutation: flipped to toBeLessThan, failed "Expected < 316.4 Received 488.9", undone.
- acceptance/aoe4-build-order-run-errors.spec.ts (rule 2): pinned per test group. Tests that read tabs (successful run, the four unreadable-status rows, network failure) are in a nested describe "on the tabs layout" with test.use TABS_VIEWPORT; the 400 omitted-issues, zero-omitted and 200-not-JSON tests assert no tabs and no longer pin a viewport. Tests unchanged otherwise.

## Resize while hidden at base
Ran both cases of the resize-while-hidden spec against 5b29e9e (scratch detached worktree, spec and helpers.ts copied in, own npm ci): 2 passed. Worktree removed. Confirms it is a regression guard that passed before the layout change.

## Gates
tsc clean; lint:dup 0 clones; npm test 59 files, 1802 passed / 10 skipped; npm run acceptance 805 passed, 0 failed; next build succeeds. No lint script in package.json.

## Notes
git worktree remove of the scratch dir printed an error about an unrelated .git/worktrees/rebase-sgs-102 being busy; scratch dir is gone (git worktree list shows no scratch).
