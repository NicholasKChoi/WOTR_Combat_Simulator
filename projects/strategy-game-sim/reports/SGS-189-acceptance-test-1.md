# SGS-189 acceptance-test 1

Verdict: PASS. Tip b17652dd8bef709f3a6e7d049ff6b50ee28b629d, checkout worktrees/sgs-189-reorder-builds.

- Tests written: none. The criterion (every spec loading english-knight-longbow or english-1tc-council-hall passes) is covered by existing specs; no new behavior needed a spec.
- Harness: acceptanceSetup ran (Chromium installed), Playwright started its own next dev.
- Run 1: acceptance/aoe4-simulate-api*, aoe4-builds-api*, aoe4-build-order-knight-longbow-page: 454 passed.
- Run 2: full acceptance suite: 1126 passed, 0 failed (4.4m). Includes all 8 specs referencing the two builds (knight-longbow-build, prebuilt-farms, deer-pack, house-rule, knight-longbow-page, prebuilt-plans, veterancy-conversion, triggers).
- Mutation checks: n/a (no tests written).
- Commit: none (no files changed).
- Criteria not expressible: none.
