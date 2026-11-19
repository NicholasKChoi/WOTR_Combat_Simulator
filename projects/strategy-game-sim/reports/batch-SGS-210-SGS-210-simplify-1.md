# Simplify pass, SGS-210

Branch sgs-210-annotations-group-repeated-step-copies, start tip d654549, trim commit 9a74faa32f6b616837884929653224fbe11c712e.

Loaded common.md, LESSONS.md (Playwright rule only, not touched), style sources, and invoked the /simplify skill. The skill's four-agent fan-out was done inline by me (reuse, simplification, efficiency, altitude), not by spawned agents.

Change: `blockedByText` in step-annotations.ts, the not-reached early return folded into the single join (same output). Skipped: duplicate blockedBy assembly in `combineRuns` (merged waits differ from per-copy for not-reached, so unifying changes behavior); `copiesDetailText` guard (covered by tests).

Unit tests: components/apps/aoe4-build-order, 35 files / 998 tests pass; tsc --noEmit clean. Nothing pushed.

simplify-proof: sgs-210-annotations-group-repeated-step-copies commit 9a74faa32f6b616837884929653224fbe11c712e
