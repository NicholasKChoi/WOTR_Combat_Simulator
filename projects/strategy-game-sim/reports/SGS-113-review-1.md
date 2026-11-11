# SGS-113 review 1

Verdict: APPROVE. Branch sgs-113-chart-legend, tip 41357ecb0e9b8ad74665c3d5107a6853716797cd, base main.

## Blocking findings
None.

## Acceptance criteria
1. One item per key, order, `lines` values: pass. `chart-rows.ts` `legendItems`; test "lists each key once" pins a/b/c/z with current/both/both/pinned. It fails on a second item for a shared key.
2. Colours: pass. `seriesColor(i)` for current and both, `pinnedColor(series, key, pinnedIndex)` for pinned-only. The test pins all four colours and that the pinned-only colour differs from `seriesColor(0)`.
3. `chart-pinned-key` once per chart with a pinned run, labels "current run" and "pinned run": pass. `PinnedLineKey` renders only under `{pinned && ...}`. `line-chart.test.ts` covers present and absent. The acceptance spec covers all `CHART_IDS` and the unpin case (not run, by design).
4. Swatch style and colour: pass by reading. Dashed only for `lines === 'pinned'`. The acceptance specs assert `toHaveCSS` for solid, `food` and the pinned-only item (unverified by execution).
5. Both lines hide and restore, `aria-pressed` on one item, dimmed: pass by reading the acceptance spec and `line-chart.tsx`. Both `hide` props go through `isLineHidden`.
6. Hidden-line helper: pass. `isLineHidden` tests cover `{z}` hiding `pinned:z`, and `{a}` hiding `a` and `pinned:a` but not `b` or `pinned:b`. A `pinned:a` entry in the hidden set hides nothing. These fail if the pinned line looked up `pinnedKey(key)` in the set.
7. Marker legend unchanged: pass. No marker hunks, and the existing tests pass.
8. Docs: pass. The two legend sentences are rewritten (lines 941 and 971-972). The `pinned:` and `(pinned)` grep leaves only line keys, the line `name`, and the marker `Age-up (pinned)`, all of which stay.
9. tsc, lint:dup, tests: pass. I ran `npx tsc --noEmit`, `npm run lint:dup` (0 clones) and `vitest run components/apps/aoe4-build-order` (19 files, 537 tests). The implementer reports full `npm test` green, and the edited tests are listed in its report.
10. INVARIANTS: no A1-A3 path touched.

## Invariants
None touched.

## Linter
`commands.lint` passes with no issues.

## Bot
`reviewBot.cli` is empty and no rules file is set, so there is nothing to reconcile.

## Convention check
Compared against the siblings `chart-legend.tsx` (marker legend) and `chart-rows.ts`, and the existing `chart-rows.test.ts` and `line-chart.test.ts`. Bootstrap utilities only on the new element, no module CSS mixed in. Tests use `it`/`describe` with the file's existing style. The new tests are not repetitive blocks.

## Non-blocking notes
- `isLineHidden` strips a `pinned:` prefix from a line key. A current series whose own key starts with `pinned:` would be mishandled. No such key exists, and the implementer noted it.
- The pinned-key swatch styles (solid and dashed) are asserted only in acceptance. `line-chart.test.ts` checks labels and count, not the styles. Acceptable because the spec asserts computed style.
- `docs/aoe4-build-order.md:971` still says a pinned line is drawn "in the same color as the current series with that key". This is untouched and was already inexact for pinned-only series. Out of scope.
- The UI inspection did not run. The swatch hunk is a small inline-style change, and the acceptance spec checks it by computed style. Not browsed.

## Coverage
Reviewed all 7 changed files in full: the 5 production and test files, the acceptance spec, and the docs. Not run: acceptance, browser and UI inspection.
