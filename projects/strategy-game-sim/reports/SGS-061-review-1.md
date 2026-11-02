# SGS-061 review 1

- Verdict: **APPROVE**
- Branch: sgs-061-aoe4-api-rejects-text, tip ace6fbe8245aa1160cfef2906444c7ae44d03c7d (local only, not on origin; reviewed from a detached worktree at that SHA)
- Base: origin/main f11e0c5abe64f31304e6f1def59bbf78c5c378b3
- Commit author: choinickolas@gmail.com. The commit message has no ticket ids or factory pointers.
- Node v24.22.2. Production server `next start` on port 3931 for the probes. Playwright ran on ACCEPTANCE_PORT=3931.

## Blocking findings

None.

## Spec gaps

None.

## Gates run

- `npx tsc --noEmit`: pass.
- `npm run lint:dup`: 0 clones.
- `npm test`: 41 files, 1232 passed, 10 skipped.
- `npx next build`: pass. The tree was clean afterwards (no AGENTS.md or lockfile noise).
- `npm run acceptance` (port 3931): 620 passed, 0 failed. This includes every AoE4 page spec.
- Mutation, re-run independently: I skipped the removed-`text` branch (`false &&`) and ran the api, contract and edges specs. 11 tests failed: all 6 `removedTextCases` rows, the two-issue case, contract `removedText` example, contract schema-invalid `text`, contract `both text and buildOrder`, and the edges 900,000-character test. I then restored the file and confirmed `git status` was clean.

## (1) Body shapes against the built server (`next start -p 3931`, real HTTP)

| body | status | issues |
|---|---|---|
| `{text: paste}` | 400 | [removed-text] |
| `{text: null}` | 400 | [removed-text] |
| `{text: null, buildOrder: valid}` | 400 | [removed-text] |
| `{text: 'x', buildOrder: valid}` | 400 | [removed-text] (not 200) |
| `{text: 'x', buildOrder: {steps: 5}}` | 400 | [removed-text] only. Proves buildOrder is not checked |
| `{text: ''}`, `{text: 42}`, `{text: 'x'*20001}` | 400 | [removed-text], no out-of-range |
| `{buildOrder: valid, text: 'x', inputs: {durationSeconds: 59}}` | 400 | [removed-text, `inputs.durationSeconds: 59 is outside 60..3600`] |
| `{text: 'x', inputs: {durationSeconds: 59, autoHouses: 'no'}}` | 400 | [removed-text, out-of-range, syntax inputs.autoHouses] |
| `{}`, `{inputs: {}}` | 400 | [`request: missing buildOrder`] |
| `{inputs: {durationSeconds: 59}}` | 400 | [missing buildOrder, inputs out-of-range]: inputs still reported after the order issue |
| `{buildOrder: null}` | 400 | [`build order: must be an object`] (from the check, not missing buildOrder) |
| `{buildOrder: valid}`, with `inputs`, with unknown keys (`foo`, `Text`) | 200 | SimulationResult |
| `{"__proto__": {"text": ...}, buildOrder}` | 200 | an own-key test, so an inherited `text` is not rejected (correct) |
| `[]`, `"s"`, `3`, `null` | 400 | [`request body: must be a JSON object`] |
| GET | 405 | `Allow: POST` |
| 1 MB+ `{text}` | 413 | `Body exceeded 1mb limit` (framework) |
| `{"text":` (malformed) | 400 | plain-text `Invalid JSON` |

Every removed-`text` issue is exactly `{code: 'syntax', message: 'request: text is no longer accepted; convert the paste to buildOrder and send that'}`, with no `step`, no `line` and no `omittedIssues`.

## (2) OpenAPI and docs

- `jq -r .info.version` gives `2.0.0`. The SimulateRequest jq gives `[["buildOrder"],{"required":["text"]},false,["buildOrder","inputs"]]`. Request examples: `["buildOrder"]`. 400 examples: `missingBuildOrder, notAnObject, removedText, stepAndInputs`. The stale-strings jq gives `[]`.
- The contract spec passed in the full run: every example validates against its schema and equals the real response, `removedText` and `missingBuildOrder` included.
- Every string in the JSON that mentions `line` is now accurate: the operation prose, the `buildOrder` and `inputs` property descriptions, and `BuildOrderIssue.line` ("this API never sets it").
- `git grep -nE "exactly one of|text: null|send exactly|posts the text" -- docs README.md data/aoe4-build-order/README.md`: no hits.
- `docs/aoe4-build-order.md` checks:
  - The Route section, the 400 bullet, the Issues paragraph, the bounds sentence and table row, and the mermaid diagram all match the code.
  - The page section (around line 817) already says Run posts `buildOrder`.
  - No sentence the diff adds is contradicted by the code.

## (3) Page

`pages/apps/aoe4-build-order.tsx:75` builds a `SimulateRequest` `{ buildOrder: converted.order, inputs: { durationSeconds } }` with no `text`. All AoE4 page specs pass in the 620-test run.

## (4) The `text` grep end state, and coverage

- `git grep -nE "\btext *[:,}]" -- 'acceptance/aoe4-simulate-api*.spec.ts'` gives 24 lines at the base and exactly 16 at the tip, the set the ticket lists:
  - api 8: rows 116-121, the two-issue case at 130, and the 413 test at 269.
  - contract 3: lines 280, 401 and 439.
  - edges 3: lines 142, 144 and 203.
  - waits 2: lines 28 and 248.
  - checks 0, issue-shape 0.
- No body that sends `text` expects a 200.
- No coverage was lost:
  - The 20000-accepted and 20001-rejected cap tests are in `lib/aoe4-build-order/text-to-build.test.ts:65` and `:72`.
  - "20001 text, then inputs issues" (the removed-text-then-inputs order) is covered by the new two-issue case.
  - The paste `line` assertions belonged to the route, which no longer sets `line`.
- The kept checks.spec `knigt` test (`a lone JSON unknown unit is exactly one issue ...`) is not a true duplicate:
  - It is the only test that pins the exact issue object with `toEqual`: step 0, suggestion `knight`, and no extra keys such as `line`.
  - The next test uses `toMatchObject` at step 1, so it would not catch an extra key.
  - The issue-shape test checks that the keys are documented in the schema, but does not check the suggestion value.
  - The overlap is real but each test asserts something the others do not, and the ticket's Scope 5 directs the conversion. Acceptable.

## (5) Edited contract-spec regexes

`spec structure > the operation prose states the issues ordering...` replaced the regexes `/pasted step carries line and step/` and `/JSON step carries step and never line/` with `/no issue carries line/` and `/an issue on a step carries step;/`. This is justified:
- Scope 3 requires rewriting the operation's "Issue location" sentences so that no issue carries `line`.
- This test asserts that prose, so it is "a test of the changed behavior".
- The new regexes match the new prose and would fail if the old prose came back.

## (6) `SIM_INPUT_BOUNDS.textChars`

It is still defined at `lib/aoe4-build-order/schema.ts:32` and used at `lib/aoe4-build-order/text-to-build.ts:10` (`maxChars`). `schema.test.ts:860` still covers it. The route no longer references it.

## Acceptance criteria

All 12 pass; all are ticked in the ticket.
1. `{text: any}` gives a single removed-text issue: pass (probes and the api spec rows).
2. Text beside a valid buildOrder gives 400; the two-issue order is correct: pass.
3. `{}` and `{inputs: {}}` give missing buildOrder; `buildOrder: null` gives the check's non-object issue: pass.
4. Valid requests give 200 and the existing 200 specs pass unchanged. No `aoe4-simulate-api*` assertion expects a `line` value: pass. Only `toBeUndefined()` checks remain.
5. The route grep prints nothing. The api.ts `\btext\b` grep prints nothing: pass.
6. The OpenAPI jq checks: pass.
7. The docs grep prints nothing, and the Route section carries the required statements: pass.
8. The contract spec passes: pass.
9. Mutation: pass (re-run by me, 11 failures).
10. The 16-line grep end state: pass.
11. tsc, lint:dup, npm test and acceptance on Node 24: pass.
12. No invariant regressions: pass.

## Invariants touched

- **S3: holds.** Any `text` body is rejected by an own-key test before any parse or simulation. The 1 MB 413 is unchanged (probe and spec). The 200-step cap is unchanged (contract `steps cap`). The 20,000-character cap remains in `textToBuildOrder`. The issue list is still capped at `MAX_REPORTED_ISSUES`.
- **A3: holds.** The `buildOrder` and `inputs` path is byte-identical in the route: the same `checkBuildOrder`, `checkSimInputs` and `simulateBuildOrder` calls. The existing 200 specs pass unchanged.
- **S1: holds.** The route imports only `lib/aoe4-build-order` modules.
- A1 and A2 are not touched.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Conventions

- `Object.hasOwn` matches existing use in `lib/aoe4-build-order/schema.ts:298` and `:362`, and in `effects.ts:140`.
- The route reuses its existing `rejected()` helper.
- The new spec table `removedTextCases` follows the sibling `syntaxCases` tuple-table style in the same describe.
- The `REMOVED_TEXT` constant follows the file's top-level const style.
- No ticket ids or factory pointers appear in the code, the specs, the docs or the commit.

## Non-blocking notes

1. `docs/api/openapi.json` `BuildOrderIssue.properties.message.description` now reads "naming the step and the offending id, kind or property". Start, inputs and request issues name no step, and page-side issues name a line. It is a looser statement than before rather than a new contradiction. Wording such as "naming the location" would be exact.
2. Design C4 says "The 400 response description lists `request: missing buildOrder` and the removed-`text` issue". The 400 response `description` itself is unchanged; the two messages appear in the 400 examples and in the operation and SimulateRequest descriptions. The ticket's Scope 3 did not ask for the response-description edit, so this is not a finding against the ticket. Consider one sentence there for parity with the design.
3. The test title `syntax: the removed-text issue for a text of 20,001 characters is the removed-text issue, not out-of-range` repeats "the removed-text issue" because of the template prefix. The row label could be `a text of 20,001 characters (no out-of-range)`.
4. In the contract spec, `both text and buildOrder ...` now has `expect(json.issues[0].code).toBe('syntax')` followed by a stricter `toEqual`. The first assertion is redundant. The ticket said to keep it.
5. Pre-existing and out of scope, untouched by the diff: the edges `request shape` rows are titled "is rejected with a single syntax issue" but assert only `issues[0].code` and `line` undefined, with no length check. `text null alone` now passes for a weaker reason than its title implies. The api spec rows cover the real behavior. Adding `expect(issues).toHaveLength(1)` would make the title true. Backlog candidate.

## Coverage

- **Reviewed in full:**
  - `pages/api/aoe4-build-order/simulate.ts`
  - `lib/aoe4-build-order/api.ts`
  - the OpenAPI diff, plus a grep of every `text`, `paste` and `line` string in the JSON
  - the `docs/aoe4-build-order.md` diff, plus the page section and Issues table context
  - all five changed acceptance specs
- **Read for context:** `pages/apps/aoe4-build-order.tsx` (request body), `lib/aoe4-build-order/text-to-build.ts` and `text-to-build.test.ts` (cap coverage), and the `textChars` grep across `schema.ts` and `text-to-build.ts`.
- **REPO.md checklist:**
  - Every diff: build done, and the page exercised through its Playwright flows.
  - AoE4 section: no helper copied; doc sentences consistent; no chart change.
- **Not done:** I did not load the page manually in a browser beyond the Playwright page specs. I did not render the mermaid diagram; its syntax was checked by reading.
- **Processes:** my `next start` on 3931 was stopped (process group killed) and Playwright's webServer exited; nothing listens on 3931. The servers on 3911 and 3921 belong to other worktrees and were left alone. I removed the review worktree after writing this report.
