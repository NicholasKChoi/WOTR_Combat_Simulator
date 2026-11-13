# SGS-143 implementer 1

Status: needs_review
Branch: sgs-143-run-bar-focus-ring-height (base origin/main 41b3ed3), tip d698acf1003e5dd486526a4b72319ac728ed9ae7
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-143-run-bar-focus-ring-height

## Files
- components/apps/aoe4-build-order/workbench.module.css: `scroll-padding-block: 0.25rem` on the 768px+ `.runBar` rule.
- components/apps/aoe4-build-order/use-run-bar-height.ts: dropped `Math.ceil`; the property is the exact rect height plus margin.
- acceptance/aoe4-split-scroll.spec.ts: two new tests (focus ring, fractional height). No existing assertion edited; 1px tolerances left as they are.

## Tests
Ran `acceptance/aoe4-split-scroll.spec.ts` only (the spec I edited): 18 passed, then 54/54 with `--repeat-each=3`. Unit suite `npm test`: 2504 passed, 15 skipped. I did not run the full acceptance suite.
- "a control scrolled in from the top of the capped bar shows its whole focus ring": preconditions asserted first (bar `scrollHeight > clientHeight`, select starts above the bar top at max scroll). Ring spread is read from the computed `box-shadow` (asserted > 0), then the ring's top edge is checked against the scrollport top (`bar.clientTop` included). No hard-coded px.
- "with a fractional bar height ...": appends a filler so the bar height plus margin ends in .1 (a ceil adds .9); asserts the height is not an integer and the property tracks the bar; then at page end asserts bar top ~0 (<0.05) and split bottom within 0.5px of the viewport bottom.

## Bug gate (regression tests fail at base 41b3ed3 code)
- Focus ring: fails with `ringTopGap: false` (expected true).
- Fractional: with `Math.ceil` fails with `barAtTop: false` (expected true).
Both ran against the unchanged production code with the new tests in place, then the fix made them pass.

## Mutation checks
The base-failure runs above are the mutation checks: reverting the CSS line (focus test) and keeping `Math.ceil` (fractional test) made each fail on the named assertion; both fixes restored. Not committed.

## Pinned behavior worth knowing
Chromium snaps the page's scroll offset to whole pixels. With no rounding, the split bottom still sat 0.2px above the viewport bottom in a probe (document height 1044.8 vs scroll 245), and with floor 0.42px. That is the engine's integer scrolling, not a shortfall from the variable, so the test's bottom tolerance is 0.5px and its discriminating assertion is the sticky bar reaching the top (ceil leaves it off the top; no rounding does not). I chose no rounding over floor because floor leaves the property below the real height and the page then ends at the same snapped offset.

## Doc claims
None added; no docs changed (docs/aoe4-build-order.md statements stay true).

## Checks
- codegen: none set. `npx next build`: succeeded. `npx tsc --noEmit` and `npm run lint:dup` (0 clones): clean.
- git diff --stat reviewed; only the three files above changed.

## Invariants
A1-A3 not touched (CSS and layout only). Run bar still capped at 40dvh at 768px+; below 768px untouched (existing test passes).

## Unverified assumptions added
None beyond the ticket's list (tests use real Chromium).

## Out-of-scope findings
- Worktree creation: the first `git worktree add` from a worktree cwd made the branch but not the worktree; added it afterwards. No impact.
- The 1px tolerances in the existing split-scroll checks were not tightened: the sub-pixel residual from integer scrolling (up to about 0.5px) means tightening below 1px would be flaky.
