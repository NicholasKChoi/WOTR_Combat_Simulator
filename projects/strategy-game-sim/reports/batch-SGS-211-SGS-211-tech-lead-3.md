# Tech-lead gate: batch SGS-211-SGS-211

## Decision

PASS - stacked draft opened. No blockers, no untested hotspots.

## Opened PRs (bottom to top)

- SGS-211: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/221 - base `main` - **new** - head pushed `c6e5c14bfbce8a9291e7db0341c81ee32116481b` (draft, title set by pr.sh create, body set by pr.sh body: "body #221 rewritten")

### Merge risk (verbatim)
**medium** - changes the public paste-text format, which the save API's round-trip check also reads; additive and backward-compatible (steps without `repeat` print exactly as before), and a revert undoes it.

### Review focus (verbatim)
- [`lib/aoe4-build-order/parse-text.ts:235-238`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/221/files#diff-f15b3276097f911e62c7bc49dd49b2f950abcd30958d1fed32c722a33f86c219R235-R238) - the trailing `xN` is read after every non-produce action; if it read in a node slot or on `produce`, an existing build text would change meaning (`to x9` becoming a repeat, a produce count doubling as a repeat) - check the read sits after the action's own fields and before the line-end check - pinned by [`lib/aoe4-build-order/parse-text.test.ts`: parses %j with the trailing xN as a repeat only in last position](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/221/files#diff-fb3d7702a77a3845bb0da04cf1da7da09836b28732a7eec6511a4ca769882bcbR349-R372)

## What I reviewed

- Range: `e396ca3...c6e5c14` (3 commits: 50288fc, 6851c75, c6e5c14), base `origin/main` = e396ca3.
- Files: `lib/aoe4-build-order/parse-text.ts`, `components/apps/aoe4-build-order/step-table-model.ts`, `components/apps/aoe4-build-order/step-table.tsx`, `docs/aoe4-build-order-format.md`, `docs/aoe4-build-order-ui.md`, tests `parse-text.test.ts`, `step-table-model.test.ts`, `saved-builds.test.ts`, specs `acceptance/aoe4-repeat-step.spec.ts`, `acceptance/aoe4-repeat-step-paste-save.spec.ts`.
- LoC: +465/-12 total; reviewable business logic +17/-5.
- Checks: INVARIANTS A1-A3 (no randomness or wall-clock; parser and formatter only; no game numbers), S3 (repeat cap is enforced by validation from SGS-208, 1..200; parser only reads); no criticalPaths symbol touched; no API/schema/OpenAPI change; formatter output unchanged for steps without `repeat`, so stored builds and shipped build texts reformat identically; the trailing read sits between the action parser and `t.end()`, so node slots and produce counts are not affected (pinned by the parse table and the syntax-position table). Open questions: none in PROJECT.md or the ticket. Stack check: single member on `main`, diff holds only this task.

## Non-blocking notes

- After a revert, a build already saved with `repeat` (now savable) would reformat without its `xN`; the round-trip save check would then reject re-saving it. Mild; noted only.
- `acceptance/aoe4-repeat-step-paste-save.spec.ts` saves builds through the dev server via the existing `gatedTest`/`postBuild` helpers, matching other save specs; the ticket's "saves nothing" applies to `aoe4-repeat-step.spec.ts`, which does not save.
- No issue line in the PR body: the ticket's Source names no `GitHub issue #<n>`.
- Stack footer lists only #221: SGS-208 (#218) and SGS-210 (#219) are integrated, and nothing depends on SGS-211.
