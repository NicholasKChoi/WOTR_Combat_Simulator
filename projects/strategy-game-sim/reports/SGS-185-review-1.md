# SGS-185 review 1

Verdict: APPROVE

Branch sgs-185-docs-desktop-only-page, tip c009c66. Diff vs origin/main touches only `ARCHITECTURE.md` and `docs/aoe4-build-order-ui.md` (SGS-184 is already in the base as f7d765a, so the diff is this ticket alone).

## Blocking findings
None.

## Acceptance criteria
1. One layout, no tabs/switch/live-follow wording: pass. Whole-word grep of the UI doc for `cards?`, `tabs`, `768`, `390`, `side-by-side layout`, `narrow`, `tablist`, `viewport width` hits only: "with no tabs" (allowed), "narrow annotation column" and "narrower" (gutter wording), and "another tab" (a browser tab in the storage-event sentence, not a layout tab). "side by side" appears without "layout" (not matched). The chart-layout "first paint" sentence is untouched.
2. Below-minimum statement: pass. Doc paragraph covers 1200 px width, same two columns, sideways scroll, vertical unchanged, no notice, container centered at its max-width so section overflows right, header viewport-wide. Code: `.pageSection { min-width: calc(1140px - var(--bs-gutter-x)) }` on a Bootstrap `container` section (`pages/apps/aoe4-build-order.tsx:333`); `Layout` header is outside the section; `acceptance/aoe4-min-width.spec.ts` asserts same width and sideways scroll at 1199 and 390.
3. Resize across 1200 / SSR: pass. No `matchMedia`, `innerWidth`, `@media` or `@container` in the page or `components/apps/aoe4-build-order`; the layout is static markup, so no remount and the server render is the same.
4. "Narrow layout:" paragraph removed, charts-full-width sentence kept; open-flags tabs clause removed; card sentence replaced by "Every row ... is a table row with its labels inline and wrapping"; `step-table-scroll` behavior kept in the layout paragraph (one statement). Pass. (The `.scroll { overflow-x: auto }` and `.column { overflow-x: hidden }` rules back "never scrolls sideways".)
5. Editor text: pass. One compact style (0.875rem, `workbench.module.css`), finish time hidden in the gutter (`.gutterEndTime { display: none }`, `step-annotation.module.css:71`), Build column scrolls vertically (`.column overflow-y: auto`), view survives runs but not a reload; no 768 condition.
6. 400 / save row / `?b=`: pass. With no result `Results` shows the h2 and `ComparePanel` only (`aoe4-build-order.tsx:411-433`); Pin label shows only when pinned (`compare-panel.tsx`); save row `flex-wrap: nowrap` with `.linkInput` shrinking (no 8rem value quoted, which the ticket allows); the `?b=` Results-selected sentence is gone and "A successful `?n=` or `?b=` load selects nothing and scrolls nothing" is added. No tab state or scroll call exists in the page, consistent with that.
7. ARCHITECTURE.md: one new Rules bullet, names `acceptance/aoe4-min-width.spec.ts` (exists), repeats no viewport values besides 1200, no existing bullet changed. Pass. Claim "no viewport media queries or container queries" verified by grep above.
8. Claims match SGS-184 tip code: pass. No disagreement between the ticket or design and the code found.
9. Diff scope: pass, two doc files only; the scope search of `docs/`, `README.md`, `ARCHITECTURE.md` found no further untrue statement (only an unrelated "tabs" whitespace hit in `docs/aoe4-build-order-format.md:104`).
10. INVARIANTS: ticket lists none; docs-only, none affected.

Other doc claims checked: run bar sticky and capped at 40dvh (`.runBar`), `overflow-anchor: none` on the section, columns fill viewport below the run bar (`height: calc(100dvh - run bar)`), Text/Table disabled only by `busy` (loading), not by Results, Tab order has no positive `tabindex` or arrow-key handling in `workbench-columns.tsx` or the page, equal headings via `h2.h4`.

## Linter / bot / conventions
Docs-only diff; lint not run (no code or type surface). No `reviewBot` configured. Doc has no ticket ids or process history in the added sentences.

## Non-blocking notes
- The page paragraph still has the pre-existing very long single-line style; the diff keeps it, consistent with the file.
- REPO.md On merge edits are for the manager; not in this diff, as intended.

## Coverage
Read the full diff, the ticket, `workbench.module.css`, `step-annotation.module.css`, `step-table.module.css`, `workbench-columns.tsx`, `compare-panel.tsx`, relevant parts of the page, and the min-width spec. UI inspection not applicable (no UI change). No tests run.
