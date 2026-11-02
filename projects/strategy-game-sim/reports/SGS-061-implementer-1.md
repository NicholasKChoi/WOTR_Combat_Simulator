# SGS-061 implementer 1

- Ticket: SGS-061 (the simulate API rejects `text`, OpenAPI 2.0.0)
- Branch: sgs-061-aoe4-api-rejects-text (base origin/main f11e0c5)
- Tip: ace6fbe8245aa1160cfef2906444c7ae44d03c7d (author choinickolas@gmail.com, not pushed)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-061-aoe4-api-rejects-text
- Status: needs_review

## Files touched
- pages/api/aoe4-build-order/simulate.ts: `checkOrder(body: Record<string, unknown>, catalog)`. An own `text` key (`Object.hasOwn`) gives the removed-text syntax issue. If `buildOrder === undefined`, the issue is `request: missing buildOrder`. Otherwise the route runs `checkBuildOrder` with no lines. Removed the `textToBuildOrder` import and the `SimulateRequest` cast. Inputs, cap, ordering and the 400 shape are unchanged.
- lib/aoe4-build-order/api.ts: `SimulateRequest` is now `{ buildOrder: BuildOrder; inputs?: SimInputOverrides }`.
- docs/api/openapi.json: version 2.0.0. In SimulateRequest, `oneOf` and `text` are removed and `required: [buildOrder]` plus `not: {required: [text]}` are added, with a new description. The operation's order-stage and issue-location prose is rewritten. The `text` request example is gone, and the 200 description now reads "The request example returns this body". The 400 examples are now missingBuildOrder, notAnObject, removedText and stepAndInputs. New descriptions for BuildOrderIssue.line ("this API never sets it", page-side conversion only), BuildOrderIssue.message (no "or line") and SimulateError.issues ("(buildOrder)"). The file was written with json.dumps(indent=2), which round-trips byte-identical, so there is no reformat noise.
- docs/aoe4-build-order.md: the bounds sentence and table row now say the 20,000-char cap belongs to the page-side `textToBuildOrder`. The Issues paragraph says only the page conversion sets `line`. The mermaid diagram shows the paste going through `textToBuildOrder` in a browser subgraph, with only BuildOrder JSON reaching the route. The Route section covers `{ buildOrder, inputs? }`, the removed-text 400, `request: missing buildOrder`, and a pointer to the page or `textToBuildOrder`. The 400 bullet says the order stage is buildOrder only and that no route issue carries `line`.
- acceptance/aoe4-simulate-api.spec.ts, -edges, -contract, -checks, -issue-shape: rewritten per Scope 5 (titles below).

## Spec titles rewritten, added, deleted (for the PR body)
aoe4-simulate-api.spec.ts ("each issue code over HTTP"):
- `syntax: neither text nor buildOrder` becomes `syntax: no buildOrder`. Old /text.*buildOrder/ ("request: send exactly one of text and buildOrder"); new /^request: missing buildOrder$/.
- `syntax: both text and buildOrder`, `syntax: text null beside buildOrder counts as both` and `syntax: text that is not a string` (old "request: send exactly one of text and buildOrder" / "text: must be a string") become rows in a new table `removedTextCases`, test `syntax: the removed-text issue for <label>`. Rows: a paste string, text null beside a valid buildOrder, a numeric text, an empty text, a valid buildOrder beside a text string is still rejected, a text of 20,001 characters. Each asserts `toEqual([{ code: 'syntax', message: 'request: text is no longer accepted; convert the paste to buildOrder and send that' }])`, which also proves there is no step, no line and no omittedIssues.
- `out-of-range: text of 20,001 characters is rejected without parsing` (old "text: 20001 characters, more than 20000") is replaced by the 20,001-character row above (new message: the removed-text message).
- `text of exactly 20,000 characters is not rejected for length` is deleted (200 before); `text-to-build.test.ts` "accepts text of exactly 20000 characters" covers it.
- Added: `a text key beside a valid buildOrder and an out-of-range input gives the removed-text issue, then the inputs issue`.
- The 1 MB 413 test is unchanged.

Note: I moved the text rows from `syntaxCases` into a sibling table in the same describe so they can assert the exact single issue. The shared `syntaxCases` loop only checks the first issue's code and a regex, and its `a step that is not an object` row legitimately carries `step`.

aoe4-simulate-api-edges.spec.ts:
- `the neither-key issue names both keys` becomes `the empty body issue is request: missing buildOrder`. Old: contains "text" and "buildOrder"; new: equals `request: missing buildOrder`.
- `a body under 1 MB with an oversized text reaches the handler caps, not the 413` becomes `... is rejected by the handler, not the 413`. Old: one `out-of-range` issue; new: exactly the removed-text syntax issue.
- `text null alone` and `a numeric text` rows are unchanged.

aoe4-simulate-api-contract.spec.ts:
- `text and steps caps` becomes `steps cap, and SimulateRequest requires buildOrder and forbids text`. It keeps the steps cap and adds: no `text` property, `required` equal to ['buildOrder'], `not.required` equal to ['text'].
- Request-example loop `['buildOrder', 'text']` becomes `['buildOrder']` (the `the text request example returns the documented 200 body` test is gone).
- `errorRequests`: `pastedStep` and `pasteSyntax` deleted; `exactlyOne` renamed to `missingBuildOrder` (body `{ inputs: { durationSeconds: 300 } }`); `removedText` added (`{ text: 'start 6 sheep -> sheep' }`).
- `text over maxLength is schema-invalid and the server rejects it` (old first code out-of-range) becomes `a request with text is schema-invalid and the server rejects it with the removed-text issue`, asserting the exact single removed-text issue.
- `both text and buildOrder is schema-invalid and the server rejects it`: keeps its assertions and adds the exact single removed-text issue.
- Type map `simulateRequest` drops `text: true`.
- Pre-existing test edited outside the named list: `spec structure > the operation prose states the issues ordering, the issue location rules and both framework responses`. Old regexes /pasted step carries line and step/ and /JSON step carries step and never line/ become /no issue carries line/ and /an issue on a step carries step;/. Ticket rule that allowed it: "a test of the changed behavior gets the new expected value". Scope 3 tells me to replace the operation's "Issue location" sentences so no issue carries line, and this test asserts that prose.

aoe4-simulate-api-checks.spec.ts:
- `a pasted unknown unit carries the nearest unit as a suggestion on its line` becomes `a lone JSON unknown unit is exactly one issue with the nearest unit as a suggestion on its step`. It posts `order([{ produce stable knigt }])` and asserts `toEqual([{ code: 'unknown-id', message: stringContaining('knigt'), step: 0, suggestion: 'knight' }])` plus `line` undefined. I converted it rather than deleting it (following the ticket's decision). Following the spec-gate note's alternative, it differs from the next test (step 1, `toMatchObject`) because it pins the exact key set (no `line`) on a single-step order. Old message "line 2: unknown unit \"knigt\" in unit"; the new one only has to contain `knigt`.
- Deleted `a text of exactly 20001 characters is the only issue and 20000 is not rejected for length` and `a 20001-character text still reports its inputs issues after the text issue`. A one-line comment at the deletion points to `lib/aoe4-build-order/text-to-build.test.ts`. The unused `START_LINE` const was removed.

aoe4-simulate-api-issue-shape.spec.ts:
- `suggestion is an optional string property and the document version is unchanged` becomes `... is 2.0.0`, and the expected version changes from '1.0.0' to '2.0.0'.
- `an unknown unit is still one 400 unknown-id issue on its paste line with only documented keys` becomes `... on its step with only documented keys`. It posts a JSON buildOrder with one `knigt` step and asserts step 0 and `line` undefined, where it used to assert line 2.
- Deleted `a text of 20001 characters is one out-of-range issue with the text message` (old "text: 20001 characters, more than 20000"), with a one-line comment pointing to text-to-build.test.ts.

aoe4-simulate-api-waits.spec.ts: untouched.

## Acceptance greps
- `git grep -nE "\btext *[:,}]" -- 'acceptance/aoe4-simulate-api*.spec.ts'`: 16 lines (api 8, contract 3, edges 3, waits 2, checks 0, issue-shape 0), the exact set the ticket lists. No body that sends `text` expects a 200.
- `parse-text|parseBuildOrderText|textToBuildOrder|textChars` in the route: nothing. `\btext\b` in api.ts: nothing.
- `jq -r .info.version` gives 2.0.0. The SimulateRequest jq gives `[["buildOrder"],{"required":["text"]},false,["buildOrder","inputs"]]`. Request examples: [buildOrder]. 400 examples: [missingBuildOrder, notAnObject, removedText, stepAndInputs]. The forbidden-strings jq gives [].
- `exactly one of|text: null|send exactly` over docs, README.md and data/aoe4-build-order/README.md: nothing.

## Tests and stages (Node v24.22.2)
- `npx tsc --noEmit`: pass.
- `npm run lint:dup`: pass, 0 clones.
- `npm test` (Vitest): 41 files, 1232 passed, 10 skipped, 0 failed. I wrote no unit tests: the change is the route's request contract, and the route has no Vitest suite. The ticket puts its coverage in the acceptance specs it names.
- `npx next build`: pass.
- `npm run acceptance` (ACCEPTANCE_PORT=3901): 620 passed, 0 failed.
- Codegen: not set in REPO.md.
- `git status` was clean after the build: no AGENTS.md re-add, no lockfile or format noise.

## Mutation checks (route; each undone, file restored from backup, final diff verified)
1. The ticket's mutation, skipping the removed-text branch (`if (false && Object.hasOwn(...))`): 11 failures. They include all 6 `removedTextCases` rows (text alone, null beside buildOrder, 42, '', valid buildOrder beside text, 20,001 chars), the two-issue case, the contract `removedText` example, the contract schema-invalid-text test, contract `both text and buildOrder`, and the edges 900,000-char test. Undone.
2. Skipping the missing-buildOrder branch: 3 failures (contract `missingBuildOrder` example, edges empty-body test, api `syntax: no buildOrder`). Undone.
3. Replacing the own-key check with `body.text != null`: 1 failure (`text null beside a valid buildOrder`). Undone.

## Invariant check
- S3: upheld. A body with any `text` is rejected before any parse or simulation. The route no longer parses text at all. The 1 MB framework limit (413 test unchanged and passing) and the 200-step cap (unchanged; contract `steps cap` passing) still hold. The 20,000-char cap remains in `textToBuildOrder` (its unit tests pass).
- A3: upheld. The `{ buildOrder, inputs }` path is unchanged, and every existing 200 spec passes unchanged.
- S1: the route imports only lib/aoe4-build-order modules. A1 and A2 are not touched.

## Out-of-scope findings
- acceptance/aoe4-simulate-api-edges.spec.ts `request shape` rows only assert `issues[0].code` and no `line`, although their titles say "a single syntax issue" (already noted by the spec gate). Mutation 3 shows `text null alone` passes even when null text is ignored, because the missing-buildOrder issue is also `syntax`. The api spec row `text null beside a valid buildOrder` covers that behavior.
- `SIM_INPUT_BOUNDS.textChars` stays in schema.ts. It is used only by `textToBuildOrder` now. The contract spec's per-bound loop still skips `textChars` because it has no OpenAPI location.

## Processes
I started no servers by hand. Playwright's own webServer on port 3901 has exited, and nothing listens on 3901. The next-server processes on 3911 and 3921 belong to the sgs-068 and review-sgs-066 worktrees, so I left them running.
