# SGS-184 implementer report 1

Status: needs_review

- Branch `sgs-184-one-desktop-layout-width-floor`, tip `09023924d1a47342f6771eb96010581e8474661f`, base origin/main c754c4c.
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-184-one-desktop-layout-width-floor`

## Files touched
- `components/apps/aoe4-build-order/workbench-columns.tsx`: git mv of `workbench-tabs.tsx`, reduced to C1 `WorkbenchColumns({ build, results })`; panel ids, roles, hidden, tablist gone.
- `use-split-layout.ts`, `workbench-tabs.test.ts`: deleted.
- `pages/apps/aoe4-build-order.tsx`: removed `tab`, `awaitingLoadTab` (state, effect, set), `resultsEnabled`, `shownTab`, `split`, `viewDisabled`; renders `WorkbenchColumns`. No other consumers of the removed names.
- `build-input.tsx`: `viewDisabled` prop and its `disabled` removed; also dropped `styles.activeView` (its only CSS rule was the deleted `:disabled` rule).
- `workbench.module.css`: runBar folded, narrow blocks deleted, editor container query folded into base rules and `container:` dropped, save-row 1200 block folded, C4 added, `button.activeView:disabled` deleted.
- `step-table.module.css`: card block deleted. `step-table.tsx`: `<td />` for the Start row, `d-inline-flex`.
- `step-annotation.module.css`: unconditional `.gutterEndTime { display: none; }`.
- `acceptance/helpers.ts`: deleted `SPLIT_MIN_WIDTH`, `TABS_VIEWPORT`, `showTab`.
- `acceptance/aoe4-min-width.spec.ts` (new): B2 at 1199 and 390 (reference width read at MIN_SUPPORTED_VIEWPORT in the same spec), B3 at 390x844 (one evaluate, includes sticky run bar), B4 resize 1280 -> 390 -> 1280.
- `acceptance/aoe4-split-layout.spec.ts`: tablist count 0 in the 1280 case; rows at MIN/WIDE (side by side, no tablist, no sideways scroll); JS-disabled server render case; hydration + same columns before/after first run case (listens to console and pageerror, since React reports hydration failure as a pageerror).
- `components/apps/aoe4-build-order/step-annotation.test.ts`: see pre-existing test edit.

## Pre-existing test edited
`step-annotation.test.ts` "keeps the start row cell empty and shows the legend": regex `<td class="[^"]*"></td>` became `<td></td>`. Ticket Scope requires dropping `styles.startSpacer` from that `<td>`, which removes the class attribute; the test asserted its presence. Intent (empty cell) unchanged.

## Tests
- `npm test`: 2613 passed, 15 skipped, 0 failed (83 files). `workbench-tabs.test.ts` gone.
- `npm run acceptance`: 1124 passed.
- Invariants encoded: width floor equals the 1200 width below 1200; columns never hidden or tabbed; server HTML is two columns; no hydration error; resize keeps focus/text and posts nothing.

## Mutation checks (each undone)
- `.pageSection` `min-width` set to 0: min-width 1199 and 390 cases fail on `sameWidth: true` vs false; resize case fails on `scrollsSideways`.
- `workbench-columns.tsx`: `hidden` on panel-results plus a `role="tablist"` div: split-layout 1280, 1200, 1800 and JS-disabled cases fail on `toBeVisible`/tablist count.
- `workbench-columns.tsx`: server/client differing node: hydration case failed (first attempt passed because only `console` was listened to; fixed by also listening to `pageerror`, then failed on the hydration message).
- `pages/apps/aoe4-build-order.tsx`: resize listener appending to text: resize case fails on `value`.
- B3 case (390 overlap): not separately mutated beyond the sticky/scroll failure seen when the CSS was accidentally reverted mid-run (barPosition `static` expected `sticky`); that run was redone with the CSS restored.

## Gates
- tsc: clean. `lint:dup`: 0 clones. `next build`: compiled OK. codegen: not set.
- Note: during mutation work a `git checkout` restored `workbench.module.css` to an unstaged-old copy; I redid the same CSS edit, re-ran every gate on the final tree, and the commit diff shows the CSS as intended. `git grep -nE '@media|@container' components pages/apps/aoe4*` returns nothing.

## Doc claims
No docs added. No new comments in code.

## Invariants
No INVARIANTS.md entries apply (ticket: none); engine, API and data untouched.

## Unverified assumptions
Both ticket-listed ones are relied on: JS-disabled context sees the full two-column server HTML (verified by the passing case), and Chromium's `scrollWidth > innerWidth` at 1199 and 390 (verified). No new ones.

## Out-of-scope findings
- `acceptance/aoe4-auto-run.spec.ts` "first load runs once" listens to `console` only for hydration, which does not see React's hydration failure (a pageerror in this Next version); the check there cannot fail. Not patched.
- Siblings left no remaining use of removed symbols (searched acceptance, components, pages, lib).
- An earlier `git stash` / `stash apply` pair in the checkout left no stash (dropped).
