# Simplify report: sgs-195-marker-control

Verdict: no trim made. Tip unchanged at 9bc74f9.

Reviewed `git diff origin/main` (14 files) against REPO.md styleSources, LESSONS.md and the common.md comment bar and code shape.

- Marker helpers moved cleanly into `chart-markers.ts`; no unused exports, no duplicated logic left in `line-chart.tsx` or `chart-rows.ts`.
- `toggleHidden` was generalized and reused by both the series legend and the shared control, with no copy.
- Comments in the diff each state a hidden constraint (row stacking and pinning, unmounted control item firing no mouseleave); none restate code.
- Single-call helpers (`labelKindOf`, `activeMarkerKind`) are short and unit-tested; merging them would only churn tests.
- Unit tests run: `npx vitest run components/apps/aoe4-build-order` passed, 33 files and 874 tests. No browser or end-to-end tests were run.
