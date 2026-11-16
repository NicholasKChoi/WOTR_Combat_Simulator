# SGS-177 implementer report 1

- Ticket: SGS-177. Branch: sgs-177-simulate-test-comment-aware-scan. Tip: 81b403014011a30fd2f0c44023f45e5aba9602de. Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-177-simulate-test-comment-aware-scan
- Status: needs_review

## Files
- lib/aoe4-build-order/simulate.test.ts: `numericLiteralsIn(code)` (one `replace` over a single alternation of block comment, line comment, single/double/template string, `/^...$/` regex, in source order) replaces the chained replaces in `literalsOf`; new `numericLiteralsIn` it.each table (7 rows). Extraction regex and allowed-literal rules unchanged.

## Tests
- simulate.test.ts: 93 pass. Full `npm test`: 2623 pass, 15 skipped. Rows cover: apostrophe in doc comment then code literal; backtick in doc comment then code literal; `/* 42 */` then code literal; quote in line comment; `//` in string then literal after it; `/*` in string then literal; digits inside strings.
- Existing source-shape test unchanged in assertions; passes on current sources. No pre-existing test edited.

## Mutation checks
- Removed the block-comment alternative (simulate.test.ts COMMENTS_STRINGS_AND_REGEXES): apostrophe, backtick and block-comment digit rows failed on the expected-literals assertion. Reverted.
- Removed the string alternatives: the `//`-in-string, `/*`-in-string and digits-in-strings rows failed. Reverted by re-edit (an earlier `git checkout` undo also wiped my uncommitted work, which I reapplied before the second mutation; the committed file is the final, verified version).

## Doc claims
None added.

## Results
- codegen: not set. build (`next build`): pass. lint (`tsc --noEmit` and `lint:dup`): pass, zero issues.
- Search at base found no comment in simulate.ts, civ-rules.ts or engine-common.ts stating the quote/backtick constraint; those files untouched.

## Invariants
No INVARIANTS touched (test-only change).

## Unverified assumptions added
None.

## Out-of-scope findings
None. Template literals with `${}` containing backticks are not handled (same as before); the scanned sources do not use that.
