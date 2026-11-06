# SGS-097 review 1

- Branch: `sgs-097-docs-issue-messages` at 9e52088 (local branch only: `origin/sgs-097-docs-issue-messages` does not
  exist, so the review worktree was made from the SHA). Base origin/main 9274372 (merge base confirmed).
- Mode: full review.
- **Verdict: REQUEST CHANGES** (three text-only fixes; the code change and tests are correct).

## Blocking findings

1. `docs/api/openapi.json:3328` - contract (text) - The new `BuildOrderIssue.message` description lists the locations
   as an exhaustive set, "(a step as steps[N], start, inputs.<path>, civ or request)", but the route also emits other
   labels. Probed with `checkBuildOrder` on this tip: `build order: must be an object` (buildOrder `null`),
   `name: must be a string`, `source: must be a string`, `steps: must be an array`, `steps: 201 steps, more than 200`,
   and the route's own `request body: must be a JSON object` (`pages/api/aoe4-build-order/simulate.ts:39`). This is a
   sentence the diff adds that the code contradicts, the same defect the ticket set out to fix ("names the step").
   Direction: replace the description with exactly:
   `"Human-readable reason. It starts with where the issue is, followed by a colon: steps[N] for a step, an order field such as civ, name or start, build order for the whole order, inputs.<path> for an input, or request or request body for the request itself. It then names the offending id, kind or property."`

2. `docs/aoe4-build-order.md:665` - contract (text) - The same exhaustive list, "(a step or line, `start`,
   `inputs.<path>` or `request`)", which also leaves out `civ` (named in the issue-order paragraph three lines up,
   line 661), `name`, `steps` (the step-count cap), `build order` and `request body`. The new line is also
   unwrapped (about 170 characters) where the paragraph wraps near 110. Direction: replace the sentence
   "A message names where the issue is (a step or line, `start`, `inputs.<path>` or `request`) and the offending
   id, kind or property." with exactly (wrapped to the paragraph's width):
   "A message starts with where the issue is: a step (`steps[N]`) or paste line (`line N`), an order field such as
   `civ`, `name` or `start`, `build order` for the whole order, `inputs.<path>`, or, from the route, `request` or
   `request body`. It then names the offending id, kind or property."

3. `docs/api/openapi.json:1769` - contract (text) - "Two request-level messages are each a single syntax issue with no
   step: ..." implies there are only two, but the same 400 response documents a third request-level issue, the
   `notAnObject` example `request body: must be a JSON object` (openapi.json:1818-1824; route `simulate.ts:38-41`).
   The two message strings are also listed unquoted and contain a `;` and `,`, so the list does not read
   unambiguously; the sibling `SimulateRequest` description (openapi.json:2217) quotes messages with `\"`.
   Strings checked against the route: `request: missing buildOrder` (simulate.ts:25, fires when `body.buildOrder ===
   undefined`) and `request: text is no longer accepted; convert the paste to buildOrder and send that`
   (simulate.ts:22, fires on any `text` key). Both match exactly. Direction: replace the description with exactly
   (JSON-escaped):
   `"The request was rejected; nothing was simulated. A problem with the request itself is one syntax issue with no step or line: \"request: missing buildOrder\" when buildOrder is absent, \"request: text is no longer accepted; convert the paste to buildOrder and send that\" when the body has a text key, and \"request body: must be a JSON object\" when the body is not a JSON object. One exception does not match SimulateError: a body that is not valid JSON is rejected by the framework before the handler runs, with status 400 and the plain-text body Invalid JSON (no JSON content type)."`
   This still satisfies the criterion 2 jq check (both strings appear in the description).

## Spec gaps

None. The ticket's location list ("a step (`steps[N]`), `start`, `inputs.<path>`, `civ` or `request`") was incomplete
against the code; the fixes above stay inside its intent ("wording that names where the issue is") and its grep check.

## Acceptance criteria

- [pass] 1: `git grep -n "naming the step and" -- docs/api/openapi.json docs/aoe4-build-order.md` finds nothing.
  (Wording is still contradicted by the code, finding 1.)
- [pass on the check, fail on accuracy] 2 (respec 1): `jq -r '.paths["/api/aoe4-build-order/simulate"].post.responses["400"].description' docs/api/openapi.json`
  prints both exact messages (ran it; implementer had not). The diff touches no example. Contract spec run on the tip:
  67 passed, 1 failed; all four 400-example cases (`stepAndInputs`, `missingBuildOrder`, `removedText`, `notAnObject`)
  and "every 400 example has a request that reproduces it" pass. The failure is `:284` (see Out of scope). Finding 3
  applies to the description text.
- [pass] 3 (respec 1): `labelSites`/`labelCases` table at `schema.test.ts:374-389`, lengths 39/40/41/5000, `x` fill,
  whole-message `===` filter with length 1, the four expected messages exactly as specified. Mutation run: reverting
  both `shortText` calls fails exactly the 8 rows for 41 and 5000 characters (all four sites), and the 39/40 rows still
  pass. The `start.villagers` row runs only through `checkBuildOrder`, so it depends only on the `startVillagersSchema`
  call; the other three depend only on `checkSimInputs`.
- [pass] 4: no existing test edited (diff adds lines only in `schema.test.ts`); `npm test` 1511 passed, 10 skipped.
- [pass] 5: the 40-character sentence (`docs/aoe4-build-order.md:532`) now names object keys in labels; true against
  the code (`schema.ts:464`, `schema.ts:685`). No measured value stated.
- [pass on the check, fail on accuracy] 6: the Validation sentence no longer says "the step or line" only, but its
  replacement list is contradicted (finding 2).
- [pass] 7: no invariant regression.

Nothing ticked (verdict is not APPROVE).

## Invariants touched

- S3 (bounded work and response): holds and improves; a 900,000-character key now yields a label of at most 43
  characters per segment. No new input or loop.
- A1-A3: engine untouched. W*, H*: not touched.

## Code review

- `schema.ts:685` `found.path.map(shortText)`: `shortText(value: unknown)` uses `String(value)`, so numeric and
  (theoretical) symbol path segments are safe; fixed field names are under 40 characters and unchanged. Extra `map`
  arguments (index, array) are ignored by the one-parameter function. Correct.
- `schema.ts:464` `start.villagers.${shortText(node)}`: `name` feeds only `typed(...)` and `inRange(...)` labels, as
  the ticket says. Correct.
- No helper copied (imports `shortText` from `model.ts`), so the AoE4 "copied helper" checklist rule holds.

## Linter

`npx tsc --noEmit && npm run lint:dup`: clean, jscpd 0 clones.

## Review bot

`reviewBot.cli` is empty; no bot run, no `rulesFile`. Nothing to reconcile.

## Conventions

- The new table follows the adjacent `sites`/`cases` table (`schema.test.ts:347-372`): tuple-typed site list,
  `flatMap` over the same lengths, `it.each` with `%s`/`%i` title. Matches.
- Doc line wrapping: see finding 2.

## Non-blocking notes

- `labelCases` repeats the `cases` build loop (`schema.test.ts:363-368`) with a different matcher. A shared
  `byLength(sites)` builder would remove the copy; jscpd does not flag it, so leave it unless touched again.

## REPO.md review checklist

- Every diff: `npx next build` ran clean on the tip. No page or component changed, so there is no page to load.
- AoE4 build order: no copied helper or constant; doc sentences checked against the code (findings 1-3); no UI or
  layout change, so no screenshots needed.
- Other sections: paths not touched.

## Out of scope

- `acceptance/aoe4-simulate-api-contract.spec.ts:284` ("the buildOrder request example returns the documented 200
  body") fails on origin/main 9274372 too: confirmed by running that spec line on a detached 9274372 checkout. The
  documented 200 example has drifted from the real response after 9274372 "Keep villager producers making villagers
  until 100 exist" (diff shows a population/cap series `100,100` vs real `150,...,200`, and a villager count `2` vs
  `3`). `goldRunOut` passes. Needs a ticket to regenerate the `buildOrder` 200 example in `docs/api/openapi.json`.
- The branch has not been pushed to origin; the manager or implementer must push before the PR.

## Coverage

Reviewed: `lib/aoe4-build-order/schema.ts`, `lib/aoe4-build-order/schema.test.ts`, `docs/api/openapi.json` (both edited
descriptions and the 400 examples), `docs/aoe4-build-order.md` (both edited paragraphs and their neighbours),
`pages/api/aoe4-build-order/simulate.ts`, `lib/aoe4-build-order/model.ts` `shortText`. Ran: lint, `npm test`,
`next build`, the contract spec on the tip and `:284` on origin/main, a mutation run, and a scratch probe of order
labels (deleted). The On merge `design/M4.md` edits are state-dir and not reviewed here.
