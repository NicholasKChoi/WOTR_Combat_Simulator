# SGS-110 implementer report 1

Ticket SGS-110, branch `sgs-110-text-gutter-annotations`, tip `d7b7e0186d3736d31489f1d83575b115e2f0f150` (base e708ee5), worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-110-text-gutter-annotations`. Not pushed.

## Files
- `components/apps/aoe4-build-order/step-annotations.ts`: `annotationsByLine`.
- `components/apps/aoe4-build-order/step-annotations.test.ts`: `annotationsByLine` table (5 rows).
- `components/apps/aoe4-build-order/build-text-editor.tsx`: new props, `AnnotationLine`, annotation `ol`, caret and hover handlers, legend; local `lines` renamed `rowCount`.
- `components/apps/aoe4-build-order/workbench.module.css`: annotation column rules.
- `pages/apps/aoe4-build-order.tsx`: new props wired; the handler extracted as `onActiveStepChange` and shared with `StepTable` (same behavior).
- `docs/aoe4-build-order.md`: Text-view paragraph, table-run-cell legend sentence, charts row-hover sentence.
- `acceptance/aoe4-compact-view.spec.ts`: new, 10 tests. No helper edited.

## Tests
- Full `npm test`: 63 files, 1968 passed, 10 skipped. `tsc --noEmit` clean. `npm run lint:dup`: 0 clones. `npx next build` OK.
- `aoe4-compact-view.spec.ts`: 10 passed. Related acceptance (`aoe4-build-order*`, `aoe4-step*`, split/narrow/small-screen/results-split, compact-view): 174 passed.
- Invariants encoded: index mapping and bounds; Text/Table parity of kind and times; empty `li` for non-step lines; en dash plus flagged plus tint for waiting and not-reached (API status asserted first); row alignment and no sideways scroll at 1280; no annotations or legend before a result; legend follows parsed steps; stale dimming; syntax-error lines; hover shades via `data-gutter-active` only (no `data-active`); caret and blur; last event wins.

## Pre-existing tests edited
None.

## Doc claims
Added to `docs/aoe4-build-order.md` (Text-view paragraph): second gutter per step line with kind colour border and started/finished times (`AnnotationLine`, `StepTimes`, `KIND_CLASS`); dimmed as in the table (`annotationToneClass`, `data-stale`); hover title shows waited and blocked by (`title` on `AnnotationLine`); empty annotation for blank, comment, start and unparseable lines (`annotationsByLine`); hover and caret shade the step, last event wins, blur clears (`onPointerEnter/Leave`, `onCaret`, `onBlur`); legend above the text editor while a result is shown and `lines.steps.length > 0`, including with a syntax error. Also added "(the text view shows the same legend above its editor)" to the run-cell paragraph, and "and the text view's gutter annotations" to the charts row-hover sentence.

## Pinned outputs
None (times in the spec are read from the API response, not pinned).

## Mutation checks
All undone; tree clean after commit.
- `annotationsByLine` `byLine[line - 1]` to `byLine[line]` (`step-annotations.ts`): 5 table rows fail. Dropping the `<= lineCount` bound: "a step line past the line count" fails.
- `onPointerLeave` made a no-op: hover test and last-event test fail (bands stay).
- `data-gutter-active` to `data-active`: hover test fails on `[data-active="true"]` count 0.
- `onBlur` removed: caret test fails.
- Legend condition without `lines.steps.length > 0`: "absent before a result" test fails (start-only text).
- `annotationToneClass` removed: waiting, not-reached, stale and syntax-error tests fail on background and opacity.
- `height: 1.5em` removed: alignment test fails.
- `data-stale` removed: stale and syntax-error tests fail.
- Caret reads line `caretLine` instead of `caretLine - 1`: caret and last-event tests fail.
- Pointer enter on a run-less `li` returns `?? 1` instead of `?? null`: the changed-step test fails on its one-shot `data-gutter-active` count (a polled `toHaveCount(0)` missed it, so it is a single read after two animation frames).
- Not caught: removing `onKeyUp={onCaret}` alone. Chromium also fires `select` on caret moves, so the `select` handler covers ArrowDown; the ticket still lists `keyup`, so it stays.

## Notes
- Gutter `li` font size: `li` keeps the 1rem line height (`1.5em`) and the 0.8rem size is applied to the `li > span` (the `StepTimes` wrapper), so rows align with the line numbers.
- Column width is `17ch`, `flex: none`; textarea keeps `min-width: 0`.
- `node_modules` was absent in the worktree; ran `npm ci` (no lockfile change).

## Invariant check
A3: annotations derive from `BuildAnnotations` and live lines; no clock or randomness; hover/caret feed only `active` state. S1: imports stay in `components/apps/aoe4-build-order/` and `lib/aoe4-build-order/`. `git grep data-active` on `build-text-editor.tsx` matches nothing. `step-annotation.tsx` untouched.

## Out-of-scope findings
None.

Status: needs_review
