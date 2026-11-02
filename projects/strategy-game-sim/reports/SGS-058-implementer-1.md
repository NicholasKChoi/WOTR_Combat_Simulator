# SGS-058 implementer report
Branch sgs-058-aoe4-data-schema, tip 82f2832c2388351f0a3d67337f6b478d62e894e4, worktree $FACTORY_DIR/worktrees/sgs-058-aoe4-data-schema. Based on origin/main 028fc43 (main had moved past d070936). Status: needs_review.
Files: lib/aoe4-build-order/data-schema.ts (new, three exported schemas, ~95 lines); lib/aoe4-build-order/data.test.ts.
Removed assertions: snapshot test "records where it came from..." (string/length, 40-hex, http); hand-entered test "labels every value with a source..." (source string, unverified boolean). Both now covered by schemas.
Tests: data.test.ts 36 pass; full npm test 1283 pass, 8 skipped; tsc, lint:dup (0 clones), next build, acceptance (569 pass, port 3811) all pass.
Mutation checks: for each of the 8 defect tests, weakened the matching schema rule (regex, startsWith, min(1), unverified, number, record->partialRecord, grantedBy, type enum); exactly that test failed each time; restored (cmp verified).
Acceptance greps: exactly 3 `z.ZodType<` lines; removed-pattern grep prints nothing. Internal schemas are unannotated so the exported ones are the only annotated ones; tsc still checks the three against Snapshot/BaseRules/CivData.
Value import from ./model: GATHER_NODES, RESOURCE_KINDS only.
Invariants: none touched; no runtime importer.
Out-of-scope: none.
