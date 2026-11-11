# SGS-115 spec gate, round 1

Verdict: NEEDS_SPEC

Read at origin/main (fetched). Files spot-checked: workbench-tabs.tsx, workbench.module.css, use-split-layout.ts,
build-input.tsx, build-text-editor.tsx, pages/apps/aoe4-build-order.tsx, acceptance/helpers.ts
(SPLIT_VIEWPORT 1280x800, WIDE_VIEWPORT 1800x900 exist), docs/aoe4-build-order.md "Page" (the grep phrases
"while the page scrolls", "two equal columns", "never scrolls vertically" all exist, lines 844, 847, 851),
design/M8.md C11 and the layout table. Scope names are grounded; `use-run-bar-height.ts` is declared new.

## Gaps

1. **Scope (workbench.module.css) and criterion 1 - the run bar's `mb-3` margin is unaccounted for - an
   implementer would guess, and criterion 1 cannot hold as written.**
   `BuildInput`'s form has classes `py-2 mb-3` (build-input.tsx line 46). The hook writes the border-box height only (design C11
   says the margin "is not included"). With `.workbenchSplit { height: calc(100dvh - var(--aoe4-run-bar-height)) }`,
   the workbench's top is the bar's bottom plus 16 px of margin, not equal to it within 1 px, and its bottom is
   `100dvh + 16px` when the bar is stuck, which breaks "bottom is at most `innerHeight`". The `saved-build-error`
   alert (`loadError`, rendered between the bar and `WorkbenchTabs`) adds further height in the same way. The ticket
   and design leave the choice open: (a) drop `mb-3` from the run bar and put the gap on the workbench (`margin-top`
   or grid padding), (b) have the hook include the margin, or (c) change the criterion to "top equals bar bottom
   plus the bar's margin-bottom".
   Proposed fix: pick one in Scope. Suggested: keep the measured height as the border box, and in
   `.workbenchSplit` use `height: calc(100dvh - var(--aoe4-run-bar-height, 0px) - <gap>)` or move the 1rem to
   padding inside the sticky form. State what happens when `saved-build-error` is shown (either the alert is
   excluded from criterion 1, or the criterion is asserted with it absent). Rewrite criterion 1 to match the chosen
   rule so the test cannot fail for the wrong reason.

## Notes (non-blocking)

- `overflow-y: auto` on a column makes its computed `overflow-x` `auto` as well. The doc says the Build panel "never
  scrolls sideways", and acceptance/aoe4-step-annotations.spec.ts line 243 asserts `panel-build` has `overflow-x:
  visible`. That assertion is on the inner panel and stays valid, but a too-wide child would now show a column
  scrollbar. Consider `overflow-x: hidden` on the column or one sentence in Scope.
- Criterion 9 (hook null-ref and missing-ResizeObserver behavior "checked by reading") is reviewer-observable but
  not testable; acceptable, but a tiny unit test with a stubbed `ref` and no `window.ResizeObserver` would be cheap.
- Criterion 4's "narrower viewport that wraps it" cannot apply in the split layout (1200 px minimum); the
  `duration-error` route is the real one.
- Checked and fine: Risk standard (no critical path or strongModelTrigger), `On merge: none`, Invariants none
  (A1 to A3 not adjacent), no diagram trigger, no Open questions, no LESSONS conflict (rects read in one
  `page.evaluate`), docs in Scope, no schema or validation input, size about 80 LOC, no dependencies. The
  `RefObject<HTMLElement | null>` signature differs from design C11's one-line signature, but design explains it.
