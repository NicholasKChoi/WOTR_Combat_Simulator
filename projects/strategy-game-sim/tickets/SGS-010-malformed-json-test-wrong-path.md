# SGS-010: Make the malformed-JSON validation test reach the real invalid-JSON path

- **Type**: Bug
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / none (bug follow-up from SGS-006)
- **Priority**: low
- **Risk**: low
  <!-- Test-only, one file, one component, no public surface change, a few lines. -->
- **LOC estimate**: 0 business logic; about 5 test lines in `acceptance/fight-api-validation.spec.ts`
- **Depends on**: none (base: main at 96d2602)
- **On merge**: none
- **Source**: SGS-006 implementer and review reports (`reports/SGS-006-implementer.md`, `reports/SGS-006-review.md`); `acceptance/fight-api-validation.spec.ts` test "malformed JSON runs no battle"

## Context

The test posts the string `'{"attack-regs":'` via `postRaw(request, body: string | Buffer, ...)`. Playwright
sends a string body as-is only when it parses as JSON; this one does not parse, so Playwright JSON-encodes
it and the server receives a valid JSON string. The handler then rejects it with the object-shape 400
(`request body must be a JSON object`, `validateFightForm` in `pages/api/fight.ts`), so the real invalid-JSON
rejection never runs under this test. That rejection is Next's body parser, not the handler: it answers 400
with the plain-text body `Invalid JSON` before the handler runs (documented in the 400 description of
`docs/api/openapi.json`). The test passes for the wrong reason and would still pass if the parser path broke: its assertions (status 400
and `expectNoBattle`, which returns early on a non-JSON body and otherwise checks only for no `rounds` or
`outcomes`) are equally satisfied by the handler's `{"error":"request body must be a JSON object"}` 400. Sending
a Buffer alone does not fix that; the test also needs an assertion the handler's shape 400 cannot satisfy.

The `JSON body null/[]/true/3/"x"` tests in the same file are not affected: those strings parse as JSON, so
Playwright sends them unmodified.

## Scope

- In `acceptance/fight-api-validation.spec.ts`, test `malformed JSON runs no battle` (in `body shape`):
  send the same truncated body as `Buffer.from('{"attack-regs":')` so it reaches the server unmodified.
  Add a one-line comment that Playwright JSON-encodes a non-JSON string body (hidden constraint, same idea as
  the existing comment in the empty-body test), e.g. "Playwright JSON-encodes a non-JSON string body, so send
  a Buffer to reach the parser."
- (respec 1) Keep the status 400 and `expectNoBattle` assertions, and add one negative assertion that the
  response is not the handler's object-shape rejection:
  `expect(await response.text()).not.toContain('request body must be a JSON object')`. This is what makes the
  test fail if the request reaches the handler instead of being rejected by the parser.
- (respec 1) Do not assert the exact `Invalid JSON` text here; the negative assertion above is allowed and is
  not that assertion. `acceptance/fight-api-contract.spec.ts` ("malformed JSON returns the plain-text 400 the
  spec documents") already sends a Buffer and asserts status 400 and the exact text `Invalid JSON`; that text
  contract stays owned by the contract spec. Fix in place rather than delete: the validation file is the full
  "rejected input runs no battle" matrix and should still list this case.

**Out of scope:** changing `pages/api/fight.ts` or `docs/api/openapi.json`; the contract spec; other tests in
the validation file; changing the `postRaw` helper signature.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The malformed-JSON test in the validation spec sends a `Buffer` body with `Content-Type: application/json`, so the server receives the raw truncated bytes.
- [ ] The test still asserts status 400 and that no battle ran.
- [ ] (respec 1) The test asserts the response text does not contain `request body must be a JSON object`, and does not assert the exact `Invalid JSON` text.
- [ ] (respec 1) Mutation check, run once and reverted: with the fixed test, temporarily setting `export const config = { api: { bodyParser: false } }` in `pages/api/fight.ts` (so `req.body` is undefined and the handler answers its object-shape 400) makes this test fail on the negative assertion. Separately, the pre-fix string body combined with the new negative assertion also fails, showing the old test hit the handler path. The implementer reports both results.
- [ ] `npm run acceptance` passes; no other test file changes.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-10-29

- Underspecified: the mutation criterion was unfalsifiable; with `bodyParser: false` the handler's `request body must be a JSON object` 400 still satisfied status 400 + `expectNoBattle`.
- Changed: Scope and criteria now require a negative assertion against the handler's shape-error text (explicitly allowed alongside "do not assert `Invalid JSON`"); the mutation check names the exact `bodyParser: false` mutation and expected failure; Context explains why a Buffer alone is not enough.
- Branch work: none existed; nothing to keep or discard.
