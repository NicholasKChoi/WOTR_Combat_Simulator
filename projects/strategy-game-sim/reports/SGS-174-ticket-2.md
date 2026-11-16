# SGS-174 re-spec 1 (ticket author)

File: tickets/SGS-174-aoe4-simulator-internals-overview.md. ticket-lint passed with no output.

Changes (all four spec-gate gaps folded in):
1. Depends on: SGS-171. The README links to the doc that holds each section at the SGS-171 tip. The model doc holds Model rules, Depletion, Technologies, CivRules seams and Extension points. The format doc holds Build order input, Route and Outputs. The pointer line goes in the model doc's intro beside the links SGS-171 adds. Context says to read the docs at the SGS-171 branch tip.
2. Module map rule: every `.ts` file that is not `*.test.ts` or `*.acceptance.test.ts` is named. The test-support files (`test-helpers.ts`, `route-test-support.ts`, `blob-fake-test-helpers.ts`) go under one test-support line.
3. Criterion 7 is now "only added lines in `git diff` on the doc".
4. Criterion 6 is now "no digits other than in file names, anchors and link targets".
5. Link-check criterion: the run is recorded in the report.

Re-spec 1 section appended. No diagrams. No open questions. No overlap beyond SGS-171, which is now a dependency. SGS-173 (ARCHITECTURE edits) is separate.
