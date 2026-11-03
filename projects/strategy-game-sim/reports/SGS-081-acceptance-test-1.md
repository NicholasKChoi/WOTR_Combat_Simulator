# SGS-081 acceptance-test 1

Verdict: PASS. Commit 2fc9593 on sgs-081-aoe4-retune-prebuilt-farms (on 7eb1d10). Test-only: acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts (15 tests). Playwright harness ran (own next dev); 15/15 pass, plus existing farm-slots, spear-longbow and knight-longbow specs pass (30 total in the first run). tsc and lint:dup clean.

Tests
- 9 tests: each of 3 shipped builds x 1200/1800/3600 s, POST simulate, no `farm-idle` warning (criteria 1, 3, 4).
- Spear: step count under 60 (far fewer than the ~110 of the farm-step approach).
- Spear at 1200 and 3600 s: no waiting step, every non-reaction step started, not-reached only on trigger, Castle (age 3) reached by 1200 s.
- Spear through 1800 s: no idle-arrival or step-stuck.
- Spear man-at-arms: time trigger >= Castle reachedAt, starts at or after Castle.
- Knight/longbow through 1800 s: no idle-arrival or step-stuck.

Mutation checks (all undone, `git diff --exit-code -- data lib` clean)
- Spear last Town Center rally back to farm: 3 farm-idle tests fail.
- Spear man-at-arms trigger 681: the trigger test fails.
- Knight first 3 farm steps deleted: 3 farm-idle tests fail.
- 1TC first farm step replaced by `move 3 sheep to farm`: 3 farm-idle tests fail. (Deleting 1TC farm steps outright does not fail, since no villager is then sent to farm. That is expected, not a test weakness.)
- Spear +70 farm steps: step-count test fails.
- Spear council-hall delayed to 1100 s: the 1200 s and 3600 s all-started/Castle tests and the man-at-arms test fail.
- Spear gold reaction to `gold` (depleted): idle-arrival test fails.
- Knight sheep reaction to `sheep`: knight idle test fails.
- Not shown to fail: a spear gold-reaction-to-stone mutation changed nothing, and I did not find a separate mutation for the knight idle test on the gold reactions. The knight test is covered by the sheep mutation.

Failures: none.

Observation (not a defect, spec-gap in ticket wording): the ticket's bar text says the spear `man-at-arms` trigger is 681 s. The branch moved it to 757 s, the new Castle landmark second, which the ticket permits when the "reaches Castle" case fails. The README line 68 states 757. The existing spear spec already pins 757. My test asserts the relation (trigger >= Castle, start >= Castle) rather than a literal.

Not expressible: the "re-time the first farm step 60 s later" catch is covered by the mutations above, not as a standing test. README/docs text criteria are not API-observable.
