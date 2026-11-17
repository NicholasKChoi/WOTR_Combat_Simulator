# Simplify: SGS-197 (branch sgs-197-chart-zoom-pan)

Verdict: nothing to trim. No commit made, nothing pushed.

Branch tip SHA: 5156184c78d41d43722b4e625e0baf728d552ad0 (unchanged)

Loaded: common.md, REPO.md, LESSONS.md (one entry, Playwright layout reads; the spec already follows it), ARCHITECTURE.md, tsconfig.json.

Reviewed the diff against origin/main (9 files): use-chart-zoom.ts, line-chart.tsx, chart-markers.ts, chart-drag.ts, use-chart-drag.ts, results.module.css, and the unit and acceptance specs.

- Reuse: DRAG_THRESHOLD_PX is already moved to chart-drag.ts and shared by both drag hooks. The zoom hook reuses the existing chart-zoom helpers. No duplicated logic found.
- Comment bar: the comments in chart-markers.ts, line-chart.tsx and the acceptance spec each state a constraint (origin and end meaning, clip alignment, window-edge marker placement). None restates a name or narrates a step.
- Code shape: the extra `highlight &&` guards beside `band` are needed for type narrowing. The only other candidates were cosmetic and left alone to avoid churn.
- Unit tests: `npm test` passed (88 files passed, 1 skipped; 2745 tests passed, 15 skipped). No browser or end-to-end tests were run.
