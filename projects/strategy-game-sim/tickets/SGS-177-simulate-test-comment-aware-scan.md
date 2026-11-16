# SGS-177: Make the numeric-literal source scan comment-aware

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 25 (one scan helper in `lib/aoe4-build-order/simulate.test.ts`; test code only)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "`simulate.test.ts` source-shape test reads `/** */` comment text as code" (found by the SGS-176 implementer)

## Context

The `source shape` test "has no numeric literal beyond 0, 1, 60, the sample step and the one shared tolerance" in `lib/aoe4-build-order/simulate.test.ts` (`literalsOf`) strips only `//` line comments, then blanks quoted strings. `/** */` and `/* */` blocks are not removed, so an apostrophe or backtick in a doc comment opens a bogus "string" that swallows real code, including numeric literals, up to the next quote. Comments in `simulate.ts` and `civ-rules.ts` therefore have to avoid `'` and backticks, which is an unwritten rule. The stripping also treats a `//` inside a string as a comment. This changes no behavior the owner sees; it is test hygiene.

## Scope

- In `simulate.test.ts`, replace the chained `.replace` calls in `literalsOf` with one comment-aware pass over the source: block comments and line comments are removed, and string literals (single, double, template) and the regex literals the scan already blanks are blanked, with each token recognized in source order so that a quote inside a comment and a comment marker inside a string are each handled as part of the enclosing token. Keep the existing literal-extraction regex and the allowed-literal rules unchanged.
- Once the scan is comment-aware, the "avoid `'` and backticks in comments" constraint is gone. Check Scope-wise that no comment in `simulate.ts`, `civ-rules.ts`, or `engine-common.ts` or doc states that constraint (a search at the base found none); do not edit those files.
- Examples of the same helper's neighbors: the `exports exactly the seam names` test reads `^export` from raw source. Leave it unless it needs the helper to stay correct.

**Out of scope:** Editing comments in the scanned source files; changing which literals are allowed; any production code.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Pre-existing tests keep their assertions; the numeric-literal test still checks the same allowed literals and counts, and passes on the current sources.
- [ ] The scan ignores literal-looking numbers and quote characters inside `/** */`, `/* */` and `//` comments: a test on the scan helper (extract it so it can be called with a string) covers a doc comment containing an apostrophe, and a doc comment containing a backtick, each followed by real code with a disallowed numeric literal that the scan must still report; the test fails if the comment text is read as code.
- [ ] A comment containing a digit sequence (for example `/* 42 */`) yields no literal; a digit sequence in code after it still does.
- [ ] A `//` or `/*` inside a string literal is not treated as a comment: a numeric literal after such a string on the same line is still reported.
- [ ] No INVARIANTS.md regressions

## Open questions

none
