# SGS-003 spec gate, pass 2

Verdict: READY

Read: ticket, prior gate report, respec report, REPO.md, both LESSONS.md (empty), PROJECT.md, CONTEXT.md,
INVARIANTS.md, spec-checklist, SGS-001/002/004/005/006 tickets, TASK-GRAPH, and at origin/main d54af2e
`pages/api/fight.ts`, `army.js`, `combat-simulator.js`. I also read the installed Next 12.1.6
`api-utils/node.js` to check the body-parser claims.

## Prior gaps

| # | Gap | Status |
|---|-----|--------|
| 1 | Unit-counting rule and leaders disabled at the cap | Closed. The rule is stated as regs+elites <= 10, leaders not counted. Leaders are never disabled. The 10/0/5 vs 0/10/5 and 6/4/5 cases are 200. |
| 2 | Leaders <= 5 server rule | Closed. It is a field range check. Leaders 5 is 200 and 6 is 400 naming the field. |
| 3 | UI cannot reach 10 | Closed. Regulars and elites run 0-10. The disabled-option arithmetic is exact. Selected values can never be disabled, since v+other <= 10 holds for the current value. |
| 4 | Order and body edge cases | Closed. The order is method, body shape, fields in fixed order, then side attack before defend. Encodings are defined. Five precedence cases cover the order. |
| 5 | Unobservable criteria | Closed. Each is rewritten to a concrete check: absence of `rounds`/`survivor`, `Number.isFinite`, a 1s timeout, no `pageerror`, `role="alert"` plus the intercepted text, and the "Army Results" heading. |
| 6 | Stale result and fetch rejection | Closed. Any failure clears the result, the whole request is in try/catch, and the generic message includes the status. |
| 7 | W1 and the design doc | Closed. W1 is named as adjacent, and the bounds cite CONTEXT.md Decisions. SGS-001 reconciliation is a stated precondition. `docs/` and openapi are explicitly out of scope. |

## Checks
- **Grounded scope.** `handler`, `parseFightForm`, the `Results` import (line 2), `submitFight`, `console.log(response)`, the selects' `name`s, and the 0-9 options all match main. `acceptance/` and the SGS-002 helpers are new in SGS-002, which is declared as a dependency.
- **Next body-parser claims verified in source.**
  - An empty JSON body becomes `{}`.
  - Malformed JSON gives a 400 with the text `Invalid JSON`.
  - `text/plain` or no content type gives a string.
  - JSON `null`, `[]` and primitives pass through to the handler.
- **Criteria.** All are observable. Spot-checked arithmetic and precedence:
  - regs 6 disables elites 5-10;
  - elites 7 disables regs 4-10;
  - attack 0/0/0 with defend 6/5/0 names `attack`, because the attack side is checked first.
- **Open questions.** Q6 is the only open one. See the next section.
- **Invariants.** S3 is enforced and W1 is respected. W2 is untouched because `Battle` is unchanged. No criterion contradicts any of them.
- **Contracts.** Field names match CONTEXT.md Key surfaces. `{ error: string }` with 400/405 matches the CONTEXT Decision. The ticket leaves the Key surfaces and openapi updates to SGS-006 and says so.
- **Size and dependencies.** About 150 lines of business logic. Dependencies are stated, and the graph row matches.
- **Diagrams.** A single-component change with no control-loop change. No diagram is acceptable.
- **Lessons.** Both files are empty.
- **Risk.** `high` is correct. The triggers are "touches an invariant" and "changes a public API contract". `criticalPaths` is empty.

## Q6 (malformed-JSON wrapping): does not block
- It is edge behavior, not the main path.
- The ticket says what happens meanwhile: accept Next's plain-text 400, and assert only the status and absence of `rounds`/`survivor`.
- The criterion and the out-of-scope line are consistent with that.
- Wrapping it would need `bodyParser: false`, which is a separate decision, so deferring it is safe.
- Action for the manager: carry Q6 to SGS-006, so the OpenAPI 400 schema notes the exception.

## New gaps
None blocking.

## Notes (non-blocking)
1. **Precondition on SGS-001.**
   - The SGS-003 ticket requires SGS-001's bounds to be reconciled first.
   - SGS-001 Scope item 6 still reads "Per-field limits and whether leaders count ... are Open question 2" and documents the UI as 0-9. Its resolved list already says leaders are not counted.
   - CONTEXT.md "WOTR inputs" says "10 units in total", and the later "WOTR caps" line refines it.
   - Keep the manager's SGS-001 re-spec ahead of SGS-003 dispatch. Otherwise W1 would have a stale doc while this ticket forbids editing `docs/`.
2. **Raw-body helpers.** The SGS-002 helper posts an object via `data:`. The body-shape and malformed cases need raw payloads.
   - Cases: the bodies `null`, `[]`, `true`, `3`, `"x"`, an empty body, `text/plain`, and `{"attack-regs":`.
   - Playwright needs a string `data` plus an explicit `Content-Type` header for these. An object `data` is auto-serialized.
   - The ticket allows sibling helpers, so the implementer is not blocked. One sentence would remove a guess.
3. **Hedged helper wording.** Scope 4 says "if SGS-002 created the shared module". SGS-002's respec makes `acceptance/helpers.ts` mandatory, so the hedge is harmless but stale.
4. **`Results` import.** "Remove only if that hunk is already being edited" is ambiguous. Line 2 is not in an edited hunk, so it is effectively a no-op. Either say "leave it" or "remove it".
5. **Precedence assertion.** For the last precedence case (attack 0/0/0, defend 6/5/0), also assert that `error` does not contain `defend`. That makes the ordering check discriminating.
6. **Form-encoded bodies.** Next parses `application/x-www-form-urlencoded` into an object of strings, so such a body is accepted if its fields are valid. This is harmless and undocumented. Bodies over 1 MB get Next's own 413. Neither needs a case.
7. **Stale reference in SGS-005.** SGS-005 line 40 says "Keep SGS-004's validation and 405 behavior". It should say SGS-003. That belongs to SGS-005's own gate.
8. **"Army Results" locator.** Use `exact: true`, as SGS-002 does. The page also has an `<h2>Results</h2>`.
