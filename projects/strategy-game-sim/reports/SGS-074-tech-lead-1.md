# SGS-074 tech-lead 1

Decision: no blockers. Draft PR opened.

## PR
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/82 - base `main`, head `sgs-074-aoe4-m4-docs-audit-playwright` @ 26634fc8254ebcc5ae1f8ff89dde6f88b13b90d9 (draft: true). Title: "Correct the build order doc and add a cross-feature build order flow spec". Body set via `gh api -X PATCH`.

### Merge risk
**low** - docs and one new test file only; a revert fully undoes it, no public surface or critical path is touched.

### Review focus
No hotspots: no runtime code changes. The only possible failure is a flaky new spec or a doc sentence that misstates behavior, and neither affects production.

## Reviewed
- Range origin/main e6cad35..26634fc (3 commits: 6465ca8, 103871e, 26634fc).
- Files: docs/aoe4-build-order.md (+9/-4), acceptance/aoe4-build-order-m4-flow.spec.ts (+84 new). Total +93/-4.
- Against INVARIANTS.md (no invariant touched), CONTEXT.md open questions (none), criticalPaths (none touched). No production code, OpenAPI, schema, or existing test change.
- Spot check: the `build order:` prefix the doc names exists (lib/aoe4-build-order/schema.test.ts:47).
- Branch was not on origin before this gate; pushed at the given tip with no new commits. No existing PR for the head.

## Non-blocking notes
- The 400 sentence at docs/aoe4-build-order.md:931 is now a very long single line (with the pinned-run clause); it is readable but could be wrapped.
- The local branch has no upstream set (pushed by SHA refspec); the remote branch matches the tip.
