# SGS-115 implementer report 1

Status: needs_review

- Ticket: SGS-115 (split scroll, columns and headings). Branch `sgs-115-split-scroll`, base `origin/main` (b3da879).
- Tip SHA: 3a0fc44351af4487535f58f5da3dc7f0b8e071ab (one commit).
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-115-split-scroll`

## Files touched
- `components/apps/aoe4-build-order/use-run-bar-height.ts` (new): the hook, as specified.
- `components/apps/aoe4-build-order/build-input.tsx`: `runBarRef` prop set as `ref` on the run-bar form.
- `components/apps/aoe4-build-order/build-text-editor.tsx`: visible label deleted; required `labelledBy` prop set as `aria-labelledby` on the textarea.
- `components/apps/aoe4-build-order/workbench-tabs.tsx`: each panel wrapped in a column div, always rendered; the column class and `build-column` / `results-column` ids only when `split`.
- `components/apps/aoe4-build-order/workbench.module.css`: `.workbenchSplit` height and `minmax(0, 1fr)` row (the `align-items: start` is removed); new `.column`.
- `pages/apps/aoe4-build-order.tsx`: `runBarRef`, `useRunBarHeight`, the Build order `h2`, `labelledBy`, the Results `h2` with `h4` and a test id.
- `docs/aoe4-build-order.md`: "Page" paragraph updated.
- `acceptance/aoe4-split-scroll.spec.ts` (new): 10 tests.

## Tests
- `npm test`: 63 files, 1972 passed, 13 skipped, 0 failed.
- `aoe4-split-scroll.spec.ts`: 10/10 pass. Invariants: workbench top = bar bottom + margin and bottom = innerHeight at both viewports (alert absent, margin > 0 asserted); each column scrolls alone (overflow asserted first); hover on the last completed step shades an on-screen chart; the property follows the bar after the bar grows (height change asserted); columns have `overflow-x: hidden` and the Build column is not clipped in table view; no columns and a scrolling page below 1200 px; heading text shown once, first in the panel (both views, `step-table-unavailable`, split and tabs); equal h2 sizes and equal h3 sizes.
- Layout and UI specs run and pass: split-layout, small-screen, results-split, narrow-layout, step-annotations, step-band, compact-view, chart-readability (66 passed), and pin-compare, m3-flow, m4-flow, step-table, auto-run, save-open, inline-issues, run-errors, client-check, gathered-resources, gather-rates-per-villager, knight-longbow-page, from (178 passed). I did not run the API-only aoe4 specs or the combat specs.
- No unit test added: the hook needs a DOM, which the unit environment lacks, and no logic outside it changed.

## Pre-existing tests edited
None.

## Hook, null and no-ResizeObserver (by reading)
`use-run-bar-height.ts` returns before writing when `ref.current` is null (`form?.closest('section')` is undefined), when no section exists, or when `typeof ResizeObserver === 'undefined'`. None of those paths throws or writes.

## Doc claims
In `docs/aoe4-build-order.md` "Page":
- "In the side-by-side layout the page only scrolls above the columns, so the bar stays stuck only as far as the page still scrolls." Backed by `.workbenchSplit` `height: calc(100dvh - var(--aoe4-run-bar-height, 0px))` and spec test 1.
- "The two columns fill the viewport below the run bar and each scrolls on its own, so the page does not scroll to reach either column's content." Backed by `workbench.module.css` `.column` and the spec "each column scrolls on its own".
- "The Build column, the Results column and the tabs carry the headings `Build order` and `Results` at the same size; the text editor's textarea takes its accessible name from the `Build order` heading." Backed by `pages/apps/aoe4-build-order.tsx` (both `h2.h4`, `aria-labelledby`) and the headings spec.
- "does not scroll vertically itself, its column does (a line longer than the box scrolls sideways)". Backed by `.textarea` `overflow-y: hidden` and the column's `overflow-y`.
Grep of the section for "page scrolls", "two equal columns" and "never scrolls vertically": the remaining "page scrolls" sentence (the run bar) now carries the added qualification. "Two equal columns" is still true (two `1fr` tracks). "Never scrolls vertically" is rewritten.

## Pinned outputs
None.

## Mutation checks (each undone with `git checkout`)
- `use-run-bar-height.ts` `height + margin` becomes `height`: fails both "fills the viewport" tests (bottom mismatch) and the "follows the bar" test.
- `workbench.module.css` `height: calc(100dvh ...)` removed: fails the two "fills the viewport" tests, "each column scrolls" and the hover test.
- `.column` `overflow-x: hidden` removed: fails the "clip sideways overflow" test (computed `auto`).
- Page `h4` class dropped from the Build `h2`: fails both heading tests (font sizes differ).
- `observer.observe(form)` removed: fails "the property follows the bar".
- `aria-labelledby` removed from the textarea: fails both heading tests (`getByRole('textbox', { name: 'Build order' })` count).
- `min-height: 0` removed: no test fails. `overflow-y: auto` removed: no test fails. See findings.

## Build, lint
- `npx tsc --noEmit` and `npm run lint:dup` (0 clones): pass.
- `npx next build`: pass.
- Codegen: none configured. `git status` clean after commit. Diff stat contains only the files above; no lockfile change.
- `git grep 'htmlFor="build-order-text"' -- components pages`: no matches.

## Invariant check
No INVARIANTS.md entry applies (UI only, S1 to S3, W and H are untouched). The wrapper div is rendered in both layouts, so no panel remounts on a resize (split-layout round-trip specs pass).

## Out-of-scope and spec findings
- Two acceptance criteria say the test "fails if either column loses `overflow-y: auto` or `min-height: 0`". Removing either rule alone changes nothing. Because `.column` has `overflow-x: hidden`, `overflow-y` computes to `auto` regardless, and a non-visible overflow makes the grid item's automatic minimum height 0. Both declarations are kept as the ticket specifies. Only removing the `.workbenchSplit` height, or `overflow-x`, is observable. The spec could not pin them separately.
- The long build in the spec uses 40 `# note` comment lines followed by 6 villager steps. Forty villager steps in a row left the last step `not-reached` (probably the population cap), so it had no chart band to hover.

Status: needs_review
