# SGS-064 review 2

Verdict: **APPROVE**

Branch `sgs-064-aoe4-house-lead-time`, tip `4675699ed742cc8f87c5f75be085c5f1ffffbe1c`, base origin/main `3ff99c6421141c870bbba3f02f056c6cdeea75ce` (merge-base = origin/main). This is a re-review after rework 1. Delta: `fe3de3e..4675699`, one commit, "Correct the Spear/Longbow acceptance wording and note the digest re-pin". The full gate was re-run.

## Blocking findings

None.

## Rework checks

1. **Production code unchanged.** `git diff fe3de3e..4675699 --stat` touches only `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts` (+5/-4) and `lib/aoe4-build-order/simulate-house-warnings.test.ts` (+1). Nothing under `lib/` outside that test file, `houses.ts`, `simulate.ts` or `data/` changed, so the review-1 differential still applies.
2. **Finding 1 is fixed.**
   - The title now reads "...arms at the Castle landmark second and starts when resources allow, with no waiting step" (spec:34).
   - The new assertion at spec:38 is `expect(step?.waitBreakdown?.resources).toBeCloseTo(MAN_AT_ARMS_START_SECONDS - CASTLE_LANDMARK_SECONDS, 3)`, which expects 6.5475.
   - The value is correct: the run passes, and review 1 measured 6.547502894965646.
   - The breakdown is accrued only from the time the step is armed (`accrueWait`, simulate.ts:838-847). So when the resources wait equals the whole armed-to-start gap, no population wait can be present.
   - **Mutation:** in `accrueWait`, I changed waits caused by resources to count as population waits, which leaves every time unchanged. Both step-23 tests (1200 s and 3600 s) failed at line 38 with "Received has value: undefined", while their `toMatchObject` time checks still passed. The other two tests passed. I reverted the mutation.
3. **Finding 2 is fixed.**
   - The comment at spec:45 now says the lead-time rule lets the build run ahead, with population 200 at 1366.43 s instead of 1373.04 s, so gold runs out earlier and the first deposit empties inside the window.
   - This matches the review-1 differential: `populationCapReachedAt` was 1366.4258 vs 1373.0384, and gold ran out at 1114.09 vs 1218.40.
   - The constant comment at spec:9 was reworded to "starts after it, once resources allow". This also covers the review-1 note that it sat above the wrong constant.
4. **Finding 3 is fixed.** A comment on the re-pinned row (simulate-house-warnings.test.ts:163) names the house lead-time rule as the reason. It contains no ticket ids or PR numbers.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1-9 | Planner rule, room cap, 660-764 s rise, landmark house start, same-baseId removal, greps, report, mutations | pass | Production code and the tests behind these are unchanged since review 1, which passed them with evidence |
| 10 | (respec 2) Re-pins hold with comments; digest; README; PR body | pass apart from PR body (left unchecked) | Values are unchanged from review 1. All three spear/longbow tests now carry correct wording. The digest row has its comment. No PR exists yet, so the PR-body list is checked at PR time |
| 11 | (respec 2) 1TC and Knight/Longbow byte-identical | pass | Production code is identical to fe3de3e, and review 1 showed these identical |
| 12 | tsc, lint:dup, unit, acceptance | pass | Node 24.22.2: tsc clean, jscpd 0 clones, vitest 1321 passed / 8 skipped, acceptance 574 passed (ACCEPTANCE_PORT=3851), `next build` ok |
| 13 | No invariant regressions | pass | No production change since review 1, so A1, A2 and A3 still hold |
| R1-1 | Retitle and assert the resources wait | pass | See rework check 2, including the mutation |
| R1-2 | Comment says the build runs ahead, with the numbers | pass | See rework check 3 |
| R1-3 | Digest re-pin comment names the lead-time rule | pass | See rework check 4 |
| R1-4 | No production-code change | pass | See rework check 1 |

I ticked every criterion except the respec-2 re-pin criterion, which includes the PR-body list.

## Invariants touched

None by this delta, which changes test files only. Review 1's results stand: A1, A2 and A3 hold, and S3 is not touched.

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are empty, so there is nothing to reconcile.

## Non-blocking notes

- simulate-house-warnings.test.ts:163: "houses are planned ahead of need" is vague, since the old rule also planned ahead. The specific cause is that supply from a building landing after the lead time (the King's Palace) no longer counts, so houses start during the palace build. The comment does not contradict the code.
- spec:38: a sibling spec checks the whole breakdown shape (`acceptance/aoe4-simulate-api-triggers.spec.ts:238`, `toEqual({ villagers: expect.any(Number) })`). `toEqual({ resources: expect.closeTo(...) })` would state "no other wait" directly. The current form is already enough, because resources equals the whole gap.
- spec:45: the comment line is about 200 characters, longer than the rest of the file.
- The review-1 non-blocking notes on unchanged code still apply (the ulp boundary at `houses.ts:22`, `simulate.ts:390` splice(-1), the magic index at `simulate-construction.test.ts:487`).

## Coverage

- Reviewed the full delta diff and the commit message (no ids or process history).
- Ran tsc, lint:dup, `npm test`, `npm run acceptance` (full suite), `next build`, and one mutation run on the spear/longbow spec.
- The REPO.md checklist ("Every diff" and the AoE4 build order section) is covered: build ok and the full acceptance suite ran. No page, helper or doc changed in this delta.
- Not reviewed: the PR body, because no PR exists yet. No server or process was left running.
