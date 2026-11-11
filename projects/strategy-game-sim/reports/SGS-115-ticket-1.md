# SGS-115 ticket, re-spec 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-115-split-scroll-columns-headings.md

## Summary

"Scroll the build and results columns separately and make the headings consistent", component aoe4-build-order,
M8 / M8.3, M8.9, Risk standard, about 80 LOC, no dependencies, On merge none. Re-spec folds in spec-gate round 1
and the revised design/M8.md C11:

- Gap 1 (run bar `mb-3`): `useRunBarHeight` now writes
  `Math.ceil(border-box height + parseFloat(getComputedStyle(form).marginBottom) || 0)` px, exactly as C11; the
  form keeps `mb-3`. Criterion 1 (respec 1) now asserts, in one `page.evaluate` with `saved-build-error` asserted
  absent, workbench top = bar border-box bottom + computed margin-bottom and workbench bottom = `innerHeight`
  (each within 1 px); it also catches a hook that drops the margin.
- `saved-build-error`: new Scope bullet, per C11: not measured, no code change, ordinary page content that scrolls
  under the stuck bar.
- Note (overflow-x): column class gains `overflow-x: hidden` so the doc's "Build panel never scrolls sideways"
  stays true; new criterion (respec 1) checks computed `overflow-x: hidden` on both columns and that
  `build-column` clips nothing (`scrollWidth <= clientWidth`) in the table view.
- Note (criterion 4): the narrower-viewport route is removed; the `duration-error` route only, at
  `SPLIT_VIEWPORT`, comparing rect height plus margin-bottom to the custom property.
- Note (hook unit test): kept as checked-by-reading; the vitest config has no DOM environment and effects do not
  run outside a renderer, so a unit test would need a new environment, out of proportion for this ticket.

Checked at origin/main: `build-input.tsx` form has `py-2 mb-3`; `duration-error` renders inside the form;
`git grep 'htmlFor="build-order-text"' -- components pages` matches only `build-text-editor.tsx` (the criterion's
end state is no match); `aoe4-step-annotations.spec.ts` asserts `panel-build` `overflow-x: visible`, on the inner
panel, so it stays valid. ticket-lint passes.

## Diagrams

None (single component, outside the core control loop).

## Open questions

none

## Overlap

Unchanged from the original ticket: other M8 tickets (C10 legend, C12 polish of `build-text-editor.tsx`, library
select and save panel) touch the same files in different hunks.
