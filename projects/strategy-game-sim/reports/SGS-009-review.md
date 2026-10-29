# SGS-009 review 1: APPROVE

Branch sgs-009-combat-doc-input-bounds-current, tip 97cae74, base origin/main 006c553. Full review.

## Blocking findings
None.

## Acceptance criteria
- [x] Form sentence replaced; doc says form disables options over 10 regulars+elites and leaders stay 0 to 5 (docs/combat-simulator.md:101-103). Matches army.js on sgs-003 (disabled = item + other > MAX_FIGHTERS; 6+5=11 so elites 5-10 disabled).
- [x] "Current code" note under Input bounds removed; grep finds no "checks none", "non-numeric", or "0 to 9".
- [x] Diff touches only lines after the bounds list; the bounds list is unchanged.
- [x] Other Current code notes (N, independence, casualties) unchanged.
- [x] Only docs/combat-simulator.md changed (1 file, +6/-9).
- [x] No INVARIANTS regressions (docs only).

"400 status" claim verified: pages/api/fight.ts on sgs-003 returns 400 for validation failure (line 256), 405 for non-POST.

## Lint / bot
commands.lint (tsc) not applicable to a docs-only change; not run. No review bot configured.

## Non-blocking notes
- docs/combat-simulator.md:97-99: the rejected-request paragraph was re-wrapped (first line about 113 chars, rest about 100) beyond adding "with a 400 status". Cosmetic; adds diff noise only.
- The 400 text makes the doc depend on SGS-003 being merged; the ticket lists that dependency.

## Coverage
Reviewed the full diff, the Input bounds section, and army.js and fight.ts on the sgs-003 branch. Did not run the app.
