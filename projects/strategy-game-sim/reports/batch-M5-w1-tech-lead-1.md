# Batch M5-w1 tech-lead gate

## Decision
No blockers, no untested hotspots. Two independent draft PRs against main (not a stack; no link, no footer). Branches pushed as-is, no new commits; both authored choinickolas@gmail.com. Bodies set via gh api PATCH.

| task | branch @ tip | PR | base | merge risk |
|---|---|---|---|---|
| SGS-078 | sgs-078-aoe4-timeline-started-first-type-colors @ b6daa13 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/84 | main | low |
| SGS-079 | sgs-079-aoe4-prebuilt-docs-no-measured-results @ 7e6a085 | https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/85 | main | low |

## Merge risk and review focus (verbatim)

### PR 84 (SGS-078)
## Merge risk
**low** - a revert fully undoes it; the only non-UI changes are an extraction of an unchanged regex and one added catalog field, neither touches a critical-path symbol, and unit and acceptance tests pin the classification and column order.

## Review focus
No hotspots: the kind rule is a small switch pinned by `step-timeline-rows.test.ts`: classifies each step kind, and the landmark extraction in the engine is a one-for-one replacement of the same regex.

### PR 85 (SGS-079)
## Merge risk
**low** - documentation only; a revert fully undoes it and nothing in the build or runtime reads the file.

## Review focus
No hotspots: a single Markdown file that nothing reads.

## Reviewed
Both branches merge-base ee7ecb9 (main), one commit each.
- SGS-078: 14 files, +235/-56 (reviewable +181/-43). simulate.ts change is only LANDMARK_CLASS moved to lib/aoe4-build-order/landmarks.ts (same regex, completeConstruction logic unchanged; not a criticalPaths symbol). schema.ts adds an additive catalog.landmarks field. No invariant touched (S1, A1-A3 hold; no game numbers, no randomness).
- SGS-079: README.md +16/-17, docs only.

## Non-blocking notes
- Row order is still step order; only the column order changed (docs say so).
- Local branches only existed before this gate; now pushed.
