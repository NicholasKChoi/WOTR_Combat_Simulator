# SGS-114 acceptance-test 1

Verdict: PASS. Tip ccc5ef15c3b6a8bc5bc25a0723fa902484cb47c1 (no commit made; see below).

## Tests

The implementer already committed `acceptance/aoe4-chart-layout.spec.ts` (10 tests) covering every Spec criterion in the ticket. I reviewed it against the criteria, found no uncovered observable criterion, so I wrote and committed nothing. The unit-level criteria (chart-layout.test.ts, line-chart.test.ts) are the implementer's and out of scope.

Harness ran: `acceptanceSetup` (link-node-modules, playwright install chromium), then Playwright on Chromium. The 10 chart-layout tests pass (10/10). The touched-component specs also pass unedited, 85/85 in total: pin-compare, chart-readability, gather-rates-per-villager, gathered-resources, split-layout, results-split, step-band, chart-layout. `npx tsc --noEmit` and `npm run lint:dup` pass (0 clones).

1. default order, all expanded, page load writes nothing to storage
2. collapse hides body, keeps title and three buttons, `aria-expanded` and `data-collapsed` flip, other charts stay expanded; expand restores body, Per villager checked with the y-label, hidden legend item still hidden
3. move up and down swap with the neighbour; end buttons disabled
4. Tab order collapse, up, down; Enter activates; focus stays on the pressed button, or moves to the other move button at an end
5. layout survives two reloads and the stored string is unchanged after each
6-8. stored unknown-ids-only, non-JSON, and a layout missing one id: normalised, no alert, no page error
9. blocked `localStorage`: page loads, collapse and move work, no alert or page error
10. at SPLIT_VIEWPORT after reorder: step band and pinned lines on expanded charts, no step band on the collapsed chart

## Mutation checks (all undone with `git checkout -- components`; `git diff --exit-code` clean after each)

- Test 4: `results.tsx:40` removed `target?.focus()`. Failed at spec:119 (focus on BODY instead of `chart-move-up` of the chart moved to last place).
- Test 1: `use-chart-layout.ts:9` hydration effect also writes. Failed at spec:55 (`stored` not null).
- Test 5: `use-chart-layout.ts:9` hydration effect writes the default. Failed at spec:134 (stored string rewritten).
- Test 3: `chart-layout.ts` `moveChart` down offset `from + 2`. Failed at spec:95 (`expectLayout` order wrong).
- Test 8: `chart-layout.ts:31` dropped `...missing`. Failed at `expectLayout` (the missing chart absent).
- Tests 7 and 9: `chart-layout.ts:38` rethrow SyntaxError, and `browser-storage.ts` unguarded `window.localStorage`. Both failed inside `openPage` (`auto-run-status` never appears because the page crashes at hydration). This is a page-load failure rather than the later alert/error assertion. It is the behavior those tests pin ("page loads"), but the failing line is in the helper.
- Test 2: `line-chart.tsx:159-160` removed `hidden={collapsed}` and the collapsed null-guard. Failed at spec:69 (`chart-body` expected hidden, received visible).
- Test 2: `results.tsx` `key={id + collapsed}` remounting the chart. Failed at spec:83 (hidden legend item `aria-pressed` false after expand).
- Test 10: `results.tsx` dropped `highlight` and `pinned` unless the order is default. Failed at spec:190 (`chart-step-band` not found in `chart-units-produced`).
- Test 10 collapsed-chart assertion, `spec:193` (`chart-step-band` count 0 on the collapsed chart): I did NOT get it to fail on its own. Rendering the plot inside a collapsed (still `hidden`) body leaves the test passing, because a hidden body gives the chart zero width and recharts draws no band. Removing `hidden` as well fails earlier at `toBeHidden`. The assertion matches the ticket ("no visible step band") but is not independently mutation-proven. Not a defect: the only breaks that reach it are caught by other assertions.

Chart-controls tests 4 (Tab order) and the `chart-collapse` / `chart-move-*` DOM order were not mutated separately; the test-4 mutation above covers the focus behavior only.

## Failures

None.

## Criteria not expressible in this harness

None in the acceptance spec. The server-render criteria (`aria-controls` equals the body `id`, `hidden` with no children, no `d-flex` or `flex-wrap`) belong to `line-chart.test.ts`.

## Not done

No commit: no test files were added or changed.
