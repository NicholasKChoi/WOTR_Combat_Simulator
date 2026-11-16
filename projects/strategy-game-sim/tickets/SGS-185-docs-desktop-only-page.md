# SGS-185: Document the desktop-only AoE4 page, its supported width and below-minimum behavior

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: M10
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 60 (prose in `docs/aoe4-build-order-ui.md` and one bullet in `ARCHITECTURE.md`; no code)
- **Depends on**: SGS-184
- **On merge**: REPO.md Review checklist, "AoE4 build order" section: replace the UI-change and layout-and-chart bullets and the sticky and editor-width thresholds per design/M10.md Docs table (screenshots at 1200, 1280 and 1800 wide, 390 only to check the below-minimum rules; sticky elements leave at least 60% of 1200x800 and 1280x720; the text editor keeps at least 50% of its width at 1200 and 1280; layout and chart checks at 1200, 1280 and 1800 with no horizontal overflow at or above 1200; remove the 360x760, 390, 700 and 768 checks)
- **Source**: design/M10.md (Docs M10.4 table, Behavior rules B1-B14, Delivery order step 3); M10.4 in MILESTONES.md; plans/M10-20261116.md outline G

## Context

M10 makes the AoE4 build-order page desktop-only: supported from 1200 px, one two-column layout, and below 1200 px the page section keeps the width it has at 1200 px so the document scrolls sideways, with no notice (OD1 = 1200, OD2 = A). SGS-184 removes the tabs and every breakpoint in code; after it lands, `docs/aoe4-build-order-ui.md` still describes tabs, a 768 px run-bar breakpoint, a narrow layout, step-row cards, a tabs first paint and a wrapping save row, and `ARCHITECTURE.md` has no rule saying the page is desktop-only. This ticket makes the docs match the code SGS-184 builds (read its branch; its ticket is the contract) and edits the REPO.md review checklist on merge. SGS-184 notes one behavior to document: below 1200 px the section keeps its width but the `Layout` container stays centered at its own Bootstrap max-width, so the section starts inside the viewport and overflows to the right; the `Layout` header outside the section stays viewport-wide.

## Scope

Docs only; no code, test, or CSS change. Write each replacement against the end state of SGS-184, not against today's code. Where a statement below is "restated", verify it against the code on SGS-184's branch tip (`pages/apps/aoe4-build-order.tsx`, `workbench-columns.tsx`, `workbench.module.css`, `step-table.module.css`, `step-annotation.module.css`).

`docs/aoe4-build-order-ui.md` (statements that become untrue, by place in the file; locate by text, not line):

- The page paragraph (opening, "The page is `/apps/aoe4-build-order`..."): the run bar stuck only "at 768 px and wider", the "below 768 px the bar is not stuck and has no height cap" sentence, and "In the side-by-side layout the page only scrolls above the columns" (the run bar is always sticky and capped; restate the sticky-only-as-far-as-the-page-scrolls fact without the layout qualifier).
- The layout paragraph that follows: "at 1200 px and wider" qualifier, "Below 1200 px they are two tabs ...", the tab-selection rules, the Text/Table disabled-on-Results-tab rule, the WAI-ARIA tabs keyboard model, "The layout follows the viewport width live ...", the carry-across-a-resize sentences, the "first paint is the tabs layout" sentence, "side-by-side layout" wording, and "the tabs carry the headings". Restate as one layout: supported from 1200 px; Build and Results always two columns, both always shown; columns fill the viewport below the run bar and scroll on their own; Tab order (run bar controls, Build column, Results column, no positive `tabindex`, no arrow-key handling in the workbench); Text and Table never disabled by the Results column; resizing across 1200 changes nothing but the sideways scroll (no remount, no new run); the server render is the same two-column layout.
- New below-minimum statement (B2, B14): below 1200 px, including a narrow phone or browser zoom that makes the CSS viewport narrower than 1200 px, the page section is as wide as at 1200 px and holds the same two columns, and the document scrolls sideways; vertical behavior is unchanged; there is no notice. The `Layout` container stays centered at its own max-width, so the section overflows to the right of the container rather than starting at the page edge; the `Layout` header stays viewport-wide.
- The editor paragraphs: "(below 768px of editor width the finished time is hidden)", "in the side-by-side layout the Build column scrolls, below 1200 px the page does", "Below 768px of the editor's own width (a narrow phone, or the side-by-side layout's column) the text view is compact ...", "The view survives runs and tab switches ... a reload starts on Build (except ... Results is selected after its first successful run ...)". Restate: one compact editor style at every width, finish time hidden in the gutter and still shown in the step table and its run cells; the Build column always scrolls vertically; the view survives runs but not a reload. The unrelated "narrow annotation column" and "narrower annotation column" wording about the annotation gutter stays.
- The "Narrow layout:" paragraph: delete it (cards, uncapped static run bar, 390 px no-sideways-scroll on either tab). Keep its last sentence, that the charts are the only column at every width and take the full Results width.
- The step-row open-flag text "the flags survive switching between Text and Table, the text going unparseable and back, and the Build and Results tabs": drop the tabs clause.
- The step-table sentence "Under 768 px each row, the start row included, is a card with its fields stacked": delete it; rows are always table rows, labels inline and wrapping, a table wider than the Build column scrolls inside `step-table-scroll`, and the Build panel never scrolls sideways.
- The 400 handling sentence "With no earlier result, Results is enabled only by a pinned run, and shows ...": restate with no disabled state; with no result and no pin, Results shows what the two-column layout shows in that state.
- The save-row sentence "From 1200 px up the row does not wrap and the link field shrinks to fit; below that the row wraps ...": restate as the row never wrapping at any width and the link field shrinking to fit (an 8rem floor is a code value; give it only if the doc quotes such values elsewhere).
- The `?b=` load sentence "When the page shows the Build and Results tabs, Results is selected after the first successful run": delete it; state, if the surrounding text does not already, that a successful `?n=` or `?b=` load selects nothing and scrolls nothing.
- Leave the chart-layout sentence "applied after the page loads, so the first paint is the default layout": it is about the stored chart order and collapsed state, not the page layout, and stays true.

`ARCHITECTURE.md` Rules: add one bullet: the AoE4 build-order page is desktop-only and supported from 1200 px; below that the page keeps its 1200 px layout and scrolls sideways, with no notice; its CSS has no viewport media queries or container queries; its acceptance specs use viewports 1200 px wide or wider, except the one spec that checks the below-minimum behavior (`acceptance/aoe4-min-width.spec.ts`). Name the spec by path; do not repeat the viewport values it uses.

Search for other docs the change makes untrue before editing: a grep at origin/main of `docs/`, `README.md`, `ARCHITECTURE.md` found only the two files above (other `docs/aoe4-build-order*.md` files and the other apps' docs hold no tabs, breakpoint or narrow-layout statement). If a grep of `docs/`, `README.md` and `ARCHITECTURE.md` at SGS-184's tip finds another, fix it and list it in the report.

REPO.md (factory file, applied by the manager on merge, not edited in the code repo): see On merge. The "AoE4 build order" Review checklist section has the UI-change bullet (360x760, 768 and 1280 screenshots; sticky at 360x760 and 1280x720; editor at 390 and 1280), and the layout-and-chart bullet (390, 700 and 1280). The replacements are per the On merge line.

**Out of scope:** any code, test, CSS or comment change (SGS-184); `pages/_app.js` viewport meta; the other apps' docs; the notice (dropped, OD2 = A); `docs/aoe4-build-order.md` and `docs/aoe4-build-order-format.md` (no layout statements); rewriting the doc beyond the statements listed; measured values.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/aoe4-build-order-ui.md` describes one layout: supported from 1200 px, Build and Results always two columns, both always shown, run bar always sticky and capped, Text and Table never disabled by the Results column. No sentence says the page has tabs, a tab list, a tabs keyboard model, a tabs layout, a layout switch at a viewport width, or a layout that follows the viewport width live. A reviewer reads the file against SGS-184's branch tip; the doc's grep (scoped to the doc paths, no count) finds no `768`, `390`, `side-by-side layout`, `tabs`, `card`, or narrow-viewport use of `narrow` in the UI doc (the "narrow annotation column" wording about the gutter is not a viewport statement and stays; the chart-layout "first paint" sentence stays).
- [ ] The UI doc states the below-minimum behavior: below 1200 px (including a phone and browser zoom) the section has its 1200 px width and the same two columns and the document scrolls sideways; vertical behavior is unchanged; no notice is shown; the `Layout` container stays centered at its own max-width so the section overflows to the right; the `Layout` header stays viewport-wide.
- [ ] The UI doc states that resizing across 1200 px changes nothing but the sideways scroll (no remount, no new run), and that the server render is the same two-column layout.
- [ ] The "Narrow layout:" paragraph is gone and the full-Results-width charts sentence remains; the step-row open-flags text has no tabs clause; the step-row card sentence is gone; rows are described as table rows with the `step-table-scroll` behavior.
- [ ] The editor text describes one compact style at every width, with the finish time hidden in the gutter and still shown in the step table and its run cells; it has no "below 768px of editor width" condition and no layout-dependent scroll sentence.
- [ ] The 400 sentence has no "Results is enabled only by a pinned run" disabled-state wording; the save-row sentence says the row never wraps and the link field shrinks; the `?b=` load text has no "Results is selected" sentence and says nothing is selected or scrolled by a successful `?n=` or `?b=` load.
- [ ] `ARCHITECTURE.md` Rules has one new bullet carrying the desktop-only statement above, naming `acceptance/aoe4-min-width.spec.ts`; no existing Rules bullet changes.
- [ ] Every claim added about the page matches the code at SGS-184's branch tip (layout, sticky run bar, compact editor, save row, below-minimum overflow); where the code disagrees with this ticket or with `design/M10.md`, the report names the disagreement and the doc follows the code, not the ticket.
- [ ] No code file, test, CSS or comment is changed: the diff touches only `docs/aoe4-build-order-ui.md`, `ARCHITECTURE.md`, and any other doc the Scope search finds.
- [ ] No INVARIANTS.md regressions

## Open questions

none
