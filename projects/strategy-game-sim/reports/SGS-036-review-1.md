# SGS-036 review 1

- Verdict: **REQUEST CHANGES** (one blocking contract finding; a one-sentence doc fix)
- Reviewed: tip `8a494314da52392cdf8fdb67ca1f0f340244a084` (the branch is not on origin yet; reviewed by SHA) against `origin/main` f078c11, full diff (11 files)
- Detached worktree: `worktrees/review-sgs-036-aoe4-request-hardening`, removed after review
- Node v24.22.2

## Blocking findings

1. `docs/api/openapi.json:191` - contract - The `simulateBuildOrder` operation description still says "Validation runs in two stages and every issue is reported." After this diff the route returns at most 100 issues and reports the rest only as a count in `omittedIssues`. The diff edits this same file and corrects the same claim in `SimulateError.issues` ("Every issue found" became "The first 100 issues found"), but leaves the operation-level sentence contradicting it. REPO.md "A route change updates `docs/api/openapi.json` in the same diff" and the AoE4 checklist ("a doc sentence the diff leaves contradicted by the code is blocking") both apply, and OpenAPI is the authoritative contract (CONTEXT.md Key surfaces). Fix: reword it to say that every issue is found but at most `MAX_REPORTED_ISSUES` (100) are listed, with the remainder counted in `omittedIssues`. It is a one-sentence edit.

## Spec gaps

None. All three judgement points below are settled by the ticket.

## Manager's specific points

1. **Pre-existing test edits: all three are required by the ticket, so this is not a NEEDS_SPEC case.**
   - `lib/aoe4-build-order/parse-text.test.ts` "treats a failed step line as a step for start ordering" asserted `[1, 2]` for `bogus\nstart -> sheep`. Scope 3 ("A line that fails to parse does not make a following `start` line a ... issue") and AC7 ("yields only the unparseable line's issue") require the opposite, so the old assertion encoded the behavior the ticket removes. The rewrite asserts line 1 only. It adds a `pause B` (uppercase id) variant and keeps the positive case in a new test, `bogus\npause a\nstart` -> [1, 3].
   - `lib/aoe4-build-order/parse-text.acceptance.test.ts` "rejects a start after a step even when that step line was itself bad" is the same rule and the same reasoning, so the inversion is required. The acceptance-test agent should know that one of its files was changed.
   - `acceptance/aoe4-simulate-api-contract.spec.ts:116`, `optional` map gains `SimulateError: ['omittedIssues']`. Scope 6 requires `omittedIssues` to be optional and `required: [error, issues]` to stay. The test's own title is "require every property the type does not mark optional", and the type now marks `omittedIssues` optional. The map is that test's type-to-spec bookkeeping, the same kind as the Scope 7 edit at line 298. No assertion logic changed. Without the edit, `npm run acceptance` fails, which would break AC13.
2. **`parsed.ok === false` is sound.** `tsconfig.json` has `strict: false`, so there is no `strictNullChecks`, and truthiness does not narrow the boolean discriminant. I swapped in `!parsed.ok` and reproduced `TS2339: Property 'issues' does not exist on type 'ParseTextResult'` at `simulate.ts:36`, then reverted. `=== false` narrows correctly and matches the repo idiom: 12 sites in `lib/aoe4-build-order/*.test.ts` (for example `parse-text.test.ts:7`, `validate.test.ts:19`). AC9 holds: `git grep "'issues' in parsed" -- pages lib` is empty and `checkOrder` narrows on `ok`.
3. **The route cap is correct but has no automated test.**
   - Code (`simulate.ts:64-67`): `all.slice(0, MAX_REPORTED_ISSUES)`, `omittedIssues = all.length - issues.length`, and the key is spread in only when the count is above 0. `issues` is never empty on this path because the 400 branch runs only when order or inputs failed, and each failure carries at least one issue. So `issues[0]` is safe, as it was before.
   - Live check with `next dev` on port 3876 (a real HTTP POST in each case):
     - 99 issues: 99 returned, no `omittedIssues` key.
     - 100 issues: 100 returned, no key.
     - 101 issues: 100 returned, `omittedIssues: 1`.
     - 250 issues: 100 returned, `omittedIssues: 150`.
     - In every case above, `error === issues[0].message`.
     - 60 paste lines plus 60 unknown `inputs.trips` keys: issues 0-59 are paste lines 1-60 in order, issues 60-99 are `trips.n0`..`trips.n39`, and `omittedIssues: 20`.
     - 1 paste issue plus 150 inputs issues: `omittedIssues: 51`.
   - Coverage: no acceptance or unit test exercises the cap. `grep omittedIssues acceptance/` finds only the two bookkeeping maps. AC1-AC4 have no test yet, and AC11's "slice 101" mutation fails no test. Vitest's `include` excludes `pages/**`, so these tests belong to the acceptance-test agent. That is not a finding against the implementer.

## Acceptance criteria

The verdict is REQUEST CHANGES, so I have not ticked anything in the ticket. Status of each criterion:

- AC1, 101 issues -> 100, `omittedIssues: 1`, `error === issues[0].message`: **pass** (live curl). No test yet.
- AC2, exactly 100 -> no key: **pass** (live). No test yet.
- AC3, 60+60 -> 60 paste then 40 inputs, `omittedIssues: 20`: **pass** (live). No test yet.
- AC4, ajv: **behavior passes, criterion not yet met.** With an ad hoc Ajv2020 against `docs/api/openapi.json`, these are accepted: 100 issues plus `omittedIssues: 1`, and 100 issues with no key. These are rejected: 101 issues, `omittedIssues: 0`, and `omittedIssues: 1.5`. The criterion says "in the contract spec", and no such test exists there yet. It is for the acceptance-test agent.
- AC5, page: **pass** (Playwright by hand against `next dev`).
  - A real 105-issue paste shows 101 `<li>`, the last being "5 more issues not shown.".
  - A real 100-issue paste shows 100 `<li>` and no extra line.
  - A stubbed 400 with `omittedIssues: 5` shows `['a', 'b', '5 more issues not shown.']` inside `simulation-error`.
  - No test yet.
- AC6, NBSP/U+202F: **pass**. Unit `parse-text.test.ts` "treats %s as a space between tokens" checks it. Live, a paste joined with U+00A0/U+202F returns 200, the same as the spaced paste.
- AC7, failed line then `start` -> only that line's issue; parsed step then `start` -> the issue: **pass**. Unit tests check both, and live I got `[1]` and `[[2, "line 2: 'start' must come before every step"]]`.
- AC8, hole at index 1 is identical to `null`: **pass**. Unit `validate.test.ts` "reports a hole in steps as the same issue as a null step" uses `toStrictEqual`.
- AC9, grep / narrow on `ok`: **pass**.
- AC10, `git grep steps.forEach -- validate.ts` is empty: **pass**.
- AC11, mutation: **partial**. The implementer reports that the WHITESPACE and `sawStep ||= !isStart` mutations each fail a named test. Reading the tests, I agree each one would fail. The slice-101 mutation fails no test because there is no route test.
- AC12, docs match Scope 6 and 8: **fail.** All the Scope 8 edits in `docs/aoe4-build-order.md` are present and accurate:
  - lines 64-65: holes;
  - lines 413-414 and 421-423: NBSP, the `\n`-only split, and the parsed-step-only `start` rule, plus "a failed `start` still counts", which matches `sawStart ||= isStart`;
  - lines 492-497: cap, `omittedIssues`, and M2 order;
  - lines 581-582: the page line.

  Scope 6 is also met in `SimulateError`: `maxItems: 100`, `omittedIssues` (integer, minimum 1), the corrected `issues` description, and `required`/`additionalProperties` unchanged. The criterion still fails because of blocking finding 1, at `openapi.json:191`.
- AC13, gates: **pass**. `npx tsc --noEmit` is clean, `npm test` passed 700/700, `npm run acceptance` passed 340/340, and `npx next build` succeeded.
- AC14, invariants: **pass** (see below).

## Invariants touched

- S3: **holds, and is strengthened.** The simulate 400 `issues` list is now bounded at 100, which closes the spec-checklist item "every list an API route returns (including validation issues) is capped".
- A1, A2, A3: not touched. No engine, data or payment code changed, and no criticalPath symbol was touched (`validate.ts`, `parse-text.ts` and the route are not listed).
- S1: holds. The route and page import only from `lib/aoe4-build-order/`.
- S2: unchanged.

## Spec checklist

- Contracts: `SimulateError.omittedIssues` and `MAX_REPORTED_ISSUES` match design/M3.md "Route" and the Modules table (`api.ts` row) exactly.
- Scope: nothing from the Out of scope lists is implemented, and nothing under `golang/` changed.
- Constants: 100 comes from the design, not an invented constant.
- Naming: fine.

## Bot reconciliation

`reviewBot.cli` is empty, so no review bot ran. `rulesFile` is empty.

## Lint

`npx tsc --noEmit`: 0 errors. There is no ESLint config, so this is the only static gate.

## Non-blocking notes

- `simulate.ts:67` adds the optional key with `...(omittedIssues > 0 ? { omittedIssues } : {})`. The nearest sibling for an optional key, `parse-text.ts:269-271` (`if (start !== undefined) { order.start = start; }`), builds the object and then assigns. Both are fine. I mention it only because the spread form is the only one of its kind in `lib/` and `pages/`.
- `openapi.json:1778` puts `maxItems` after `description`. The siblings at `openapi.json:892` and `:973` put it next to `minItems`/`type`, before `items`. This is cosmetic.
- The page renders "1 more issues not shown." when N=1. The design and ticket fix this text "for any N", so it is not a finding, but the owner may want a singular form later.
- Out of scope, already noted by the implementer: `handler` still narrows `order`/`inputs` with `'issues' in` and `'order' in` (`simulate.ts:57,64`).
- For the acceptance-test agent:
  - AC1-AC4 and the AC11 slice-101 mutation need tests in `acceptance/` (route cap, 60+60 ordering, ajv on a capped body, and rejection of 101 / `omittedIssues: 0`).
  - AC5 needs a page test with a stubbed `omittedIssues: 5`.
  - `parse-text.acceptance.test.ts:140` was inverted by the implementer.

## Checklist (REPO.md Review checklist)

- Every diff: I ran `npx next build` (clean). I loaded `/apps/aoe4-build-order` under `npm run dev` and went through the flow: paste text, click Run, and read the rendered `simulation-error` list. I did this with real 100- and 105-issue pastes and with a stubbed `omittedIssues: 5` body.
- AoE4 build order:
  - No helper, constant or tolerance was copied. `MAX_REPORTED_ISSUES` is defined once in `api.ts` and imported by the route.
  - I checked the rule changes against `docs/aoe4-build-order.md`; every touched sentence matches the code.
  - No chart change.

## Coverage

- Reviewed every file in the diff:
  - `acceptance/aoe4-simulate-api-contract.spec.ts`
  - `docs/aoe4-build-order.md`
  - `docs/api/openapi.json`
  - `lib/aoe4-build-order/api.ts`
  - `lib/aoe4-build-order/parse-text.ts`
  - `lib/aoe4-build-order/parse-text.test.ts`
  - `lib/aoe4-build-order/parse-text.acceptance.test.ts`
  - `lib/aoe4-build-order/validate.ts`
  - `lib/aoe4-build-order/validate.test.ts`
  - `pages/api/aoe4-build-order/simulate.ts`
  - `pages/apps/aoe4-build-order.tsx`
- Context read: `validate.ts` (`OrderChecker.check`, `resolveSimInputs`/`resolveTrips`) and the `parseBuildOrderText` loop.
- I did not run the mutations myself. I relied on the implementer's report and confirmed by reading that each named test would fail.
- The dev server (port 3876) is stopped, the port is free, and the review worktree has been removed.
