# Simplify pass, batch SGS-158-SGS-158

New tip: dea14a6491585f03febfe752f53ebf2cded02c82 (was ba9dee1).

Changes (lib/combat-simulator):
- battle.ts: moved MIN_HIT_FACE up beside MAX_COMBAT_DICE and MAX_LEADER_REROLLS.
- battle.test.ts: it.each titles now read "a combat die showing N scores H (hits)" instead of "scores 1 hits".

Nothing else to trim. Checks: npm test 2562 passed, 15 skipped; tsc --noEmit clean; lint:dup clean. No browser tests run. Not pushed.
