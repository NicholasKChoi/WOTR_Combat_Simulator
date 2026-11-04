# SGS-093 implementer-2 (Rework 1)
Status: needs_review. Branch sgs-093-aoe4-docs-prebuilt-cleanups, tip 26eebf9e2942894622c1232ba60d744fa5d428cb, rebased onto origin/main fcfbaf1.
Worktree: .claude/code-factory/worktrees/sgs-093-aoe4-docs-prebuilt-cleanups

- Conflict in lib/aoe4-build-order/simulate-house-warnings.test.ts resolved by taking main's test title and field-set structure.
- Digest re-pinned (ENG Spear/Longbow into MAA/Crossbow, 1800 s): affa5ac15c88b132 (old branch pin, old hash) -> 1cead3b6a8f33aa3 (main's pin) -> 95876b5e98214174 (field-set hash of this branch's rebuilt build). Final: 95876b5e98214174.
- King's Palace digest: main's 082d524201cfafbd matched this branch's builds, so it was kept.
- No other digest needed changing (ENG 1TC unchanged; acceptance house-lead-time and prebuilt-plans pins unchanged and passing).
- Checks: tsc clean, lint:dup clean, npm test 1361 passed / 10 skipped; Playwright contract, spear-longbow-build, prebuilt-plans, house-lead-time specs: 92 passed. Dev server stopped.
- Not run: next build, full acceptance suite.
- Mutation check: the single changed pin was verified by the test failing with the old value and passing with the new one.
