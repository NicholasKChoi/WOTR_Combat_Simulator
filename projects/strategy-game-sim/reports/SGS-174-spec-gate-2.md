# SGS-174 spec gate, round 2

**Verdict: READY**

All four round-1 gaps are closed. I read the SGS-171 branch tip (124dc82) in its task checkout.

## Checked

- Depends on SGS-171, and TASK-GRAPH.md agrees. The tip's docs match the ticket's description.
  - The model doc `docs/aoe4-build-order.md` has Purpose and model, Determinism, Data sources, Model rules, Depletion, Severity, Technologies, CivRules seams and Extension points.
  - The format doc has Build order input, Route (with Builds routes and Named builds routes) and Outputs.
  - The model doc intro already links the format and UI docs, so the pointer line has a clear place.
- The module list in the ticket accounts for all 35 non-test `.ts` files in `lib/aoe4-build-order/` at the tip.
  - The three test-support files (`test-helpers.ts`, `route-test-support.ts`, `blob-fake-test-helpers.ts`) fall under the one "test support" line.
  - The rule is "every file present", so the README stays correct if a file is added later.
- `pages/api/aoe4-build-order/simulate.ts` and `data/aoe4-build-order/README.md` exist.
- `buildOrderCatalog`, `checkBuildOrder` and `checkSimInputs` are in `schema.ts`. `runInstant`, `offerSteps`, `applyDueEvents`, `nextWake`, `sampleTimes` and `stepHandlers` are in `simulate.ts`.
- No existing test reads a README in `lib/aoe4-build-order/` or depends on the doc layout. The README hits in the tests are the freshness check's own pointer text and the builds directory listing.
- Criteria are mechanical:
  - a `git ls-files` diff for the module map;
  - a digit-free check;
  - a link check recorded in the report;
  - a doc diff of added lines only;
  - markdown-only diff.
- No search criterion runs over code.
- Risk low, Invariants none, On merge none and Unverified assumptions none are right for a docs-only change.
- No overlap with other open tickets. SGS-173 and SGS-172 edit other docs. SGS-176 adds doc comments to lib exports and does not touch the README.

## Notes

- The implementer must wait for SGS-171 to integrate, or branch from its tip. The links resolve only after the split.
- The simulate handler checks against `englishCatalog()`. The ticket says "the catalog from `buildOrderCatalog`", which is close enough. Its "as read from the code" instruction covers any difference in the README wording.
