# SGS-176 spec gate 1

**Verdict: NEEDS_SPEC**

## Gaps

1. Criteria 1 and 3 vs Scope (existing comments) - Scope lets the implementer fold an existing comment into the new doc comment (for example above `formatBuildOrderText`). Folding removes or edits existing comment lines. Criterion 3 says "adds only comment lines ... no non-comment line is added, removed, or changed", and the Scope rule "do not add, remove, or edit comments inside function bodies" is the only edit limit. The implementer has to guess whether editing or deleting an existing top-level `//` or `/* */` comment is allowed. Proposed fix: state that the diff changes only comment lines (added or edited), no code line, and that lines removed are comment lines only. Criterion 1 should also accept an adjacent existing comment that already states the job, since Scope allows skipping those. As written, criterion 1 forbids what Scope keeps.

2. Scope boundary of "test files" - Scope covers "non-test source files" and puts test files out of scope. The base has three non-`.test.ts` test-support modules with exports: `lib/aoe4-build-order/test-helpers.ts` (19 exports), `route-test-support.ts` (6) and `blob-fake-test-helpers.ts` (7). `blob-fake-test-helpers.ts` is a REPO.md exemplar. `git grep` shows 310 `export` lines in `lib/`, and none of them are in `*.test.ts` files. So the LOC note "test files included in that count" is wrong, and the 310 includes the 32 helper exports. An implementer cannot tell whether the helpers are in or out. Proposed fix: say whether test-support modules (named by file) are covered. Either way, define the criterion 1 file set by a rule, for example "every `lib/**/*.ts` file not matching `*.test.ts`, `*.acceptance.test.ts` or `*.live.test.ts`, and not one of the three named helpers".

3. Criterion 1 verification recipe - "list `export` lines whose preceding line is not the end of a doc comment" gives false hits on the multi-line `export type { ... } from` re-exports (`api.ts:4`, `model.ts:60`), which Scope skips. It also misses `export` lines inside an overloaded function group. Proposed fix: state the exemptions in the criterion (re-export statements and symbols whose adjacent comment already states the job). Also say what counts when a single `export` statement declares several names.

4. Stale pinned numbers - The Context quotes "4 exports", "13 exports" and "2 comment lines" for specific files, and the LOC estimate quotes "about 310 export lines". These are context counts, not criteria, so they do not block alone. They are wrong in one respect (see gap 2), and the implementer should not rely on them for coverage. Proposed fix: drop them or label them as a snapshot.

5. Criterion 6 - "No INVARIANTS.md regressions" is a pointer to a factory file and has no observable outcome for a comments-only change. Proposed fix: replace it with the observable fact (no executable line changed, which criterion 3 already covers) or delete it.

6. Criterion 2 - "states the symbol's job ... none merely restates the identifier" is a judgment call, and that is acceptable for a reviewer. The criterion "names the design-doc section heading when one covers it" has no check, though. Proposed fix: require that every quoted heading exists verbatim in `docs/combat-simulator.md` or `docs/aoe4-build-order.md`, and that a comment cites no heading the code does not implement. Add this as a checkable property.

7. Behavior-neutral claim - Risk `low` is fine. The comment-only change cannot touch the `criticalPaths` symbols' behavior. A trivial gap: criterion 4 says "no test file is edited", which holds. Nothing to change.

## Checked, no gap

- Files named in Scope exist at origin/main: `parse-text.ts`, `named-builds-routes.ts`, `battle.ts`, `data-schema.ts`, `model.ts`, `schema.ts`, `named-builds.ts`, `saved-builds.ts`, `depletion.ts`, `simulate.ts`.
- No test or acceptance test reads `lib/` source text, so comments cannot break one.
- On merge `none`, Unverified assumptions `none`, Open questions `none` and Depends on `none` are consistent. The comment-only change needs no diagram, no input validation and no doc updates.
- Size: about 310 one-line comments is under the ~400-line limit, though it is a wide diff.

## Notes

- Consider splitting the work by directory (`combat-simulator`, then `aoe4-build-order`) if review capacity is an issue. This is not required.
