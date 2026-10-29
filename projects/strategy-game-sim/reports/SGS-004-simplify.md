# SGS-004 simplify
Reviewed origin/main..76a266e for reuse, simplification, efficiency, comments. The diff is mostly moved code; no reuse or efficiency changes were worth making.
Changed: lib/combat-simulator/battle.ts, removed five step-narrating comments (BattleResult "// data", resolveRound "// combat", "// leaders", "// take combat hits", "// record number of rounds in the battle") and a whitespace-only line. One new commit on top; pinned exports, constants and history untouched.
Result: tsc --noEmit clean; npm test 33/33 pass.
