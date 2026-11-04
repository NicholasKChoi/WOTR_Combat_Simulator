# SGS-086 review 1: APPROVE

Branch sgs-086-aoe4-small-screen-tabs-keyboard @ c83ac75, base b9481e3.

## Blocking findings
None.

## Acceptance criteria
- 320/360 card overflow: pass (spec polls max(scrollWidth, select/input right edges) minus width; implementer showed it fails with the CSS reverted). The recorded "371 on main" number was not re-measured; revert-fails evidence is accepted instead. Non-blocking.
- Run bar static at 360, scrolled away, no covered titles: pass (spec reads position, barTop < 0, zero overlaps).
- Sticky at 768/1280, top 0, scrollMarginTop equals bar height: pass. 360: margin 0px and heading top within viewport: pass. `stickyBarHeight` reads computed position, so it follows the CSS.
- Tab keys, roving tabindex, one tab stop, disabled Results: pass by code (`nextTab`, `onKeyDown`, `tabIndex`) and spec. preventDefault only for handled keys.
- Unit table: pass; covers every listed row plus extras.
- Docs: pass; Page and Narrow layout sentences match the CSS and code; no remaining "sticky at every width" sentence.
- tsc and lint:dup: run by me, clean. npm test, next build and acceptance: taken from the implementer's report (1360 unit, 747 acceptance passing); not re-run by me.
- Mutation criterion: met in substance, not literally. The unit test fails under the mutation. The acceptance test cannot: `shownTab = resultsEnabled ? tab : 'build'` hides the stray `onSelect('results')`, and `.focus()` on a disabled button is a no-op, so no DOM state differs. The ticket text over-claimed. The disabled-tab acceptance test still guards the end-user behavior (Build stays selected and focused), and the unit test guards the mechanism. This is a spec wording gap, not a code defect, so no NEEDS_SPEC.
- Invariants: none apply.

## Contract, lint, bot, conventions, correctness
- Out of scope respected: `acceptance/aoe4-build-order.spec.ts` untouched, breakpoints unchanged, no Bootstrap utilities mixed onto module-styled elements.
- Lint: `npx tsc --noEmit` and `npm run lint:dup` clean (0 clones).
- Review bot: none configured.
- Conventions: spec file uses 2-space indentation, matching the sibling `acceptance/aoe4-narrow-layout.spec.ts`. Test table uses `it.each`.
- Correctness: wrap arithmetic correct; fewer than two enabled tabs returns null; refs set via callback; no leaks.
- The doc line in docs/aoe4-build-order.md is long (one very long line) but matches the file's style of unwrapped prose in that paragraph. Not a finding.
- Doc claims checked against code: all three hold.

## Non-blocking notes
- Under a regression in `nextTab`, page state `tab` could hold 'results' while Results is disabled; harmless because `shownTab` masks it.
- I did not load the page in a browser myself or take screenshots (REPO.md asks for 360/768/1280 screenshots); I relied on the passing Playwright assertions the implementer reported.

## Coverage
Reviewed all 7 changed files in the diff. Not reviewed: independent runs of npm test, next build and acceptance; manual screenshots.
