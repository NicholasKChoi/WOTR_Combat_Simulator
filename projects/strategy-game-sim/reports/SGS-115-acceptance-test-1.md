# SGS-115 acceptance-test 1

Branch `sgs-115-split-scroll`, tip df77e2ef694ca7ee23e2f276839176250b0a7d58 (no new commit; nothing to add). Verdict: PASS.

## Tests
The implementer's `acceptance/aoe4-split-scroll.spec.ts` already covers every criterion expressible in the harness through the page boundary, so I wrote no new tests and made no commit. I reviewed each against the ticket, and it asserts rendered values (rects, computed styles, scroll positions), not classes.

- fills viewport below stuck run bar (split and wide): top = bar bottom + margin, bottom = innerHeight, saved-build-error count 0.
- each column scrolls on its own: overflow, scrollTop > 0, window has scroll room, wheel leaves scrollY and other column unchanged.
- hover on last annotation shades an on-screen chart-step-band.
- run bar height property follows bar growth (duration-error), bar height changed.
- both columns overflow-x hidden, Build column not clipped in table view.
- below 1200 px: no columns, page scrolls.
- headings (split and tabs): same font size, chart h3 sizes equal, text shown once, textbox named "Build order", first child of panels.
- Build heading leads panel with step-table-unavailable.

## Run
Setup (`link-node-modules` and `acceptance:setup`) ran. `aoe4-split-scroll`, `aoe4-split-layout`, `aoe4-small-screen`: 28 passed, 0 failed (Chromium, real dev server). `tsc --noEmit` and `lint:dup` clean.

## Mutation checks (each undone with `git checkout`; `git diff --exit-code` clean; worktree clean)
- `workbench.module.css:19` delete `height` rule: fills-viewport fails (split and wide), `top` false, spec:51.
- `workbench.module.css:26` delete `overscroll-behavior`: each-column-scrolls fails at spec:74, expected 194 received 245 (window.scrollY).
- `workbench.module.css:24` delete `overflow-x: hidden`: clip-sideways fails, build/results computed "auto", spec:144.
- `use-run-bar-height.ts:15` observer callback skips writes while `duration-error` is shown: run-bar-height fails at spec:124, `agrees` false after the bar grew. (Two cruder breaks, dropping `observe` and writing once, both failed earlier at spec:116 on the initial agreement check: the mount-time write alone is 51 px stale, so the observer carries the first correct value. Still the right test.)
- `aoe4-build-order.tsx:305` drop `h4` from results heading: headings test fails at spec:184, "36px" vs "27px" (split) and 33.066 vs 26.022 (tabs).
- `workbench-tabs.tsx:89` build-column testid always set: below-1200 fails at spec:151 (count 1, expected 0).
- `workbench.module.css:19-25` remove height and column overflow: hover test fails at spec:85 on its precondition (column has overflow), not on the chart-on-screen assertion. A break that keeps the column scrolling yet leaves the chart off screen would need a change outside this ticket's code, so the on-screen assertion has no independent mutation.
- Not mutated: the heading-first-element assertions (first-child checks) and the layout round trips in the existing specs.

## Failures
None.

## Not expressible
- `use-run-bar-height.ts` null ref / missing `ResizeObserver` no-op: no DOM in unit env; checked by reading: line 9 returns before any write when `form`, `section` or `ResizeObserver` is missing.
