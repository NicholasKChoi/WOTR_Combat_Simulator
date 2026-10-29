# SGS-003 re-spec 1 (2026-10-28)

**Ticket:** `tickets/SGS-003-validate-fight-inputs.md`. Status should move from `needs_spec` back to spec gate.

**Read:**
- the spec-gate report;
- CONTEXT.md Decisions;
- INVARIANTS.md;
- spec-checklist;
- the SGS-001, SGS-002, SGS-004, SGS-005, and SGS-006 tickets;
- at origin/main d54af2e: `pages/api/fight.ts`, `components/apps/combat-simulator/army.js`, `pages/apps/combat-simulator.js`, `results.js`, `pages/api/models/army.ts`;
- the Next 12.1.6 body parser (`node_modules/next/dist/server/api-utils/node.js`).

## Gap-by-gap resolution

1. **Unit-counting rule.** The rule now reads "regulars + elites <= 10 per side, leaders not counted" everywhere. The UI criterion keeps leaders 0-5 selectable at the cap. Added 10/0/5 vs 0/10/5 as accepted, and 6/4/5 as accepted to prove leaders are not counted.
2. **Leaders <= 5 on the server.** This is a field-level range check (0-5), returning 400 with an error that names the field. Criteria: 5 is 200, 6 is 400, and 10/0/5 is 200.
3. **UI cannot reach 10.**
   - Regulars and elites now run 0-10 as controlled selects. An option is disabled when it would push the side's sum over 10.
   - Leaders run 0-5 and are never disabled.
   - Criteria cover 10 being selectable, the exact disabled ranges, and side independence.
4. **Validation order and body edge cases.** The order is fixed, and the first failure wins:
   1. method (405);
   2. body is a plain object (generic 400);
   3. fields in fixed order, each checked for presence, then format, then range (0-10, or 0-5 for leaders), with the error naming the field;
   4. attack side, then defend side, each checked for sum <= 10 and then sum >= 1, with the error naming the side.

   Encodings: a JSON number must satisfy `Number.isSafeInteger(v) && v >= 0`. A string must match `/^[0-9]+$/`, with leading zeros allowed. The range check bounds long digit-strings, so no length limit is needed.

   Next 12.1.6 parsing facts, verified in its source:
   - An empty JSON body becomes `{}`, so the error names `attack-regs`.
   - A `text/plain` body or one with no content type arrives as a string, so it fails the body-shape check.
   - Malformed JSON gets Next's plain-text `Invalid JSON` 400 before the handler runs. The ticket accepts this, and it is now Open question 6.

   A precedence criterion was added with five concrete cases.
5. **Unobservable criteria, now rewritten:**
   - "No battle runs" means the response has no `rounds` or `survivor` key.
   - The large-value bound is a 1-second request timeout.
   - "No uncaught rejection" means no `pageerror` event.
   - Finite statistics are checked with `Number.isFinite` on both averages of every 200 in the specs.
   - The error element has `role="alert"`, and the spec locates it by role plus text equal to the intercepted server `error`.
   - Results absence is checked as absence of the "Army Results" heading.
6. **Stale results and fetch rejection.**
   - Any failure clears the previous result.
   - The whole request is in `try/catch`. On rejection or an unparseable 200, a generic message shows.
   - A non-JSON error body shows a generic message with the status.
   - The error is cleared on each submit start.
   - The `page.route().abort()` criterion was added.
7. **W1 and the design doc.**
   - W1 is listed as adjacent (Risk comment and invariants criterion).
   - The bounds cite CONTEXT.md Decisions. The ticket says SGS-001 is reconciled before it starts, and it explicitly does not edit `docs/combat-simulator.md`.
   - CONTEXT.md Key surfaces and `docs/api/openapi.json` are out of scope, because SGS-006 records the contract.

**Notes folded in:**
- `HEAD` and `OPTIONS` are included in the 405 criterion.
- `setHeader('Allow', 'POST')` must come before `status(405).json`.
- SGS-002 helpers are reused. If the shared module does not exist, this ticket creates it.
- `Results` import line corrected to line 2.

## Other changes
- LOC estimate went from about 120 to about 150, because the selects become controlled and error state is added. Risk stays high.
- `console.log(response)` is now removed unconditionally, since it is in the touched hunk.
- The `takeHit` path (more than 5 units with 0 regulars drives regulars negative) is now reachable with 10 elites from the UI. It is explicitly out of scope and owned by SGS-004 per CONTEXT.md Decisions.

## Open questions
- **Q6 (owner):** wrap Next's malformed-JSON plain-text 400 in `{ error }`? That requires `bodyParser: false` and hand parsing. Currently accepted as-is.

## Overlap
- **SGS-001:** its ticket text (item 6) still says "army max 10 units total", leaves the leader question open, and documents the UI as 0-9. The manager is re-speccing it. SGS-003 depends on it.
- **SGS-004:** serializes on `fight.ts`. Owns the `takeHit` negative-regulars fix.
- **SGS-005:** adds `battles` validation in the same style. SGS-003 ignores unknown keys, so `battles` passes through.
- **SGS-006:** its boundary cases (11 is 400, 0/0 is 400, leaders 6 is 400) match this ticket. It documents the 400/405 contract defined here, and it should note the malformed-JSON exception (Q6).
