# SGS-203 review 6

Verdict: **REQUEST CHANGES**
Branch: sgs-203-marker-control-stays-in-view, tip 6c71747fc4e5aab47d80e7ef9442ed308f15f0a7, diff `origin/main...HEAD` (1 commit, 8 files).

## Blocking findings

1. `acceptance/aoe4-marker-control-sticky.spec.ts:142` - test - The one-line case `focusClearance(LAST)` cannot fail. Its precondition does not hold. At 1280x800 the drag-handle tops, measured from the column's content top, are 272 / 746 / 1221 / 1695 px, and the column's max scrollTop is 1554. For LAST, `handleTop + 300` = 1995, which clamps to 1554. The last handle then already sits 141 px below the column top, 67 px below the 74 px control, so `scrollIntoView({block:'nearest'})` does nothing. Removing the scroll padding cannot move it. The test name claims "lands at or below the control, also after the control wraps taller", so it claims the one-line case, and that case is dead. Only the wrapped call at line 147, on the second-to-last chart, exercises the padding. That call is what the implementer's "scroll-padding-top -> 0px: test 3 fails" mutation hit. Why it matters: AC4's one-line clearance has no test that can fail. - Direction:
   - Run the one-line case on a chart whose handle can be scrolled above the column top: `CHART_IDS[1]` or `CHART_IDS[CHART_IDS.length - 2]` (relTop 746 or 1221, so a target of 1046 or 1521 is at most 1554).
   - In `focusClearance`, before `scrollIntoView`, assert the precondition in one evaluate: the handle's rect top is above the column's top, so the action can move it. Also assert that the scroll target is at most `max`.
   - The production break it must fail on is `components/apps/aoe4-build-order/workbench.module.css:45`, with `scroll-padding-top: var(--aoe4-marker-control-height, 0px)` changed to `0px`. With the padding, `handleTop - controlBottom` is about 0 (the handle aligns to the padding edge). Without it, the value is about -74 (the handle at the column top, under the 74 px control).

2. `acceptance/aoe4-marker-control-sticky.spec.ts:89-91, 136-138, 156-158` - convention (LESSONS.md layout values; ticket AC5) - Three polls compare layout values read in separate `evaluate` calls:
   - line 89-91: `readStuck` and then the first chart header's top;
   - line 136-138: `readStuck` and then the drag handle's top;
   - line 156-158: `readStuck` and then the chart body's top.

   The LESSONS.md entry for `acceptance/**` says to read every value in one evaluate. AC5 also says the `elementFromPoint` hit is to be read "in the same `evaluate` as the rects", and the plot rect at line 157 is not. Why it matters: these are the comparisons whose separate reads caused the reworks and flakes the lesson lists. - Direction: give `readStuck` an optional `target` selector (for example `'[data-testid="chart-x"] [data-testid="chart-header-row"]'`) and return `targetTop` from the same evaluate as the column and control rects and the `elementFromPoint` hit. Then use `s.targetTop` at all three sites.

## Spec gaps

None.

## Implementer deviations (judged as asked)

- (1) Top at the column edge checked on scrolled positions only. Not a defect. AC1 is about the scrolled state. At scrollTop 0 the inspection shows the control in its flow position below messages and key results (control top 627, column top 435 at 1200x800). AC3's "not covering the first chart at scrollTop 0" is checked through the header top, which is at or below the control bottom (701.44 = 701.44 measured).
- (2) The "series and pinned legends scroll away" acceptance test was replaced by a unit test. Not a defect. `SeriesLegend` and `PinnedLegend` sit at the end of the chart cell's wrapper div (`line-chart.tsx:316-322`). A sticky `top: 0` there has no room to move inside that containing block, so making `.legend` sticky cannot change what the user sees. An acceptance test of that criterion could not fail. The unit test guards the class split. See the note below about the pinned legend.
- (3) `scrollIntoView({block:'nearest'})` plus `focus()` in place of Tab. Not a defect against intent. Chromium's focus scroll centres an off-screen element, so a Tab-driven test could not fail when the padding is removed, and AC4 requires a test that does. The ticket's criterion also names "or is scrolled into view". The defect in this test is the dead one-line row (finding 1), not the method.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Control pinned at the column's top when scrolled to the last chart | pass | Spec test 1 (one `readStuck` evaluate under poll, lines 79-84). The implementer records that it fails at the base on "control pinned at scroll 518". Inspection: control top equals column top (435.19) at mid and bottom, at 1200x800, 1280x720, 1280x800 and 1800x900. |
| 2 | Hover and toggle work against the last chart | pass | Spec test 2 lines 112-121: labels on the last chart equal that kind's labels; line count drops and is restored; `aria-pressed` false/true. |
| 3 | In view at every scroll position; does not cover the first chart at scrollTop 0 | pass | Spec test 1 at max/3, 2max/3 and bottom, plus the header check at the top. Inspection at the top: header top 701.44, control bottom 701.44. |
| 4 | Focus or scroll-into-view clearance; fails without the padding | pass (behaviour); test defect, finding 1 | The wrapped call fails without the padding. The one-line call cannot fail. |
| 5 | Drawn over the chart content (`elementFromPoint`); still dims | pass (behaviour); read-shape defect, finding 2 | Inspection: `onTop` true and background `rgb(255, 255, 255)` at every scrolled position. Recharts 3.10.1 Tooltip sets no CSS z-index, so z-index 5 is above it and below the popover's 1080. The control stays inside `results-last-good` (`results.tsx:99-108`), so it still dims. |
| 6 | Only the marker control sticks | pass | `.legend` is unchanged (`results.module.css:28-31`); only `MarkerControl` uses `.markerControl` (`chart-legend.tsx:78`). Unit test in `chart-legend.test.ts:42-48`. |
| 7 | Stuck area follows the control's height | pass | `useMarkerControlHeight` uses a ResizeObserver. Spec test 3's wrapped case: the implementer's mutations with a fixed 48 px height and a no-op observer both fail it. |
| 8 | No markers: no control, zero `scroll-padding-top`; Build column never padded; existing order assertions unchanged | pass | Inspection after `start -> sheep`: 0 controls, padding `0px`; the Build column is `auto` at every width. Spec test 5. The diff to `chart-legend.test.ts` only adds lines; no pre-existing test was edited. |
| 9 | Docs | pass | `docs/aoe4-build-order-ui.md:137` states the sticky behaviour and that it works against every chart. Each clause checked against the code: sticky and over the charts in `.markerControl`; legends and zoom bar not sticky; clearance in `.resultsColumn`; no markers gives null and the property is removed. |
| 10 | No INVARIANTS.md regressions | pass | No simulation, API or data path is touched. A1-A3 do not apply in substance (CSS and hook only, no cost or time literal, no random). S1 holds: no cross-app import. |

Bug regression record: present. Base 0866156, test 1 fails on the named-bug assertion "control pinned at scroll 518".

## Invariants and checklist touched

- spec-checklist Contracts, Scope, Naming, A1-A3: hold. `--aoe4-marker-control-height` follows the naming pattern of `--aoe4-run-bar-height`. Nothing out of scope (zoom bar, run bar and Build column are untouched). No invented constant: z-index 5 sits between the chart content and the run bar's 10, and the ticket bounds it only by 1080 and the top layer.
- REPO checklist, AoE4:
  - Sticky elements: run bar 172 px plus control 74 px leaves 69% of 1200x800 and 66% of 1280x720 (at least 60% required).
  - No horizontal overflow at 1200, 1280 or 1800.
  - No Bootstrap spacing utility mixed with module CSS on the control root: `mb-3` is gone, and `small` is a type utility.
  - `cn` is used for the class names in `workbench-columns.tsx`.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones. `chart-legend.test.ts`: 15 pass.

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md; skipped.

## UI inspection

The task checkout was served with `npx next dev` on port 3871, then stopped (port free).

- `inspect.cjs` loaded `/apps/aoe4-build-order` with "ENG Knight/Longbow (King's Palace)" at 1200x800, 1280x720, 1280x800 and 1800x900. It scrolled the results column to the top, the middle and the bottom.
- Overflow clipping inside the control: none.
- Words broken mid-word in the control: none.
- Overlapping marker items: none.
- Document horizontal overflow: none at any width.
- Control on top (`elementFromPoint`) with an opaque background: yes, at every scrolled position.
- The no-marker run (1280x800) showed no control and `scroll-padding-top: 0px`.
- Screenshots (`shot-*.png`) went in the scratch dir. I read `shot-1200x800-mid.png`: the Markers control is pinned over the plot with no bleed-through.
- The inspection also measured the drag-handle positions behind finding 1.

## Non-blocking notes

- `components/apps/aoe4-build-order/use-marker-control-height.ts:5-19` copies `use-run-bar-height.ts:5-21`. The differences are the property name, the `present` flag and the margin term; the control's margin-bottom is 0, so the margin term would be harmless. A maintainer will likely ask for one shared hook, `(ref, property, present = true)`, used by both. The ticket invites mirroring `useRunBarHeight`, and common.md says not to rename unasked, so I am not blocking on it.
- `chart-legend.test.ts:42-48` checks `SeriesLegend` but not `PinnedLegend`, although AC6 names both. A one-line `PinnedLegend` render would complete the split check.
- Spec test 2, line 113: there is no check that the last chart lacks those labels before the hover. Asserting `labels()` differs from `expected` before `hover()` would make the hover the proven cause.
- The doc sentence "Tabbing to ... a chart control keeps it clear of the stuck control" relies on the browser honouring `scroll-padding` for focus scrolling (the spec standard, and Chromium does). No test tabs, for the reason given under deviation (3).

## Coverage

Reviewed every changed file:

- `acceptance/aoe4-marker-control-sticky.spec.ts`
- `chart-legend.test.ts`
- `chart-legend.tsx`
- `results.module.css`
- `use-marker-control-height.ts`
- `workbench-columns.tsx`
- `workbench.module.css`
- `docs/aoe4-build-order-ui.md`

I also read these to judge the change:

- `use-run-bar-height.ts`
- `results.tsx:99-111`
- `line-chart.tsx:295-330`
- `acceptance/helpers.ts`
- the recharts 3.10.1 tooltip z-index

I did not run `npx next build`; the implementer reports it passing. I did not run acceptance tests (review does not).
