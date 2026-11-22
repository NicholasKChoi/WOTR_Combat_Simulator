# Tech-lead gate: batch SGS-213-SGS-213

## Decision
APPROVE - draft PR opened. No blockers, no untested hotspots.

## Opened PRs (bottom to top)
- SGS-213: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/222 - base `main` - new - head 6f9b91f02772ee301b6db84dc8c3299b90b2ce28 (draft; title set by pr.sh create, body set by pr.sh body: "body #222 rewritten")

### Merge risk
**low** - display-only change to the text-view popover; a revert fully undoes it, it touches no API, schema, config or critical simulation symbol, and unit plus acceptance tests pin both the placement and the no-wait rule.

### Review focus
No hotspots: the placement is a pure function of rects pinned by a unit table (beside, fallback, vertical clamps), the no-wait rule is a one-line predicate pinned per status and on combined runs, and acceptance tests assert both in the browser at the minimum and wide viewports.

## What I reviewed
- Range: 5eac2142954b5a42351f433956297e4b921f77bc (merge-base with origin/main)...6f9b91f (4 commits).
- Files: components/apps/aoe4-build-order/annotation-popover.tsx (+36/-12), build-text-editor.tsx (+8/-4), step-annotations.ts (+2/-0), docs/aoe4-build-order-ui.md (+2/-2), plus tests: annotation-popover.test.ts (+59/-1), step-annotations.test.ts (+29/-0), acceptance/aoe4-step-annotations.spec.ts (+95/-28). Total +231/-47; reviewable +46/-16.
- Invariants A1-A3 (paths match): no simulation, data, payment or timing code touched; no violation. No open questions in PROJECT.md. No criticalPaths symbol touched. No public surface (API, schema, config) touched.
- `hasPopover` receives `annotation.run`, which `annotationsByLine` builds with `combineRuns` (step-annotations.ts:232), so the repeated-step rule applies to the combined run as the ticket requires.
- Stack check: single standalone task on main; no existing PR before this run.
- Issue line: ticket Source names no `GitHub issue #<n>`, so none.

## Non-blocking notes
- `hasPopover` compares `waitSeconds === 0` exactly; a float residue (e.g. a summed wait of 1e-12) would show a popover reading `Waited 0:00`. No producer of such a value was identified; display only.
- PR body attribution line placed above the `cf-stack` footer so the footer stays at the end.
