# SGS-104 review 1

Verdict: **REQUEST CHANGES**

Reviewed: branch sgs-104-split-layout at 7e05a8aa9b24b179358c63c6e397a782d7d4859a (commits bca1d06 and 7e05a8a) against origin/main 5b29e9e, in a detached worktree `worktrees/review-sgs-104` (removed after this report was written).

## Blocking findings

1. `docs/aoe4-build-order.md:902-904` - contract (text) - The diff put the new "below 1800 px" clause in the middle of the sentence, so "it scrolls vertically inside that column" now follows the stacked case. Below 1800 px the timeline has no column, no `max-height` and no `overflow-y` (they sit only inside `@media (min-width: 1800px)` in `workbench.module.css:14-32`), so the sentence describes something the code does not do. Replace lines 902-904 with this text:
   "At 1800 px and wider the step timeline sits in a column to the left of the charts and stays on screen just below the run bar while the charts scroll; it scrolls vertically inside that column, and sideways inside its own box when the table is wider than the column. Below 1800 px it is stacked above the charts and scrolls with the page."

2. `docs/aoe4-build-order.md:867` and `components/apps/aoe4-build-order/use-split-layout.ts:14` - contract (text) - "The first paint is the tabs layout; the page switches to the side-by-side layout after it loads." and the comment "False on the server and on the first client render" are true only when the page hydrates from its static HTML (a direct load or a reload). `useSyncExternalStore` uses `getServerSnapshot` only during hydration. On a client-side navigation it calls `getSnapshot` on the first render, and `pages/index.js:35` links to the page with `next/link`. I checked this in Playwright at 1280x800: going from `/` through the "AoE4 Build Order Simulator" link, a MutationObserver never saw `workbench-tabs`, and the first render that had `panel-build` was already split. The behavior is fine (no hydration takes place on that path); the text is what is wrong. Replacements:
   - doc, line 867: replace "The first paint is the tabs layout; the page switches to the side-by-side layout after it loads." with "When the page is opened directly, its first paint is the tabs layout and it switches to the side-by-side layout after it loads."
   - comment, `use-split-layout.ts:14`: replace it with "// False on the server and during hydration, so the first render matches the static HTML."

3. `acceptance/aoe4-split-layout.spec.ts:165-167` - convention - The resize-while-hidden table copies `openPage` line for line (`page.goto(AOE4_PAGE)`, `waitForLoadState('networkidle')`, then the `auto-run-status` `current` expect). `openPage` in `acceptance/helpers.ts:102-106` does exactly this, and the same file already imports it and uses it in every other test. Direction: replace the three lines with `await openPage(page)` and drop the `AOE4_PAGE` import if nothing else uses it.

## Spec gaps

None.

## Acceptance criteria

- Wiring greps: **pass**. `min-width: 1200px` under components appears only at `use-split-layout.ts:3` (`WORKBENCH_SPLIT_QUERY`). `min-width: 1800px` appears only at `workbench.module.css:14`. `useSplitLayout` appears only in `use-split-layout.ts` and the page. `matchMedia` appears only in `use-split-layout.ts`. (Implementer report 1 says the 1200 grep found "no match"; it actually finds the one allowed match.)
- "split at 1280": **pass**. `aoe4-split-layout.spec.ts:8-38` covers every item: tablist and tabs have count 0, both panels are visible with no `hidden` and no `role`, side by side in one evaluate, the top/left/right rects for the editor and `results-last-good`, and `scrollWidth`. It passed in my run.
- "the Build column scrolls inside itself": **pass**. The rule is at `workbench.module.css:42-44`. The step-table tests that click `step-delete`/`step-add` run at the default 1280 viewport and passed in my run (121/121 on the touched specs).
- "the start row stays a table row from 768 px": **pass**. `aoe4-step-table.spec.ts:491-497` uses `WIDE_VIEWPORT`, and the `count.x > rally.x` and trigger/action checks are under `toPass`. The 390 half is unchanged and no same-line rally/count assertion is left.
- "tabs at 390": **pass** (`aoe4-split-layout.spec.ts:40-50`).
- "the breakpoint is 1200 px": **pass** (`:52-61`; the implementer's 1100 px mutation was caught).
- "the layout switches live": **pass** (`:63-82`, inside `expectNoRun`).
- "resize keeps focus and state": **pass, with a note**. Both round trips exist (`:84-125`). The pin check runs only in the text-view round trip. The criterion says "in both", but the Results panel is the same in both trips, so a pin check in the table trip would add nothing. See the notes.
- "view toggle never disabled by the tab in split": **pass** (`:127-144`).
- "first paint matches the server": **pass** (`:146-155`). The listener is registered before `goto`, and the test filters on `/hydrat/i`.
- "the timeline split is at 1800 px": **pass** (`aoe4-results-split.spec.ts:108-126`).
- "resize while hidden": **pass**. It is a table over the two cases (`:157-184`). Implementer report 2 says it passed against 5b29e9e. Blocking finding 3 applies to its setup lines.
- Edited specs follow the rules, and the tab grep: **pass**. Every `tab-(build|results)|workbench-tabs` match outside the split spec sits in a describe pinned to `TABS_VIEWPORT` (auto-run :65/:162, m4-flow :19, pin-compare :361, run-errors :52, small-screen :93, step-table :697) or to 390/360 px (auto-run :299, small-screen :36).
- Docs state every Scope item: **fail**, because of blocking findings 1 and 2. Every required item is present, there are no measured sizes, and the `1200 px and wider|beside them at 1200` grep finds only the side-by-side sentence, which is correct.
- Gates: **pass**. My runs: `npx tsc --noEmit` clean, `npm run lint:dup` 0 clones, `npm test` 59 files with 1802 passed / 10 skipped, `npx next build` succeeds with `/apps/aoe4-build-order` as SSG, and the 9 touched acceptance specs 121/121. I did not run the full acceptance suite; implementer report 2 says 805 passed.
- No INVARIANTS.md regressions: **pass** (see below).

## Invariants touched

- S1 (apps independent): **holds**. The new imports are `react` and `./workbench.module.css`, plus the page importing `../../components/apps/aoe4-build-order/use-split-layout`.
- A3 (same input, same timings): **holds**. `split` only affects the `WorkbenchTabs` markup and `viewDisabled`. No result, request or controller path reads it. The live-switch test proves no POST happens on a resize.
- S2, S3, A1, A2, W1, W2, H1-H3: not touched.

## Spec checklist

- Key surfaces and design names: `WORKBENCH_SPLIT_QUERY`, `useSplitLayout`, the `split` prop, `workbench-split`, `.workbenchSplit` and `viewDisabled = !split && shownTab === 'results'` all match design M6 C6 and "Layout" (lines 60, 68, 70, 586-591).
- Scope: no `resize` listener, `nextTab` is unchanged, `line-chart.tsx`, routes, `ARCHITECTURE.md` and `openapi.json` are untouched, and nothing under `golang/` changed.
- No invented constants. The 1200/1800 values come from the design.
- Naming: fine.

## Linter

`npx tsc --noEmit && npm run lint:dup` is clean. The repo has no ESLint config.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran and there are no bot findings to reconcile. `rulesFile` is empty.

## Conventions

- `use-split-layout.ts` uses 4-space indent and module-level functions like its sibling `use-auto-run.ts`. Each comment states a hidden constraint, which meets the bar.
- `workbench-tabs.tsx`: the stable wrapper, the tablist rendered as `false` when split, and fixed panel positions match the respec 1 tree rule. The wrapper `className={split ? styles.workbenchSplit : undefined}` is a ternary, not a template literal, so the "use `cn`" rule is not violated.
- No Bootstrap utilities are mixed with module CSS on the new wrapper.

## Review checklist (REPO.md)

- Every diff: I ran `npx next build`. I loaded the page through Playwright (`next dev`) at 360x760, 390, 700, 768, 1199, 1200, 1280, 1799 and 1800, in text view, table view and Results. The page `scrollWidth` equals the viewport width in every state. I looked at screenshots of the 1280 text and table views and of focus states.
- AoE4 build order: no helper or constant is copied between `lib/aoe4-build-order/` modules. Doc sentences were checked against the code (findings 1 and 2). The layout checks show no horizontal page overflow at 390, 700 or 1280, and the sticky run bar is unchanged.

## Non-blocking notes

- `workbench.module.css:42-44`: the scroll container for the Build column is the whole `panel-build`. In the default build, table view, the panel is about 9100 px tall and the step table is 693 px wide in a 534 px column at 1280 (624 px at 1800). The horizontal scrollbar therefore sits at the bottom of the panel, and the rightmost columns of every row (the step controls) are out of view until the user scrolls sideways. With a mouse and no shift-wheel, that means scrolling to the bottom of the page first. The ticket specified this rule (respec 3), so this is not a finding against the diff. It is a UX follow-up: put the scroll on the step table's own wrapper, or narrow the table in split.
- The same `overflow-x: auto` clips the right edge of the textarea border and its focus ring at 1280 and 1800, because the textarea's right edge equals the panel's right edge (measured 631/631 at 1280). This is cosmetic.
- `aoe4-split-layout.spec.ts:107-125`: the table-view round trip does not re-check the pin label. The criterion says "in both", but the text-view trip already covers it.
- `aoe4-auto-run.spec.ts:14`: `TABS_VIEWPORT` was inserted between `settledScrollY` and `showTab` in the import list. The other edited files put it before the lower-case names.
- `aoe4-build-order-run-errors.spec.ts`: two tests were moved (the 200-not-JSON test up, the successful-run test into the nested describe) so the TABS describe could be contiguous. Their bodies are unchanged.
- Conflict with SGS-105: `git merge-tree 7e05a8a sgs-105-save-and-open-by-link` reports content conflicts in `acceptance/helpers.ts` and `docs/aoe4-build-order.md`. `pages/apps/aoe4-build-order.tsx` and `workbench.module.css` merge cleanly. Resolve at the batch rebase. Design line 592 adds Save/link/Copy to the run bar tab order in split; check it once both land.
- Observed outside this diff: at 768 px (tabs layout) `panel-build` in table view has `scrollWidth` 693 against `clientWidth` 666, though the page does not scroll sideways. This was already the case and is not touched here.

## Out-of-scope findings

- The Build-column scroll placement above (`workbench.module.css:42-44`, measured `panel-build` scrollHeight 9133 and scrollWidth 693 against clientWidth 534 at 1280): a UX follow-up for the backlog, not part of this ticket's contract.

## Coverage

Files reviewed: all 15 in the diff (`use-split-layout.ts`, `workbench-tabs.tsx`, `workbench.module.css`, `pages/apps/aoe4-build-order.tsx`, `docs/aoe4-build-order.md`, `acceptance/helpers.ts`, `aoe4-split-layout.spec.ts`, and the edited auto-run, m4-flow, pin-compare, run-errors, narrow-layout, results-split, small-screen and step-table specs). I compared against `use-auto-run.ts`, `pages/index.js` and design M6. Not run: the full acceptance suite (I ran only the 9 touched specs).
