# SGS-091 implementer-2 (rework 1)
Branch sgs-091-aoe4-engine-cleanups, tip 03be58b6b2586ee30d676913845500dd13435716, worktree .claude/code-factory/worktrees/sgs-091-aoe4-engine-cleanups. Status: needs_review.

Changes
- model.ts: new `shortText(value: unknown): string` and private `MAX_QUOTED_LENGTH = 40` (first 40 chars, then `...`).
- schema.ts: local ID_QUOTE_CHARS and shortId deleted; all call sites use `shortText`.
- parse-text.ts: local MAX_QUOTED_LENGTH deleted; `quote()` returns `'${shortText(token)}'` (output identical).
- data.acceptance.test.ts (pre-existing test edited): "model.ts exports exactly the 25 documented types and the shared lists" pins model.ts value exports; added `'shortText'` after `'RESOURCE_KINDS'`. Needed because the fix requires a new model.ts export.

Results
- vitest full run: 45 files passed, 1413 passed, 10 skipped. tsc --noEmit clean. lint:dup 0 clones. No eslint config exists in the repo (npm run lint absent).
- Mutation: set limit to 41 in model.ts: 29 tests failed (parse-text "truncates a long token", schema quoted-ids table); reverted.
- Acceptance (Playwright) specs not rerun: messages are byte-identical and no spec file changed in this pass.
