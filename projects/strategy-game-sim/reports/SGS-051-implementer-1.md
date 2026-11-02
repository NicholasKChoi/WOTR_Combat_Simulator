# SGS-051 implementer report 1
Branch sgs-051-aoe4-build-knight-longbow, tip e25e534b7f4b55426ffb7854a7e3020550fef0d4, worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-051-aoe4-build-knight-longbow. Status: needs_review.

Files: data/aoe4-build-order/builds/english-knight-longbow.json (new, 53 steps); lib/aoe4-build-order/builds.ts (import + entry); lib/aoe4-build-order/builds.test.ts (two King's Palace cases: blacksmith order + startedAt, several gold deposits dry at 3600 s); data/aoe4-build-order/README.md (entry). docs/ needs no edit.

Build: Feudal via abbey-of-kings (ENG 1TC's already-tuned opening), Castle via kings-palace; 3 stables, 2 ranges, 12 villagers to gold before the palace, rally kings-palace -> wood, farms at 14/16/18 min, four blacksmith techs after the palace step, veteran-longbowmen after produce knight (upgrade gold: 4x125 + 250 = 750). source = "hand-authored for this simulator".

Result: Castle 905.4 s (15:05; ref 804 s). At 1200 s: 24 knights, 17 longbowmen (ref ~23 / ~54; longbow gap: two ranges starved of wood/food, no cause fixed). Gold run-outs (N=5): gold 1051.0 s, gold#2 1519.2, gold#3 1987.5, gold#4 2455.7, gold#5 2923.9; each moved by its move-all reaction at the run-out instant, gold#5 -> wood.

Finding that shaped the build: the King's Palace is a villager producer that spawns to the start rally (gold). Without a rally step for it (placed before the build), its villagers arrived at depleted gold: idle-arrival warning. Added rally kings-palace -> wood.

Tests: npm test 37 files, 998 passed, 4 skipped; shared suites cover the new build. tsc and lint:dup clean (0 clones); next build ok; npm run acceptance 522 passed.
Mutations (undone): techs moved before palace -> order case failed; first gold reaction deleted -> bar parts 4/5 failed at 1200 and 3600 plus dry-deposit case; dry-deposit threshold raised -> failed.
Pre-existing tests edited: none. Codegen: none set. Invariants A1-A3 upheld (no amount key; deterministic).
Out-of-scope: none.
