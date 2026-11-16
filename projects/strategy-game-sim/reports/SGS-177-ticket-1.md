# SGS-177 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-177-simulate-test-comment-aware-scan.md

Summary: Chore, aoe4-build-order, standalone (Milestone none), Priority low, Risk low, about 25 lines of test code, no dependencies, On merge none. The `literalsOf` scan in the `source shape` test of `lib/aoe4-build-order/simulate.test.ts` strips only `//` comments and then blanks quotes, so an apostrophe or backtick in a `/** */` block opens a bogus string that swallows real literals. The ticket asks for a single source-ordered pass that removes comments and blanks strings and regexes. Criteria require an extracted helper tested for: a quote or backtick in a doc comment, digits in a comment, and a comment marker inside a string. The existing assertions are kept.

Diagrams: none (single-component, outside the core loop).
Open questions: none.
Overlap: none found. No doc or comment states the "avoid quotes" constraint (searched at origin/main).
Lint: ticket-lint passed. No scratch checkout was made.
