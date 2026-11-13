# SGS-150 implementer 1

Status: needs_review
Ticket: SGS-150. Branch: sgs-150-deflake-small-screen-step-band. Tip: 9450b3493428bdb3afc255d6013a16a26e995353.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-150-deflake-small-screen-step-band (base origin/main 41b3ed3)

## Files touched
- acceptance/aoe4-small-screen.spec.ts: run bar 360x760 test. `before` is taken inside `expect.poll` until it is greater than 0. The post-results scroll, bar position and title overlap are read in one polled evaluate, using an instant scroll.
- acceptance/aoe4-build-order-step-band.spec.ts: start-row test. Page scrolled once up front (instant); each step polls one evaluate returning `{bands, active}`.
No production, helper, config or LESSONS changes.

## Reproduction (base, 10 workers, --repeat-each=30)
- Step-band start-row test: reproduced, 10 of 30 failed (also 16/30 and 2/30 in later runs). Two shapes: `toHaveCount(0)` on `[data-active="true"]` received 1 right after `start.hover()`, and `toHaveCount(0)` on `chart-step-band` received 4 (after the start-row hover step).
- Confirmed cause (event log from an instrumented run, since reverted): the ticket's cause was close but the mechanism differs. `start.hover()` makes Playwright scroll the page, and Bootstrap's `scroll-behavior: smooth` animates it (sy 0 to 244 over about 400 ms). Rows slide under the stationary pointer, so `pointerleave step-start-row` then `pointerenter step-row` fire about 400 ms after hover. This is a late pointer event from scroll, not a late hover frame. The existing `toHaveCount(0)` passes on its first sample before the event lands, then the state flips. The pointer state ends up legitimately on a step row, so a settle-wait alone would not fix it; the scroll itself had to be removed.
- Small-screen test: did not reproduce (30 of 30 passed at base, 10 workers). Hardening applied for the likely cause. One more cause found by reading: the post-results `window.scrollTo(0, 400)` was a smooth scroll (the same Bootstrap rule), so the old `barTop` read could be mid-animation. It is now an instant scroll, with all reads in one evaluate.
- Other tests in both files: no same-pattern failure in `--repeat-each=8` over both whole files (168 passed, 10 workers); none changed. Candidates inspected but not changed because nothing failed: "moving the pointer off the row removes the band" (hover then `mouse.move(0,0)`), "stays sticky at the top" (already polled in one evaluate).

## Fix result (after)
- Both target tests: --repeat-each=60, --workers=10, 120 passed, 0 failed (1.0 min).
- Both whole files: --repeat-each=8, 10 workers, 168 passed.
- Unit (`npm test`): 81 files passed, 1 skipped; 2504 tests passed, 15 skipped.
- `npx tsc --noEmit` and `npm run lint:dup` pass. `npx next build` succeeds. Codegen is unset.
- No process left running (Playwright webServer self-managed).

## Assertions
Pre-existing assertions are kept. Additions: `active: 1` is asserted whenever the band is drawn; the cleared state is asserted after focusing `duration-seconds` (spec-gate note). The small-screen `barTop` (not-a-number check plus `< 0`) is now `barAbove: bar.top < 0` in the same polled read, together with `scrolled` and `overlaps: 0`. The step-band test gained a precondition: the start row and target row centres are inside the 800px viewport after the up-front scroll. Pre-existing tests edited: only the two named ones, both assertions retained.

## Mutation checks (all reverted, `git status` clean of production files)
- Small-screen: `workbench.module.css:19` `position: static` to `sticky` at below 768px fails at the `static` position check (`Expected "static", Received "sticky"`). To reach the new polled assertions, I also removed the static check temporarily; then the poll fails on `barAbove: false` (expected true). Both undone.
- Step-band: `step-table.tsx:243` removing the start row's `onFocus` clear fails with `active 1 / bands 4` instead of `0 / 0` in `expectState(cleared)`; removing `onPointerEnter` clear fails the same way. Both undone.

## Doc claims
One code comment added in the step-band test: "A hover or focus that scrolls the page animates it (smooth scrolling), and rows sliding under the still pointer fire late pointerenter events that change the state after an assertion passed. The page is scrolled up front, instantly, to where both rows' centres are in view, so no step scrolls." True per the event log above and the `visible` precondition in `aoe4-build-order-step-band.spec.ts` (start-row test).

## PR body notes
Cause for step-band: smooth page scroll after hover moves rows under the pointer (reproduced 10/30 at base). Small-screen: not reproduced; hardened (instant scroll, polled single read).

## Lessons candidate (not edited)
Existing layout-reads lesson does not cover this: in `acceptance/**`, Playwright `hover()` and `focus()` scroll the page smoothly, and scroll-driven pointerenter events then change hover state after an assertion passes. Suggested rule: scroll the target into view instantly before hover/focus sequences. Report only; owner/manager decides.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Invariant check
No INVARIANTS regressions; no production files changed (`git diff --stat origin/main` lists only the two specs).
