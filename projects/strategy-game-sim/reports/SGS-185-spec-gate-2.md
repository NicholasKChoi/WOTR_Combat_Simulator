# SGS-185 spec gate 2

Verdict: NEEDS_SPEC (one small mechanical gap; nothing needs the owner)

Read at origin/main (SGS-184 has no branch yet; its ticket was read as the contract).

## Re-spec 1 fixes: verified
- On merge is now two items with no inner `;`. Fixed.
- Criterion 1 uses whole-word greps and names allowed leftovers ("Discard" no longer matches). Fixed, except the gap below.

## Gaps

1. **Acceptance criterion 1 - the `\btabs\b` grep still hits text the ticket may keep.** At origin/main the layout paragraph (line 14) says "both always shown, with no tabs". Scope says to restate the layout as one layout and keeps that content; an implementer writing "no tabs" (or "no tab strip") fails the stated grep, which allows only "Discard", the annotation-column wording and the chart "first paint" sentence. The ticket also does not say whether "no tabs" is allowed. Fix: either (a) add to the allowed leftovers "a sentence that says the page has no tabs", or (b) state in Scope that the restated text does not mention tabs except as the Tab key / tab order, and drop "with no tabs". Pick (b) if the doc should describe only the one layout. Note `\btabs\b` does not match "another tab" (lines 261, 270), which is fine.

## Checked and fine
- Every quoted doc sentence exists at origin/main in `docs/aoe4-build-order-ui.md`: page paragraph (line 11), layout paragraph (14-16), editor paragraphs including "The view survives runs and tab switches ... a reload starts on Build" (line 19-21), Narrow layout paragraph (59), step-table card sentence (88), 400 handling (223), save row (288-289), `?b=` load (300), chart "first paint" (164). `step-table-scroll` exists (`step-table.tsx:314`).
- Grep of `ARCHITECTURE.md` (Rules section exists, no viewport/tabs bullets) and `README.md` finds nothing else untrue.
- Scope agrees with design/M10.md Docs M10.4 table and the SGS-184 ticket (layout, compact editor, save row, B6/B7/B9/B10, `acceptance/aoe4-min-width.spec.ts`, no media or container queries). On merge matches the design's REPO.md row.
- Open questions none, Invariants none, Risk low (docs only), Unverified assumptions none, Depends on SGS-184 stated, small size, no overlap with another open ticket, no diagrams needed. Criteria 8 and 9 handle the unlanded dependency soundly.

## Notes
- Gate 1 notes still apply: the reworded "Tab order" sentence should not begin "In that layout"; the "side-by-side layout the step table wraps to fit the Build panel's column" sentence (line 16) is covered only by the step-table scroll item, so naming it would avoid a miss.
- The design's M10.4 check also greps `first paint`; the ticket deliberately keeps the chart sentence, which is correct.
