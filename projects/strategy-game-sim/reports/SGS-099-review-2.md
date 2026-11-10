# SGS-099 review 2

Verdict: **APPROVE**
Reviewed: 5efa6eeb15c6e90930e0329f11a233d73a9531d5 against origin/main 1e6d6c2. This was a full review, since this gate bounced review 1 at eb3212e. It was done in a detached worktree at `worktrees/review-sgs-099-saved-build-record`, which was removed afterwards.

## Rework 1 required fixes

- [x] The uncapped count comes from `checkBuildOrder` on the same input, and the test asserts `omittedIssues === total - MAX_REPORTED_ISSUES` and `issues.length === MAX_REPORTED_ISSUES` (`saved-builds.test.ts:187-197`). It also asserts `total > MAX_REPORTED_ISSUES`, so the test cannot pass trivially if `checkBuildOrder` stops failing (that path gives `total = 0`).
- [x] Mutation confirmed independently: with `saved-builds.ts:66` changed to `{ omittedIssues: omittedIssues + 1 }`, the test fails with `expected 51 to be 50` (1 failed, 50 passed). The change was reverted and the tree is clean.

The delta since eb3212e touches the test file only: the `checkBuildOrder` import and the one test above. There are no production changes.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

All ticked in the ticket.

| criterion | result | evidence |
|---|---|---|
| Exports each C1 name with the stated signatures; import grep empty | pass | `saved-builds.ts:10-113` matches design M6.md C1. `git grep -nE "from '(node:|react|next)"` returns nothing (exit 1). |
| `savedBuildId` table, determinism, key order, change sensitivity | pass | test:48-77 |
| `isSavedBuildId` table, including the `\n` anchor case | pass | test:81-96 |
| `storageEnv` table | pass | test:100-110 |
| Key tables | pass | test:114-118 |
| `checkSaveBuildRequest` rows: non-object, knigt, duration x5, name 100/101, 413 by UTF-8 bytes via `source`, 60/3600 ok | pass | test:122-167 |
| Issue order and cap | pass (was fail) | test:172-197. The cap now pins the exact remainder (see above). |
| Round trip: listBuilds loop, 20001 mock, walkSeconds 2.5, part-2 guard via `vi.mock` both ways | pass | test:200-224 |
| `api.ts` exports `BuildsError` and the three types, header updated, tsc and lint:dup pass | pass | `api.ts:1,5,28-30`. tsc is clean; jscpd found 0 clones. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- A1: holds. Duration bounds come from `outOfRange`/`SIM_INPUT_BOUNDS`. 65,536 and 100 are storage caps fixed by the design, not game numbers.
- A2, A3: not touched. Nothing in the simulation path changes.
- S3: holds. The record has a byte cap and the name a length cap. Issues are capped at `MAX_REPORTED_ISSUES`. The 413 check runs before the round trip.
- S1: holds. All imports stay inside `lib/aoe4-build-order/`.

## Contract, scope, spec-checklist

- Names match C1 and C3 exactly. The check order matches Scope steps 1 to 8.
- `api.ts` re-exports with `export type` only, so there is no runtime import cycle.
- Nothing from either Out of scope list is implemented. No invented constants. No `golang/` changes.
- The docs grep (`saved-builds`, `saved build`, `BuildsError` in docs/, ARCHITECTURE.md, README.md) is empty, so no doc is contradicted.
- No ticket ids or factory pointers in the code or tests.

## Linter

`npx tsc --noEmit && npm run lint:dup`: pass, 0 clones.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to run or reconcile.

## Conventions

Unchanged from review 1.
- The source style matches `builds.ts` and `text-to-build.ts`.
- The test style matches `text-to-build.test.ts` and `schema.test.ts`: `it.each` tables, `ENGLISH`, `listBuilds()`.
- The new test lines follow the file's existing helpers (`withOrder`, `badRequest`).

## Correctness

Re-read in full. No issues found.
- `badRequest` is never called with an empty array.
- The 413 check counts UTF-8 bytes through `TextEncoder`.
- Name is checked only on a valid order.
- `sortedKeys` keeps the comparison independent of key order, as review 1 discussed.

## Non-blocking notes

- **Commit message hygiene (manager action at PR time).** Commit 5efa6ee is titled `SGS-099: assert exact omittedIssues remainder`. common.md keeps ticket ids out of commit messages, and a GitHub squash merge copies each commit subject into the squash body by default. When opening or merging the PR, squash it to one commit, or set the squash body explicitly, so `SGS-099` does not land on main. Suggested subject: `Add the saved-build record, its id and the save checks`.
- These carry over from review 1:
  - `api.ts:1` points at openapi.json, which does not cover the builds API until the OpenAPI ticket lands.
  - The cap block is duplicated with `pages/api/aoe4-build-order/simulate.ts:54-56`; SGS-103 could extract it.
  - The `knigt` step literal appears twice (test:128, test:170).

## Coverage

- Files reviewed: `lib/aoe4-build-order/saved-builds.ts`, `lib/aoe4-build-order/saved-builds.test.ts`, `lib/aoe4-build-order/api.ts`.
- Ran:
  - `npm ci`.
  - lint: pass.
  - `npm test`: 49 files, 1562 passed, 10 skipped.
  - `npx next build`: pass.
  - One mutation: killed.
- REPO.md checklist:
  - "Every diff": the build passes. No page is touched, so no page was loaded.
  - "AoE4 build order": no copied helper or tolerance, no engine rule change, no UI change.
