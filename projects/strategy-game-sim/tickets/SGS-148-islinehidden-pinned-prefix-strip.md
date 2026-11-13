# SGS-148: Stop isLineHidden stripping pinned: from current series keys

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 15 (`isLineHidden` in chart-rows.ts and its two callers in line-chart.tsx and chart-legend.tsx)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md); backlog bullet from SGS-113

## Context

The chart legend hides a series line and its pinned line together through one key in the hidden set. `isLineHidden` in `components/apps/aoe4-build-order/chart-rows.ts` decides which set entry a line maps to by checking whether the line key starts with `pinned:` (`PINNED_PREFIX`), and strips it. The check is on the key text, so a current series whose own key starts with `pinned:` has its prefix stripped and looks up the wrong hidden entry; the toggle then hides the wrong line, or none. No such series key exists in the data today, so the defect is latent. Confirmed still present at `origin/main` after the legend rework: `line-chart.tsx` calls `isLineHidden(hidden, s.key)` for current lines and `isLineHidden(hidden, pinnedKey(s.key))` for pinned lines, and `pinnedLegendShown` in `chart-legend.tsx` calls it with `pinnedKey(s.key)`.

## Scope

- Make `isLineHidden` decide from what the caller knows (a current line versus a pinned line, plus the series key) rather than from the key's text. Callers pass the plain series key and say which kind of line it is, so no key text is ever inspected for the prefix. The exact signature (a flag, an options value, or two functions) is the implementer's choice.
- Update the callers: the current and pinned `Line` elements in `line-chart.tsx` and `pinnedLegendShown` in `chart-legend.tsx`. Drop `PINNED_PREFIX` stripping from `isLineHidden`; `pinnedKey` and the row-building in `toChartRows` keep their behavior.
- Update `chart-rows.test.ts` `isLineHidden` tests (examples: "hides a series line and its pinned line together", "does not treat a pinned key in the hidden set as hiding anything") to the new signature, keeping their assertions.

**Out of scope:** the chart-row data key collision between a current series keyed `pinned:x` and the pinned line of series `x` in `toChartRows` (both write the same row field); fixing it would change the row key format and is not needed for the hidden lookup. Do not rename `pinnedKey`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A current series whose key starts with `pinned:` is hidden when, and only when, that exact key is in the hidden set; a test fails if the prefix is stripped before the lookup.
- [ ] A hidden set holding the plain key `a` hides both the current line and the pinned line of series `a`, and neither line of a series that is not in the set (existing behavior holds).
- [ ] A hidden set holding a `pinned:`-prefixed key for a series does not hide that series' pinned line (existing behavior holds).
- [ ] `pinnedLegendShown` still reports a pinned legend when a pinned series line is visible and not when all pinned series are hidden and there are no pinned age-ups.
- [ ] Pre-existing tests keep their assertions; only calls to `isLineHidden` change shape.
- [ ] `npx tsc --noEmit` passes.
- [ ] No INVARIANTS.md regressions

## Open questions

none
