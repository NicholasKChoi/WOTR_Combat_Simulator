# SGS-140 implementer report 1

Status: needs_review (one spec deviation to confirm, below)

- Ticket: SGS-140. Branch `sgs-140-editor-compact-mode`, tip `2f18733`, base `origin/main` (5564bd0; SGS-128 is merged there as #139).
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-140-editor-compact-mode`

## Key finding: root font is 18px, not 16px
`styles/global.css` sets `html { font-size: 18px }`, so 1rem = 18px and 48rem = 864px. With the C14 values alone the criterion 2 bound fails: at 1280x800 the editor is 534 px, textarea content 375 px, probe (48 `0`s at 15.75px) 453.7 px. The ticket's levers (gutter `min-width`, annotation padding) are not enough either, so the compact rule also tightens the textarea's horizontal padding (still inside compact mode only). The margin is thin: content 455 vs probe 453.7 (1.3 px). A third-digit line number (100+ lines) or a font change would break it; a spec owner may want to revisit (for example a smaller compact font or collapsing the gutter) rather than rely on this margin.

Measured (Chromium, default build, after the run):
| viewport | editor | textarea clientWidth | textarea content | probe (48 chars) |
|---|---|---|---|---|
| 390x844 | 336 | 266 | 257 | 453.7 |
| 1280x800 | 534 | 464 | 455 | 453.7 |
Before tightening (C14 values only) at 1280x800: textarea client 402, content 375.

Deviations from C14 values, all inside the compact container query: `.annotations` width 4.7ch (C14: at most 8ch; started times up to `10:49` need about 38 px of the 40 px content), `.annotations` padding-right 0, `.gutter` min-width 0 and padding-right 0.125rem, `.textarea` horizontal padding 0.25rem. A 6-character time (`100:00`) would clip in the 4.7ch column; the default build has none.

## Files touched
- `components/apps/aoe4-build-order/workbench.module.css`: `.editor` is `container: build-editor / inline-size`; `--editor-font-size` (1rem) drives the shared font rule; annotation span is `calc(0.8 * var(--editor-font-size))`; `@container build-editor (width < 48rem)` sets the 0.875rem font on `.gutter/.annotations/.textarea` and the narrower widths and padding.
- `components/apps/aoe4-build-order/step-annotation.module.css`: `.gutterEndTime` hidden inside the same container query.
- `components/apps/aoe4-build-order/step-annotation.tsx`: `StepTimes` puts `gutterEndTime` on the finished span only when `labelled` is false (step table and table view unaffected).
- `components/apps/aoe4-build-order/build-text-editor.tsx`: `data-testid="build-order-editor"` on the editor wrapper.
- `docs/aoe4-build-order.md`: text-view gutter paragraph updated.
- `acceptance/aoe4-editor-width.spec.ts`: new, 7 tests.

## Tests
- New spec: 7 passed. Existing related acceptance specs (step-annotations, step-band, narrow-layout, compact-view, split-layout, step-table, results-split) plus the new one: 98 passed. `npm test`: 74 files, 2360 passed, 13 skipped, 0 failed. Full acceptance suite not run (acceptance-test gate owns it).
- Invariants encoded: textarea at least half the editor at 390; content fits 48 chars at 1280; compact: finish time `display:none`, started visible, fonts 0.875rem, span 0.8x, annotation width, no clipped annotation, annotation tops equal line-number tops; table `step-finished` visible with same texts as the gutter; hover marks `data-gutter-active` with a visible box-shadow; at 1024 (editor at least 48rem) finish visible, fonts 1rem, span 0.8rem-equivalent, annotation width 17ch.
- Rem is read from the page, not hard-coded.
- Pre-existing tests edited: none. (An earlier class name `gutterFinished` broke `step-annotation.test.ts` "labelled false shows the Started and Finished labels" because the class text contains "Finished"; renamed to `gutterEndTime` instead of editing the test.)

## Mutation checks (all undone, tree clean after)
- `--editor-font-size: 0.875rem` -> `1rem` in compact rule: fails the 1280 content-width test and both font tests.
- Hide rule `display:none` -> `block`: fails both compact gutter tests (finish displays).
- Container query `width < 48rem` -> `< 1rem`: 4 compact tests fail (width, font, hide).
- Query `< 90rem` in both files: wide-mode test fails (finish hidden, fonts).
- Hide class applied to every finished span and rule unscoped: table-view test (finish not visible) and wide test fail. Scoping to the container alone cannot leak into the table; that break alone passes, so the table test guards the unscoped variant only.
- `box-shadow` removed from active rule: hover test fails.
- Alignment and clip assertions were not individually mutated.

## Doc claims
- `docs/aoe4-build-order.md`: "(below 48rem of editor width the finished time is hidden)" matches `step-annotation.module.css` `.gutterEndTime` in `@container build-editor (width < 48rem)`.
- Same file: "Below 48rem of the editor's own width ... the text view is compact: the gutter, annotations and textarea use a 0.875rem font, the annotation column is narrower and the gutter, annotation and textarea padding is tightened, so more of each line shows; the step table and table view still show the finished time." matches the compact block in `workbench.module.css` and the table test.

## Pinned outputs
None.

## Clean
- Codegen: none set. `npx tsc --noEmit` and `npm run lint:dup`: clean (0 clones). `next build`: passed (run before the class rename; tsc and tests re-run after).
- Diff stat limited to the six named files; no lockfile or stray changes.

## Invariants
INVARIANTS.md entries not touched (CSS and a test id only). Existing gutter text readers keep `textContent`.

## Unverified assumptions added
None.

## Out-of-scope findings
- Ticket Context and C14 sizing assume 1rem = 16px; the site root is 18px (`styles/global.css`). Other M9 rem-based bounds may be off the same way.
- `SGS-140` ticket says the container name works unchanged in CSS modules; confirmed (the shared `build-editor` name matches across `workbench.module.css` and `step-annotation.module.css`).
