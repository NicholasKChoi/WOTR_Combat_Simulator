# SGS-003 implementer report

- Ticket: SGS-003, validate and cap /api/fight inputs, reject non-POST, never return NaN
- Branch: sgs-003-validate-fight-inputs (base origin/main 7fd4c91)
- Tip: 018b3f4c244144ef4391d1c68899994bcd9cccc4 (author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-003-validate-fight-inputs
- Status: needs_review

## Files touched

- `pages/api/fight.ts`: 405 for non-POST with `Allow: POST`; `validateFightForm` (body shape, fields in fixed order with presence/format/range, then per-side cap and zero-fighter checks, attack first); `parseFightForm` now takes validated counts; unused `Results` import removed (hunk already edited).
- `components/apps/combat-simulator/army.js`: regulars/elites 0-10 as controlled selects with sum-based `disabled`; leaders 0-5, never disabled; select names unchanged.
- `pages/apps/combat-simulator.js`: error state, `role="alert"` `alert alert-danger` element directly below Fight! inside the form; result cleared on any failure; server `error` string shown verbatim, else a generic message with the HTTP status; `try/catch` so `submitFight` never throws; debug `console.log(response)` removed.
- `acceptance/helpers.ts`: `postFight` accepts a loose `FightBody` (missing keys, non-string values) and an optional timeout; `armies()` builder; `FIELD_KEYS` export. (Manager note from SGS-002 review.)
- `acceptance/fight-api-validation.spec.ts` (new): all HTTP acceptance criteria.
- `acceptance/combat-simulator-validation.spec.ts` (new): all UI acceptance criteria.

Business logic is about 150 lines; specs about 360.

## Tests

- Ticket Scope 4 assigns the acceptance specs to this ticket, so I wrote them (the manager's note allowed this when scope says so).
- `npm run acceptance`: 91 passed, 0 failed, run twice. That includes the existing SGS-002 specs, unchanged and still passing; their DEFAULT_ARMIES 3/1/1 is valid under the new rules.
- `npm test` (Vitest): 4 passed. I added no Vitest unit test. The ticket requires the validator to stay local to `pages/api/fight.ts`, Vitest only includes `utils/**` and `lib/**`, and a test file under `pages/api/` would become a route and break `next build`. The acceptance specs cover every rule and boundary directly.
- Invariants the specs encode:
  - S3: every numeric input is bounded before `Battle`, including large values rejected within a 1s request timeout.
  - W1 bounds: regulars + elites 1-10 per side, leaders 0-5 and not counted.
  - Finite averages on every 200.
  - Error precedence: method, then body, then fields in order, then sides.

## Build / lint / codegen

- codegen: not set.
- `npx tsc --noEmit`: clean.
- `npx next build`: passes. I did not run `npm ci` because node_modules was already present in the fresh worktree.

## Invariant check

- S3: upheld and now enforced for all six inputs before `Battle` runs.
- W1: upheld. The bounds match CONTEXT.md Decisions and docs/combat-simulator.md "Input bounds", and combat logic is unchanged.
- W2: untouched.
- `git diff origin/main` shows no change to `Battle`, `rollDice`, `calculateCombatRollResults`, `pages/api/models/army.ts`, `BattleStats`, `docs/`, or `golang/`.

## For review

- Next renders its own empty `<p role="alert" id="__next-route-announcer__">` on every page. A page-wide `getByRole('alert')` therefore hits two elements, and "no role=alert element" can never be literally true. The UI specs scope the alert to `#fight-form`. The acceptance-test gate should do the same.
- In Playwright, `data: ''` does not arrive at Next as an empty application/json body. The spec sends `Buffer.alloc(0)` instead. Verified with curl: the server returns `{"error":"attack-regs is required"}` for an empty JSON body.
- Error strings:
  - field errors: `<key> is required`, `<key> must be a non-negative whole number`, `<key> must be between 0 and <max>`;
  - side errors: `<side> army has more than 10 regulars and elites`, `<side> army needs at least one regular or elite`;
  - body: `request body must be a JSON object`;
  - 405: `method <M> is not allowed; use POST`.
- Worktree creation hit `could not lock config file .git/config` (a sandbox bind on config.lock), so the upstream-tracking write failed. The branch was created and I then added the worktree for it. The branch has no upstream configured, which does not matter since nothing was pushed.

## Out-of-scope findings

- `docs/combat-simulator.md` "Input bounds" says "The form does not stop a combination the server rejects, such as 10 regulars and 10 elites." This ticket's UI now disables those options, so the sentence and the "Current code" notes there are stale. SGS-001 owns the doc and should reconcile it.
- `<label htmlFor>` in `army.js` still points to ids that don't exist, left alone per the ticket.
