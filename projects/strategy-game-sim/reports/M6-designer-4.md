# M6 designer pass 4

Design: `design/M6.md`, amended in place. Only the three spec-gate points below were changed.

## 1. C3 OpenAPI names: `SavedBuild` / `SavedBuildWithId` (SGS-103 gap 1)

- Confirmed `docs/api/openapi.json` on main is `openapi: 3.1.0`, and the contract specs use `ajv/dist/2020`
  with `strict: false`, so `unevaluatedProperties` works.
- C3 "OpenAPI names" now has a schema table:
  - `SavedBuild`: `version` (const 1), `buildOrder` ($ref `BuildOrder`), `durationSeconds` (integer). All three
    are required and described. It sets no `additionalProperties`, so it is open.
  - `SavedBuildWithId`: `allOf [ $ref SavedBuild, { properties: { id: pattern ^[A-Za-z0-9_-]{11}$ }, required: [id] } ]`
    with `unevaluatedProperties: false`. It is closed.
  - `SaveBuildResponse` and `BuildsError`: closed with `additionalProperties: false`.
  - `SaveBuildRequest`: request side, not checked for being closed.
- The contract check now asserts four things:
  - the live GET body validates against `SavedBuildWithId`;
  - that body with an extra property, or without `id`, fails;
  - the closed response-side schemas are exactly `SaveBuildResponse`, `BuildsError` and `SavedBuildWithId`;
  - `SavedBuild` requires every property and is open.
- The `$ref` points at the whole `SavedBuild` schema, so the reference walk finds it.
- Tickets: SGS-103 (Scope item 7 and the contract criteria).

## 2. C3 save checks: 20000-character and 413 examples (SGS-099 gap 1, and gap 2 for 413)

- Round trip part 1 now starts with the `walkSeconds: 2.5` example.
- The row now says no valid order reaches the 20000-character cap today. The bound is 200 steps of about
  95 characters each, so about 19,000 characters.
- The cap stays as a guard. Its unit case mocks `formatBuildOrderText` to return 20001 characters once and expects
  `text: 20001 characters, more than 20000`, with no 413.
- The 413 row now says only `source` can reach the limit, because `name` is capped at 100 characters.
- Its example is a valid order with a `source` of 30,000 three-byte characters. The same order with a short
  `source` saves.
- Tickets: SGS-099 (round-trip and 413 criteria). SGS-103 only if it copies those examples.

## 3. Auto-run controller rules (SGS-100 gaps 1-3 and the smaller points)

- **Fire ordering, new definition.** "Abort the in-flight request" always means three steps:
  - abort its AbortController;
  - clear `inflightKey`;
  - increase `seq`, so the response or a pending body read is stale.

  Rules 1, 3, 4 and 5 all use it. Rule 5's new request takes the new `seq`.
- **Rule 4 (a).** Rule 4 aborts any in-flight request, as rule 3 does, and status stays `rejected`. With the
  lifetime rule below, rule 4 matches only while status is `rejected`, when nothing is in flight. So the abort is a
  guard; no test can reach it through the public API.
- **New row: `rejectedKey` lifetime (b).** I chose to clear on leaving `rejected`:
  - `rejectedKey`, `serverIssues` and `omittedIssues` are set together by a readable 400.
  - They are cleared together by every transition to a status other than `rejected`: rules 1, 3, 5, a 200, a
    failure, and retry. Only rule 4 keeps them.
  - Sample 1: K1 400, then K2 fails, then K1 settles again. K1 is re-POSTed.
  - Sample 2: K1 rejected, then an edit and undo within 500 ms. Rule 4 applies and no POST is sent.
  - The retry row was updated to match.
- **Response staleness (c).** The check runs when `deps.post` settles. It runs again after `response.json()` or
  `readRejection` resolves, before any state change or `onChange`.
- **New response row.** An `AbortError` on the latest request that the controller did not cause is a network
  error, so status becomes `failed`.
- **New create row (d).** `onChange` never fires during create. The caller reads `getState()` after create returns.
- **useAutoRun ownership (e).** The hook creates the controller in a mount `useEffect`, never during render. Then:
  - It copies `getState()` into React state.
  - The cleanup calls `dispose`, which also covers the dev double mount.
  - Before the effect runs, the hook returns `loading` with `settled` equal to the args, `conversion`,
    `durationError` and `request` computed from the args, and the other fields null or empty. `flush` and `retry`
    do nothing until then.
- **Unit test layout.** Added cases:
  - a response superseded or disposed while its body read is pending;
  - the two `rejectedKey` lifetime samples;
  - create calling no `onChange`.
- Tickets: SGS-100 (controller criteria for rule 4, lifetime, the body-read check, AbortError, create).
  SGS-102 (hook creates in an effect and copies `getState()` after create; it already states the pre-effect
  `loading` state).
- No change for SGS-101, SGS-104, SGS-105 or SGS-106.
