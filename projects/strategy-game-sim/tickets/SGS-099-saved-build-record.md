# SGS-099: Add the saved-build record, its id and the save checks

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M6 / M6.4 (validation, size cap), M6.6 (env key prefix)
- **Priority**: medium
- **Risk**: standard
- **Invariants**: A1 (no game number is written into code: the caps reuse `SIM_INPUT_BOUNDS`), S3 (the save path is bounded: the record has a byte cap and the name a length cap)
- **LOC estimate**: ~150 (new `lib/aoe4-build-order/saved-builds.ts`; a few lines in `lib/aoe4-build-order/api.ts`; business logic only, tests excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M6.md` C1 and the C3 rows that `checkSaveBuildRequest` produces (the 400 and 413 rows); `plans/M6-20261105.md` outline A

## Context

M6 saves a validated `{ buildOrder, durationSeconds }` under a content-addressed 11-character id and reads
it back. This ticket adds the pure, browser-safe module that owns the record shape, the id, the key layout
and the save checks. The stores, rate limit, routes and page (later tickets) build on it and use its names
exactly. Nothing calls it yet, so no behavior on the site changes.

## Scope

Read first: `design/M6.md` C1 and C3 (authoritative for names and behavior). Existing code used:
`buildOrderShape`, `checkBuildOrder`, `outOfRange`, `SIM_INPUT_BOUNDS` and `BuildOrderCatalog` in
`lib/aoe4-build-order/schema.ts`; `textToBuildOrder` in `lib/aoe4-build-order/text-to-build.ts`;
`formatBuildOrderText` in `lib/aoe4-build-order/parse-text.ts`; `SimulateError` and `MAX_REPORTED_ISSUES` in
`lib/aoe4-build-order/api.ts`; `BuildOrderIssue` in `lib/aoe4-build-order/model.ts`.

1. New `lib/aoe4-build-order/saved-builds.ts`, pure TS. It imports no `node:` module, React or Next, and
   uses Web Crypto (`crypto.subtle`), `TextEncoder` and `btoa`, never `node:crypto` or `Buffer`, so the
   page can import it. It exports each C1 name:
   - `SAVED_BUILD_VERSION = 1`, `savedBuildSchema` (zod, `version: z.literal(1)`, `buildOrder:
     buildOrderShape`, `durationSeconds: z.number().int()`), and `SavedBuild = z.infer<typeof
     savedBuildSchema>`. Duration bounds are not part of this schema (a read must succeed whatever the
     bounds become); they are checked on save only.
   - `SaveBuildRequest = Omit<SavedBuild, 'version'>` and `SaveBuildResponse { id: string; path: string }`.
   - `SAVED_BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/` and `isSavedBuildId(value: unknown): value is string`
     (false for any non-string).
   - `savedBuildId(record: SavedBuild): Promise<string>`: SHA-256 of `JSON.stringify(record)` as UTF-8, first
     11 characters of the unpadded base64url digest (`+` to `-`, `/` to `_`, `=` removed).
   - `storageEnv(vercelEnv: string | undefined): string`: `'production'` or `'preview'` when the input is
     exactly that, otherwise `'development'`.
   - `savedBuildKey(env, id)` is `${env}/builds/${id}.json`; `rateCounterKey(env, clientKey)` is
     `${env}/rate-limit/${clientKey}.json`; `savedBuildPath(id)` is `/apps/aoe4-build-order?b=${id}`.
   - `SAVED_BUILD_MAX_BYTES = 65_536` and `SAVED_NAME_MAX_CHARS = 100`.
   - `checkSaveBuildRequest(body: unknown, catalog: BuildOrderCatalog)` returning `{ ok: true; record:
     SavedBuild; json: string } | { ok: false; status: 400; error: SimulateError } | { ok: false; status:
     413; error: BuildsError }`. Checks run in this order and the first failing group decides; within the
     400 group the issues are ordered order issues, then duration, then name:
     1. `body` is not a plain object (including an array or `null`): 400 with `error` and the single issue
        message `request body: must be a JSON object`, issue code `syntax`. `api-route.ts` (SGS-103) is the
        one source of `isPlainObject` and `notAnObjectError`; it does not exist yet, so this ticket keeps a
        temporary private (non-exported) copy of both in `saved-builds.ts`, and SGS-103 deletes it and
        imports the `api-route.ts` ones (design M6.md C7).
     2. `checkBuildOrder(body.buildOrder, catalog)` issues (a missing `buildOrder` is reported by it).
     3. `durationSeconds` missing, not a number, or failing `outOfRange(value, 'durationSeconds')`: one
        `out-of-range` issue with no `step`, message `durationSeconds: missing`, `durationSeconds: must be
        a number`, or `durationSeconds: <outOfRange text>`.
     4. When the order is valid, `name` longer than `SAVED_NAME_MAX_CHARS` (UTF-16 length, as `textChars`
        counts): one `out-of-range` issue, message `name: <n> characters, more than 100`.
     5. If steps 2 to 4 found issues, return 400 with `error` equal to the first issue's message, `issues`
        capped at `MAX_REPORTED_ISSUES`, and `omittedIssues` only when above zero, the same shape as the
        simulate route.
     6. Build `record = { version: 1, buildOrder: <checked order>, durationSeconds }` in schema key order and
        `json = JSON.stringify(record)`. When `json` is more than `SAVED_BUILD_MAX_BYTES` UTF-8 bytes
        (`TextEncoder`), return 413 with `error` `saved build: <bytes> bytes, more than 65536`. Only `source` (no length cap)
        can reach this: a `name` is capped at 100 characters by step 4.
     7. Paste round trip: `textToBuildOrder(formatBuildOrderText(order), catalog)`. When it fails, return
        400 with its issues (capped as in step 5; `error` is the first issue's message). When it succeeds and its `steps` or `start` differ
        structurally from the record's (compare by value, ignoring key order), return 400 with one issue,
        code `invalid`, message `build order: reopening it as text would change the build; use whole
        numbers for times and counts`, and `error` equal to that message. `name`, `civ` and `source` are not compared. This second branch is a
        guard: no input `checkBuildOrder` accepts reaches it (it either re-parses equal or fails the first
        half), and it stays for a future formatter or grammar change; that is a claim about today's formatter
        and no test depends on it (the guard test uses a mock). The `textToBuildOrder` 20000-character cap
        (`text: <n> characters, more than 20000`) also fails the first half, but no valid order reaches it today
        (at most 200 steps of about 95 formatted characters is about 19,000 characters); it stays as a guard
        against a longer formatter or larger bounds and its unit case uses the same mock. A fractional `walkSeconds` such as
        `2.5` fails the first half (formatted `walk 2.5s`; the grammar accepts whole seconds only) and returns
        the `syntax` issue `line <n>: expected walk seconds like 4s, got '2.5s'` plus any issue the partial
        order adds (design M6.md C3).
     8. Otherwise `{ ok: true, record, json }`.
2. `lib/aoe4-build-order/api.ts`: add `export interface BuildsError { error: string }` and re-export the
   types `SavedBuild`, `SaveBuildRequest` and `SaveBuildResponse` from `./saved-builds` with `export type`.
   Update the file's header comment ("Request and response types for POST /api/aoe4-build-order/simulate") to
   cover the builds API types too.
   `saved-builds.ts` imports `SimulateError`, `BuildsError` and `MAX_REPORTED_ISSUES` from `./api`; the
   cycle is type-only on the `api.ts` side and must not create a runtime import cycle.
3. Input validation (common.md): the request has a nested object, so it is past the hand-check threshold.
   `buildOrder` is validated by the existing zod schema through `checkBuildOrder`; the stored shape is
   `savedBuildSchema`. `checkSaveBuildRequest` adds no hand-rolled validator for the contents of
   `buildOrder`; the envelope checks in steps 1, 3 and 4 above are the only hand checks (they reuse
   `outOfRange` and the existing issue shape).
4. New `lib/aoe4-build-order/saved-builds.test.ts` (Vitest, table style of `schema.test.ts`, `ENGLISH` from
   `test-helpers.ts`, a valid order from `listBuilds()`).
5. Docs: no existing doc becomes untrue (no behavior is exposed yet). Before writing, grep `docs/`,
   `ARCHITECTURE.md` and `README.md` for `saved-builds`, `saved build` and `BuildsError`; if any
   statement exists that this contradicts, fix it here.

**Out of scope:** the stores and `build-store.ts`, the rate limit and `clientKey`, `api-route.ts`, the
routes, the OpenAPI spec, the page, the smoke script, `@vercel/blob` and the zod `overrides`. A hash helper
shared with `clientKey` is the rate-limit ticket's concern. `savedBuildKey` and `rateCounterKey` do not
validate their arguments; the callers (the stores and routes) validate ids with `isSavedBuildId`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `saved-builds.ts` exports each name in Scope item 1 with the stated signatures. The match for node, React or Next imports is empty:
      `git grep -nE "from '(node:|react|next)" -- lib/aoe4-build-order/saved-builds.ts`.
- [x] `savedBuildId`: every id for a table of different records is exactly 11 characters matching
      `SAVED_BUILD_ID_PATTERN`. Test cases pin: the same record gives the same id twice; the same record built
      with its fields in a different object-literal order, passed through `savedBuildSchema.parse`, gives the
      same id; changing `durationSeconds`, `buildOrder.name` or one step each gives a different id. A
      `savedBuildId` that hashes a different serialization (for example, of the unparsed input) fails the
      key-order case.
- [x] `isSavedBuildId` table: `'Zx3_k9-QaB0'` true; `'abc'`, a 10-character, a 12-character string, and 11
      characters containing each of `.`, `/` and `=` false; `undefined`, `null`, a number and an array false;
      an 11-character string followed by `\n` false (pins that the pattern is anchored).
- [x] `storageEnv` table: `'production'` and `'preview'` return themselves; `'development'`, `undefined`,
      `''`, `'Production'` and `'staging'` return `'development'`.
- [x] Key tables: `savedBuildKey('preview', 'Zx3_k9-QaB0')` is `preview/builds/Zx3_k9-QaB0.json`;
      `rateCounterKey('development', 'AbCdEfGhIjKlMnOp')` is
      `development/rate-limit/AbCdEfGhIjKlMnOp.json`; `savedBuildPath('Zx3_k9-QaB0')` is
      `/apps/aoe4-build-order?b=Zx3_k9-QaB0`.
- [x] `checkSaveBuildRequest` has one test row per C3 400 or 413 row, each asserting `status` and the
      response shape:
      - `[]`, `null` and `'x'` give 400, `error` `request body: must be a JSON object`, and one `syntax`
        issue.
      - A unit id `knigt` in a step gives 400 with an `unknown-id` issue from `checkBuildOrder`.
      - `durationSeconds` of `59`, `3601`, `61.5`, missing and `'60'` each give 400 with one `out-of-range`
        issue that has no `step`, with the messages in Scope.
      - `name` of 100 characters passes and of 101 gives 400 with `name: 101 characters, more than 100`.
      - A valid order with a multi-byte `source` (for example 30,000 three-byte characters: under the cap in
        characters, over it in UTF-8 bytes) gives 413 with `BuildsError` shape and `error` `saved build: <bytes>
        bytes, more than 65536`; the same order with a short `source` gives `ok: true`. The test builds the record
        from valid steps, not by editing the constant, so it fails if the check compares characters instead of
        UTF-8 bytes. The test uses `source`, never `name` (a name is capped at 100 characters and cannot reach
        413). (respec 2)
      - A valid order and `durationSeconds` of 60 and 3600 give `ok: true`, `record.version` is 1, and
        `json === JSON.stringify(record)`.
- [x] Issue-order test: a body with an invalid order and an invalid `durationSeconds` returns the order issues
      first, then the duration issue; an order that is invalid and a 101-character name returns no name issue
      (name is checked only for a valid order); a valid order with both a bad duration and a long name returns
      the duration issue before the name issue. With more than `MAX_REPORTED_ISSUES` order issues, `issues` is
      capped, `omittedIssues` is the remainder, and `error` equals `issues[0].message`.
- [x] Round-trip test cases:
      - A valid shipped build (every entry of `listBuilds()`, as a loop) gives `ok: true`.
      - A valid order (so the order checks pass) with the same `vi.mock` of `formatBuildOrderText` as the guard
        test, its mock returning a 20001-character text once, gives 400 with the single issue `text: 20001
        characters, more than 20000` from `textToBuildOrder`, `error` equal to that message, not 413 and not
        `ok: true`. This catches a missing round-trip step. No real order is built for this row, since none
        reaches 20000 characters. (respec 2)
      - An order with `walkSeconds: 2.5` gives 400 with the `syntax` issue `line <n>: expected walk seconds
        like 4s, got '2.5s'` (the test asserts the message with the `<n>` it gets) plus any partial-order
        issues, no `invalid` issue, no 413 and no `ok: true`. (respec 1)
      - The guard branch (message in Scope step 7) is pinned with `vi.mock('./parse-text', async
        (importOriginal) => ...)` making `formatBuildOrderText` a `vi.fn` that wraps the original; for one
        test, `mockReturnValueOnce` returns the text of a different shipped build (valid, parses, different
        `steps`), and `checkSaveBuildRequest` returns 400 with the single `invalid` issue. A second case
        returns the order's own text and gives `ok: true`, so the test fails if the compare is dropped or
        always fires. No test-only export is added to `saved-builds.ts`. (respec 1)
- [x] `lib/aoe4-build-order/api.ts` exports `BuildsError` and the three re-exported types, and its header
      comment covers the builds API types; `npx tsc --noEmit`
      and `npm run lint:dup` pass with no new duplication flagged against `simulate.ts` or `schema.ts`.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-09

- Underspecified: the fractional `walkSeconds` case (the design example, one `invalid` issue, disagreed with the code) and where `isPlainObject` and `notAnObjectError` live.
- Changed: the design settled both. `walkSeconds: 2.5` returns the `syntax` parse issue; the `invalid` branch is a guard tested with a `vi.mock` of `formatBuildOrderText`; this ticket keeps a temporary private copy of the plain-object check that SGS-103 deletes.
- Existing branch work: none (no branch yet).

## Re-spec 2026-11-09 (2)

- Underspecified: the over-20000-character round-trip row had no buildable input (no valid order reaches it), the 413 row named `name` (capped, cannot reach 413), and the export criterion was a closed list.
- Changed: the 20000 row now uses the `formatBuildOrderText` mock; the 413 test uses a multi-byte `source`; step 7 states `error` for both 400 branches; the `api.ts` header comment is updated; the export criterion says "each C1 name" with the import grep (design pass 4, item 2).
- Existing branch work: none (no branch yet).

## Rework 1 - 2026-11-09 (review)

Bounced by review 1 (`reports/SGS-099-review-1.md`) at tip eb3212ea03f44ca8191859c016680692ec628e41. No earlier gate had passed the task. Production code had no defect; one test is too weak. The criterion ("`omittedIssues` is the remainder") is unchanged.

Findings:
- `lib/aoe4-build-order/saved-builds.test.ts:187-193`: `caps the issues and counts the rest` asserts only `omittedIssues > 0`. Changing `saved-builds.ts:66` to report `omittedIssues + 1` leaves all 51 tests passing.

Required fixes:
- [x] Take the uncapped issue count from `checkBuildOrder` on the same input and assert `omittedIssues === total - MAX_REPORTED_ISSUES` (and `issues.length === MAX_REPORTED_ISSUES`).
- [x] Confirm the mutation: with `saved-builds.ts:66` reporting `omittedIssues + 1`, the test fails.
