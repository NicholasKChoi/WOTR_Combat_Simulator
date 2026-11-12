# SGS-140 review 2

Branch `sgs-140-editor-compact-mode`, tip 2f18733 (unchanged since review 1). Reviewed in my own detached worktree `review-sgs-140` (removed, or deferred if EBUSY).

## Verdict: APPROVE

The spec gap from review 1 is closed: the re-specced ticket states the 18px root and ratifies the levers the branch uses (compact query only). No code change; no blocking findings.

## Blocking findings
None.

## Acceptance criteria
1. Pass. "at 390 px the textarea keeps half of the editor" asserts editor < 48rem first, then client width >= 0.5 x editor in one `page.evaluate` (review 1 measured 266 of 336).
2. Pass. Content width >= 48-char probe in the textarea's computed font, editor < 48rem asserted first, one evaluate (review 1: 455 vs 453.7). The fonts are checked in the gutter-fonts test; a removed rule or 1rem font fails. The thin margin and its limits (3-digit gutter, `100:00`) are now stated out of scope in the ticket.
3. Pass. Wide test at TABS_VIEWPORT asserts editor >= 48rem first, finish not `none`, fonts 1rem, span 0.8x, annotation width 17ch.
4. Pass. Finish `display: none`, started visible, fonts 0.875rem, span 0.8x, width <= 8ch, `clipped` 0 over all annotation rows, at 390 and 1280x800. My live run at 360, 768 and 1280: finish displays `none`, `annClip` 0 in all three.
5. Pass. Hide class `gutterEndTime` applied only when `labelled` is false (`step-annotation.tsx`), rule inside the container query; the table test compares step-table `step-finished` texts with the gutter's and asserts visibility.
6. Pass. Annotation row tops equal line-number row tops (exact), plus font equality in `expectFonts`. Screenshots show rows aligned.
7. Pass. Hover sets `data-gutter-active` with a visible box-shadow in compact mode, precondition asserted first. Stale tone CSS is untouched.
8. Pass. No existing test file edited (diff: new spec plus 5 source/doc files); text readers unchanged.
9. Pass. The `docs/aoe4-build-order.md` paragraph now says the finished time is hidden below 48rem of editor width and describes compact mode; each claim matches the compact block (0.875rem, narrower annotation column, tightened padding, table keeps finish time). No sentence says the gutter always shows both times.
10. Pass. Run by me in the review worktree: `npx tsc --noEmit` clean, `npm run lint:dup` 0 clones, `npm test` 74 files, 2360 passed (13 skipped), `npx next build` succeeds. Screenshot inspection below.
11. Pass. No INVARIANTS entry applies (CSS, a test id, a class). Spec-checklist: Contracts/Scope/Naming hold; A1 to A3 untouched.

## UI inspection (preview, `next dev -p 3877`, default build, Text view)
Loaded `/apps/aoe4-build-order` at 360x760, 768x900 and 1280x800. Script checked document horizontal scroll, clipped/overflow:hidden boxes, annotation clipping, and finish-time display; screenshots of the editor at each width (and the full viewport at 768).

| width | editor | textarea client | doc scrollWidth vs viewport | overflow:hidden clipped | annotation clipped | gutter finish |
|---|---|---|---|---|---|---|
| 360 | 306 | 236 | 360 = 360 | none | 0 | none |
| 768 | 666 | 596 | 768 = 768 | none | 0 | none |
| 1280 | 534 | 464 | 1280 = 1280 | none | 0 | none |

Every ancestor of the editor up to the container has scrollWidth = clientWidth, so the Build panel does not overflow sideways at any of the three widths. The text area scrolls sideways inside itself for long lines (spec-allowed). Screenshots show line numbers, started times and text aligned, kind borders and the 2:24 active/stale-toned row visible, no mid-word breaks and no overlap. The 5-char times (`10:00`) sit close to the text but are not clipped. At 768 the editor (666) is still under 864 so compact applies; the tabs layout editor of TABS_VIEWPORT (1024) is the wide case covered by the spec.

## Linter
tsc and jscpd: no issues. No ESLint in this repo.

## Review bot
`reviewBot.cli` empty: skipped. No rules file.

## Conventions
Spec uses `helpers.ts` (`openPage`, viewports, `showView`), loops over viewports and no repeated blocks; reads all rects in one `page.evaluate` (LESSONS rule holds). `build-editor` container name is shared by two CSS files (workbench and step-annotation); undocumented coupling, non-blocking.

## Correctness
`(width < 48rem)` is the same boundary as design C14's `max-width: 47.99rem`. `labelled ? undefined : styles.gutterEndTime` has the right polarity. `.textarea` compact `--editor-font-size` wins over Bootstrap `.form-control` (font test passes at 0.875rem per implementer; computed font equality asserted in spec).

## Non-blocking notes
- Margin at 1280 px is about 1.3 px (ticket now records it as a known limit).
- Spec files were not run (acceptance is not mine). I judged the tests by reading.
- Other M9 rem bounds may assume 16px; the owner checks separately (per ticket).

## Coverage
Reviewed: all 6 changed files, the new spec in full, REPO.md, LESSONS, INVARIANTS, spec-checklist, ticket, review 1. Not run: acceptance/Playwright test files (by rule). Nothing left running (port 3877 stopped).
