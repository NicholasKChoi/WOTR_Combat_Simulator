# SGS-139 spec gate 2

Verdict: READY

Read at origin/main (SGS-135 and SGS-138 taken at their stated end states). Re-checked: `ageUpMarkers` (line 63), `labelled = ageUpMarkers(markers)` (138), `measureRef` (136, 282) and the `kind !== 'age-up'` filter (242) in `line-chart.tsx` match the ticket's quotes. Design M9.md C8, the Marker labels rules and the M9.7 Criteria-map row agree with the body; the design's reset rule (set-state-during-render or an effect) matches Scope.

## Gate 1 gaps

1. Collapse case could not fail: closed. The criterion now asserts `data-active="true"` first, collapses with `dispatchEvent('click')` (no pointer or focus change), asserts the legend is gone, moves the pointer away, expands, and states it fails if the reset is removed. The Unverified assumptions field lists the Chromium event assumption it depends on.
2. Either-or verification of the stale reset: closed. Scope names one pure `liveMarkerKind(markers, kind, collapsed)` used for both slots and both rules, with a Vitest table (null, kept, no markers left, collapsed). The render fallback stays covered by the `activeMarkerKind` rows.

The gate 1 notes are also folded in: Playwright owns the drawing rule, SGS-137 ordering is stated (no dependency, rebase), and the aria-label text is no longer dictated.

## New-gap check

None blocking. Criteria are behavior-based with no stale pins. Risk standard, Invariants none, and Depends-on SGS-138 stand. On merge is a single well-formed item. Docs are in Scope with a grep rule. Open questions: none.

## Notes (non-blocking)

- The new `liveMarkerKind` is absent from design M9.md Contracts; the ticket adds it to CONTEXT.md under On merge, which satisfies the contract check.
- The collapse Playwright case relies on the pointer not leaving the item during `dispatchEvent`; the ticket lists this as an unverified assumption and the case asserts the before and after states, so it fails loudly rather than passing vacuously.
