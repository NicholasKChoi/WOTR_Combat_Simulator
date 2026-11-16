Title: Implementer runs and mutation-checks the acceptance specs a ticket makes it write

## Problem

Tickets routinely put Playwright cases in their acceptance criteria, so the implementer writes or edits
acceptance specs. Two engine rules then work against it:

- `agents/implementer.md` (Unit tests): "Do not author acceptance-harness tests (`REPO.md`
  `acceptanceHarness`); a separate gate owns those." The ticket outranks this, so the implementer writes
  the spec anyway.
- `references/common.md` (Processes), repeated at `agents/implementer.md:108`: "Only acceptance-test runs
  `commands.acceptance` or browser and end-to-end tests." This one still holds. So the implementer's
  own mutation check ("for each test you write, break the production code it covers") and the Bug-ticket
  regression-at-base run (`implementer.md:71`) both skip the spec it just wrote.

Acceptance-test, which would run the spec, comes after review. Review is the first gate to execute or
mutate it, and every defect becomes a full rework plus a review rerun.

## Evidence (WOTR_Combat_Simulator, project strategy-game-sim, 2026-11-12..15)

- SGS-137: implementer-1 "Acceptance NOT run. The role rules reserve acceptance runs for the acceptance
  gate". Review-1 found that the new `yLabel` locator also matched the age-up label, a strict-mode
  failure on first run.
- SGS-139: implementer-1 "The Playwright spec has no mutation checks because it was not run". Review-1
  found that the label-overlap check was vacuous, because the chosen marker kind had one marker.
- SGS-157: implementer-2 "I did not run the scratch-checkout base check" because the regression was an
  acceptance test. Review-1 blocked on missing regression-at-base evidence.
- SGS-135 and SGS-147: these implementers ran their specs anyway, against the rule, and caught most
  defects. Review still found one claimed case per test with no break that fails it (the #41 shape).

Six of the eight implementation reworks in the window were acceptance-spec defects. Each cost a rework
implementer plus a review rerun.

## Suggested edit

`agents/implementer.md`, Unit tests:
```diff
-edge cases. Do not author acceptance-harness tests (`REPO.md` `acceptanceHarness`); a separate gate
-owns those. Do not write tests that only restate schema markers or generated code.
+edge cases. Write an acceptance-harness spec only when a criterion names one; acceptance-test owns the
+rest. Do not write tests that only restate schema markers or generated code.
```
`agents/implementer.md` and `references/common.md`, Processes:
```diff
-- Only acceptance-test runs `commands.acceptance` or browser and end-to-end tests. The exception is
-  a task that builds or changes the acceptance harness: the implementer runs it once and records the
-  result, and review checks that record.
+- Only acceptance-test runs `commands.acceptance` or browser and end-to-end tests across the suite.
+  Two exceptions: a task that builds or changes the acceptance harness (the implementer runs it once
+  and records the result), and acceptance spec files the implementer added or edited, which it runs
+  by file under `timeout`, mutation-checks like its unit tests, and, on a Bug ticket, runs at the base
+  for the regression record. Review checks those records.
```
Report back gains: `- Acceptance specs written: <files>, run result, mutation per test, base run (Bug)`.

Side effect: one scoped Playwright run per implementer that writes specs (1-3 files, a few minutes);
checkout ports are already per-checkout.

Alternative: run acceptance-test before review for diffs that add acceptance specs. That keeps the
implementer rule, but review then sees two authors' tests in one pass.

Source: retro 2026-11-15 (WOTR_Combat_Simulator, strategy-game-sim, M9 close), pattern 1. Report:
`.claude/code-factory/projects/strategy-game-sim/reports/retro-20261115.md`.
