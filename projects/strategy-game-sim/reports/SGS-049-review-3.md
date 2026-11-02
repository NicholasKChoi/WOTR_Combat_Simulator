# SGS-049 review 3 (rework 2, delta review)

- **Branch and diff.** Branch `sgs-049-aoe4-chart-markers-ui`, tip `ccbba95ed4977ae04cb646f23e453cad23e5ca4f`, base `origin/main` 1d5f5c9. I reviewed the delta `14a4d62..ccbba95`, which changes `line-chart.tsx` (+12/-5) and `acceptance/aoe4-build-order.spec.ts`.
- **Branch is local only.** It is not on origin (`git ls-remote` returns nothing), so I reviewed the local commit in a detached worktree at `worktrees/review-sgs-049-aoe4-chart-markers-ui`, which I removed afterwards.
- **Node.** 24.22.2.
- **Verdict: APPROVE.** There are no blocking findings, and all acceptance criteria and rework fixes are ticked in the ticket.

## Blocking findings

None.

## Rework 2 required fixes

| Fix | Result | Evidence |
|---|---|---|
| Keep a label that fits on neither side inside the plot, stacked in rows | done | `placeMarkers` (`line-chart.tsx:35-46`) computes `pinned = !fitsRight && at - width < 0` and pins the label to the plot's left edge. It does this with `dx = -at * plotWidth / end`, records the interval `[0, width]`, and keeps `insideTopLeft`. Row choice uses the interval that is actually drawn. The `dx` value is applied through the label props (line 120). |
| Comment re-wrapped and true | done | Lines 30-32 wrap at about 110 characters, like the rest of the file. "Pinned to the plot's left edge ... so it never covers the Y-axis ticks" is true. At 390 px the left-most label starts 5.5 px inside the grid (recharts' label offset), and no label box intersects any tick text on any chart. |
| 390 px Playwright test with an inside-plot check | done | The width loop runs `[768, 390]`. `expectMarkerLabelsApart` now asserts that each label box lies horizontally within `.recharts-cartesian-grid`. |
| Mutation: removing the clamp fails it | confirmed by running it | I set `const pinned = false`. The 390 px test failed with `label 3 in chart-units-produced leaves the plot`, and the 768 px test still passed. I then restored the line; `git status` was clean. |
| Optional: skip markers while width is null; drop unused `i`; margin comment | done | Line 105: `chartWidth === null ? [] : placeMarkers(...)`. `i` is removed. Line 20 is `// Mirrors recharts' default chart margin.` |

## Null-width skip

- **What is skipped.** The skip drops whole marker lines, not only their labels, during the single render before `ResizeObserver` delivers `onResize`. That render is the transient frame described in review 2.
- **Server render is unaffected.** It never sees the SVG, because `ResponsiveContainer` returns null without a size. The marker legend is outside the container and is not gated, so `line-chart.test.ts` is unaffected.
- **First paint.** In the browser, every chart ends up with the full marker count at every width:
  - the acceptance count tests pass;
  - my probe counted `markers.length` on all three charts at all widths;
  - there were 0 console errors.
- **Existing tests.** `npm test` passes 864/864 and acceptance passes 434/434.
- **Remaining case.** A browser without `ResizeObserver` would never show markers. recharts' container already depends on it, so this is not a new dependency.

## Live measurement (`npm run dev`, ENG 1TC, 5 markers)

The probe was a Playwright script against `npm run dev` on port 3877, checking all three charts. At each width it checked that:
- each label box lies inside the grid box, both horizontally and vertically;
- no two label boxes intersect;
- no label box intersects any axis tick text;
- the marker count equals `markers.length`.

| Width | Plot px | Min left slack | Min right slack | Problems |
|---|---|---|---|---|
| 1280 | 967 | 216.9 | 382.0 | none |
| 1024 | 787 | 177.5 | 289.2 | none |
| 768 | 547 | 125.0 | 165.4 | none |
| 576 | 367 | 85.6 | 72.6 | none |
| 390 | 217 | 5.5 | 26.8 | none |

- **Live resize.** I resized one page through 1280, 1024, 768, 576, 390 and back to 1280 without a new run. There were no problems at any step, and the values matched the fresh loads.
- **Screenshot.** The 390 px screenshot confirms that `steeled-arrow 8:41` and `iron-undermesh 9:41` sit at the plot's left edge, clear of the tick values and of each other.

## Acceptance criteria (all ticked)

| # | Criterion | Result |
|---|---|---|
| 1 | Tables and `markerLabel`; `formatMinSec` imported | pass (unchanged since review 1) |
| 2 | WCAG 3:1; colors not in `PALETTE` | pass (unchanged) |
| 3 | N `chart-marker` per chart, with attributes, stroke and dash | pass (acceptance) |
| 4 | Label text; close labels do not intersect | pass. Acceptance passes, and I measured 1280-390 px plus the live resize. |
| 5 | Marker legend | pass (acceptance) |
| 6 | `markers: []` | pass (acceptance) |
| 7 | Series legend click | pass (acceptance) |
| 8 | Marker at the horizon is drawn | pass (acceptance) |
| 9 | `markers={result.markers}` x3 | pass. `git grep` finds 3 lines. |
| 10 | Mutations | pass, as in rounds 1 and 2, plus the clamp mutation, which I ran myself. |
| 11 | Doc | pass. "Stack their labels in rows so each stays readable" (`docs/aoe4-build-order.md:668-669`) now holds down to 390 px. The doc is unchanged in this delta. |
| 12 | Diff leaves SGS-052 and SGS-048 lines alone | pass on intent. `width={Y_AXIS_WIDTH}` is the same value, as in review 2. The Y-axis test passes. |
| 13 | tsc, npm test and acceptance pass; no invariant regressions | pass |

## Invariants touched

- S1 holds: there are no new imports in the delta.
- A1, A2 and A3 are not touched; the change is display only.

## Spec checklist

- No names changed and no new exports.
- No invented constants: the clamp derives from the existing measured width.
- Scope is unchanged.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot was run. There is no `rulesFile`.

## Conventions

- The delta follows the file's existing style: 4-space indentation, wrapping at about 110 characters, and label props inline.
- The spec's `for (const width of [...]) test(...)` loop is a standard Playwright parametrization.

## Non-blocking notes

- **`line-chart.tsx:42`, long line.** The nested ternary for `[from, to]` is about 130 characters, longer than its neighbours.
- **Label far from its line.** A pinned label sits at the plot's left edge, far from its line: at 390 px, the 8:41 and 9:41 labels sit near 0:00. The `m:ss` text in the label still identifies the line, so this is acceptable on phone widths.
- **Label wider than the whole plot.** Such a label would still overflow on the right. That needs a plot narrower than about 140 px and does not happen at 390 px.

## Commands

| Command | Result |
|---|---|
| `npm ci` | OK |
| `npx tsc --noEmit` | clean |
| `npm run lint:dup` | 0 clones |
| `npm test` | 36 files, 864 passed |
| `npx next build` | success |
| `npm run acceptance` | 434 passed |
| Mutation run | described above |
| `npm run dev` probe | described above |

The dev server's process group was killed, and port 3877 is free. The probe files were removed, and the worktree was clean before I removed it.

## REPO.md review checklist

- **Every diff.** The build passes, and I loaded the page on `npm run dev` and checked it through the user flow: select ENG 1TC, run, resize.
- **AoE4 build order.**
  - No copied helpers.
  - The doc sentence holds.
  - At 1280 px, no label overlaps an axis or tick label.
- **Other sections.** Combat simulator, Starcraft helper, Shared code and `golang/` are not touched.

## Coverage

- **Read in full.** `line-chart.tsx`, the spec hunks in the delta, and the doc's marker paragraph.
- **Checked against `origin/main`.** The whole-branch diff matches review 2 apart from this delta.
- **Not re-reviewed.** `chart-rows.ts`, the tests and `results.tsx` are unchanged since review 1.
