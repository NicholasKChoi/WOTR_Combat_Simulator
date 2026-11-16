# SGS-174 spec gate, round 1

**Verdict: NEEDS_SPEC**

## Gaps

1. **Dependencies / Links into the design doc** - The ticket says `Depends on: none`, but TASK-GRAPH.md lists SGS-171 as its dependency. SGS-171 (Split the AoE4 build order doc in three) is not merged. It moves Build order input, Route (with Builds routes and Named builds routes) and Outputs out of `docs/aoe4-build-order.md` into `docs/aoe4-build-order-format.md`. The ticket's link targets (Build order input, Route, Outputs) therefore resolve in a different file after SGS-171. Meanwhile Model rules, Depletion, Technologies, CivRules seams and Extension points stay in `docs/aoe4-build-order.md`. An implementer working at `origin/main` would link to the old file, and the links break the moment SGS-171 merges. The ticket also says "being split by another backlog item" without depending on it, and it places the new README line in "Purpose and model", which SGS-171 rewrites (the intro gains links to the other two docs). Proposed fix: set `Depends on: SGS-171`. Say that the README links to whichever doc holds each section (model doc for rules, depletion, technologies, CivRules seams and extension points; format doc for build order input, route and outputs), by heading anchor, as they read at the SGS-171 tip. Say that the one-line pointer goes in the model doc's intro beside the links SGS-171 adds. Read the docs at the SGS-171 branch tip, not at `origin/main`. (The implementer or the manager can close this; it is not owner-only.)

2. **Module map / criterion 1** - "every non-test `.ts` file" is ambiguous. `lib/aoe4-build-order/` holds `test-helpers.ts`, `route-test-support.ts` and `blob-fake-test-helpers.ts`. They are not `*.test.ts`, but they are test-only support. The example list omits them, and the criterion says a reviewer diffs `git ls-files` against the README. Proposed fix: state the rule. Every `.ts` file that is not `*.test.ts` or `*.acceptance.test.ts` is named, and the test-support files are either listed under one "test support" line or explicitly excluded. Pick one.

3. **Acceptance criterion 7** - "no other statement in that doc becomes untrue" has no observable check. Proposed fix: "the only change to `docs/aoe4-build-order.md` is the added pointer line(s) (`git diff` on that file shows only added lines)."

4. **Acceptance criterion 6** - "states no game number... that the design doc also states" is hard to confirm. Proposed fix: "the README contains no digits other than in file names, heading anchors and link targets". That is mechanical and checkable.

## Checked and fine

- Files and symbols at `origin/main` exist: `checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog` (schema.ts), `textToBuildOrder` (text-to-build.ts), `simulateBuildOrder`, `runInstant`, `offerSteps`, `applyDueEvents`, `nextWake`, `sampleTimes`, `stepHandlers` (simulate.ts), `pages/api/aoe4-build-order/simulate.ts`, `data/aoe4-build-order/README.md`.
- Data flow matches the code: the simulate handler takes `buildOrder`, rejects `text`, then runs `checkBuildOrder` and `checkSimInputs` against `englishCatalog()`, then `simulateBuildOrder`.
- `runInstant` order at base: collectRunOuts, house pass, offerSteps, applyDueEvents, house pass, offerSteps, startProduction, house pass. The ticket's summary is a compressed form of that order. It says "read from the code", so it is fine.
- Risk low, Invariants none, On merge none, and Unverified assumptions none are all appropriate for a docs-only change. No criteria search code. Nothing else removes or replaces the README's subject.

## Notes

- Consider adding a README link check (the criterion already requires resolving links; it should say it is run and recorded, as SGS-171 does).
