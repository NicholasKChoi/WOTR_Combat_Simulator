# Tech-lead: batch SGS-210

**Decision: APPROVE - draft PR opened**

## PRs (bottom to top)

- SGS-210: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/219 - base `main` - new - head pushed `9a74faa32f6b616837884929653224fbe11c712e`

### Merge risk
**low** - client-side display code only (no API, schema, CLI or config, no `criticalPaths` symbol), a revert fully undoes it, and unit tables pin the combined-run, span, grouping and alignment rules

### Review focus
No hotspots: no step has more than one copy until the page can enter repeats, and the new rules (`combineRuns`, `sourceSpan`, `groupBySource`, source alignment, copy and gutter text) are pinned by unit tables whose single-copy rows keep the earlier expected values.

## Reviewed

- Range: `453b7054737f0e2298e18077800c9d5e06745ed0...9a74faa` (3 commits, all SGS-210), base `origin/main`.
- Files: 10. Production code: `step-annotations.ts`, `step-annotation.tsx`, `annotation-popover.tsx`, `build-text-editor.tsx`, `results.tsx`, `step-annotation.module.css`, plus `docs/aoe4-build-order-ui.md`. Unit tests: `step-annotations.test.ts`, `step-annotation.test.ts`, `annotation-popover.test.ts`.
- LoC: +475/-35 total; +129/-20 excluding unit tests.
- Invariants checked: A1 (no game numbers added), A2 (no payment logic touched), A3 (annotations are a pure function of result and text; no randomness or clock), S1 (imports stay inside the app). No `criticalPaths` symbol touched (all changes are under `components/`). No open questions in PROJECT.md or the ticket. No API, schema or OpenAPI change.
- Stack check: diff against `main` holds only SGS-210's commits; no PR existed for the branch before this run.
- Issue line: the ticket's Source names no `GitHub issue #<n>`, so it is omitted.

## Non-blocking notes

- `results.tsx:42` (the `sourceSpan` highlight wiring) has no unit test, as the ticket states; with one copy per source it equals the old `stepSpan` call, and SGS-211's page spec is slated to cover repeated-row shading.
- `groupBySource` would build a sparse array if a result skipped a source index. The simulator emits every source (SGS-208), and results are not persisted, so no producer exists today.
- The two Preview checks follow the ticket's Unverified assumptions. The second one (closed `<details>`, keyboard toggling, popover copy lines on separate lines) can only be checked once SGS-211 lets the page enter a repeat.
