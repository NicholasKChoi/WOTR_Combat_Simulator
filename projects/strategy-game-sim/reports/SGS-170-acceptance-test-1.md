# SGS-170 acceptance-test 1

Verdict: PASS. Commit eb35dae9b7679a0447d100262ce3f52b279fdc6f on sgs-170-step-annotation-hover-popover (tip passed was 3e4c403). Harness ran (acceptanceSetup, then `npm run acceptance`).

## Run
Specs: aoe4-step-annotations, aoe4-build-order-step-band, aoe4-editor-width, aoe4-compact-view, aoe4-step-table, aoe4-build-order-m3-flow. 94 passed, 0 failed, before my added test. My added test passed on its own run. The compact-view and step-band specs (existing caret/hover shading, last-wins) kept their assertions and pass.

## Tests (all in acceptance/aoe4-step-annotations.spec.ts, implementer's unless marked)
- hovers completed no-wait and not-reached steps, popover text, hidden before/after: pass
- start line shows no popover: pass
- (added by me) blank, comment and unparseable lines show no popover on hover or caret, with a run-line caret control: pass
- caret alone shows/moves/hides popover (off a run line, on blur): pass
- hover and caret share one active step, last wins, no restore on leave: pass
- popover inside viewport and not clipped at 360/768/1280, first and last line: pass x3
- gutter has no title attribute: pass
- gutter stays aria-hidden, lines not focusable: pass

## Mutation checks (all undone, `git diff --exit-code` on components clean)
- build-text-editor.tsx:~50 popover rendered without `active`: 8 popover tests failed (toBeHidden / toHaveCount / toBeVisible).
- build-text-editor.tsx `<li>` given `title="x"`: no-title test failed, `Received: "x"`.
- annotation-popover.tsx place(): clamp removed: all 3 viewport tests failed (popover bottom 794 > viewport 760).
- build-text-editor.tsx:85 aria-hidden removed: aria-hidden test failed, hidden null vs 'true'.
- Popover for a no-run line (`active ? ... : null`): survived. Equivalent mutant: a no-run line never becomes active (activeStep is null for it by hover or caret), so the no-run-line tests cannot reach it. The no-run criterion is pinned only at the boundary level.

## Not expressed
- None. Chart shading criterion is covered by existing tests, unchanged.

Lint (`tsc --noEmit`, `lint:dup`) clean. No failures. No processes left running.
