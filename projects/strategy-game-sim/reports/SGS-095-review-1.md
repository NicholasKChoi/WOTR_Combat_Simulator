# SGS-095 review 1

Verdict: APPROVE (diff 4ac6a6a..a857539, 7 files, test and helper only)

## Blocking findings
None.

## Acceptance criteria
- Criteria 1-2 (MAN_AT_ARMS_STEP): dropped per Re-spec 3; `git grep MAN_AT_ARMS_STEP` is empty on the tip. Pass (dropped).
- Schema table titles/collection-time work: pass. Title has no `%#`; `run(value)` and `expected(...)` now execute inside the `it` body. The describe body only builds row tuples.
- Schema mutation check: not re-run by me; implementer reports 1 failed (the 5000-char houseBuilderSource row), 378 passed. Left unchecked (unverified by me). Code shape supports it.
- Stale comment deleted, digests and held values unchanged: pass (diff shows only the comment line removed).
- Greps: `networkidle` only at helpers.ts:102 (openPage); `goto('/apps/combat-simulator')` only at helpers.ts:91. Four call sites use `openCombatSimulator`. Helper uses `waitForFunction` on `__reactProps$` own property, no sleep, no files outside acceptance/ or lib tests changed. Pass.
- Reproduction record: implementer report gives command (`npx playwright test combat-simulator-battles --repeat-each=10 --workers=4`), before 70 passed (no repro), after 70 passed. Not re-run by me; left unchecked.
- npm test / tsc / acceptance: I ran tsc, lint:dup, and the two edited vitest files (403 passed). Full `npm test` and acceptance not re-run by me; left unchecked. Implementer reports green (one unrelated flake, below).
- INVARIANTS: none touched; holds.

## Lint
`npx tsc --noEmit` clean, `npm run lint:dup` clean.

## Bot
`reviewBot.cli` empty; no bot or rulesFile applies.

## Conventions
- Helper placement and style match neighbours in acceptance/helpers.ts (`openPage` at line ~100). Comment states a hidden constraint (hydration race), within the comment bar, no ticket ids.
- Schema test keeps the existing `it.each` table style.
- LESSONS (layout reads) not relevant.

## Non-blocking notes
- `fight-api-caps.spec.ts` import order puts `openCombatSimulator` after `postFight` (not alphabetical); the other specs are alphabetical-ish, trivial.
- Out of scope: `acceptance/aoe4-small-screen.spec.ts:42` flaked once in a full acceptance run per the implementer (passed alone 5/5 and on full rerun). Worth a BACKLOG note.

## Coverage
All 7 changed files reviewed. Did not run Playwright or full `npm test`.
