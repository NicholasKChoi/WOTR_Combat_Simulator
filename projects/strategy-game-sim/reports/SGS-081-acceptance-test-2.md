# SGS-081 acceptance-test 2

Verdict: PASS. Tested tip eb6406c; new commit 884b1c6 on sgs-081-aoe4-retune-prebuilt-farms (local, not pushed). Test-only: acceptance/aoe4-simulate-api-prebuilt-plans.spec.ts (14 tests). Playwright harness ran (own next dev): 29/29 pass (14 new + 15 in the existing prebuilt-farms spec, which already holds the floors/cap API case per build and the farm-idle loop). builds.test.ts: 43 passed, 10 skipped. tsc and lint:dup clean (0 clones). No server left running.

Tests written
- Per build x (1200, 3600 s): no waiting step, every non-reaction step started, not-reached only on trigger (6).
- Per build: no idle-arrival or step-stuck through 1800 s (3; restores the spear coverage dropped from the old spec).
- Per build: produced unit types at 3600 s are exactly the plan's (3).
- Spear: Castle by 1200 s, man-at-arms time trigger >= Castle, step starts >= Castle (1).
- 1TC: steps[0..23] sha256 equals the file at 2fc9593 (hash verified equal to both versions); first reaction is the gold depleted move-all to gold#2; every step after 23 is a reaction or has a time trigger >= 420 (3).

Mutation checks (all undone; git status clean apart from the new file)
- 1TC steps[22] trigger 420 -> 421: guide-steps test fails.
- 1TC step 30 trigger -> 300: late-step test fails.
- Knight build: knight produce steps removed: unit-types test and the knight floors case fail.
- Spear man-at-arms trigger -> 100: Castle/trigger test and spear floors case fail.
- 1TC gold reaction target -> wood: first-reaction test fails.
- Spear all farm steps removed: 9 tests fail (farm-idle x3, waiting, floors, unit types, Castle).

Failures: none.

Not expressed / notes
- Floating-cap and floors are already covered per build at the API by the existing spec; mutation M3/M4/M6 confirmed they bite.
- README and docs criteria and the git diff --stat scope are not API-observable. The 1TC freeze is pinned by hash, so a deliberate guide edit must update GUIDE_STEPS_SHA256.
- I did not run the full browser-based aoe4-build-order.spec.ts marker-label runs (Rework 7); outside this role's scope.
