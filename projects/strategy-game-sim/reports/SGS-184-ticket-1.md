# SGS-184 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-184-one-desktop-layout-width-floor.md (ticket-lint clean)

Summary: "One desktop layout: remove tabs and breakpoints, add the width floor". Feature, M10, component aoe4-build-order, Risk standard (no strongModelTriggers or criticalPaths apply; UI, dead-code removal, test work), about 150 business lines plus about 110 of new spec and about 200 deleted. Depends on SGS-179 to SGS-183. Scope: `workbench-tabs.tsx` renamed to `workbench-columns.tsx` (C1), delete `use-split-layout.ts` and `workbench-tabs.test.ts`, page state removal, `BuildInput` without `viewDisabled`, the CSS folds and deletions per the design table, C4 on `.pageSection`, `helpers.ts` removal of the three old helpers, new `aoe4-min-width.spec.ts` (B2, B3, B4), and the B5 JS-disabled server-render case in `aoe4-split-layout.spec.ts`. Criteria cover B1, B2, B3, B4, B5, B6, B9, B12 (CSS removal read by review), symbol removal via tsc, lint:dup, unit and acceptance runs. No file overlap with A-E beyond sequential edits of `aoe4-split-layout.spec.ts` and `helpers.ts` (both dependency-ordered; every spec user of `showTab`/`TABS_VIEWPORT`/`SPLIT_MIN_WIDTH` is covered by one of SGS-179..183, checked by grep at origin/main 6411526).

Diagrams: none (one-line "no diagram required").
Open questions: none. On merge: none.

Decisions I made where the design left them to the ticket:
- Panel `id` attributes dropped (nothing references them; specs use data-testid).
- `button.activeView:disabled` in `workbench.module.css` is deleted as dead once `viewDisabled` goes (only source of `disabled` on that button; not in the design's CSS table).
- Removal of CSS queries is proven by reviewer read, not a search (rule: search criteria are for docs only); a no-`tablist`-role assertion proves the tab strip gone without naming removed test ids.

Observations for the manager (not blocking):
- Design C4 floors the section's width, but the outer `Layout` container is still centered at its Bootstrap max-width below 1200 (960 at 992-1199, 720 at 768-991, and so on), so at e.g. 1100 px the section starts at about 84 px from the left and overflows right by about 96 px instead of starting at the page edge. Width equality (B2) still holds; position equality does not. It is acceptable under OD2 = A; the owner may notice it at M10.5. Not added as a criterion.
- Plan outline F's gate `git grep tab-build|tab-results|workbench-tabs` was not copied as a criterion (search criteria are for docs only); the typecheck, the deleted files and the role-based assertion replace it.
- No scratch checkout was made; nothing to clean up. No ran-command claims beyond: `git fetch origin`, reads at origin/main, ticket-lint.
