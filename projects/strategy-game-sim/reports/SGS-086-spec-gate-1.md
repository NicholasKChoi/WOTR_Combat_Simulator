# SGS-086 spec gate 1
Verdict: READY. Risk low confirmed (UI-only, one component, no criticalPaths symbol, no strongModelTrigger, ~45 LOC, Invariants none correct).
Checked on origin/main b9481e3: workbench-tabs.tsx, workbench.module.css (.runBar sticky, .runField 767.98px), step-table.tsx/.module.css (w-auto selects, Labeled d-md-inline-flex, step-field-* testids), pages/apps/aoe4-build-order.tsx (two scrollMarginTop effects), docs Page section, vitest include covers components/**/*.test.ts, aoe4-results-split/narrow-layout/inline-issues specs exist.
Notes (non-blocking):
- Pure function's return for Home/End/arrow when the target equals the active tab is only pinned for ArrowRight disabled (null). Say Home/End on Build with Results disabled also return null (or build) so the unit table and the acceptance test agree.
- docs "Narrow layout" paragraph (line ~836, "the run bar wraps onto several rows") should also say the bar scrolls with the page; the "grep for other sticky statements" clause covers it.
- scrollMarginTop is set only when an effect fires; a viewport resize across 768 px between runs is not handled (edge, fine).
- Criterion 2 cites "371" as history only; the checked property is scrollWidth <= viewport, so it does not go stale.
