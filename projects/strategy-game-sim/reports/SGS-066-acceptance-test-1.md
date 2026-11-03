# SGS-066 acceptance-test 1

Verdict: PASS. Tip 6e1a5d0 plus one new commit 7d20a04 (tests only).

Already covered by existing specs that can fail through the real page (not re-added): load state; 200 selects Results and
scrolls below the run bar at 1280/768/390; sticky run bar in both tabs; text/table toggle (one view, byte-exact text,
survives run, tab switch, resets on reload); auto-size rows (8 min, 30) and no inner scroll; gutter count, data-line,
no data-error, level with text; rejection/400/500 select Build with pin kept; unpin with no result.

Gap found and added (aoe4-build-order.spec.ts):
1. rejected paste in table view: build-order-issues visible below step-table-unavailable, table view stays pressed.
2. mocked 400 in table view: simulation-error below step-table, view stays table, no build-order-issues.

Run: 10/10 pass (--repeat-each=5, 4 workers, port 4021). tsc and lint:dup clean.
Mutations (reverted, git diff clean): IssueList only in text view -> test 1 fails; simulation-error only in text view ->
test 2 fails.
Not expressible: none.
