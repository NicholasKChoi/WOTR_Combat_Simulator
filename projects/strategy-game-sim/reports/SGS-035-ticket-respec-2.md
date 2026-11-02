# SGS-035 ticket respec 2

Folded the four non-blocking spec-gate notes into tickets/SGS-035-aoe4-engine-common-dup-check.md (edited in place, no appended section):
1. Scope 3: the three villagerWalk call sites pass `x ?? state.inputs.walkSeconds` to `villagerWalkSeconds`.
2. Scope 3: spawnUnit move-speed division is villager-only; "leave it as is" (conditional removed).
3. Scope 6: test-helpers.ts comments must not contain the string `test-helpers`.
4. Spend-totals criterion: villager cost read from game data, not a hardcoded 50.
Tagged (respec 2). Nothing else changed; no open questions.
