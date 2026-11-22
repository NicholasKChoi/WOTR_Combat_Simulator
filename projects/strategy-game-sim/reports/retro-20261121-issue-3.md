Title: Implementer mutation checks are listed per break, so a test that no break fails still passes (follow-up to #41)

## Problem

`agents/implementer.md` (Unit tests) requires, for each test and each row, claimed case and assertion
in it, a break that fails that test's own check, and the report lists "per test ... the break you made".
Implementers instead list breaks and the tests that caught them ("combineRuns: copy it instead of
returning same -> 'returns the same run for one copy'"). That list proves every break is caught by
something; it does not prove every test fails for some break. A test whose claimed case is caught only
by other tests, or a row covered only by a break that changes two conditions at once, goes through. The
rule exists and does not fire because the report format the agent fills in is keyed by break.

## Evidence (WOTR_Combat_Simulator, project strategy-game-sim, 2026-11-18/19)

- SGS-210 (review 8, finding 1): the test "gives a repeated source copies equal to its copy count and a
  run equal to the combined run" asserts neither claim; with `combineRuns(copies)` changed to
  `copies[0]` it still passes. The implementer's report (implementer 7) lists that same break under
  "alignment: ... `run = copies[0]` -> alignment, row 5/6/7 and buildAnnotations tests": other tests
  caught it, so the dead test was never noticed.
- SGS-212 (review 6, findings 1 and 3): the row "the text does not convert" keeps a converting text, so
  adding `conversion.ok &&` to `canRename` fails nothing. The report lists one break "tied to status and
  conversion (stale and invalid rows)": two conditions in one edit, so the status half failed both
  rows. Removing `!saving &&` fails nothing, and no break of it is listed.
- Both were sonnet implementers; each cost a rework and an opus review rerun ($1.5-1.7). After #41 and
  #73 landed (11-17/18), 2 of the 5 tickets in this window still had a test-cannot-fail rework (8 of 41
  in the window before).

## Suggested edit

`agents/implementer.md`, Report, the Mutation checks item:
```diff
-- Mutation checks: per test (an acceptance spec included), and per table row, claimed case, and
-  assertion within it, the break you made (`file:line`), the assertion that failed, and confirmation
-  it was undone.
+- Mutation checks: a table with one line per test you wrote or edited (an acceptance spec included),
+  and one per table row and per case its name claims, named as in the test file:
+  `<test or row> | <break, file:line> | <its own assertion that failed>`. List the tests first, then
+  find a break for each; a break that another test caught does not fill a line. One break changes one
+  condition: a break that changes two conditions (`status && conversion` removed together) fills no
+  line. A line with no break means the test is rewritten or deleted before you report.
```
`agents/review.md`: when the implementer's mutation table lacks a line for a new test, row or claimed
case, that is a `test` finding by itself (no need to rediscover the break).

Source: retro 2026-11-21 (WOTR_Combat_Simulator, strategy-game-sim, M12 close), pattern 4. Report:
`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261121.md`.
