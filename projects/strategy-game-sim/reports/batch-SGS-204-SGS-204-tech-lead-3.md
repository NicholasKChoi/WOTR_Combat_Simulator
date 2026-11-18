# Tech-lead gate: batch SGS-204-SGS-204

**Decision: PASS, 1 draft PR opened**

## PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/215, base `main`, **new**, head `23182839a9c0711696d5e23d6f3e007e69de7bb6` (draft)

### Merge risk
**low** - display-only chart text; a revert fully undoes it, it touches no API, schema, CLI, config or critical-path symbol, and unit and acceptance tests pin the naming and placement rules.

### Review focus
No hotspots: a client-side label added beside existing chart dots. The tier rule is pinned by a unit test looped over every English upgrade id, and the overlap, edge and own-dot rules by `tierTextSlots`/`placeTierText` unit tests. Acceptance specs in Chromium check the rendered text, its non-overlap and its plot bounds.

## Reviewed

- Range: `0866156...2318283` (merge-base with origin/main `086615606cd5`; origin/main is at `5662cb8`). 3 commits: 1f5ebe0, d09af46, 2318283.
- Files: `components/apps/aoe4-build-order/{result-series.ts, upgrade-tier-text.tsx (new), line-chart.tsx, page-help.tsx}`, `docs/aoe4-build-order-ui.md`, plus tests `result-series.test.ts` and `acceptance/aoe4-units-chart-upgrade-dots.spec.ts`.
- LoC: +468/-5 total; reviewable +169/-4, excluding unit tests and the acceptance spec.
- Checked against INVARIANTS (S1-S3, A1-A3), PROJECT.md Open questions (none), and criticalPaths. No criticalPaths symbol is touched, no engine or data change, no public surface. A1 holds: the tier text comes from the ids alone.
- Stack check: standalone on `main`, no base-only branch, no existing PR before this run.
- PR body: no `Fixes`/`Refs` line, because the ticket's Source is a BACKLOG.md item and not a GitHub issue. Preview checks come from the ticket's Unverified assumptions about how recharts' `ReferenceDot` renders label content and about its plot-area and axis-scale hooks.

## Non-blocking notes

- `tierTextSlots` (`result-series.ts:113`) always terminates: each pass merges two distinct groups, so it makes at most n-1 merges. Each `UpgradeTierText` recomputes the whole layout, which is O(n^3) per text. This is fine for the handful of upgrade dots one chart draws.
- `upgrade-tier-text.tsx` uses `estimateLabelWidth` to size the boxes, not measured widths. A font whose real width differs a lot from the estimate could let two texts touch slightly. Only appearance is affected.
- `gh pr create` printed "Warning: 60 uncommitted changes". It comes from the main checkout's untracked files and does not affect the PR.
