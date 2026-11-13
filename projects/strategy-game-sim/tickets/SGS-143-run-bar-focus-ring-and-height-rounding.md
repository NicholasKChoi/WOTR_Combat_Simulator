# SGS-143: Fix run bar focus ring clipping and height rounding

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: the browser scrolls a focused control into the capped bar's own scrollport and honors `scroll-padding-block` on that scroller; a fractional `getBoundingClientRect().height` and the sticky bar's reachable scroll position behave per spec (real Chromium in the acceptance suite, not faked)
- **LOC estimate**: 15 (`workbench.module.css` rule, `use-run-bar-height.ts` rounding)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12): run bar focus-ring clip (SGS-133 review-1) and `useRunBarHeight` ceil (SGS-132 implementer)

## Context

At 768 px and wider the run bar (`.runBar` in `components/apps/aoe4-build-order/workbench.module.css`) is sticky and capped at 40dvh with `overflow-y: auto`. Tabbing to a control that scrolls into view inside the capped bar leaves it flush with the scrollport edge, so the top (or bottom) of its focus ring is clipped; no scroll padding is set. Separately, `useRunBarHeight` in `use-run-bar-height.ts` writes `--aoe4-run-bar-height` (the bar's rect height plus its bottom margin) with `Math.ceil`; the split workbench height is `calc(100dvh - var(--aoe4-run-bar-height))`, so when the bar height is fractional the document comes out up to 1px shorter than needed and the page cannot scroll quite far enough for the sticky bar to reach the viewport top. No existing test caught it: the split-scroll acceptance checks in `acceptance/aoe4-split-scroll.spec.ts` allow a 1px tolerance.

### Cause

- Focus ring: `.runBar` capped-bar rule has no `scroll-padding-block`.
- Height: rounding up in `useRunBarHeight`'s `write` makes the variable larger than the real height; the shortfall is the fractional remainder.

## Scope

- `workbench.module.css`: give the capped `.runBar` (the 768 px and wider rule) a small `scroll-padding-block` (about 0.25rem) so a focused control's ring is fully visible when scrolled into the bar.
- `use-run-bar-height.ts`: stop rounding up so the variable never exceeds the real bar height plus margin; the implementer picks the rounding (floor, or no rounding) and keeps the split workbench filling the viewport below the bar without the page gaining a visible extra scroll.
- Docs: the run bar paragraph and the narrow-layout statement in `docs/aoe4-build-order.md` stay true; update them only if the implementation changes a stated behavior.
- Tests: add to the existing acceptance specs (`acceptance/aoe4-split-scroll.spec.ts` is the example) and tighten any 1px tolerance this ticket makes unnecessary only if it still passes; other tests keep their assertions.

**Out of scope:** whether `.pageSection { overflow-anchor: none }` should stay at narrow and tabs widths (see Open questions; unchanged here); run bar cap, layout, or content changes; the below-768 px static bar.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At 768 px and wider, with a run bar tall enough to scroll inside its cap, focusing a control that scrolls into the bar leaves its full focus ring inside the bar's visible area (a test measures the focused control's ring extent against the bar's scrollport, and fails without the scroll padding).
- [ ] With a fractional run bar height, scrolling the page to its end brings the sticky bar to the viewport top and the split workbench bottom to the viewport bottom, with no sub-pixel shortfall; a test that forces a fractional bar height fails at the base.
- [ ] The run bar still never exceeds 40% of the viewport height at 768 px and wider, and the below-768 px bar stays static and uncapped.
- [ ] No INVARIANTS.md regressions

## Open questions

- designer: `overflow-anchor: none` on `.pageSection` also applies at the narrow and tabs widths, where the run bar is static or the page scrolls normally; should scroll anchoring be kept there?
