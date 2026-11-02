# SGS-060 review 1

Verdict: **APPROVE**
Branch sgs-060-aoe4-api-specs-send-build-order, tip f5d5e84f1eec3204b98cd1c86d21051bb21472d7. Stacked on sgs-075 (7037d48); reviewed `git diff 7037d48..f5d5e84` only (12 files under `acceptance/aoe4-simulate-api*.spec.ts`, +78/-93). Node v24.22.2, ACCEPTANCE_PORT=3847.

## Blocking findings

None.

## Spec gaps

None that block. Criterion 1 cannot be met as written (see below). The manager should amend it to "16 Scope 5 lines plus the 8 in `-checks` and `-issue-shape`", or have SGS-061 take those 8 explicitly.

## Acceptance criteria

1. **Unchecked (literal fail, intent met).** The grep prints 24 lines. Per file: api 6 (103, 104, 105, 149, 160, 264), edges 3 (142, 144, 204), contract 5 (277, 278, 400, 438, 446), waits 2 (28, 248). Those 16 are exactly the Scope 5 list. The other 8 come only from two files that did not exist at the ticket's base d5c2549 (75 lines there, 84 at 7037d48):
   - `-checks.spec.ts` (from sgs-075): 5 lines at 29, 140, 141, 142, 147.
   - `-issue-shape.spec.ts` (on main since the ticket): 3 lines at 29, 44, 47.

   Every one of the 8 tests either `line` on a pasted 400 or the 20,000-character `text` rule. Both are Scope 5 categories that belong to the remove-`text` ticket. Lines 141 and 47 are expected messages, not request bodies, but the regex matches them. `-house-warnings.spec.ts` was also added after the ticket. Its warm-up was converted (1 line), which is consistent with Scope 1.
2. Pass. All 10 named specs import `buildOrderFrom` from `./helpers`, and so does house-warnings. `git grep textToBuildOrder -- 'acceptance/*.spec.ts'` prints nothing. The waits signature `simulate(request, text, inputs = {})` is unchanged.
3. Pass on the delta: only `acceptance/aoe4-simulate-api*.spec.ts`. helpers.ts, the route, lib and docs are untouched. The rest of the diff against origin/main is sgs-075.
4. Pass. In api.spec, every Scope 2 case keeps its code and id:
   - unknown-id `no-such-building`
   - unsupported-tech `military-academy`
   - unknown-tech-effect `forestry`
   - invalid house/villager
   - the invalid-rules regexes keep scout, house, capital-town-center, house.\*villager, wheelbarrow.\*house and town-center

   `line N` became `steps\[0\]` or `start`. The town-center case keeps `step === 0`. No `line` assertion is left in them.
5. Pass. Edges issue-cap: 99 and 100 have no `omittedIssues` key. 101 gives omitted 1 and 200 gives omitted 100, with `step` 0..99. The combined case is 60+60 with 100 listed / omitted 20, steps 0..59, and the 40 input messages unchanged. Repeat uses 101. Contract "a real capped response validates" uses 101 bad steps via `buildOrderBody`, omitted 1. The bad step yields exactly one `unknown-id` each, proven by the 99 case listing 99.
6. **Unchecked: cannot verify.** The three tests are gone: `syntax ... carries its line`, `CRLF line endings ...`, and the paste half of issue location (renamed "a JSON step issue carries step and no line"). There is no PR yet, so I cannot check that the PR body names the covering lib test files.
7. Pass, from my own runs:
   - `npx playwright test acceptance/aoe4-simulate-api`: 317 passed.
   - `npm run acceptance`: 601 passed.
   - `npx tsc --noEmit`: clean.
   - `npm run lint:dup`: 0 clones, exit 0.
8. Pass. The diff touches no invariant-scoped path. S3 cap specs still prove the cap. A3 equality specs still compare a converted paste against hand-written JSON.

## Deleted-test coverage (verified)

- **`@1:61` syntax with line.** `lib/aoe4-build-order/parse-text.acceptance.test.ts:75-78` asserts `syntaxLines('@1:61 pause tc')` equals `[1]`, and `syntaxLines` asserts code `syntax`. No `text-to-build.test.ts` addition was needed.
- **CRLF equals LF.**
  - `parse-text.test.ts:111-116` asserts CRLF physical lines `[3,5,7]` and a step strictly equal to the LF-parsed shape.
  - `parse-text.acceptance.test.ts:103` and `:107` cover CRLF issue lines and step lines.
  - The parser treats `\r` as whitespace (`parse-text.ts:22-24`), so the start line is covered too.
  - No test compares a whole CRLF order with the LF order, but the strict step equality plus the whitespace rule cover it.
- **Paste step issue carries line and step.** `text-to-build.test.ts:32` asserts `{ code: 'invalid', message: 'line 3: stable cannot produce longbowman', step: 0, line: 3 }`, the same check-fault-on-paste case.

## Sample comparison against 7037d48 (all 12 files)

- **Warm-ups in 9 files, depletion `ORDERS`, the depletion-engine farm-free body and the waits helper.** Only the body key changed (`text` became `buildOrder: buildOrderFrom(same paste)`). The assertions are byte-identical.
- **Edges inputs block.** `inputs`, `extra: 1` and every expectation are unchanged.
- **api.spec 405 and array body.** These now send `JSON_ORDER`. The assertions are unchanged.

## Mutations (my own; both reverted, `git status` clean)

1. **Issue order.** I changed the route to build `all = [inputs issues, order issues]`. 6 tests failed, including the rewritten edges:243 "the cap applies after order issues and inputs issues are combined, order first".
2. **Inputs ignored for JSON orders.** I changed the route to `checkSimInputs(request.buildOrder !== undefined ? {} : request.inputs ?? {}, ...)`. 74 tests failed, including:
   - the rewritten edges inputs tests (104, 110, 116, 122, 128, 243);
   - all 4 depletion `ORDERS` rows;
   - 14 waits tests through the rewritten `simulate` helper;
   - depletion-engine, triggers and timelines.

   This proves the converted bodies really reach the `buildOrder` path with their inputs.

## Bot reconciliation

`reviewBot.cli` is empty and there is no rules file, so nothing to reconcile.

## Conventions

- The edges issue-cap block adds a local `order(steps)` beside its `START`. It matches api.spec's `order()` (`acceptance/aoe4-simulate-api.spec.ts:24`) and the contract spec's `buildOrderBody`. jscpd reports no clone.
- `badSteps` follows the same `Array.from` shape as the `unknownBuildings` helper next to it.

## Non-blocking notes

- **Titles that still say paste or text.** These titles now drive a converted paste through the JSON path:
  - describe "text and JSON paths" (`acceptance/aoe4-simulate-api.spec.ts:53`);
  - "a paste order with a start line ..." (:54);
  - "... the same units, steps and times as the paste" (:60);
  - edges "the research order gives the same result as paste and as JSON" (`acceptance/aoe4-simulate-api-edges.spec.ts:85`).

  The ticket kept these titles on purpose, and the assertions still fail if conversion and hand-written JSON diverge. Worth retitling in the remove-`text` ticket.
- **`paste()` helper removal.** Removing the now-unused `paste()` helper in api.spec is fine.

## Coverage

- **Reviewed:** all 12 changed spec files in full diff, plus the surrounding context in api, edges and contract. Also read `acceptance/helpers.ts:72-77` (`buildOrderFrom`), the route `pages/api/aoe4-build-order/simulate.ts`, and the lib tests cited for the deleted specs.
- **REPO.md checklist:**
  - "Every diff" asks for `next build` and loading pages. Not run: this is a test-only diff with no page or route change, and the full acceptance suite, which loads the pages, passed.
  - The AoE4 section's paths are not touched.
- **Cleanup:** no process left running; port 3847 is free.
