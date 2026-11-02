# SGS-060: Rewrite the API acceptance specs to send `buildOrder` instead of `text`

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.1
- **Priority**: high
- **Risk**: standard
  <!-- Test-only: no production file changes, no strongModelTriggers item. Not low because it rewrites about
       60 request bodies across 11 specs (more than ~100 lines of edits) and sits next to S3 (the cap and
       size specs). -->
- **Invariants**: S3 (the issue-cap, 20000-character and 1 MB specs keep proving every request is bounded; the ones that depend on the `text` rule are left for the remove-`text` ticket, so no bound loses its test here), A3 (the paste-versus-JSON equality specs keep proving the same order gives the same result)
- **LOC estimate**: about 150 changed lines of test code across 11 spec files (no business logic)
- **Depends on**: SGS-075 (adds `buildOrderFrom` to `acceptance/helpers.ts` and swaps the route to `checkBuildOrder`, which gives a bad JSON step one issue); transitively SGS-057
- **On merge**: none
- **Source**: M4 design Behavior rules "API test rewrite" rows `which`, `how`, `when` (`design/M4.md`) and "M4.1 ticket order" row 4; plan outline E1 as split by designer pass 3 (`reports/M4-designer-3.md`: Spec gaps 1, "Outline changes" 1)

## Context

The route still accepts `text` after SGS-075 (a temporary branch), but a later ticket removes it and the page stops sending it in
SGS-059. Every API spec that builds its order from a paste must therefore send the converted `buildOrder`
first, so the removal diff is small and the suite passes before and after this ticket with the route unchanged.

## Scope

All paths are relative to the repo root. Facts below are from origin/main `d5c2549`; the specs listed are the
11 that have a `text` request body (`git grep -nE "\btext *[:,}]" -- 'acceptance/aoe4-simulate-api*.spec.ts'`
prints 75 lines today). Helper contract (SGS-075): `acceptance/helpers.ts`
`export function buildOrderFrom(text: string): BuildOrder`, which throws with the joined issue messages when the
text does not convert. Specs import `buildOrderFrom` from `./helpers`; they never call `textToBuildOrder`.
`acceptance/helpers.ts`, the route, `api.ts`, `docs/` and OpenAPI are not edited.

**1. Bodies that only used `text` to make a valid build.** Send `{ buildOrder: buildOrderFrom(<same paste>), ...rest }`
and keep the assertion unchanged. This covers every `{ text: <paste> }` body in:
- `aoe4-simulate-api.spec.ts`: warm-up (`beforeAll`), the two `PASTE` bodies in "text and JSON paths", the
  `PASTE` + `durationSeconds: 59` body in "a JSON start issue and an inputs issue carry neither step nor line",
  the three "passing neighbour" bodies, the 405 body `data: { text: PASTE }`, and the non-object body
  `[{ text: PASTE }]` (becomes `[{ buildOrder: JSON_ORDER }]`).
- `aoe4-simulate-api-edges.spec.ts`: warm-up, every `VILLAGERS_TEXT`, `RESEARCH_TEXT` and `START_LINE` body in
  "result shape" and "inputs" (including the `inputs: null`, `inputs: 'x'`, trips and `durationSeconds` cases and
  the `extra: 1` body), keeping `inputs` and extra keys beside `buildOrder`. The "research order gives the same
  result as paste and as JSON" test keeps comparing `buildOrderFrom(RESEARCH_TEXT)` against `RESEARCH_ORDER`.
- `-depletion.spec.ts`: warm-up and the three `ORDERS` entries with `text` (the table's `{ inputs, ...rest }`
  merge keeps working).
- `-depletion-engine.spec.ts`: warm-up and the `text` body in "leaves orders without a farm build exactly as before".
- `-markers`, `-research`, `-spend-population`, `-timelines`, `-triggers`: the one warm-up post in each.
- `-waits.spec.ts`: the warm-up, and the local helper `simulate(request, text, inputs)`, which keeps its signature
  (its about 20 call sites and the `lines(...)` helper do not change) and posts
  `{ buildOrder: buildOrderFrom(text), inputs }` inside.

**2. Rejection specs that used a paste to produce a check-level fault.** The fault is not grammar, so rewrite the
body to a JSON `buildOrder` literal with the same fault and keep the issue `code` and the named id in the
assertion. A `line N` part of a message regex becomes the JSON label: `steps\[i\]` for a step and `start` for the
start. Write the literal by hand from the step shapes in `lib/aoe4-build-order/model.ts`; the file already has
`order(steps, start)`. In `aoe4-simulate-api.spec.ts`:
- `unknown-id: an unknown producer` (`produce villager from no-such-building`), `unsupported-tech: military-academy`,
  `unknown-tech-effect: forestry`, `invalid: a producer that cannot produce the unit`;
- the "invalid rules" cases `start.villagers summing to 5`, `rally on a produce of scout`, `a rally step on house`,
  `no start.rally while English starts with capital-town-center`, `produce villager from house`,
  `research wheelbarrow at house`, and `a build of town-center with no start.rally and no earlier rally source`
  (its `step === 0` assertion stays).

**3. Cases deleted because other tests cover them.** Each is a test of paste grammar or of `line` on a 400, which
the design assigns to the text tests:
- `syntax: a paste line that does not parse carries its line` (`@1:61 ...`): covered by the `line` cases in
  `parse-text.acceptance.test.ts` and `text-to-build.test.ts`. If the implementer finds no case there with a
  parse issue on a `@m:ss` trigger, it adds one to `text-to-build.test.ts` instead of keeping the spec.
- `CRLF line endings give the same result as LF` in the edges spec: covered by `parse-text.test.ts` (line 112)
  and `parse-text.acceptance.test.ts` (lines 103 and 107).
- In `issue location`, the paste half of `a paste step issue carries line and step; the same fault as JSON carries
  step and no line` (the JSON half stays under a title that says only that). `text-to-build.test.ts` covers `line`
  on check issues.

**4. The issue-cap specs.** They used 99 to 250 junk paste lines to get that many issues. Rewrite them to send
`buildOrder` whose `steps` are N copies of one step that fails exactly one field, for example
`{ action: 'produce', producer: 'capital-town-center', unit: 'no-such-unit-<i>' }` (one `unknown-id` each), and
assert `step` where they asserted `line` (`step` is `i`, the `line` expectation `1..100` becomes `0..99`).
Counts 99, 100 and 101 stay (omitted 0, 0, 1). The 250 case becomes 200, the step maximum (omitted 100), because a
JSON order of more than 200 steps is itself an `out-of-range` issue. The "combined, paste first" case becomes 60 bad
steps plus the 60 `influenceCoverage` inputs issues with the same 100 / 20 expectation. "A capped body is the
same on repeat" uses 101 bad steps. The same rewrite applies to `aoe4-simulate-api-contract.spec.ts`
"a real capped response validates" (101 bad steps via the existing `buildOrderBody`, `omittedIssues` 1).

**5. Specs left unchanged for the remove-`text` ticket (they test the old `text` rules or the transport).** These
keep their `text` bodies and are not edited, so after this ticket `git grep -nE "\btext *[:,}]" --
'acceptance/aoe4-simulate-api*.spec.ts'` prints exactly these 16 lines:
- `aoe4-simulate-api.spec.ts` (6): `both text and buildOrder`, `text null beside buildOrder counts as both`,
  `text that is not a string`, `out-of-range: text of 20,001 characters ...`, `text of exactly 20,000 characters ...`,
  and the 1 MB body `JSON.stringify({ text: 'x'.repeat(1024 * 1024) })`.
- `aoe4-simulate-api-edges.spec.ts` (3): `text null alone`, `a numeric text`, and the 900,000-character `text` body.
- `aoe4-simulate-api-contract.spec.ts` (5): the `pastedStep` and `pasteSyntax` entries of `errorRequests` (they
  reproduce OpenAPI 400 examples), `text over maxLength is schema-invalid ...`, `both text and buildOrder ...`,
  and the `simulateRequest` type map line (`text: true`). The `the text request example returns the documented
  200 body` test uses `requestExamples.text`, which is OpenAPI text; it is not edited.
- `aoe4-simulate-api-waits.spec.ts` (2): the helper's parameter `text: string` and the `simulate(request, text, ...)`
  call at the end.
The raw-string bodies (`'{"text":'`, `'{"text": "start 6 sheep'`, the `text/plain` Buffer) stay as they are.

**6. Tests the implementer lists.** The PR body lists every spec title that is rewritten (sections 2 and 4),
deleted or trimmed (section 3), with the old and new expected message where it changed.

**Out of scope:** `acceptance/helpers.ts` (SGS-075 adds `buildOrderFrom`; SGS-059 adds `runRejected`); every page
spec (`aoe4-build-order*.spec.ts`, `aoe4-step-table.spec.ts`, SGS-059); the route, `api.ts`, OpenAPI, docs and
`lib/`; the specs and OpenAPI examples that test the old `text` rules (section 5, replaced in the remove-`text`
ticket); `aoe4-simulate-api-knight-longbow-build.spec.ts` and `-spear-longbow-build.spec.ts` (no `text` body);
`SIM_INPUT_BOUNDS` import in the contract spec (SGS-057, SGS-075).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `git grep -nE "\btext *[:,}]" -- 'acceptance/aoe4-simulate-api*.spec.ts'` prints 75 lines today and exactly the 16 lines of Scope 5 after the change (api 6, edges 3, contract 5, waits 2); no other spec file has a `text` request body.
- [x] Each of the 10 specs that convert a paste (`aoe4-simulate-api`, `-edges`, `-depletion`, `-depletion-engine`, `-markers`, `-research`, `-spend-population`, `-timelines`, `-triggers`, `-waits`) imports `buildOrderFrom` from `./helpers`; `git grep -n "textToBuildOrder" -- 'acceptance/*.spec.ts'` prints nothing; the waits `simulate(request, text, inputs)` signature is unchanged.
- [x] `git diff --name-only origin/main` lists only files under `acceptance/aoe4-simulate-api*.spec.ts` (plus, only if Scope 3 requires it, `lib/aoe4-build-order/text-to-build.test.ts`); `acceptance/helpers.ts`, `pages/`, `lib/` (other than that file), `docs/` and page specs are untouched.
- [x] Every rewritten check-fault spec in Scope 2 still asserts the same issue `code` and the same named id (unit, producer, tech, building) as before, and none of those specs asserts a `line N` message or a `line` property.
- [x] The issue-cap specs assert 99 and 100 issues with no `omittedIssues` key, 101 issues giving 100 listed and `omittedIssues` 1, 200 issues giving 100 listed and `omittedIssues` 100, the first 100 `step` values equal `0..99`, and the combined case 100 listed with `omittedIssues` 20; each bad step yields exactly one issue (verified by the 99-issue case listing 99).
- [ ] The three deleted or trimmed tests of Scope 3 no longer exist, and the PR body names the lib test file that covers each.
- [x] With the route unchanged, `npx playwright test acceptance/aoe4-simulate-api*.spec.ts` passes; `npx tsc --noEmit` and `npm run lint:dup` pass; `npm run acceptance` passes (Node 24).
- [x] No INVARIANTS.md regressions

## Open questions

None. (If SGS-075's `buildOrderFrom` or its one-issue-per-bad-step check differs from its ticket, this ticket follows the merged names; the manager re-specs only if the difference changes Scope 4.)

## Re-spec 2026-11-02

- Underspecified: SGS-057 was split; `buildOrderFrom`, the `checkBuildOrder` route swap and the temporary `text` branch are SGS-075.
- Changed: Depends on SGS-075 (transitively SGS-057); helper and route-swap references point to SGS-075.
- Stands: all Scope and criteria.
