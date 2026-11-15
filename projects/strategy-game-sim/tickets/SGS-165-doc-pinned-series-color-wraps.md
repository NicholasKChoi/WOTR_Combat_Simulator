# SGS-165: Document that the pinned-series palette index wraps

- **Type**: Docs
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 3 (one paragraph in docs/aoe4-build-order.md; no code)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullet "(docs) docs/aoe4-build-order.md pinned-series color" (non-blocking note from SGS-152 review 2)

## Context

The chart section of `docs/aoe4-build-order.md` (paragraph beginning "With a pinned run, each chart also draws the pinned run's series dashed") says a pinned-only series takes the palette color at index (number of current series) + (its index among the pinned series). The code, `pinnedColor` in `components/apps/aoe4-build-order/chart-rows.ts`, resolves that index through `seriesColor`, which wraps by modulo the length of `PALETTE`. The doc never says the index wraps, so a reader would take it as an out-of-range index when current plus pinned-only series exceed the palette size.

## Scope

- `docs/aoe4-build-order.md`, the pinned-run chart paragraph named above: add the missing claim that the palette index wraps around when it reaches past the end of the palette, so colors then repeat. Optionally also say the same wrap applies to current series (`seriesColor`). Do not quote the palette length (it is tuned in code).
- Grep the doc for other statements of the palette or color-index rule (for example the legend or series color text) and make them consistent.

**Out of scope:** any code change; changing the palette; other doc sections.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/aoe4-build-order.md` states that the palette index for a pinned-only series wraps (modulo the palette size) once it passes the last palette color, matching `pinnedColor` and `seriesColor` in `components/apps/aoe4-build-order/chart-rows.ts`.
- [ ] The doc quotes no palette length or color count.
- [ ] No file other than `docs/aoe4-build-order.md` changes.
- [ ] No INVARIANTS.md regressions

## Open questions

none
