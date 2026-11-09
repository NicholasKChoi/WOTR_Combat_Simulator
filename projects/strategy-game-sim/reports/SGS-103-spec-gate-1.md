# SGS-103 spec gate 1

Ticket: `tickets/SGS-103-builds-api-routes.md`. Milestone M6, design `design/M6.md` (C3, C4, C7). Checked
against `origin/main` (1e6d6c2) and the Depends-on tickets SGS-099 and SGS-101 as drafted.

## Verdict: NEEDS_SPEC

Two gaps would make an implementer guess or fail a criterion. Both are fixable in the ticket without the owner.

## Gaps

1. **Scope item 7 (`SavedBuildWithId`) and the contract criteria - the composition cannot be built as written.**
   - Missing: Scope says `SavedBuild` is a closed schema (response-side schemas are closed, and the contract
     criterion checks `SavedBuild` is closed and requires every property). It also says `SavedBuildWithId` is
     closed, is `SavedBuild`'s properties plus `id`, "composed so `SavedBuild` stays referenced", and that the live
     body (with `id`) validates. With `SavedBuild` having `additionalProperties: false`, an `allOf` of
     `[$ref SavedBuild, {id}]` rejects `id` (the closed branch does not know it), and `unevaluatedProperties`
     in the outer schema cannot see through a closed branch either. A `$ref` to
     `#/components/schemas/SavedBuild/properties/version` does not count as referencing `SavedBuild` in the
     surface spec's "references every schema" walk (it strips the prefix and gets `SavedBuild/properties/...`).
     The design C3 sentence has the same contradiction.
   - Why an implementer would guess: they must pick which of three stated constraints to break (closed
     `SavedBuild`, `SavedBuild` referenced, live body validates), and the contract spec then either fails or
     is edited to fit.
   - Proposed fix: state the technique. For example: `SavedBuild` requires every property, describes each, and
     sets no `additionalProperties` keyword (open, so it can be composed); `SavedBuildWithId` is
     `{ allOf: [{ $ref: SavedBuild }, { properties: { id: { type: string, pattern: SAVED_BUILD_ID_PATTERN,
     description }, required: [id] } ], unevaluatedProperties: false }`. Then the contract criterion reads: the
     closed response-side schemas are `SaveBuildResponse`, `BuildsError` and `SavedBuildWithId` (the last through
     `unevaluatedProperties: false`); `SavedBuild` requires every property but is open; a GET body with an
     added property or without `id` fails `SavedBuildWithId`. Amend design C3 "OpenAPI names" to match (the
     ticket agent may do that, no owner decision is needed). Note Ajv runs with `strict: false` in the existing
     specs and `ajv/dist/2020` supports `unevaluatedProperties`.

2. **Acceptance criterion 2 (One source) - the grep contradicts the end state.**
   - Missing: `git grep -n "must be a JSON object" -- lib pages ':!*.test.ts'` must match only `api-route.ts`, but
     `pages/api/fight.ts:67` on main contains `request body must be a JSON object` (no colon), which this
     pattern also matches. The criterion fails on an unchanged file that Scope says to leave alone.
   - Why: the implementer cannot satisfy it without touching `fight.ts` (out of scope) or silently weakening it.
   - Proposed fix: search the exact text, `git grep -n "request body: must be a JSON object" -- lib pages
     ':!*.test.ts'`, and keep "every match is in `api-route.ts`"; or allow `pages/api/fight.ts` as the
     criterion already does for the other two greps.

## Notes (non-blocking)

- Exact export lists ("exactly six names", "exactly `saveBuildReply` and `savedBuildReply`", the exact path
  list and schema list) are design-doc constants, so they pass the staleness rule. What matters is the property:
  `api-route.ts` is browser-safe and does not export `englishCatalog`; the grep criteria already cover it.
- Scope item 8, `english-catalog.test.ts`: "the memo test moves here from `api-route.test.ts`" - `api-route.test.ts`
  is new in this ticket and has no memo test. Drop the clause.
- The `Invariants` field paraphrases S3 as "every save is bounded"; INVARIANTS.md S3 is "every simulation request
  finishes in bounded time". The adjacency is fine (the simulate route keeps its caps), but quote the entry
  rather than re-define it.
- `playwright.config.ts`: `{ ...process.env, BUILDS_LOCAL_DIR }` has values typed `string | undefined`, which
  `webServer.env` (`Record<string, string>`) rejects under `strictNullChecks`; the implementer needs a filter or
  `Object.fromEntries`. A developer shell with `VERCEL_ENV=production` would make DELETE answer 405 in the live
  spec; consider also removing `VERCEL_ENV` from that environment.
- `postBuildRaw` must send `Content-Type: application/json` (as `postSimulateRaw` does) or the 128 kb body
  limit and the framework `Invalid JSON` 400 are not exercised. Say so in Scope item 9.
- CONTEXT.md "Key surfaces" lists only the fight and simulate routes; the manager may add the two builds routes
  after merge (not required for correctness).
- Existing title in `fight-api-spec-surface.spec.ts` ("lists /api/fight and /api/aoe4-build-order/simulate") will
  be stale text when its path list changes; edit the title with the value.

## Check results

| # | Check | Result |
|---|-------|--------|
| 1 | Grounded scope | Pass. `simulate.ts`, `simulate-api.acceptance.test.ts` (recording `res` has `status`, `setHeader`, `json` only), `playwright.config.ts`, `helpers.ts`, the version pins in `aoe4-gathered-resources.spec.ts` and `aoe4-simulate-api-issue-shape.spec.ts`, and the paths and schema lists in `fight-api-spec-surface.spec.ts` exist on main. New files are marked new. Next 16 docs confirm `bodyParser.sizeLimit` and `req.query`. `requestExamples` has exactly `buildOrder` and `goldRunOut`, so the loop change covers the whole set. |
| 2 | Testable criteria | One gap (grep, gap 2) and one build-feasibility gap (gap 1). Counts and lists are design constants or rules. Rule for existing tests is stated (version, paths, schema names take the new value; others unchanged). |
| 3 | Open questions | None in the ticket or CONTEXT.md. |
| 4 | Invariants | S3 and A3 named; no criterion contradicts them. Wording note above. |
| 5 | Contracts | Matches design C3, C4, C7, and SGS-099 (`checkSaveBuildRequest`, `BuildsError`, the temporary private copy it says SGS-103 deletes) and SGS-101 (`BuildStore`, `buildStoreFromEnv`, `clientKey`, `takeSaveSlot`; Playwright env left to this ticket). One design inconsistency: gap 1. |
| 6 | Dependencies and size | Stated (SGS-099, SGS-101). About 180 lines of business logic. |
| 7 | Diagrams | Triggers do not fire (one component, no core loop); design holds the data flow. |
| 8 | Lessons | Repo lesson (Playwright layout reads) does not apply. Project LESSONS.md is empty. |
| 9 | Decisions | CONTEXT.md Decisions is empty; body agrees with the design and OD-2 (a), OD-8 (a). |
| 10 | On merge | `none` is right: no new factory command, harness or Decisions rule. |
| 11 | Risk | `standard` is right: new contract with exact names in the design, 180 lines, the simulate handler's responses stay byte-identical, `simulateBuildOrder` and other criticalPaths symbols untouched, the OpenAPI example fix is documentation. |
| 12 | Docs | In Scope: `docs/aoe4-build-order.md` Route section, `ARCHITECTURE.md` Where files go, OpenAPI. Grep of docs, README and ARCHITECTURE on main finds no statement the change makes untrue. |
| 13 | Input validation | Pass. The save request is past the threshold and goes through SGS-099's zod-backed `checkSaveBuildRequest`; `id` uses `isSavedBuildId`; no hand-rolled validator added. |
