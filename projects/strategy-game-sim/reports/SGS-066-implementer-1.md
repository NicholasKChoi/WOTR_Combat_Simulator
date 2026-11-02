# SGS-066 implementer report 1

Status: needs_review
Branch: sgs-066-aoe4-workbench-tabs-editor (from sgs-059-aoe4-page-posts-build-order 41e648d6227798d8dc73deb5ef1f9bbdab2cdd3d)
Tip: 0d57ba110d8b027e417381225b9b1336488858ad
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-066-aoe4-workbench-tabs-editor

## Files
- components/apps/aoe4-build-order/text-lines.ts, text-lines.test.ts (new): lineCount + table test.
- components/apps/aoe4-build-order/build-text-editor.tsx (new): textarea (rows max(8,n), wrap off) + gutter.
- components/apps/aoe4-build-order/workbench-tabs.tsx (new): WorkbenchTab, WorkbenchTabs.
- components/apps/aoe4-build-order/workbench.module.css (new): sticky bar, gutter/textarea metrics, scroll-margin.
- components/apps/aoe4-build-order/build-input.tsx: sticky run bar, EditorView, view toggle; textarea and IssueList removed.
- pages/apps/aoe4-build-order.tsx: tab/view state, derived shown tab, scrollIntoView after 200, layout.
- docs/aoe4-build-order.md: Page section rewritten (tabs, run bar, toggle, editor).
- acceptance/helpers.ts: showTab, showView.
- acceptance/*.spec.ts: rule A-D edits plus new specs (below).

## Tests
- npm test: 1225 passed, 8 skipped (42 files). text-lines.test.ts: 4 rows (lineCount of '', 'a\nb', 'a\n', 'a\n\nb').
- Full npm run acceptance (port 3871): 629 passed, 0 failed. Re-ran aoe4 specs after final edits: 97 passed.
- New specs in aoe4-build-order.spec.ts (describe "workbench tabs, run bar and editor", 11 tests): load state; 200 run selects Results below the run bar and both panels stay mounted (page scrolled to bottom before Run); rejected paste with and without pin; mocked 400 and 500 after a 200; unpin with no result; sticky bar in both tabs; gutter counts; auto-size and level line numbers; view toggle survives run, tab switch, resets on reload.

## Pre-existing tests edited (rules A-D)
- aoe4-build-order.spec.ts: "a failed run after a successful one removes the charts", "warnings list warnings before ... resets on reload", "editing the text after a run keeps the labels until the next run", "a rejected paste and a start-only run show no timeline" (Rule B: click tab-build before fill).
- aoe4-build-order-pin-compare.spec.ts: `run` helper (tab-build before fill); "the pin survives a text edit and a prebuilt change" (tab-build before fill, tab-results before the pinned path presence check: charts do not draw in a hidden panel); "a rejected paste removes charts and table but keeps the pin..." (tab-build before fill).
- aoe4-build-order-timeline-compare.spec.ts: runWith helper (tab-build before fill).
- aoe4-build-order-client-check.spec.ts: expectPostedChecked (reads the text before Run, since the textarea is hidden on Results), "a table edit posts..." and "the table view of a prebuilt build..." (Rule C view clicks).
- aoe4-build-order-m3-flow.spec.ts: all three tests (Rule B and C).
- aoe4-step-table.spec.ts: every test (Rule C): openWith/expectText/textValue helpers switch view; direct `editor-view-table` clicks elsewhere. Expected values unchanged.
No assertion value changed.

## Mutation checks (each applied, run, confirmed failing, reverted)
- lineCount ignoring a final empty line: text-lines.test.ts failed (1 of 4) and "gutter has one line number per line" spec failed.
- shownTab = tab (not derived): "unpinning on Results" spec failed.
- position: sticky -> static: "run bar stays at the top" spec failed.
- rows Math.max(8, n) -> n: "textarea grows" spec failed.
- scrollIntoView removed: "successful run selects Results" failed (first attempt passed, so the spec now scrolls to the bottom before Run).

## Stages
- tsc --noEmit clean; lint:dup 0 clones; npx next build OK; codegen not set.

## Invariants
- Page still in Layout and linked (untouched). New components import only from lib/aoe4-build-order and the component folder. Run path and unchecked duration unchanged.
- Criteria greps: no `rows={16}`; one `build-order-text` testid (in build-text-editor.tsx; git grep misses it until committed); no IssueList in build-input.tsx; tab-build present in the three named specs; editor-view-table in step-table spec.

## Notes and findings
- step-table.tsx and step-table-model.ts untouched. aoe4-step-table.spec.ts is fully edited here, so it will conflict textually with any SGS-068 edit to that spec; resolve at rebase.
- Charts (recharts ResponsiveContainer) draw nothing while the Results panel is hidden; specs asserting a drawn series must select Results first (absence assertions are unaffected).
- Run-bar scroll-margin is a fixed 8rem on the Results wrapper, which covers a one-line bar; a bar wrapped to several lines at narrow widths (not checked at 390 px) could overlap the panel top.
- Gutter and textarea metrics come from the CSS module (page font is 18px); a wrapped long line is avoided with wrap="off".
- Port 3871 was briefly busy when I launched a second run while the first was still alive; no leftover processes of mine remain.
