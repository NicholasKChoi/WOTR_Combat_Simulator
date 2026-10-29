# SGS-003 review (full pass)

- Verdict: **APPROVE**
- Branch: sgs-003-validate-fight-inputs. The tip reviewed is 018b3f4c244144ef4391d1c68899994bcd9cccc4 (local only; `origin/sgs-003-validate-fight-inputs` does not exist yet). Base is origin/main 7fd4c91.
- Review worktree: `worktrees/review-sgs-003-validate-fight-inputs` (detached at 018b3f4).
- Commit author: choinickolas@gmail.com. The commit message has no ticket ids or factory pointers.

## Blocking findings

None.

## Spec gaps

None blocking. The design-doc drift is discussed under Non-blocking note 1. It needs a follow-up ticket.

## Gates run

- `npx tsc --noEmit`: clean. tsconfig includes `pages/apps/combat-simulator.js`, so the page's new code was type-checked too.
- `npm test` (Vitest): 4 passed.
- `npx next build`: passes, run after a fresh `npm ci` in the review worktree.
- `npm run acceptance`: 91 passed, 0 failed (8.2s). This includes the unchanged SGS-002 specs.
- Ran `next dev` and curl against `/api/fight`:
  - GET and OPTIONS return 405 with `Allow: POST` and a JSON error.
  - HEAD returns 405 with `Allow: POST`.
  - Malformed JSON gets Next's plain-text `400 Invalid JSON`.
  - A body with no Content-Type returns 400 `request body must be a JSON object`.
  - JSON `-0` counts as 0, so attack -0/0/0 returns the "attack army needs at least one" error.
  - Leading-zero `"0001"` is accepted.
  - The Arabic-Indic digit `"٣"` is rejected because the regex is ASCII only.
  - JSON `3.0` is accepted, as expected, since JSON cannot distinguish it from 3.
- Loaded the page in Chromium with defend at 0/0/0 and clicked Fight!. The `alert alert-danger` box renders directly under Fight!, inside the form, with the server text. The page-wide `[role=alert]` list contained exactly that element plus Next's empty `#__next-route-announcer__`. This confirms the implementer's claim about the route announcer.
- Review bot: `reviewBot.cli` is empty and there is no `rulesFile`, so nothing ran.

## Acceptance criteria (all ticked in the ticket)

| Criterion | Result | Evidence |
|---|---|---|
| 405 for GET/PUT/DELETE/PATCH/OPTIONS, plus HEAD | pass | `fight.ts:248-252`; spec `fight-api-validation.spec.ts:60-78`; curl |
| Valid POST returns 200 with finite averages, all 7 combinations | pass | spec `:80-97`. `fighters < 1` rejection (`fight.ts:146`) guarantees `rounds >= 1` |
| Field errors: missing, bad strings, bad JSON values; each key covered; attack and defend fields both covered | pass | `fight.ts:97-121`; spec `:99-133` (missing for all 6 keys; bad values on `attack-elts` and `defend-ldrs`) |
| Body shape: null/[]/true/3/"x"/text/plain; empty JSON names attack-regs | pass | `fight.ts:94-96,124-127`; spec `:135-149`; curl |
| Malformed JSON returns 400 with no battle keys | pass | spec `:151-155`; curl |
| Range boundaries per side | pass | spec `:158-176` |
| Side cap 10+1 for each side; 6/4/5 returns 200 | pass | `fight.ts:142-145`; spec `:178-183`, `:89` |
| Zero fighters 0/0/0 and 0/0/5 per side | pass | `fight.ts:146-148`; spec `:185-190` |
| Error precedence (5 cases) | pass | method check runs before body parsing (`fight.ts:248`); fields loop then sides loop (`fight.ts:129-149`); spec `:194-215` |
| Large values rejected within 1s | pass | range check bounds `Number("9"*400) = Infinity`; spec `:217-234` (warm-up in `beforeAll` is reasonable) |
| UI: selects offer 0-10/0-10/0-5; 10 selectable | pass | `army.js:4-9`; UI spec `:42-53` |
| UI: sum-based disabling, leaders never disabled, sides independent | pass | `army.js:29,44`; UI spec `:55-75` |
| UI: 10/0/5 vs 0/10/5 renders results and no alert | pass, see scoping note | UI spec `:77-84` |
| UI: server error text shown verbatim, old results cleared, no pageerror | pass | `combat-simulator.js:43-46`; UI spec `:86-102` |
| UI: valid submit after an error recovers | pass | `combat-simulator.js:30`; UI spec `:104-111` |
| UI: aborted fetch shows alert, no results, no pageerror | pass | `combat-simulator.js:50-53`; UI spec `:114-125` |
| No diff to Battle/rollDice/calculateCombatRollResults/models/army.ts/BattleStats/docs/golang | pass | `git diff --stat` on those paths is empty; no matching `+/-` lines in fight.ts |
| tsc, next build, acceptance pass | pass | see Gates run |
| No invariant regressions | pass | see below |

**Scoping the alert to `#fight-form`.** It still tests the criterion as written. Next 12 renders `<p id="__next-route-announcer__" role="alert">` on every page, outside the app tree and always empty (observed). So an unscoped "no role=alert element" can never hold, and the criterion can only mean the page's own error element. Scope 3 places that element inside the form ("directly below the Fight! button inside the form"). The page renders `role="alert"` in only one place (`combat-simulator.js:88`), so a stray alert elsewhere cannot escape the check. A stricter alternative would be page-wide `getByRole('alert').filter({ hasText: /\S/ })`, but it adds nothing today.

**Empty-body spec sends `Buffer.alloc(0)`.** This is fine. The criterion is about what the server does with an empty `application/json` body. I could not re-check Playwright's `data: ''` behavior myself, but the server side is confirmed by the passing spec. The spec comment at `:147` states the hidden constraint, which meets the comment bar.

**No Vitest test.** This is acceptable. The ticket requires the validator to stay "small and local to `fight.ts`". `vitest.config.ts` only includes `utils/`/`lib/`. A test file under `pages/api/` would become a public route, which ARCHITECTURE.md "Where files go" forbids. Scope 4 assigns the HTTP-level coverage to acceptance specs, and those specs cover every rule. When the logic moves to `lib/combat-simulator/` (CONTEXT.md Decisions, Testing), the validator should get unit tests there.

## Invariants

- **S3 (bounded time): holds.** All six inputs are capped before `Battle` runs (`fight.ts:254-261`). Combat strength strictly drops by one per hit (`models/army.ts:26-38`), so the loop terminates for every accepted army, including 0/10.
- **W1 (combat rules match doc): holds.** Combat code is unchanged. The server bounds match `docs/combat-simulator.md` "Input bounds", lines 91-99.
- **W2: untouched.** One battle per request, built from fresh `BaseArmy` objects (`fight.ts:154-158`).
- **S1/S2: unaffected.** No cross-app imports, and no new pages.

## spec-checklist.md

- Contracts: the six field keys and the 200 body are unchanged, matching CONTEXT.md Key surfaces.
- Scope:
  - nothing out of scope is touched (no `golang/`, no docs, no openapi);
  - no open question is answered with an invented constant (10 and 5 come from CONTEXT.md Decisions);
  - Open question 6 is left as is (Next's malformed-JSON 400 is not wrapped).
- Naming: `MAX_FIGHTERS_PER_SIDE`, `validateFightForm`, and `parseCount` state intent.
- S3: met, as above. W1/W2: met, as above.

## Conventions (compared against nearby code)

- `army.js` uses `useState`, matching `pages/apps/starcraft-helper.js:52,64-65` and the page's own `useState` (`combat-simulator.js:24`).
- Bootstrap `alert alert-danger` inside `row`/`col`, matching the form's other rows (`combat-simulator.js:77-84`).
- `fight.ts` keeps the file's semicolon style and its local interfaces (`BattleStats` at `:63`).
- Specs:
  - they extend `acceptance/helpers.ts` (as the SGS-002 review note asked) and reuse `fillArmies`/`postFight`;
  - the `waitForResponse` predicate matches `combat-simulator.spec.ts:9-11`;
  - spec file naming follows its siblings.
- No REVIEW.md exists. Both LESSONS.md files are empty.

## REPO.md review checklist

- Every diff:
  - ran `next build`;
  - loaded the page with dev and exercised the error flow in a browser (screenshot checked);
  - the user-visible flow was reviewed (select, Fight!, alert, results).
- Combat simulator:
  - Round trip: select `name`s are unchanged (`army.js:21,37,52`). `FormData` posts the same six keys, `validateFightForm` reads `${side}-${suffix}` for the same keys, `BaseArmy` is built in the same argument order, and the `BattleStats`/`Results` props are unchanged.
  - Exercised `/api/fight` with curl for the boundary cases in the doc's Input bounds. Responses match the doc's rules.
  - The dice/casualty item is not applicable, since that logic is unchanged.

## Non-blocking notes

1. **Design-doc drift: a follow-up, not a blocker.**
   - `docs/combat-simulator.md:101-102` says "The form does not stop a combination the server rejects". `army.js:29,44` now disables those options. `:104-106` ("Current code: ... the server checks none of these bounds") is also stale now.
   - Why it doesn't block this change:
     - W1 (INVARIANTS.md) covers dice, leader rerolls, casualties, and round order. Form option disabling is none of those.
     - Every bound the doc does state as a rule (lines 91-99) is enforced exactly.
     - The ticket's Scope 2 (spec-gated, respec 1) explicitly requires the disabling. Its Out of scope and a General criterion forbid touching `docs/`. CONTEXT.md Design docs assigns the doc to SGS-001.
   - The new behavior is strictly more protective than the doc's sentence, so no user flow contradicts a doc rule.
   - **Manager action:** SGS-001 is done (M1.1). Open a small docs follow-up, or fold it into the next ticket that edits the doc, to:
     - replace line 101-102 with "the form disables combinations over 10 regulars + elites";
     - remove the line 104-106 Current-code note.
2. **Form-encoded bodies are accepted.**
   - Next parses `application/x-www-form-urlencoded` into an object, so it passes `isPlainObject` (`fight.ts:94`). The six fields, sent as strings, get a 200 (observed with curl).
   - The ticket defines the body as "a plain object", not "JSON only", so this complies.
   - SGS-006 should decide whether to document it as supported or reject it.
3. **Public error strings for SGS-006.** Field errors (`<key> is required`, `<key> must be a non-negative whole number`, `<key> must be between 0 and <max>`) are at `fight.ts:108-118`. The other strings:
   - side errors: `fight.ts:144,147`;
   - body error: `fight.ts:126`;
   - 405: `fight.ts:250` (`method <M> is not allowed; use POST`).
4. **Duplicate caps.** The caps are defined twice: `army.js:4-5` (`MAX_FIGHTERS`, `MAX_LEADERS`) and `fight.ts:74-75`. These should become one source when the logic moves to `lib/combat-simulator/`. Sharing them today would mean importing from `pages/api/` into a component, which is worse.
5. **`fillArmies` (`acceptance/helpers.ts:22-26`) is order-sensitive.** It sets regulars before elites. Now that options disable, moving an already-filled form from e.g. 3/7 to 10/0 would block on a disabled option. Current specs never do that. Future specs that refill a form should go through 0 first, or the helper should set elites before regulars when the total would exceed 10.
6. **Overlapping submits.** `submitFight` has no in-flight guard, so a slow first response can overwrite a later one. This predates the change and is not in the criteria.
7. **The validator has no unit tests yet.** They belong with the move to `lib/combat-simulator/`.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` is empty, and there is no rules file).

## Coverage

- Files reviewed in full:
  - `pages/api/fight.ts`;
  - `components/apps/combat-simulator/army.js`;
  - `pages/apps/combat-simulator.js`;
  - `acceptance/helpers.ts`;
  - `acceptance/fight-api-validation.spec.ts`;
  - `acceptance/combat-simulator-validation.spec.ts`.
- Also read: the sibling specs, `results.js`, `models/army.ts`, and docs Input bounds.
- Could not review: the Vercel preview, because the branch is not pushed.
