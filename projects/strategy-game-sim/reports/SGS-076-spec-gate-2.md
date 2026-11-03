# SGS-076 spec gate 2

Verdict: READY (risk `low` confirmed). Column split ratio treated as a parameter (the 2fr/3fr values in Scope 2 can change without touching any criterion or case).

## Prior gaps
1. Grid children: closed. Scope 1 fixes two always-rendered wrappers, no test ids, charts in order, sticky/align-self/max-height/overflow on the timeline column, `min-width: 0` on the charts column.
2. Sticky offset: closed. Scope 3 gives `--run-bar-height` on the page `section`, set from `runBar.current.getBoundingClientRect().height`. Pass condition is `barBottom - 1 <= timelineTop <= barBottom + 1`. The prior Notes (single evaluate, instant scroll, class location) are also folded in.

## New checks
- Scope 7 (narrow-layout edit): the test exists as described (describe "AoE4 build order at a 1280 px screen", `test.use` 1280x720, loop over `SCROLL_BOXES`). Moving only the `step-timeline-scroll` check to 1024x768 is a well-defined edit. Docs and criteria agree with it. The 390 px tests are untouched.
- ResizeObserver offset: sound. `runBar` ref is on the `BuildInput` form (always rendered), the section has no `style` prop so React will not clobber the custom property, the observer fires on first observe and on every size change (covers the wrapped-bar case), and the two existing effects stay. No unit test renders the page, so a missing `ResizeObserver` in jsdom is not a risk. The `section` ref and the `runBar.current` null guard are implementer-trivial.
- Other checks: files and functions exist; criteria observable; Invariants S1 fine; no contracts or dependencies; no diagram trigger; repo lesson on one-evaluate reads is followed; docs sentence plus paragraph edit cover the two stale statements (docs lines ~837 and ~888); no input validation; SGS-077 keeps `chart-floating-resources` last, so the scroll target holds.

## Notes (non-blocking)
- Scope 7: say how the 1024 check gets its viewport (for example `page.setViewportSize` before `pinnedResults`, or a separate test under its own `test.use`). The 1280 describe currently fixes the viewport for its whole block. The implementer can choose; either satisfies the criterion.
- Scope 7: the stacked 1024x768 `scrollWidth <= clientWidth` pass was not run in the prototype (only the 1280 failure was observed). The container at 1024 is 960 px, and the table has `min-width: 30rem`, so it should fit. SGS-078 changing the columns could change this; if it fails there, that is a SGS-078 interaction, not a gap here.
- Sticky case geometry is tight at 1280x800: timeline `max-height` (800 - bar) ends at the viewport bottom, which is where the charts column ends after `scrollIntoView(block: 'end')`. The prototype passed. If a later chart or margin change shrinks the row, the case could flake; rebase with SGS-077 should rerun the spec.
- Existing 1280 px chart-label tests (`aoe4-build-order.spec.ts` ~357, ~413; pin-compare ~267) now run on a narrower chart column. The prototype passed them on `ee7ecb9`; the Test rule covers breakage after rebasing.
