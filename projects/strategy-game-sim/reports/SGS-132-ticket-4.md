# SGS-132 ticket report 4 (re-spec 3)

- File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-132-save-panel-live-status.md`
- Lint: `ticket-lint.py` clean.

## Summary

SGS-132 "Put the save controls on one row with a live Saved status" (aoe4-build-order, M9.3, ~130 business-logic lines, depends on SGS-128, which is integrated). Re-spec 3 handles the implementer's needs_spec finding. Context now explains the cause. `save-panel` takes its own run-bar row, so the bar is taller. The page's scroll range is the bar's page top minus up to 1px, because `useRunBarHeight` writes `Math.ceil(height + margin)`. As a result, `aoe4-small-screen.spec.ts` "stays sticky at the top" (top exactly 0) and `aoe4-split-scroll.spec.ts` "each column scrolls on its own" (which relies on the fill leaving the page short of its maximum scroll) only pass by sub-pixel luck.

Scope now makes an exception to the "no existing test edited" rule for exactly those two tests:
- The sticky test allows a top within less than 1px of 0. Its other checks stay.
- The split-scroll test sets the page scroll itself, for example with `scrollInstantly`, and asserts there is room to scroll further before each wheel. Its post-wheel assertions stay.

Changing `useRunBarHeight` and adding pixel-height or `min-height` tuning are both forbidden. New criteria (respec 3) cover:
- the edits to both specs, each with a mutation run that must fail: `.runBar` set to static, and `overscroll-behavior: contain` removed from `.column`;
- `use-run-bar-height.ts` staying unchanged;
- `auto-run-status` staying the bar's last child.

## Why this resolution and not SGS-133

SGS-133 (run-bar cap and scroll anchoring) extends `aoe4-split-scroll.spec.ts` with new cases. It does not touch these two tests, and from 768px up it caps the bar only at 40dvh, so at 1280x800 and 1280x720 with no save the bar stays uncapped and the rounding remains. SGS-133 also depends on SGS-132, so SGS-132 cannot merge with failing tests while it waits for SGS-133. The edits do not duplicate SGS-133's work.

## Additional fix found while re-exploring

The ticket said "`auto-run-status` stays in the run bar after the save panel; its position within the wrapped bar is the implementer's". The branch read the second half as permission and moved `auto-run-status` before `SaveBuild` in `build-input.tsx`. SGS-133's Scope says SGS-132 leaves it after the save panel, and its criterion that scrolls the capped bar to its end and expects `auto-run-status` inside the bar depends on that order. The ticket now requires it to stay the bar's last child in DOM order. The branch's move gets reverted.

## Branch work that stands

Branch `sgs-132-save-panel-live-status` at `edca704`: save panel and status, Escape handler, CSS, helper move, Vitest cases, the new `aoe4-save-status.spec.ts`, and the docs. Still to do: revert the `auto-run-status` move, then make the two spec edits. Re-check the doc's Page paragraph if it describes the order.

## Diagrams

None. Single-component change, outside the core loop.

## Open questions

None.

## Overlap / notes for the manager

- SGS-133 criterion (a) expects "the `run-bar` top at 0" after scrolling to the end with `mouse.wheel`, which hits the same `Math.ceil` sub-pixel slack. It should probably use the same sub-1px tolerance. I did not edit SGS-133.
- SGS-141 and any later change to the bar's height no longer trip these two tests once SGS-132 lands.
