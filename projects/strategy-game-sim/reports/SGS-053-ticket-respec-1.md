# SGS-053 ticket re-spec 1

Gap: Scope item 7 covered only ~line 221; ~line 272 ("Builders walk `inputs.walkSeconds` each way") carries the same stale claim.
Changes: item 7 now covers ~221 and ~272; criterion widened to "every builder-walk statement" with a grep check.
Decision: ~line 220 ("a `start.rally` route uses `inputs.walkSeconds`") DOES need the divisor: `simulate.ts:229` divides `(rally.walkSeconds ?? inputs.walkSeconds)` by moveSpeedMultiplier, and a start rally has no walkSeconds (`simulate.ts:150`). Added to Scope and criterion.
Open questions: none.
