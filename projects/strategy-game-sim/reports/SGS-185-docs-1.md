# SGS-185 docs report 1

- Ticket: SGS-185. Branch: `sgs-185-docs-desktop-only-page` (base origin/main at f7d765a, which holds SGS-184).
- Tip SHA: c009c66dd0469fe5fba5b3584bfc986df9b0298f
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-185-docs-desktop-only-page
- Status: needs_review

## Docs touched

- `docs/aoe4-build-order-ui.md`: one layout, below-minimum behavior, editor, step rows, 400, save row, `?b=` load.
- `ARCHITECTURE.md`: one new Rules bullet (desktop-only). No existing bullet changed.

## Doc claims (source)

- "supported from 1200 px wide"; section "as wide as it is at 1200 px" (`workbench.module.css:.pageSection` min-width `calc(1140px - gutter)`, nested in Bootstrap `.container`; `acceptance/aoe4-min-width.spec.ts`).
- Run bar always stuck and capped at 40% of viewport height (`.runBar` sticky, `max-height: 40dvh`); scroll anchoring off (`.pageSection overflow-anchor: none`).
- "Build and Results sit side by side in two equal columns, always both shown ... each scrolls on its own" (`workbench-columns.tsx`, `.workbenchSplit` grid 1fr 1fr, height `100dvh - run bar`, `.column overflow-y: auto`).
- Tab order, no positive tabindex, no arrow-key handling: tab/keyboard code is gone in `workbench-columns.tsx`; the positive-tabindex claim was already in the doc and is not touched by the diff.
- "Text and Table buttons are never disabled by the Results column": no tabs code remains.
- Step table wraps, scrolls inside `step-table-scroll`, Build panel never scrolls sideways (`step-table.module.css:.scroll overflow-x: auto`, `.column overflow-x: hidden`).
- Resizing across 1200 changes nothing but the sideways scroll, no remount, no run; server render is the same layout: `use-split-layout.ts` and the matchMedia switch are removed; `acceptance/aoe4-split-layout.spec.ts` covers resize/no-run.
- Below-minimum paragraph: no notice, container centered at its own max-width, section overflows right, header viewport-wide: `pages/apps/aoe4-build-order.tsx` (`<section className="container pageSection">` inside `components/layout.js` `.container`; header is outside the section).
- "The Build column scrolls vertically": `.column overflow-y: auto`.
- "the finished time is hidden in the gutter, and the step table and its run cells still show it": `step-annotation.module.css:.gutterEndTime { display: none }` unconditional.
- "compact at every width ... 0.875rem font": `workbench.module.css` `--editor-font-size: 0.875rem`, unconditional.
- "The view survives runs but not a reload": view state has no tab dependence; reload behavior was already in the sentence.
- "Every row ... is a table row with its labels inline and wrapping": `step-table.module.css` has no card rules; `aoe4-min-width.spec.ts` pins table rows at phone width.
- "With no earlier result, Results shows its heading and the compare panel (the pin label and Unpin while a run is pinned, no compare table without a shown result)": `pages/apps/aoe4-build-order.tsx` Results column renders heading and `ComparePanel`; `compare-panel.tsx` shows the label only when pinned.
- "The row never wraps, at any width, and the link field shrinks to fit": `.saveRow { flex-wrap: nowrap }`, `.linkInput min-width: 0 / 8rem`, `flex: 1 1 12rem`. The 8rem floor is not quoted (doc quotes no such value).
- "A successful `?n=` or `?b=` load selects nothing and scrolls nothing": no tab selection code remains; pinned by the acceptance spec added in SGS-184.
- ARCHITECTURE.md bullet: no `@media`/`@container` in `components/apps/aoe4-build-order` or the page (grep empty); acceptance viewports: only `aoe4-min-width.spec.ts` sets a width under 1200 in a `width:` literal (grep). Not exhaustive over constants imported from `helpers.ts`; this restates the ticket wording.

## Removed claims

- Run bar stuck only at 768 px and up, unstuck below: `.runBar` is unconditionally sticky.
- "In the side-by-side layout ..." qualifiers, tabs, tab selection, Results enabled by result or pin, disabled toggle on Results tab, WAI-ARIA tabs model, live layout switch, carry-across-resize and first-paint-is-tabs sentences: `use-split-layout.ts` removed, no tabs in `workbench-columns.tsx`.
- Below 768 px editor width condition for the finish time and compact style: no media or container queries in the CSS.
- "Narrow layout:" paragraph (cards, static run bar, 390 px): no such CSS remains. Kept: the charts-are-the-only-column sentence.
- Open-flags tabs clause, step-row card sentence, "Results is enabled only by a pinned run", the wrapping save row below 1200, "Results is selected after the first successful run" (both places): contradicted by the code above.

## CONTEXT.md Design docs

No row to add or change (no doc moved or renamed).

## REPO.md on merge (manager applies, per ticket)

Replace the "AoE4 build order" UI-change and layout-and-chart bullets as given in the ticket's On merge line.

## Checks

- Whole-word grep of `docs/aoe4-build-order-ui.md` for `cards?`, `tabs`, `768`, `390`, `side-by-side layout`, `narrow`: only hits are "no tabs" and the "narrow annotation column" / "narrower annotation column" gutter wording (allowed leftovers). I reworded the ticket's "narrow phone" phrase to "a phone ... less than 1200 px wide" so the grep stays clean. Hyphenless "side by side" remains in the layout sentence.
- Scope grep of `docs/`, `README.md`, `ARCHITECTURE.md` at the tip for tabs/768/narrow layout/side-by-side/breakpoint: no other doc affected (only unrelated "tabs" whitespace and "narrow no-break space" in the format doc, and numbers in openapi.json).
- Lint/codegen: not run. `commands.lint` is tsc plus jscpd and does not check docs; `commands.codegen` is empty. Diff touches only two Markdown files.
- Links: none added.

## Disagreements between ticket and code

None found. I stated the layout from code, not from the ticket.

## Out-of-scope findings

None.
