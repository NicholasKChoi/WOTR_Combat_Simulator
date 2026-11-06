# SGS-097 review 2

- Branch: `sgs-097-docs-issue-messages` at 8524f53 (reviewed in a detached worktree at that SHA;
  `origin/sgs-097-docs-issue-messages` still does not exist).
- Mode: delta, `9e52088..8524f53` (one commit, "SGS-097 rework 1: correct issue-message location docs").
  Delta touches only `docs/aoe4-build-order.md` (+4/-2) and `docs/api/openapi.json` (+2/-2, two description strings).
- **Verdict: APPROVE**

## Blocking findings

None.

## Rework 1 fixes (all verified verbatim, by exact string comparison)

1. `docs/api/openapi.json:3328` `BuildOrderIssue.message.description`: `jq -r` output equals the required text exactly.
2. `docs/aoe4-build-order.md:664-668`: the joined lines contain the required sentence exactly. Wrap: line lengths
   104, 113, 106, 105, 60, against the paragraph's 105-106 above (lines 660-662). Fine.
3. `docs/api/openapi.json:1769` simulate 400 description: `jq -r` output equals the required text exactly
   (escaped quotes decode correctly). The three quoted strings match the route
   (`pages/api/aoe4-build-order/simulate.ts:22, 25, 39`).

- `jq empty docs/api/openapi.json`: valid JSON.
- Criterion 2 jq check: the 400 description contains both `request: missing buildOrder` and
  `request: text is no longer accepted; convert the paste to buildOrder and send that`.
- The delta changes no 400 example (only the two description lines in openapi.json).
- `git grep "naming the step and\|names the step or line" -- docs/`: no match.

## Acceptance criteria

All seven pass (criteria 1, 3, 4, 5 and 7 passed in review 1, and the delta does not touch code or tests).
Criteria 2 and 6, which review 1 failed on accuracy, now hold. All seven, plus the three Rework 1 fixes, are
ticked in the ticket.

## Invariants touched

None in the delta (doc text only). S3 holds as in review 1.

## Linter / bot

The delta has no code change, so lint was not re-run (it was clean at 9e52088). `reviewBot.cli` is empty.

## Non-blocking notes

- The branch is not pushed to origin. Push it before opening the PR.
- Unchanged from review 1: `acceptance/aoe4-simulate-api-contract.spec.ts:284` also fails on main (the 200
  `buildOrder` example is out of date). It needs its own ticket.

## Coverage

Reviewed the whole delta `9e52088..8524f53`. Not re-run: tests, build, contract spec (no code or example change).
