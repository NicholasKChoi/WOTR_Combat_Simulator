# SGS-195 spec gate 2 (re-spec 1)

Verdict: READY

Scope of this pass: the re-spec 1 additions (two test-only fixes and two `(respec 1)` criteria), read at origin/main. The rest of the ticket stands from spec-gate 1 and the earlier reviewed production code.

## Checks on the new content

- Grounded: `acceptance/aoe4-chart-layout.spec.ts` has the first/last-chart loop. Its `scrollIntoView({ block: 'start' })` is at line 166, with the `before.top > 0` and `before.top < before.max` assertions at lines 174-175. `acceptance/aoe4-split-scroll.spec.ts` "the headings share a size and lead their panels" collects `[...document.querySelectorAll('h3')]` at line 172. Both match the ticket's description.
- The chart titles are `h3` elements rendered in `chart-header.tsx` inside `chart-header-row`, which sits inside `table[data-testid=chart-table]`. Scoping the query to `chart-table` therefore keeps every chart title and drops the `Markers` heading. `compare-panel.tsx` also has an `h3` (`compare-heading`); the scoped query excludes it too, which is harmless.
- Testable: the layout criterion is stated as a property (room above and below the handle, independent of the content after the last chart). It keeps both precondition assertions. The split-scroll test still fails on two different chart title sizes. An empty scoped query would also fail, because `sizes.charts` would be length 0 and the test expects 1.
- Other tests that depend on page height or on every `h3`: I searched `acceptance/` for `h3` and for scroll use. `aoe4-chart-layout` and `aoe4-split-scroll` are the only ones that read `h3`. The other scroll users (`aoe4-split-layout`, `aoe4-auto-run`, `aoe4-step-annotations`, `aoe4-build-order-step-band`, `helpers.ts`) place themselves with `scrollIntoView` on the target, or only compare scroll values before and after an action. None obviously depends on the shortened page. The ticket already tells the implementer to search for others.
- No production change in the re-spec, so risk (standard), invariants, contracts, On merge, docs and unverified assumptions are unchanged from gate 1 and are not reopened.

## Notes (non-blocking)

- The ticket says "All paths under `components/apps/aoe4-build-order/` unless noted", but the `acceptance/*.spec.ts` files it names live at the repo root `acceptance/`. The implementer will find them, but a one-word "(repo root)" would remove the ambiguity.
- The layout fix's example "align the handle to the end of the column" cannot work for the first chart. Its handle is near the top of the column, so the scroll position clamps toward 0 and `top > 0` fails. The ticket states the real rule as a property (room above and below), and "compute a scroll position inside (0, max)" works for both charts, so this is not a gap. The implementer should use the computed position, for example centring the handle.
