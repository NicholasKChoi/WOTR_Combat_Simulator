# SGS-036 implementer report 1

- Ticket: SGS-036 (aoe4 request hardening), risk high
- Branch: `sgs-036-aoe4-request-hardening`, base `origin/main` f078c11
- Tip: `8a494314da52392cdf8fdb67ca1f0f340244a084` (one commit, author choinickolas@gmail.com)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-036-aoe4-request-hardening`
- Node: v24.22.2 (matches `engines: 24.x`)

## Files touched

- `lib/aoe4-build-order/api.ts`: export `MAX_REPORTED_ISSUES = 100`; `SimulateError.omittedIssues?: number`.
- `pages/api/aoe4-build-order/simulate.ts`: combine issues as before, slice to 100, add `omittedIssues` only when > 0; `checkOrder` narrows on `parsed.ok === false`.
- `lib/aoe4-build-order/parse-text.ts`: `WHITESPACE` adds U+00A0 and U+202F (comment updated); `sawStep` set only after a step line parses.
- `lib/aoe4-build-order/validate.ts`: indexed `for` loop over `steps` instead of `forEach`.
- `pages/apps/aoe4-build-order.tsx`: `errorMessages` appends `N more issues not shown.` when `omittedIssues` is a number > 0 (inside `simulation-error`).
- `docs/api/openapi.json`: `SimulateError.issues` gets `maxItems: 100` and a corrected description; new optional `omittedIssues` (integer, minimum 1). `additionalProperties: false` and `required: [error, issues]` kept.
- `docs/aoe4-build-order.md`: steps-bound paragraph (holes), paste grammar (NBSP/U+202F whitespace, `\n`-only split; parsed-step-only `start` rule, failed `start` still counts), 400 response (cap, `omittedIssues`, cap after combining in M2 order), page 400 display (extra line).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: `Record<keyof SimulateError, true>` gains `omittedIssues: true` (Scope 7) and the `optional` map in "response-side schemas are closed..." gains `SimulateError: ['omittedIssues']` (see below).
- `lib/aoe4-build-order/parse-text.test.ts`: new NBSP/U+202F tests, `\n`-only split test, rewritten pre-start test, new "start after parsed step after a failed line" test.
- `lib/aoe4-build-order/validate.test.ts`: sparse-steps test.
- `lib/aoe4-build-order/parse-text.acceptance.test.ts`: one assertion inverted (see below).

## Tests

- `npm test`: 27 files, 700 passed, 0 failed.
- New/changed unit tests and the invariant each encodes:
  - parse-text `line map > treats U+00A0 / U+202F as a space between tokens` (it.each, 2 cases): a line joined with either no-break space parses to the same result (order + lines) as the space-separated line; leading/trailing runs are trimmed.
  - parse-text `line map > does not split lines on a no-break space`: `pause a pause b` is one line with one issue.
  - parse-text `start line > does not count a failed step line as a step for start ordering`: `bogus\nstart -> sheep` and `pause B\nstart -> sheep` yield only line 1's issue.
  - parse-text `start line > still rejects a start after a parsed step when an earlier line failed`: `bogus\npause a\nstart -> sheep` yields lines [1, 3], the second being the "before every step" issue.
  - validate `validateBuildOrder syntax > reports a hole in steps as the same issue as a null step`: `[PAUSE, , PAUSE]` gives exactly the `{ code: 'syntax', step: 1, message: ...steps[1]... }` issue that `[PAUSE, null, PAUSE]` gives.
- The route cap has no unit test: `pages/**` is outside the vitest `include`, and route-level tests belong to the acceptance harness (Playwright), which the gate owns. I checked it by hand against `next dev` on port 3987: 100 `bogus` lines gave 100 issues with no `omittedIssues` key; 101 gave 100 issues, `omittedIssues: 1`, and `error === issues[0].message`. The server was stopped afterwards.

## Pre-existing tests edited

1. `lib/aoe4-build-order/parse-text.test.ts:start line > treats a failed step line as a step for start ordering`. It asserted `bogus\nstart -> sheep` gives issues on lines [1, 2]. It is now `does not count a failed step line as a step for start ordering` and asserts line 1 only. Basis: Scope 3 and the acceptance criterion "A text of an unparseable line followed by a valid `start` line yields only the unparseable line's issue" require the opposite of the old assertion. The ticket has no separate rule for existing tests.
2. `lib/aoe4-build-order/parse-text.acceptance.test.ts:parseBuildOrderText start line > rejects a start after a step even when that step line was itself bad`. It asserted `[1, 2]` for `bogus\nstart 6 sheep`. It is now `does not reject a start after a step line that was itself bad` and asserts `[1]`. The basis is the same as item 1. This file is a vitest file from an earlier acceptance pass, so the acceptance gate may want to review it.
3. `acceptance/aoe4-simulate-api-contract.spec.ts:spec structure > response-side schemas are closed and require every property the type does not mark optional`. The `optional` map gained `SimulateError: ['omittedIssues']`. Without it the test requires every schema property to be in `required`, which conflicts with Scope 6 ("optional `omittedIssues`", keep `required: [error, issues]`). Scope 7 names only line 298, but this map is the same kind of type-to-spec bookkeeping, and `npm run acceptance` must pass. No assertion logic changed.

Flag for manager: the implementer rule says a failing pre-existing test with no ticket rule means change no assertion and report needs_spec. I edited these three because the ticket's Scope and acceptance criteria name the new behavior outright. If the manager reads the rule strictly, these are the edits to re-check.

## Mutation checks (each run, failed, then reverted with `git checkout`; tree clean afterwards)

- Removed ` ` from `WHITESPACE`: `treats U+00A0 as a space between tokens` failed.
- Removed ` `: `treats U+202F as a space between tokens` failed.
- Restored `sawStep ||= !isStart`: `does not count a failed step line as a step for start ordering` failed.
- Removed `sawStep = true`: `still rejects a start after a parsed step when an earlier line failed` failed, along with 2 existing tests.
- Restored `steps.forEach(...)`: `reports a hole in steps as the same issue as a null step` failed.
- Split lines on `/[\n ]/`: `does not split lines on a no-break space` failed (plus the U+00A0 token test).
- Route slice to 101: not mutation-tested at unit level (no unit test, as above). The acceptance gate owns that check.

## Gates

- codegen: not set in REPO.md.
- build (`npm ci && npx next build`): passed; all routes built.
- lint (`npx tsc --noEmit`): 0 errors. The first attempt with `!parsed.ok` failed TS2339 because `tsconfig` has `strict: false`, and without `strictNullChecks` truthiness does not narrow the `ok` discriminant. I used `parsed.ok === false`, which narrows on `ok` and matches how the repo's tests narrow `ParseTextResult`. This departs from the ticket's literal `!parsed.ok`; the criterion "checkOrder narrows on `ok`" is met.
- unit (`npm test`): 700/700.
- acceptance (`npm run acceptance`): 340 passed, 0 failed, after the contract-spec `optional` map fix (1 failed before it).
- `git grep -n "'issues' in parsed" -- pages lib`: no matches. `git grep -n "steps.forEach" -- lib/aoe4-build-order/validate.ts`: no matches.
- Diff audit: only the files above changed. No lockfile, AGENTS.md or reformatting noise. The OpenAPI JSON was rewritten with 2-space indent and the diff is limited to the `SimulateError` hunk.

## Invariant check

- S3: upheld and strengthened. The `issues` list in the simulate 400 is now capped at 100.
- A1, A2, A3: not touched (no engine, data, or payment code changed).
- S1, S2: the page stays in Layout and no cross-app import was added.

## Out-of-scope findings

- `pages/api/aoe4-build-order/simulate.ts` `handler` still narrows `order`/`inputs` with `'issues' in` / `'order' in` rather than `ok`. The ticket scoped only `checkOrder`. It works today.

## Status

`needs_review`
