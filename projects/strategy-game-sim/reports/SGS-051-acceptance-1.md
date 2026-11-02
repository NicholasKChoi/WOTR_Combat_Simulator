# SGS-051 acceptance-test 1

Verdict: PASS. New tip 74afb68aa9289117f9bcadd5d7dd44b6efb2150e (on b5eb52f).

New tests (Playwright, port 3871, Node 24.22.2, server stopped):
- acceptance/aoe4-simulate-api-knight-longbow-build.spec.ts (new)
  - the five gold-switch reactions are the last five steps (JSON shape, one per deposit).
  - 1200 s: no waiting step; every non-reaction step started; only `gold` ran out and reaction 1 startedAt === its depletedAt; reactions 2-5 not-reached with waitingOn trigger; no warning-severity gold warning.
  - 3600 s: no waiting step; all five deposits run out in order; each reaction startedAt equals its deposit's depletedAt; no warning-severity gold warning.
- acceptance/aoe4-build-order.spec.ts: the existing page-list test now also pins the three names in order (ENG 1TC, Spear/Longbow, Knight/Longbow).

Result: 51 passed across the new spec, aoe4-build-order, aoe4-step-table, spear-longbow spec. tsc clean, lint:dup ok.

Note: the brief said reactions are not-reached at 1200 s. Measured: the first gold deposit runs out at 931.85 s, so reaction 1 has run by 1200 s; only reactions 2-5 are not-reached. The test asserts that.

Mutation checks (all undone, `git diff --exit-code` clean):
- Swapped the spear and knight entries in builds.ts: the page-list test failed.
- Changed the last reaction's `count: all` to `1` in the build JSON: the knight spec failed (1 failed, 2 passed).

Already covered, skipped: step-table spec (choosing the other prebuilt), builds.test.ts (bar, round-trip, blacksmith order), existing spear spec.
Not expressible: exact run-out seconds are not asserted (reported figures only).
