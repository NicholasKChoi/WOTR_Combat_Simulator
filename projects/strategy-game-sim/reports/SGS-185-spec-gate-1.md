# SGS-185 spec gate 1

Verdict: NEEDS_SPEC (two small, mechanical gaps; nothing needs the owner)

Read at origin/main. The SGS-184 branch does not exist yet (draft); its ticket was read as the contract.

## Gaps

1. **On merge - the field is not exactly `; `-separated items.** The one item contains `; ` inside its parentheses ("screenshots ...; sticky elements ...; the text editor ...; layout and chart checks ...; remove ..."). A parser splitting on `; ` yields five fragments, and the later ones ("sticky elements leave ...") are not instructions. An implementer or manager could apply only the first. Fix: use one item per REPO.md edit, with no `;` inside. For example: `REPO.md Review checklist, "AoE4 build order" section: replace the UI-change bullet with screenshots at 1200, 1280 and 1800 wide (390 only to check the below-minimum rules), sticky elements leaving at least 60% of 1200x800 and 1280x720, and the text editor keeping at least 50% of its width at 1200 and 1280 per design/M10.md Docs table; replace the layout-and-chart bullet with checks at 1200, 1280 and 1800 with no horizontal overflow at or above 1200, and remove the 360x760, 390, 700 and 768 checks`. Two items, no inner semicolons.

2. **Acceptance criterion 1 - the grep for `card` cannot pass.** The doc has "Discard your edits to ..." (line 31 at origin/main, in the Reloading/discard text, which stays). A plain or case-insensitive `card` search matches "Discard", so a reviewer running the stated grep sees a hit the ticket says must be absent. The same applies to any `tabs` search that is not word-bounded only if it reaches "tab"; "tabs" itself is fine. Fix: state the check as whole-word, `\bcards?\b`, `\btabs\b`, `\b768\b`, `\b390\b`, and name the allowed remaining hits: "Discard", "narrow annotation column", and the chart-layout "first paint" sentence.

## Checked and fine

- Every quoted doc sentence exists at origin/main in `docs/aoe4-build-order-ui.md` (page paragraph, layout paragraph, editor paragraphs, Narrow layout paragraph at line 59, step-table card sentence at 88, 400 handling at 223, `?b=` load at 300, chart "first paint" at 164). The save-row sentence is at 288. `ARCHITECTURE.md` has a Rules section with the bullet style the ticket expects.
- Grep of `docs/`, `README.md`, `ARCHITECTURE.md` for 768/360/390/side-by-side/phone/viewport/breakpoint finds only the UI doc, as the ticket says.
- Content agrees with design/M10.md Docs M10.4 table and SGS-184's behavior list (B1-B14, spec path `acceptance/aoe4-min-width.spec.ts`, no viewport media queries or container queries). It also adds the `Layout` container and header overflow note, which SGS-184's ticket carries.
- Open questions none, Invariants none, Risk low (docs only), Diagrams not needed, Unverified assumptions none (no external behavior), Depends on SGS-184 stated, size small, no overlap with another open ticket.
- Criteria 8 and 9 (doc follows the code at SGS-184's tip and the report names disagreements) are a sound way to handle the unlanded dependency.

## Notes

- The ticket names the doc's "Tab order" sentence to keep; make sure the reworded run of it no longer begins "In that layout".
- Scope item for the "side-by-side layout the step table wraps to fit the Build panel's column" sentence is covered only implicitly (by the step-table scroll item). Listing it by text would avoid it being missed; the step-table item already states the target behavior.
