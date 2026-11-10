# SGS-110 acceptance-test 1

Branch sgs-110-text-gutter-annotations, tip ab0029c5cebed24fb997de6adc5b70466f5872cd (was d7b7e01). Harness ran (Playwright, Chromium).

The implementer's spec `acceptance/aoe4-compact-view.spec.ts` already covered the criteria. I added two tests to it.

## Tests added
1. "a changed step that was flagged keeps only its kind": the not-reached step's li is edited under a held response. It first asserts data-status=not-reached, data-flagged and a warning background. After the edit it asserts: data-kind present, no step-started, no step-finished, no data-status, no data-flagged, no data-long-wait, and a background equal to a calm dimmed li and different from the earlier warning background (criterion 3, null run).
2. "a key release that leaves the caret in place re-shades the caret line after a hover left": caret on step X, hover Y, leave Y (no bands), press Shift (keyup with an unchanged caret), band for X returns.

## Results
Compact-view spec, step-annotations spec and inline-issues spec: 35 passed. `npx tsc --noEmit` and `lint:dup` clean (0 clones).

## Mutation checks (all undone with `git checkout -- build-text-editor.tsx`, `git diff --exit-code` clean)
- `build-text-editor.tsx:39` `data-status={run?.status ?? "not-reached"}`: failed at `not.toHaveAttribute('data-status')` (received "not-reached").
- `build-text-editor.tsx` null-run branch renders a `step-finished` span: failed at `toHaveCount(0)` on step-finished (received 1).
- `annotationToneClass(run ?? <flagged run>, stale)`: failed at the background equality, expected rgba(0, 0, 0, 0), received rgb(255, 243, 205).
- Removed `onKeyUp={onCaret}`: the Shift test failed at `expectBandEverywhere`, since the band did not return.
- I did not re-mutate the implementer's existing tests.

## The onKeyUp question
The implementer was right that ArrowDown cannot cover onKeyUp, but not because Chromium fires `select`. I logged native events: ArrowDown, ArrowUp, Home, End and ArrowRight fire only keydown and keyup, with no native `select`. React's `onSelect` is synthesized from keyup, mouseup and selectionchange, and only fires when the selection changed. So `onKeyUp` matters only when a key release leaves the caret unchanged and a hover has since cleared the shading. A bare Shift press is such a key, and test 2 covers it. Removing `onKeyUp` now fails a test.

## Failures
None. No impl-defects or spec-gaps.

## Not expressible
Narrow screens (below 768 px) are out of scope for M7, per the ticket and your direction. The CSS rules are not tested at 390 px.
