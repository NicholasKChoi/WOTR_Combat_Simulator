# SGS-116 implementer report 1

Status: needs_spec (one acceptance assertion cannot hold; code otherwise complete and committed)

- Ticket: SGS-116. Branch: sgs-116-step-table-readability. Tip: 22ba5073c377a762432f384c3fc01ce105b7d78f (base origin/main b3da879).
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-116-step-table-readability

## needs_spec: `deletesInside` cannot hold
With the select cap deleted (as Scope says), the existing layout case "the longest prebuilt step table fits the Build panel and the editor is not clipped" fails on `deletesInside` (panelFits still true). The table now scrolls sideways inside `step-table-scroll`, so the delete buttons' rects sit right of the panel edge. Isolation: with only `nowrap` removed it still fails; with the select cap restored (nowrap kept) it passes. So the cap removal is the cause. Per the ticket I did not weaken the assertion. I dropped only `tableFits` (allowed). That one acceptance case is red on this branch; the other 15 in the spec pass. Spec needs to decide: measure `deletesInside` against the scroll box instead of the panel, or keep a narrower cap, or reach the delete button without sideways scroll.

## Files touched
- components/apps/aoe4-build-order/step-annotations.ts: `STILL_WAITING`, `waitedText`.
- components/apps/aoe4-build-order/step-annotation.tsx: `StepTimes` `labelled` prop; run cell Waited label outside the `step-waited` value span, omitted for still waiting.
- components/apps/aoe4-build-order/step-annotation.module.css: `.badge` nowrap; `tbody > tr > td.kindBorder` rule.
- components/apps/aoe4-build-order/step-table.module.css: removed `.table select` max-width.
- components/apps/aoe4-build-order/build-text-editor.tsx: `labelled={false}`, gutter title via `waitedText`, `scrollLeft` reset on non-typed text change (ref `typedText` holds the last value typed; effect on `text` resets when `text` differs from it).
- step-annotation.test.ts, step-annotations.test.ts: unit tests.
- acceptance/aoe4-step-annotations.spec.ts: new/extended cases.
- docs/aoe4-build-order.md: four paragraphs per Scope.

## Tests
- `npm test`: 63 files, 1981 passed, 13 skipped, 0 failed. `tsc --noEmit` clean; `lint:dup` 0 clones; `next build` succeeds. Codegen: none set.
- Acceptance (`npx playwright test acceptance/aoe4-step-annotations.spec.ts`, harness file changed so run once): 15 passed, 1 failed (the `deletesInside` case above).
- Invariants encoded: waitedText rule per status; labelled flag controls labels and values stay bare; waiting/not-reached cell has no "Waited"; gutter title text; badges nowrap and selects fit; 4px kind border at 390; scroll reset only for non-typed changes.

## Pre-existing tests edited
- step-annotation.test.ts `renders the %s times through StepTimes`: passes `labelled: true` to match the run cell (ticket: tests rendering `StepTimes` pass `labelled`).
- acceptance spec: "a not-reached step reads an en dash..." extended (step-waited `still waiting`, cell text lacks `Waited`); "the longest prebuilt step table fits..." dropped `tableFits` (ticket allows).

## Deviation: typing acceptance case
Ticket says press `End` and type. In Chromium the caret reveal after typing re-scrolls to the right even when the effect resets `scrollLeft` on every change, so the End variant passed under that break (cannot fail). I replaced it with: caret placed in the visible part of the long line, type `y`, assert `scrollLeft` unchanged from its precondition (200). That fails under always-reset (received 77).

## Doc claims
- docs/aoe4-build-order.md text view: "filling the text from the select, a load or the table starts it scrolled to the left, while typing keeps the caret's scroll" (build-text-editor.tsx `typedText` effect; acceptance cases).
- Gutter: "its started and finished times without labels ... for a `waiting` or `not-reached` step it reads `Still waiting. Blocked by: ...` instead of a time" (build-text-editor.tsx `AnnotationLine` title).
- Run cell: "The cell labels the three times Started, Finished and Waited; a `waiting` or `not-reached` step has no Waited label and reads `still waiting` in place of a time." (step-annotation.tsx `StepRunCell`, `StepTimes`).
- Narrow: "each card keeps its kind border" (`tbody > tr > td.kindBorder`; 390 acceptance case).

## Pinned outputs
None.

## Mutation checks (all undone; diff verified)
- step-annotations.ts waitedText drop `not-reached`: `waitedText > not-reached ... reads still waiting` failed ('1:15').
- step-annotation.tsx `labelled` inverted: three labelled tests failed.
- step-annotation.tsx always show `Waited `: both `reads still waiting without a Waited label` rows failed.
- build-text-editor.tsx reset never: select-scroll case failed (Expected 0, received 200). Reset always: typing case failed (Expected 200, received 77).
- CSS: nowrap removed -> badge case failed ("nowrap" vs "normal"); `td.kindBorder` rule renamed -> 390 case failed (4px vs 0px); select cap restored -> select width case failed (194 > 135); title text reverted to Waited -> gutter case failed.

## Invariants
INVARIANTS.md not touched by this ticket (display only); no simulation or lib code changed. The grep criterion holds: `Waited` in non-test source appears only in step-annotation.tsx:78 and build-text-editor.tsx:43.

## Out-of-scope findings
None.
