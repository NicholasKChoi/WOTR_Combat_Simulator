# Tech-lead: batch SGS-196

Decision: no blockers, no untested hotspots. Draft PR opened.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/199 (base main, new, head 7364631ff491489f3e01599afac930da4da88606)
- Merge risk: low (new files only, no importer, no public surface or critical-path symbol).
- Review focus: chart-zoom.ts:40-45 rowsInWindow (pinned by chart-zoom.test.ts rowsInWindow table); chart-zoom.ts:25-29 panWindow (pinned by panWindow table).

Reviewed: 7364631 vs main, 4 files (2 source, 2 test), +93 source LoC, +235 total. No invariant touched, no irreversibility, no security surface.

Non-blocking: none.
