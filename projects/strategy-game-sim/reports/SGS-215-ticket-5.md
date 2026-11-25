# SGS-215 ticket report 5 (re-spec 2)

File: tickets/SGS-215-production-past-population-cap.md. Both mechanical gaps from spec-gate-4 are folded in.

1. The retuned Spear/Longbow criterion is now "every unit test and acceptance spec that loads this build file passes with assertions as written". It names the consumers as examples: builds.test.ts and the PRODUCTION_FLOORS entry, spear-longbow-build, prebuilt-plans, house-rule, deer-pack, prebuilt-farms, unit-lines, and aoe4-units-chart-upgrade-dots. The two re-pins are the gold run-out time in builds.test.ts and the 1800 s digest in simulate-house-gate.test.ts. Both are taken from the retuned file in the same change. Tagged (respec 2).
2. The pre-cap criterion now says an integer durationSeconds strictly before the cap instant, because cap instants are fractional. The criterion keeps its (respec 1) tag and gains (respec 2).

I appended `## Re-spec 2`. ticket-lint.py with --spec exits 0, with no errors or warnings. I did no re-exploration, as the gaps were marked mechanical. There are no open questions and no diagrams were changed.
