# Batch simplify SGS-127..SGS-129

Loaded common.md, REPO.md (styleSources ARCHITECTURE.md, tsconfig.json), LESSONS.md (acceptance-only rule, not touched), INVARIANTS.md.

## New tips (stack linear: main <- 127 <- 128 <- 129; nothing pushed)

| Task | Branch | Old tip | New tip |
|---|---|---|---|
| SGS-127 | sgs-127-blob-strong-etag | 335f6a3 | 8691f1e |
| SGS-128 | sgs-128-shared-test-helpers-and-jscpd-gates | c85f1e0 | 9bbe59d (rebased 2 commits: 44241c0, 6e31e80, then trim) |
| SGS-129 | sgs-129-strict-typescript | 4c2ee16 | 75fa929 (rebased only, simplify skipped, low risk) |

## Trims

- SGS-127 (8691f1e): removed redundant `as string` casts and `id: id` in `acceptance/aoe4-named-builds-version-saves.spec.ts` (json() is any). The rest of the diff (blob-build-store read, route logging, tests) was already tight; no comment-bar or style-source issues found.
- SGS-128 (9bbe59d): after rebasing onto 127, the 127 spec re-declared `WARM_UP_TIMEOUT_MS`, `START`, `STEPS`, `saveBody`, which 128 now exports from `acceptance/helpers.ts`. The spec now imports `saveBody` and `WARM_UP_TIMEOUT_MS` from helpers.

Rebases had no conflicts. Note: many other acceptance specs still declare their own `WARM_UP_TIMEOUT_MS` (helpers exports it; only 4 specs import it); outside this batch's scope, left as is.

## Verification

- 127: `npx tsc --noEmit` clean; vitest blob-build-store + named-builds-routes: 123 passed.
- 128: tsc clean; `npm run lint:dup` 0 clones (both configs); `npm test` 2360 passed, 13 skipped.
- 129 (top tip 75fa929): `npx tsc --noEmit` clean; `npm test` 74 files, 2360 passed, 13 skipped.
- No acceptance/browser tests run.
