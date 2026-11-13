# Batch simplify: SGS-142 (SGS-143, 146, 148, 152 skipped, low risk)

Branch sgs-142-replace-named-missing-key-conflict, base origin/main. Tip unchanged: eb03b95. Nothing committed, nothing pushed.

## Review of the branch diff
Read the full diff (blob-build-store.ts, its unit and acceptance tests, the live test, ARCHITECTURE.md) against common.md comment bar and code shape, REPO.md styleSources (ARCHITECTURE.md, tsconfig.json) and LESSONS.md (only an acceptance/** Playwright lesson; not applicable).

No trims made:
- `headNotFound` is a distinct helper from `exists` on purpose (the new comment says why: exists() maps any head failure to absent). It has two call sites worth of intent in one place and the comment is a hidden-constraint comment that passes the bar.
- The replaceNamed comment states one external fact (plain BlobError on 2.9.0) and one rejected alternative; kept.
- Test tables are already parametrized; the new head table rows each cover a different branch.
- ARCHITECTURE.md change is a necessary doc update.

## Checks (unit only)
- npm test: 81 files passed, 1 skipped; 2507 passed, 15 skipped.
- npx tsc --noEmit: clean.
- npm run lint:dup: 0 clones.
- run.sh was not available (CLAUDE_PLUGIN_ROOT unset); ran with nvm 24 directly. No browser/e2e tests, no .env.local, no test:blob-live.
