# Simplify SGS-211 (sgs-211-repeat-paste-text-and-table-field)

Invoked /simplify on origin/main..HEAD. I applied its four angles (reuse, simplification, efficiency,
altitude) by reading the diff myself and did not launch the four review agents. The production code
is clean: it reuses REPEATABLE_ACTIONS, COUNT, and the existing words()/walk() formatters.

Trim: removed two `parse-text.test.ts` rows (`produce ... -> sheep x2`, `produce ... walk 4s x3`).
They duplicated existing `tc` rows in the same table, so no break could fail them alone.

Unit tests: `parse-text.test.ts` passes, 181 tests. Nothing pushed.

simplify-proof: sgs-211-repeat-paste-text-and-table-field commit c6e5c14bfbce8a9291e7db0341c81ee32116481b
