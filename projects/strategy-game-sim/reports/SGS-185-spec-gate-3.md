# SGS-185 spec gate 3

Verdict: READY

Read at origin/main (SGS-184 has no branch yet; its ticket was read as the contract).

## Re-spec 2 fix: verified
- Criterion 1 now allows "a sentence saying the page has no tabs", so the existing "with no tabs" text (doc line 14) no longer conflicts with the `\btabs\b` grep.
- Scope names the line-16 "In the side-by-side layout the step table wraps..." sentence and bars an "In that layout" opening for the Tab order sentence. Both gate-1 notes are covered.

## Checked
- A grep of the UI doc at origin/main for `\bcards?\b`, `\btabs\b`, `\b768\b`, `\b390\b`, `side-by-side layout`, `narrow` and `first paint` hits only text Scope lists: lines 11, 14-16, 18-19, 59, 61, 83, 88, and 288 and 300 for the save row and `?b=` load. The allowed leftovers (the "narrow annotation column" gutter wording on line 19, the chart "first paint" on line 164, "Discard") are all named. The other `tab` hits (lines 261, 270, "another tab") do not match `\btabs\b`.
- On merge is exactly two `; `-separated items, with no inner semicolons or trailing prose. It matches the design's REPO.md row.
- ARCHITECTURE.md has a Rules section. No existing bullet states viewport or tabs rules, so the new bullet is additive.
- `acceptance/aoe4-min-width.spec.ts` is introduced by SGS-184's ticket (line 37), so naming it by path is grounded. The design's M10.4 table agrees with Scope.
- Open questions none, Invariants none, Risk low (docs only), Unverified assumptions none, Depends on SGS-184 stated, size well under 400 lines, no overlap with another open ticket, no diagrams needed. Criteria 8 and 9 cover the dependency being unlanded: the doc follows the code and the report names any disagreement.

## Notes
- Scope cites "line 16 at the base" as a hint. It is harmless because the same bullet says to locate by text.
- The design's M10.4 check also greps `tab` (workbench sense) and `first paint`. The ticket deliberately keeps the chart-layout "first paint" sentence, which is correct. The implementer should expect the reviewer to see that hit.
