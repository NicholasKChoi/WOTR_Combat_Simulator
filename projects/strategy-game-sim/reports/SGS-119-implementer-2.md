# SGS-119 implementer 2 (rework 1)

- Branch sgs-119-named-build-shapes, tip 33b9fbbfb22c9f9026b4e42fb5e5c34249122e45
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-119-named-build-shapes
- Files touched: lib/aoe4-build-order/named-builds.test.ts (one new row in the sameSecretHash table: 'the first is a prefix of the second', 'abcde', 'abcdef', false; existing row kept).
- Mutation check: removed the length guard at named-builds.ts:38; the new row failed ("expected true to be false", named-builds.test.ts:107), 51 others passed. Guard restored; the commit diff touches only the test file.
- tsc --noEmit, lint:dup: pass. npm test: 64 files, 2024 passed, 13 skipped. Build not rerun (test-only change).
- No pre-existing tests edited. No doc claims added. No pinned outputs.
- Required-fixes checklist item: done.
- Status: needs_review
