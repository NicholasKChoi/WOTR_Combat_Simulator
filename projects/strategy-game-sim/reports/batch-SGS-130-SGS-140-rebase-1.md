# Batch SGS-130..140 local restack onto origin/main 0ba1970

Nothing pushed. No conflicts in any branch; no code changed beyond the rebase.

| Order | Branch | New tip (full SHA) | Old tip |
|---|---|---|---|
| 1 | sgs-130-blob-landed-write-retry-cap | 1c854a6d152dc518fa2c20c17eed0136788a68f6 | 559cf88 |
| 2 | sgs-131-my-builds-no-wipe-and-backup | 398f1cb69482b175395df2afe5081a0531a21ac3 | c03940d |
| 3 | sgs-134-chart-layout-model-key-results-collapse | b02eddd1d5c351b7ede7ded6df089901b3e71ab5 | a5e866c |
| 4 | sgs-136-simulate-production-buildings-series | a771693b9004e2476f35e27dd7179b97b84614a8 | bbaa171 |
| 5 | sgs-140-editor-compact-mode | cf023bb4646d5692101ee4fd7d780b8e5f4769ba | 72be9db |

Commands used: 130 `git rebase origin/main`; 131 `--onto <130 new> 73693ef` (3 own commits); 134 `--onto <131 new> c03940d`; 136 `--onto <134 new> a5e866c`; 140 `--onto <136 new> bbaa171`.

Checks (all passed): tsc --noEmit and lint:dup (0 clones, both configs) on every branch; unit tests for touched areas
(130: lib/aoe4-build-order, 1652 pass; 131: components+lib aoe4-build-order, 2366 pass; 134: components, 731 pass;
136: components+lib, 2398 pass); full `npm test` at 140: 77 files passed, 1 skipped, 2455 tests passed, 15 skipped.
Acceptance (Playwright) specs were not run.
