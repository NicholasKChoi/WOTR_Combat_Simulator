# SGS-036 review 2 (rework 1)

- Verdict: **APPROVE**
- Reviewed: tip `ab263688994376072cf2e88dfa6a90cf10aff900` against `origin/main` f078c11. Full branch diff is 11 files. The rework delta `8a49431..ab26368` is one line in `docs/api/openapi.json`.
- Round-1 conclusions are reused for the 8a49431 content, which is unchanged (see `reports/SGS-036-review-1.md`).
- Detached worktree: `worktrees/review-sgs-036-aoe4-request-hardening`, removed after review. Node v24.22.2.

## Blocking findings

None.

## Round-1 finding: fixed

`docs/api/openapi.json:191`, the `simulateBuildOrder` description:

- Old: "Validation runs in two stages and every issue is reported."
- New: "Validation runs in two stages; at most 100 issues are listed and the rest are counted in omittedIssues."

This matches `simulate.ts:64-67`: a slice to `MAX_REPORTED_ISSUES`, and `omittedIssues` present only when above 0. Nothing else in the description changed.

## Sweep for other sentences that contradict the 100-issue cap

- **`docs/api/openapi.json`**: I walked every string that mentions "issue" under the simulate path and the SimulateRequest, BuildOrder, BuildOrderIssue and SimulateError schemas.
  - `SimulateError.issues` says "The first 100 issues found" and has `maxItems: 100`.
  - `omittedIssues` is described as "Count of issues dropped past the 100-issue cap", with `minimum: 1`.
  - The 400 response description and the `notAnObject` example make no all-issues claim.
  - No contradiction remains.
- **`docs/aoe4-build-order.md`**:
  - Line 464, "Each issue is reported on its step or `start`, with the location fields above", is about where an issue is located, not whether every issue is listed. It is accurate.
  - Lines 492-497 state the cap and `omittedIssues`.
  - Line 581, "A 400 shows every returned issue's `message`", says "returned" and is accurate. Lines 582-583 cover the "N more issues not shown." line.
- **`pages/apps/aoe4-build-order.tsx`**: the only user-facing text about issues is the `${omittedIssues} more issues not shown.` line, which is consistent.
- **Repo-wide**: `git grep -iE "every (returned )?issue|all (the )?issues|every problem|all problems"` finds only `docs/aoe4-build-order.md:581` (accurate, see above).

## Acceptance criteria

These were ticked in the ticket:

- AC1-AC3, AC5: pass. Verified live in round 1, and the route and page code are unchanged since.
- AC6-AC8: pass (unit tests).
- AC9 and AC10: pass (greps).
- AC12: pass. The rework closed the round-1 failure, and the sweep above is clean.
- AC13: pass, re-run this round:
  - `npx tsc --noEmit` is clean.
  - `npm test` passed 700/700.
  - `npm run acceptance` passed 340/340.
  - `npx next build` succeeded.
- AC14: pass.

These were left unticked because no test exists yet. Both belong to the acceptance-test agent, not the implementer:

- AC4: the ajv check is "in the contract spec", and no test there yet asserts a capped body, 101 issues, or `omittedIssues: 0`. The behavior passed an ad hoc ajv check in round 1.
- AC11: the "slice 101" mutation fails no test, because no route-cap test exists. The WHITESPACE and `sawStep` mutations are covered by named unit tests.

## Invariants touched

- S3: holds, and is strengthened. The 400 `issues` list is bounded at 100.
- S1: holds.
- S2: unchanged.
- A1-A3: not touched.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. No bot ran.

## Lint

`npx tsc --noEmit`: 0 errors. It is the only static gate, since the repo has no ESLint config.

## Non-blocking notes

The round-1 notes still stand:

- The spread form for the optional key at `simulate.ts:67`.
- `maxItems` ordering at `openapi.json` SimulateError.issues.
- The text reads "1 more issues not shown." when N=1.
- `'issues' in order` / `'issues' in inputs` remain in `handler` (out of scope).

## Checklist (REPO.md)

- Every diff: `npx next build` is clean.
- Page:
  - The rework touched no page code.
  - The page flow was exercised by hand in round 1.
  - This round, the `acceptance/aoe4-build-order.spec.ts` page tests passed under next dev.
- AoE4 section:
  - No copied helpers.
  - Every doc sentence that touches the cap now matches the code.

## Coverage

- Rework delta: `docs/api/openapi.json`.
- Full-branch doc sweep: `docs/api/openapi.json`, `docs/aoe4-build-order.md`, `pages/apps/aoe4-build-order.tsx`, `lib/aoe4-build-order/api.ts` and `pages/api/aoe4-build-order/simulate.ts`, plus a repo-wide grep.
- The other files rely on round 1, and are unchanged since 8a49431.
- No server or Playwright process is left running. The review worktree has been removed.
