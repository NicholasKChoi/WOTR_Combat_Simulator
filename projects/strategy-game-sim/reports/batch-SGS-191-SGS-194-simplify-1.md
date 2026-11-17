# Simplify pass: SGS-191 and SGS-194

Loaded: common.md, LESSONS.md (Playwright layout lesson; not touched by either trim), REPO.md, ARCHITECTURE.md and tsconfig.json (style sources). Independent branches, nothing pushed.

## sgs-191-unit-line-data
- Old tip f58419cbaf6612ed8194152f93012f9deca9ad0d, new tip 3e13a62dd9ec953e22b4a4dfcbfb862a89396e14.
- Trim: the `research markers unit` describe in `acceptance/aoe4-simulate-api-unit-lines.spec.ts` was indented 4 spaces inside the file's 2-space style; dedented. Whitespace only, no behavior change.
- Reviewed and left: unit-lines.ts, markers.ts, research.ts, simulate.ts, model.ts comments, docs and openapi (no reuse, efficiency or comment-bar issues).
- Unit tests (`npm test`): 84 files passed, 1 skipped; 2627 tests passed, 15 skipped.

## sgs-194-results-charts-table
- Old tip 141a2534210f3fadaaa86a5ed830389888f0d05c, new tip 4dc3bd8a899aede40b41fd95e543b560895260fe.
- Trim: in `chart-header.test.ts`, removed two `expect(html).toContain('Gather rates' / 'extra-control')` lines from the no-layout test; the cell-scoped assertions above them already check the same content.
- Reviewed and left: chart-header.tsx, line-chart.tsx (mostly reindentation into the table), results.tsx, CSS. The inner `hidden` on `chart-body` beside the `hidden` row is kept because the tests and `aria-controls` use it.
- Unit tests (`npm test`): 83 files passed, 1 skipped; 2614 tests passed, 15 skipped.

No browser or end-to-end tests were run.
