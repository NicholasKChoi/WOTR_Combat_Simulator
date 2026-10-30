# SGS-011 re-spec 2

Ticket: projects/strategy-game-sim/tickets/SGS-011-api-models-army-resolver-error.md
Trigger: reports/SGS-011-spec-gate-2.md, gap 1 (AC1 grep count contradicted Scope).

## Changed
- AC1, tagged (respec 2): `git grep "models/army"` over pages/, lib/, components/, acceptance/, docs/, ARCHITECTURE.md now expects exactly two matches: the request URL in the 404 test in acceptance/fight-api-caps.spec.ts, and the not-contain assertion in acceptance/fight-api-spec-surface.spec.ts. The rule that the caps test title does not contain the path is kept.
- Appended `## Re-spec 2026-10-29 (2)` section.

## Unchanged
Scope, Risk, On merge, other ACs, Open questions (none). No branch work exists.
