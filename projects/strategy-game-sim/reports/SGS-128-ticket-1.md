# SGS-128 ticket report

File: `projects/strategy-game-sim/tickets/SGS-128-shared-test-helpers-and-jscpd-gates.md` (lint clean).

Summary: "Share the storage and fetch test helpers and add the two jscpd gates", aoe4-build-order, M9.11 and the acceptance-scan part of M9.9. Root ticket (no dependencies), about 150 lines, test and config code only, Risk standard. Scope: new `storage-test-helpers.ts` (C12), fold the three fake-Storage copies and the `saved-build-loader.test.ts` fetch copies, `.jscpd.json` plus `acceptance`, new `.jscpd.tests.json` (5 lines), `lint:dup` runs both, fold every reported clone, fix `ARCHITECTURE.md`. Criteria cover lint:dup, no remaining helper copies, tests and tsc still green, probe, docs.

Checked: at `origin/main` (cdc51b1), jscpd reports 8 clones scanning `acceptance/` at current thresholds and 19 clones at 5 lines over test and helper files, matching the design. Run with CLI options in a throwaway worktree (removed).

Diagrams: none (single-component).
Open questions: none.
Overlap: none found. The ticket allows a split into helpers plus tests gate versus acceptance path if the clone folds exceed about 400 lines.
Note: the pattern glob syntax was not verified against a config file, only CLI `--pattern`; listed under Unverified assumptions.
