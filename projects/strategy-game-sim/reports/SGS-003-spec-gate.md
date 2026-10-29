# SGS-003 spec gate

Verdict: NEEDS_SPEC (no gap needs the owner; all are ticket edits).

Read: ticket, REPO.md, CONTEXT.md, INVARIANTS.md, PROJECT.md, SGS-001/002 tickets, and `fight.ts`, `army.ts`, `army.js`, `combat-simulator.js` at origin/main.

## Checks that pass
- Grounded scope: `handler`, `parseFightForm`, `Results` import, `submitFight`, `console.log(response)`, and the six field names all exist as described. `Results` is on line 2 of `fight.ts`, not line 1 (cosmetic).
- Risk `high` is correct (public API contract change, adjacent to S3).
- Size is about 120 lines, under 400. Dependencies are stated.
- Diagrams: the no-diagram statement is acceptable.
- Lessons: both LESSONS.md files are empty.

## Gaps

1. **Criteria / Scope 2 - the unit-counting rule is still written as unresolved, and it contradicts the owner's answer.**
   - The owner resolved Open question 1: leaders are excluded and regs + elts <= 10.
   - Scope 1 still says "total units (see Open questions for what counts)".
   - The "total 11" criterion still says "under the unit-counting rule the owner confirms".
   - The UI criterion says that with 10 total units "the controls do not let the user raise any attack select further". That includes the leaders select, which contradicts leaders not counting.
   - Scope 2 says "options that would push the total over 10 are disabled" without saying whether leaders are in the total.
   - An implementer would guess whether to disable the leaders select at 10.
   - Fix:
     - State the rule as "regulars + elites <= 10 per side; leaders are not counted".
     - Reword the UI criterion: at regs + elts = 10, regulars and elites options that raise the sum are disabled, and leaders stay selectable 0-5.
     - Add the 10/0/5 vs 0/10/5 case as accepted.

2. **Scope 1 / Criteria - the owner's leaders <= 5 server rule (resolved Q2) is not in scope or criteria.**
   - No bullet says what to validate, which error to return, or what to name.
   - There is no test for it.
   - Fix:
     - Add "leaders must be <= 5 per side, else 400 naming the field or side".
     - Add a criterion: 5 leaders is accepted and 6 returns 400.
     - Add a criterion that 10 regs + 0 elts + 5 leaders is 200.

3. **Scope 2 - the UI cannot reach the 10 cap.**
   - `army.js` offers 0-9 for regulars and elites. A 10/0 or 0/10 army cannot be built.
   - The ticket says "keep leaders at 0-5 as today" but does not say to extend regulars and elites to 0-10.
   - The server accepts 10, so the UI and server disagree.
   - Fix: state that regulars and elites options run 0-10 (subject to the sum rule) and leaders 0-5. Add a UI criterion that 10 regulars is selectable when elites = 0.

4. **Scope 1 - validation order and body edge cases are unspecified.**
   - The criteria require "400 naming the field" for a missing field or a non-numeric value, but several cases leave the implementer guessing:
     - What does an empty or non-object body (`""`, `null`, an array, undefined) name? Name the first required field, or return a generic message?
     - If several things are wrong, which error wins? Suggested order: field presence and format in the fixed order, then leaders, then per-side cap, then the at-least-one-fighter rule.
     - Malformed JSON never reaches the handler. Next's body parser rejects it with its own plain-text 400, not `{ error }`. Say whether that is accepted or must be wrapped.
     - What about a JSON number such as `2.5`, `1e9`, `-1`, `true`, or `null`? Define "JSON number" as `Number.isSafeInteger(v) && v >= 0`, and say a digit-string longer than a safe integer returns 400.
     - Does `"007"` count as digits-only?
   - Fix: add a short validation-order and body-shape paragraph, and add `null`, `true` and an array body to the 400 criterion.

5. **Criteria - several are not observable by a test or reviewer as written.**
   - "no battle runs" cannot be checked over HTTP. Rewrite as "response is 400/405 and the body has no `rounds` or `survivor` key". Do not count server logs, because the per-round `console.log` is out of scope.
   - "Very large values return 400 immediately" has no bound. Rewrite as "returns 400 within 1 second (Playwright request timeout)".
   - "no uncaught promise rejection from `submitFight`" needs a check. Rewrite as "the page emits no `pageerror` event on a 400 submit".
   - "no response ever contains null/NaN statistics" is unbounded. Rewrite as "for each 200 response, `averageAttackHitsPerRound` and `averageDefendHitsPerRound` pass `Number.isFinite`".
   - "alert region near the Fight! button" has no locator, and SGS-002 forbids `data-testid` in its own scope only.
     - Specify `role="alert"` on the error element.
     - Say the spec finds it by role and by text equal to the server's error string.
   - "Results table does not appear": name the absence of the "Army Results" heading.

6. **Scope 3 - failure and stale-results behavior is unspecified.**
   - Does the previous successful result stay visible while the error shows, or is it cleared? The criterion says "no results table appears for that submit", which suggests it is cleared. State the rule explicitly.
   - A network failure (`fetch` rejects) is not mentioned. The criterion says "failed request does not throw", so wrap it in `try/catch` and show a generic message.

7. **Invariants / Contracts - W1 and the design doc are not addressed.**
   - W1 and the spec-checklist make `docs/combat-simulator.md` authoritative for input bounds.
   - The ticket names S3 and W2 but not W1.
   - SGS-001's text says "army max 10 units total", with leaders counting left as an open question. That is now stale against the owner decision.
   - Fix: add W1 as adjacent. State that SGS-001's input-bounds section must read "regulars + elites <= 10; leaders 0-5, not counted; 0 fighters invalid", or that this ticket updates that section in the same diff. Also state that SGS-001 is reconciled before this ticket starts.
   - CONTEXT.md "Key surfaces" lists the form fields but not the validation rules or the 400/405 responses. Either add one line there or note that the SGS-006 spec carries it.

## Notes (non-blocking)
- REPO.md says a route change updates `docs/api/openapi.json`. That file does not exist yet (SGS-006 creates it), so say explicitly that this ticket does not touch it.
- Say that 405 also applies to HEAD and OPTIONS, which is already covered by "any non-POST".
- Make sure the 405 `Allow` header is set via `res.setHeader` before `res.status(405).json(...)`.
- Reuse SGS-002 helpers (`post a fight`, `fill army by name`) rather than adding new ones. SGS-002 only creates the shared module "if two or more specs use them", so state that SGS-003 creates it if SGS-002 did not.
- The criterion `npx next build passes` is fine, but REPO.md also asks for loading the page under `npm run dev`. The UI specs cover that.
- Passing the select `disabled` state while keeping `name` is fine, because disabled options in an enabled select still submit the selected value.
