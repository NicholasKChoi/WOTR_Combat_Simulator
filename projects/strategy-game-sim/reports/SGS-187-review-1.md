# SGS-187 review 1

Verdict: APPROVE

Branch sgs-187-remove-unused-settled-scroll-y, tip f7ff09f4c088105819c70c532d447ed985e3295c.

## Blocking findings
none

## Acceptance criteria
- `settledScrollY` removed, tsc passes: pass. The diff deletes the function and its comment from acceptance/helpers.ts (5 lines). `git grep settledScrollY` outside .md files finds nothing. `npx tsc --noEmit` passed in my scratch.
- Pre-existing tests keep their assertions: pass. The diff touches only acceptance/helpers.ts and no spec or test file.
- `npm run lint:dup` and `npm test`: lint:dup passed (0 clones). `npm test` was not re-run by me; the implementer recorded 2613 passed. The diff deletes only unused acceptance-helper code, so unit tests are unaffected.
- No INVARIANTS.md regressions: the ticket lists none, and the diff touches only a Playwright helper.

## Scope checks
- TABS_VIEWPORT, showTab and SPLIT_MIN_WIDTH no longer appear under acceptance/, so there is no leftover for this ticket to delete.
- No other helper changed.

## Invariants
None touched.

## Bot
No reviewBot configured.

## Non-blocking notes
none

## Coverage
Reviewed the full diff (one file). I ran tsc and lint:dup. I did not run `npm test` or the acceptance tests. The UI inspection does not apply: no UI change.
