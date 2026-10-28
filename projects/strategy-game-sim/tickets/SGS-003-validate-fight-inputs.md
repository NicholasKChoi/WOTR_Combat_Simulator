# SGS-003: Validate and cap /api/fight inputs, reject non-POST, never return NaN

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.5
- **Priority**: high
- **Risk**: high
  <!-- strongModelTriggers: changes a public API contract (request validation, new 405/400 responses); adjacent to S3. -->
- **LOC estimate**: ~120 (`pages/api/fight.ts` validation ~60-80; `components/apps/combat-simulator/army.js` and `pages/apps/combat-simulator.js` ~40-50; business logic only, acceptance specs excluded)
- **Depends on**: SGS-001 (design doc), SGS-002 (acceptance harness)
- **Source**: M1.5; Outline D in plans/M1-20261028.md; CONTEXT.md Decisions ("WOTR inputs": army capped at 10 units, a side starting with 0 units is invalid); owner decisions on 405 and UI behavior

## Context

`handler` in `pages/api/fight.ts` does no validation: `parseFightForm` runs `parseInt` on `req.body[...]`, so missing or junk fields become `NaN`, `parseInt("3abc")` becomes 3, negatives and huge counts are accepted (S3: unbounded work), any HTTP method runs a fight, and a side with no fighting units gives `rounds = 0` so `getStats()` returns `NaN` averages (serialized as `null`). The UI also lets the user pick up to 9+9+5 units per side, and `submitFight` in `pages/apps/combat-simulator.js` throws on any non-OK response, so the user sees nothing.

## Scope

1. `pages/api/fight.ts`, at the top of `handler`, before any `Battle` runs:
   - Non-POST returns 405 with an `Allow: POST` header and a JSON `{ error: string }` body.
   - Validate the six fields `attack-regs`, `attack-elts`, `attack-ldrs`, `defend-regs`, `defend-elts`, `defend-ldrs`. Each must be present and be a non-negative integer, given as a JSON number or a string of digits only (the form posts strings; `parseInt` leniency like `"3abc"` or `"2.5"` is not accepted). Otherwise 400 with `{ error: string }` naming the offending field.
   - Per side, total units (see Open questions for what counts) must be at most 10, else 400 naming the side.
   - Per side, regulars + elites must be at least 1 (a side with no fighting units is invalid), else 400 naming the side. This is what guarantees `getStats()` never divides by zero.
   - Replace `parseInt` use in `parseFightForm` with the validated values; no change to `Battle`, dice, leader, or `takeHit` logic.
   - Remove the unused `Results` import in `fight.ts` (it is on the first line of the file and unused; touched only if the hunk is already being edited).
2. `components/apps/combat-simulator/army.js`: the selects must not allow building an army the server rejects. Make each select's available options depend on the other two in the same army (for example, options that would push the total over 10 are disabled), and keep leaders at 0-5 as today. Each select keeps its `name` (`<armyKey>-regs|elts|ldrs`) so the form round trip is unchanged. A zero-fighting-unit army cannot be avoided by option limits alone (the default is 0/0/0), so the page must also surface the server's 400 (next item).
3. `pages/apps/combat-simulator.js`, `submitFight`: on a non-OK response, read the JSON `error` and render it visibly on the page (an alert region near the Fight! button), instead of `throw new Error`. Clear it on the next submit or success. Fall back to a generic message with the status if the body is not JSON. Remove the debug `console.log(response)` only if in the touched hunk.
4. Acceptance specs added to the SGS-002 harness (follow its layout and runner), covering every boundary below over HTTP and the UI error display.

**Out of scope:** combat dice and leader logic, the 5-die cap, casualty order (SGS-004); the N-battle loop, response shape change, removing the per-round `console.log` in `Battle`, and any validation of an N field (SGS-005); documenting the API contract or moving `pages/api/models/army.ts` (M1.7); `golang/`; the StarCraft helper. PR #11 was closed as superseded; do not adopt its branch or code.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `GET`, `PUT`, `DELETE` (and any non-POST) to `/api/fight` return 405 with `Allow: POST` and a JSON `error`, and no battle is run.
- [ ] A POST with all six fields valid (for example 5/2/1 vs 3/3/0) still returns 200 and the existing `BattleStats` shape, with finite `averageAttackHitsPerRound` and `averageDefendHitsPerRound`.
- [ ] A POST with a missing field, a non-numeric value (`"abc"`), a partly numeric value (`"3abc"`), a fractional value (`"2.5"`), a negative value, or an empty body returns 400 with a JSON `error` naming the field; no battle runs.
- [ ] An army whose total is exactly 10 is accepted; total 11 returns 400 naming the side (for both attack and defend), under the unit-counting rule the owner confirms.
- [ ] A side with regulars + elites = 0 (including leaders only, and 0/0/0) returns 400 naming the side; no response ever contains `null`/`NaN` statistics.
- [ ] Very large values (for example 1e9, `"999999999"`) return 400 immediately, not a long-running or crashed request (S3).
- [ ] In the UI, with the attack side at 10 total units, the controls do not let the user raise any attack select further (the extra options are disabled or removed); the same holds for the defend side, and the two sides are independent.
- [ ] In the UI, clicking Fight! with a side at 0 regulars and 0 elites shows the server's error text on the page (visible, not only in the console), no results table appears for that submit, and a following valid submit clears the error and renders results.
- [ ] A failed request does not throw an uncaught promise rejection from `submitFight`.
- [ ] `git diff` shows no changes to `Battle`, `rollDice`, `calculateCombatRollResults`, `BaseArmy.takeHit`, or the response shape.
- [ ] `npx tsc --noEmit` and `npx next build` pass; the acceptance command from SGS-002 passes with the new cases.
- [ ] No INVARIANTS.md regressions (S3 now enforced for all current numeric inputs; W2 untouched).

## Open questions

Resolved by the owner (2026-10-28):
1. Leaders do not count toward the 10-unit cap: regulars + elites <= 10 per side.
2. Leaders <= 5 per side is enforced by the server with a 400.
3. The `{ error: string }` body for 400 and 405 is accepted as the public error format for now.
