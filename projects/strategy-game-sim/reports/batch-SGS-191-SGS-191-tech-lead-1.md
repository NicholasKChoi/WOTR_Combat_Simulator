# Tech-lead: batch SGS-191-SGS-191

## Decision

PASS. No blockers, no untested hotspots. Draft PR opened.

## PRs (bottom to top)

- SGS-191: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/201, base `main`, **new**, head pushed `3e13a62dd9ec953e22b4a4dfcbfb862a89396e14` (branch `sgs-191-unit-line-data`). Body set by `gh api` PATCH (succeeded).

### Merge risk (verbatim)
**medium** - adds fields to the public simulate API response (`UnitSeries.lineName` required, `ChartMarker.unit` optional); additive and backward-compatible, and a revert undoes it.

### Review focus (verbatim)
No hotspots: two additive, derived result fields with no effect on the event loop or payment; `unitLineName` is pinned by a loop over every English unit line plus fallback and whole-word cases, and the marker `unit` by a loop over every upgrade target through the engine.

## What I reviewed

- Commit range `87f0cd7..3e13a62` (4 commits), 13 files, +261/-13 overall. Reviewable business logic: +27/-4 in `lib/aoe4-build-order/{unit-lines,simulate,research,markers,model}.ts`. Also read the OpenAPI and format-doc changes, plus the new unit tests (`unit-lines.test.ts`, `markers.test.ts`, `research.test.ts` additions).
- Invariants: A1 holds (line name derived from data entry names). A2 is untouched. A3 holds (pure derivation, no randomness or clock). No `criticalPaths` symbol is touched: `unitSeries` in simulate.ts and `researchItem` in research.ts are not listed.
- Contract: the response gains only fields. The OpenAPI closed schemas are updated in the same PR, and the contract spec's key records and optional map are updated. Pin storage stores no result, so nothing persisted is affected.
- Open questions: none in PROJECT.md. The design C3/C4/C7b spec is followed exactly.
- Stack check: one member on `main`, and its diff contains only its own task.
- Issue line: the ticket Source names no `GitHub issue #<n>`, so it is omitted.

## Non-blocking notes

- `docs/api/openapi.json` `info.version` stays `2.6.0`. The last additive result field (production buildings, b37b56b) bumped it from 2.5.0 to 2.6.0. A minor bump may be wanted for consistency. CI does not enforce it.
- `unitLineName` throws on an empty array (`reduce` with no initial value). The only caller passes the unit entries of a produced unit's own `baseId`, which always holds at least that entry, so this does not happen today.
