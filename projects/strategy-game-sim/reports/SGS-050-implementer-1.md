# SGS-050 implementer report 1

Branch sgs-050-aoe4-build-spear-longbow-maa-crossbow, tip 9a8d2efb6c7356a496c2d8ce376c04ac1d83d69d (one commit on origin/main 835aceb).
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-050-aoe4-build-spear-longbow-maa-crossbow
Status: needs_review

Files
- data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json (new, 29 steps)
- lib/aoe4-build-order/builds.ts (import + second entry)
- lib/aoe4-build-order/builds.test.ts (shape test, uses countAt from test-helpers)
- data/aoe4-build-order/README.md (entry for the build)
- docs/aoe4-build-order.md: no edit (its prebuilt paragraph states the bar generically; nothing contradicted)

Measured gold run-outs at default inputs (PR body data)
- gold 1218 s, gold#2 1944 s, gold#3 2670 s; gold#4 never reached. Nothing runs out by 1200 s.
- 3 reactions in the file: gold -> gold#2, gold#2 -> gold#3, gold#3 -> farm (last deposit's target is a non-gold node).
- man-at-arms trigger = time 681 (Castle landmark completes 680.31 s); actual start 760 s (resource wait).
- King's Palace is a villager producer: a rally step sends its villagers to farm (otherwise they walk to the start rally `sheep`).
  TC rally goes to gold 560-760 s only, so no producer is rallied to a deposit when it runs out; no producer rally reaction needed.

Tests
- npm test: 37 files, 997 passed, 2 skipped (1TC-only tests). builds.test.ts: 20 passed, 2 skipped.
- Invariants encoded: bar parts 1-5 at 1200/3600 on the new build (existing parametrized tests), paste round-trip, validates, shape test (order, Castle, unit counts, MAA/XB start >= palace completedAt).
- Pre-existing tests edited: none (only an import and an appended describe in builds.test.ts).

Mutation checks (in this worktree, each reverted from a saved copy; git status clean afterwards except intended changes)
1. Remove gold reaction: bar "moves every gatherer off a gold deposit" at 3600 s failed.
2. Move produce man-at-arms before build kings-palace: shape test failed.
3. Remove build kings-palace: shape test and both "starts every non-reaction step" tests failed.
4. Delete the gold#3 reaction: bar gold test at 3600 s failed.
Note: mutations were run on the SGS-039/040 base, which is already merged in origin/main 835aceb.

Gates: tsc --noEmit clean; lint:dup 0 clones; npx next build ok; npm run acceptance 522 passed. Node 24.
Determinism: the engine is deterministic; not separately asserted with a new test (ticket lists it as acceptance; two runs were not added to the suite).
git diff --stat origin/main on rules, aoe4world, english-1tc.json: empty.

Out-of-scope findings: none. Observation: the spearman/longbowman steps are continuous, so they keep consuming resources after the transition (final 3600 s counts: spearman 15, longbowman 13, man-at-arms 40, crossbowman 27).
