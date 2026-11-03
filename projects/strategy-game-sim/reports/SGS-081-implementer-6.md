# SGS-081 implementer 6 (Rework 7)

Branch sgs-081-aoe4-retune-prebuilt-farms, tip eb6406c43f6482f75a725f763b1076d960c87baf. Status: needs_review.

Changed: acceptance/aoe4-build-order.spec.ts `expectMarkerLabelsApart` only. It now reads every label rect, the plot rect,
the SVG rect and `data-label-rows` in one `root.evaluate` (getBoundingClientRect), inside `expect(async () => {...}).toPass()`
so it retries until the scroll settles. All assertions and tolerances are unchanged (plot offset < 1, above plot +0.5,
inside plot, no overlap); the one-match-per-label check moved into the snapshot.

Results (Node as installed):
- `-g "marker labels"` alone, 10 consecutive runs: 3 passed each, 10/10.
- `npx playwright test acceptance/aoe4-`: 510 passed.
- npm test: 1350 passed, 10 skipped. tsc clean. lint:dup 0 clones. next build succeeds.
- Mutation: not re-run; test code only, no production change. The overlap/inside/above assertions are textually unchanged.

No pre-existing tests' assertions changed. No doc claims added. No out-of-scope findings.
