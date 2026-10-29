# SGS-003: Validate and cap /api/fight inputs, reject non-POST, never return NaN

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.5
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes a public API contract (request validation, new 405/400 responses); adjacent to S3 and W1. -->
- **LOC estimate**: ~150 (`pages/api/fight.ts` validation ~70-80; `components/apps/combat-simulator/army.js` controlled selects ~35; `pages/apps/combat-simulator.js` error state ~30; business logic only, acceptance specs excluded)
- **Depends on**: SGS-001 (design doc; its input-bounds section is reconciled to the CONTEXT.md decisions before this ticket starts), SGS-002 (acceptance harness)
- **Source**: M1.5; Outline D in plans/M1-20261028.md; CONTEXT.md Decisions ("WOTR inputs", "WOTR caps", "Error responses"); owner answers 2026-10-28 (resolved Open questions below); spec gate `reports/SGS-003-spec-gate.md`

## Context

`handler` in `pages/api/fight.ts` does no validation: `parseFightForm` runs `parseInt` on `req.body[...]`, so missing or junk fields become `NaN`, `parseInt("3abc")` becomes 3, negatives and huge counts are accepted (S3: unbounded work), any HTTP method runs a fight, and a side with no fighting units gives `rounds = 0` so `getStats()` returns `NaN` averages (serialized as `null`). The UI offers 0-9 regulars, 0-9 elites, 0-5 leaders per side (`army.js`), so it can neither build a 10-unit army nor be stopped from building an over-cap one, and `submitFight` in `pages/apps/combat-simulator.js` throws on any non-OK response, so the user sees nothing.

Input bounds (source: CONTEXT.md Decisions; `docs/combat-simulator.md` will state the same once SGS-001 is reconciled, and this ticket does not edit it): per side, regulars + elites <= 10 (leaders are not counted); leaders 0-5; regulars + elites = 0 is invalid. Errors are `{ error: string }` with 400 or 405.

## Scope

### 1. `pages/api/fight.ts`, `handler`

All checks run at the top of `handler`, before `parseFightForm` and `Battle`. The first failing check returns; later checks do not run. Order (respec 1):

1. **Method.** Any method other than `POST` (including `GET`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`): `res.setHeader('Allow', 'POST')`, then `res.status(405).json({ error })`.
2. **Body shape.** `req.body` must be a plain object: not `null`, not `undefined`, not an array, not a string or other primitive. Otherwise 400 with a generic `error` saying the body must be a JSON object (it names no field). Notes on what reaches the handler under Next 12.1.6's built-in body parser:
   - An empty body sent as `application/json` arrives as `{}`, so it fails step 3 on the first field (`attack-regs`), not step 2.
   - A body with no `Content-Type` or `text/plain` arrives as a string and fails step 2.
   - `null`, `true`, `3`, `"x"`, and `[]` sent as JSON fail step 2.
   - Malformed JSON never reaches the handler: Next replies 400 with the plain-text body `Invalid JSON`. This ticket accepts that response as-is and does not disable the body parser (see Open questions).
3. **Fields, in fixed order** `attack-regs`, `attack-elts`, `attack-ldrs`, `defend-regs`, `defend-elts`, `defend-ldrs`. For each field, the first failing rule returns 400 with an `error` that contains the field key:
   - Present (key exists and the value is not `undefined`).
   - Well-formed, in one of two encodings:
     - a JSON number `v` with `Number.isSafeInteger(v) && v >= 0` (`-0` counts as 0);
     - a string matching `/^[0-9]+$/` (digits only), converted with `Number(...)`. Leading zeros are allowed (`"007"` is 7). `""`, `" 3"`, `"+3"`, `"-1"`, `"3abc"`, `"2.5"`, `"3.0"`, `"1e2"`, and `"0x3"` are rejected.
     - Anything else is rejected: `2.5`, `-1`, `1e21`, `NaN`-producing values, `true`, `null`, objects, arrays.
   - In range: regulars and elites 0-10, leaders 0-5. A long digit-string or huge number (`"999999999"`, `1e9`, a 400-digit string) fails here. No separate length limit is needed, because the range check bounds the value.
4. **Per side, attack first, then defend.** For each side, the first failing rule returns 400 with an `error` that contains the side name (`attack` or `defend`):
   - regulars + elites <= 10 (leaders not counted);
   - regulars + elites >= 1 (covers 0/0/0 and leaders-only armies). This guarantees `rounds >= 1`, so `getStats()` never divides by zero.

Unknown extra keys are ignored. SGS-005 adds `battles` and its own check.

`parseFightForm` builds both `BaseArmy` objects from the validated numbers instead of calling `parseInt`. The validation code may return either the numbers or an error. Keep its shape small and local to `fight.ts`.

Remove the unused `Results` import (line 2) only if that hunk is already being edited.

No change to `Battle`, `rollDice`, `calculateCombatRollResults`, `BaseArmy`, or the `BattleStats` shape.

### 2. `components/apps/combat-simulator/army.js`, `Army` (respec 1)

- Regulars and elites selects offer 0-10. Leaders offers 0-5.
- The regulars and elites selects become controlled, holding state local to the component. In the regulars select, an option `v` is `disabled` when `v + elites > 10`. In the elites select, an option `v` is `disabled` when `regulars + v > 10`.
- Leader options are never disabled.
- Both armies keep defaulting to 0/0/0, and the two `Army` instances stay independent.
- Each select keeps its `name` (`<armyKey>-regs|elts|ldrs`), so `FormData` posts the same six keys.
- The UI cannot prevent a 0-fighter army (the default is 0/0/0). The page surfaces the server's 400 for that case (item 3).
- Leave the `<label htmlFor>` mismatch alone. SGS-002 specs select by `name`.

### 3. `pages/apps/combat-simulator.js`, `submitFight` and render (respec 1)

- Add an error state. Render it, only when non-empty, as an element with `role="alert"` placed directly below the Fight! button inside the form, with the message as its text. Use Bootstrap alert classes such as `alert alert-danger` to match the page styling.
- When a submit starts, clear the error.
- **On a 200**, parse the JSON, set the result, and leave the error empty.
- **On a non-OK response:**
  - Clear any previous result, so the "Army Results" section disappears.
  - If the body parses as JSON with a string `error`, show that string verbatim.
  - Otherwise show a generic message that includes the HTTP status. This covers Next's plain-text `Invalid JSON` 400 and HTML 500 pages.
- **If `fetch` rejects** (network failure), or a 200 body fails to parse: clear the result and show a generic message. Wrap the whole request in `try/catch`, so `submitFight` never rejects and never throws.
- Remove the debug `console.log(response)`, which is in the touched hunk.

### 4. Acceptance specs in the SGS-002 harness

Add the specs under `acceptance/`, following SGS-002's layout and runner. Extend `acceptance/fight-api.spec.ts` and `acceptance/combat-simulator.spec.ts`, or add sibling files in the same style.

Reuse SGS-002's shared helpers (post a fight, fill an army by `name`) if they exist. If SGS-002 did not create the shared module, create it here, because these specs plus SGS-002's give at least two users.

Every case in the Acceptance criteria below is covered.

**Out of scope:**
- Combat dice and leader logic, the 5-die cap, the reroll cap, and the casualty order, including `takeHit` decrementing regulars below 0 with more than 5 units and 0 regulars (all SGS-004).
- The N-battle loop, response shape changes, removing the per-round `console.log` in `Battle`, and any `battles` validation (all SGS-005).
- Creating or editing `docs/api/openapi.json`, CONTEXT.md "Key surfaces", and the exported request/response types. SGS-006 records the 400/405 contract defined here.
- Editing `docs/combat-simulator.md`. SGS-001 owns it. This ticket cites CONTEXT.md Decisions.
- Wrapping Next's malformed-JSON 400.
- Moving `pages/api/models/army.ts`.
- `golang/` and the StarCraft helper.
- PR #11 was closed as superseded. Do not adopt its branch or code.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

Over HTTP (Playwright `request` fixture against the harness server). In these criteria, "no battle runs" means the response is not 200 and its body has neither a `rounds` nor a `survivor` key (respec 1).

- [x] (respec 1) `GET`, `PUT`, `DELETE`, `PATCH`, and `OPTIONS` to `/api/fight` each return 405 with header `Allow: POST`, a JSON body whose `error` is a non-empty string, and no `rounds` or `survivor` key. `HEAD` returns 405 with `Allow: POST`.
- [x] (respec 1) A POST with valid fields returns 200 with the existing `BattleStats` keys, and `Number.isFinite` holds for both `averageAttackHitsPerRound` and `averageDefendHitsPerRound`. Covered combinations:
  - 5/2/1 vs 3/3/0;
  - 10/0/5 vs 0/10/5;
  - 10/0/0 vs 1/0/0;
  - all six fields sent as JSON numbers;
  - all six sent as digit strings;
  - a mix of the two;
  - `"007"`-style leading zeros.
- [x] (respec 1) Field errors: each case below returns 400 with a JSON `error` containing the offending field key, and no `rounds`/`survivor` key. The cases are applied to at least one attack field and one defend field, and each field key appears in at least one case:
  - field missing;
  - `"abc"`, `"3abc"`, `"2.5"`, `""`, `"-1"`, `"1e2"`;
  - JSON `2.5`, `-1`, `true`, `null`.
- [x] (respec 1) Body-shape errors: a JSON body of `null`, `[]`, `true`, `3`, or `"x"`, or a `text/plain` body, each returns 400 with a JSON `error`. An empty `application/json` body returns 400 whose `error` contains `attack-regs`.
- [x] (respec 1) Malformed JSON (for example `{"attack-regs":`) returns 400 and no `rounds`/`survivor`. The body is Next's plain-text response, and the spec asserts only status and absence of those keys.
- [x] (respec 1) Range boundaries on each side:
  - regulars 10 with elites 0 is 200;
  - elites 10 with regulars 0 is 200;
  - leaders 5 is 200;
  - leaders 6 is 400 with `error` containing that leaders field key;
  - regulars 11 is 400 with `error` containing that regulars field key.
- [x] (respec 1) Side cap: 10 regulars + 1 elite (leaders any 0-5) returns 400 with `error` containing the side name. Tested for attack and for defend separately, with the other side valid. 6 regulars + 4 elites + 5 leaders is 200, which shows leaders are not counted.
- [x] (respec 1) Zero fighters: 0/0/0 and 0/0/5 each return 400 with `error` containing the side name, for attack and for defend.
- [x] (respec 1) Error precedence:
  - a PUT with an invalid body returns 405, not 400;
  - with `attack-elts: "abc"` and `defend-regs` missing, the `error` names `attack-elts`;
  - with attack at 0/0/0 and `defend-ldrs: 6`, the `error` names `defend-ldrs`, because field checks run before side checks;
  - with attack at 0/0/0 and defend at 11/0/0 given as numbers, the `error` names `defend-regs` (range check);
  - with attack at 0/0/0 and defend at 6/5/0, the `error` contains `attack`.
- [x] (respec 1) Large values `1e9`, `"999999999"`, and a 400-digit string each return 400 within the Playwright request timeout set to 1 second.

In the UI (`/apps/combat-simulator`):

- [x] (respec 1) The regulars and elites selects each offer 0-10, and leaders offers 0-5. With elites at 0, regulars 10 is selectable. With regulars at 0, elites 10 is selectable.
- [x] (respec 1) With attack regulars at 6, the attack elites options 5-10 are disabled and 0-4 are enabled. With attack elites at 7, attack regulars options 4-10 are disabled. At regulars + elites = 10, every attack leaders option 0-5 stays enabled and selectable. Setting attack values does not disable any defend option, and the reverse also holds.
- [x] (respec 1) Submitting with attack 10/0/5 vs defend 0/10/5 renders the "Army Results" heading and no `role="alert"` element.
- [x] (respec 1) Clicking Fight! with a side at 0 regulars and 0 elites shows an element with `role="alert"` whose text equals the server's `error` string for that request. The spec captures that string from the intercepted response. The "Army Results" heading is absent, even when a successful result was shown before this submit, and the page emits no `pageerror` event.
- [x] (respec 1) After that error, a valid submit removes the `role="alert"` element and renders the "Army Results" heading.
- [x] (respec 1) With `/api/fight` aborted via `page.route(...).abort()`, clicking Fight! shows a `role="alert"` element with non-empty text, no "Army Results" heading, and no `pageerror` event.

General:

- [x] `git diff` shows no changes to `Battle`, `rollDice`, `calculateCombatRollResults`, `pages/api/models/army.ts`, the `BattleStats` interface, `docs/`, or `golang/`.
- [x] `npx tsc --noEmit` and `npx next build` pass, and `npm run acceptance` passes with the new cases.
- [x] No INVARIANTS.md regressions:
  - S3 is now enforced for every current numeric input, before `Battle` runs;
  - W1 holds, because the bounds match CONTEXT.md Decisions and combat logic is unchanged;
  - W2 is untouched.

## Open questions

Resolved by the owner (2026-10-28):
1. Leaders do not count toward the 10-unit cap: regulars + elites <= 10 per side.
2. Leaders <= 5 per side is enforced by the server with a 400 (5 accepted, 6 rejected).
3. The `{ error: string }` body for 400 and 405 is accepted as the public error format for now.
4. A side with 0 regulars + elites is rejected with 400.
5. POST only. Other methods get 405 with `Allow: POST`.

Open:
6. (respec 1) Malformed JSON is answered by Next's body parser with a plain-text `Invalid JSON` 400 before the handler runs, so it is the one 400 that is not `{ error: string }`. This ticket accepts it. Wrapping it would require `export const config = { api: { bodyParser: false } }` and parsing the body by hand. Does the owner want that, in a follow-up or in SGS-006?

## Re-spec 2026-10-28

Re-spec 1, from `reports/SGS-003-spec-gate.md`.

**What was underspecified**
- The unit-counting rule still read as unresolved, and the UI criterion would have disabled leaders at the cap.
- The owner's leaders <= 5 server rule was missing.
- The UI could not reach 10 regulars or 10 elites (options ran 0-9).
- Validation order, body-shape edge cases (empty, null, array, non-object, malformed JSON), number vs digit-string encoding, and error precedence were all unspecified.
- Several criteria were not observable: "no battle runs", "immediately", "no uncaught rejection", the unbounded "never null/NaN", and an unlocated "alert region".
- Neither stale-result behavior on error nor `fetch` rejection was specified.
- W1 and the design-doc source of the bounds were not addressed.

**What changed**
- Scope 1 is rewritten as an ordered validation list:
  - method;
  - body shape;
  - per-field presence, format, and range, in fixed field order;
  - per-side cap, then zero-fighter.
- Encodings are defined: `Number.isSafeInteger && >= 0` for numbers, `/^[0-9]+$/` for strings, with leading zeros allowed. The per-field range check bounds long digit-strings.
- The empty `application/json` body (`{}`) names `attack-regs`. Non-object bodies get a generic error. Next's malformed-JSON 400 is accepted, and wrapping it is moved to Open question 6.
- Scope 2: regulars and elites run 0-10, with sum-based disabling. Leaders run 0-5 and are never disabled.
- Scope 3:
  - `role="alert"` error element below Fight!;
  - the previous result is cleared on any failure;
  - `try/catch` around `fetch`, with a generic message on rejection;
  - `console.log(response)` is removed.
- Scope 4: the shared helper module is created here if SGS-002 did not create it.
- Out of scope now names `docs/combat-simulator.md` (SGS-001), `docs/api/openapi.json` and CONTEXT.md Key surfaces (SGS-006), and the `takeHit` negative-regulars bug (SGS-004).
- All criteria were rewritten to observable checks (tagged `(respec 1)`):
  - "no battle runs" means no `rounds`/`survivor` key;
  - `Number.isFinite` on both averages;
  - a 1-second request timeout;
  - no `pageerror` event;
  - locating the alert by role plus the exact server text;
  - absence of the "Army Results" heading.
- Added cases:
  - the 10/0/5 vs 0/10/5 boundary;
  - leaders 5 accepted and 6 rejected;
  - precedence;
  - a network abort.
- W1 is listed as adjacent. The bounds cite CONTEXT.md Decisions, and SGS-001 is expected to be reconciled before this ticket starts.

**Existing branch work that still stands**
- None. The branch `sgs-003-validate-fight-inputs` has not been created.

## Manager note - 2026-10-29 (from SGS-002 review, non-blocking)

`acceptance/helpers.ts:12` types `Armies` as a strict record of six string fields. Widen `postFight`'s input type (or add a raw-body helper) so boundary cases can send missing keys and non-string values.
