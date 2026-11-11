# Batch 113/117/119 simplify + linearize

- Simplify on sgs-119-named-build-shapes: diff is small (named-builds.ts, a base64UrlEncode extraction in saved-builds.ts, tests). No quality trim warranted; no commit made.
- Rebase: sgs-117 onto sgs-113, then sgs-119 onto sgs-117. No conflicts.
- New tips: sgs-113-chart-legend 41357ec (unchanged); sgs-117-unit-test-debt 89b5d32; sgs-119-named-build-shapes 3524d12 (1cf984c, 3524d12 on top of 89b5d32).
- Top worktree: `npx tsc --noEmit` clean; `npm test` 64 files passed, 2030 passed, 13 skipped.
- Nothing pushed.
