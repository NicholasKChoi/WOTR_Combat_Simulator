# SGS-217 ticket report (2, re-spec 1)

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-217-population-cap-spec.md`

## Summary

New title: "Extend the population cap mark spec with the cases it does not cover". It is still a Chore in M13, component aoe4-build-order, Risk low, Depends on SGS-216 (integrated), with 0 business-logic lines (about 100 added spec lines). The ticket now **extends the existing `acceptance/aoe4-population-cap-mark.spec.ts`** that SGS-216 shipped. It says so explicitly, and every existing test and assertion in that file stays. It no longer asks for a new `aoe4-population-cap.spec.ts`. Context now says SGS-216 already ships that spec and lists what the spec covers.

I compared the cases against the spec at origin/main 9bd5a5e. These were dropped because the spec already covers them:
- the single mark at the API time, with `data-label` and the m:ss label;
- no mark on the other charts;
- no mark for a 600 s run;
- the mark staying in place when all kinds are hidden, when a run is pinned, and on hover;
- no mark when the zoom window ends before the cap time;
- the label inside the grid's right edge and above the axis at 1200, 1280 and 1800 px.

These remain and are now the ticket's cases:
1. The Markers control lists exactly the marker kinds present in the run, and no entry names the population cap (D17).
2. A pinned run that reached the cap, with a current 600 s run that did not: no mark is drawn, and the `compare-row` `data-key="pop-cap"` shows the pinned time as m:ss and the current run as not reached (D9).
3. The line's x when unzoomed. Then, in a zoom window that contains the cap time with room after it: the x matches the window's axis, and the label is right of the line inside the plot. Preconditions assert that the window's span is shorter than the cap time, so the test fails if the side is judged without the window origin (D16).
4. Reset after a zoom window that ends before the cap time brings the mark back at the same `data-at` and x. The existing test only resets from a window that contains the cap.
5. Pointer-down on the mark's bottom label, then a drag, starts a `chart-zoom-selection`, and releasing zooms the chart (D18). The existing zoom spec only shows that a press on the top label rows does not start one.

Not added, judged low value: the label's left edge at the three widths, and page-wide horizontal overflow. The layout specs already cover overflow, and at a cap time of 1095 of 1200 s the label cannot be clipped on the left.

Something meaningful does remain, so I do not recommend discarding the ticket. The pinned-run D9 case, the window-relative label side and line x, and the label pointer-down are untested in a browser today.

## Diagrams

None; the ticket carries the no-diagram sentence.

## Open questions

none

## Overlap

- No overlap with any open ticket.
- The M13 design's Testing row M13.3 still names a new `acceptance/aoe4-population-cap.spec.ts`. The ticket instead extends the file SGS-216 named `aoe4-population-cap-mark.spec.ts`. This is a design-text mismatch only, with no doc impact. The designer may update the row.

## Searches (items 2, 11, 17)

- **Tests:** I searched `acceptance/` at origin/main for `chart-time-mark`, `chart-population` and `Population cap`. Hits:
  - `aoe4-population-cap-mark.spec.ts`, the file being extended;
  - `aoe4-chart-views.spec.ts` (chart title) and `aoe4-legend-pressed-state.spec.ts` (chart filter), which only name the fifth chart; neither is edited.
  
  `aoe4-marker-labels.spec.ts` pins the Markers kind list for another build and is not edited. Scope states all of this.
- **Docs:** `docs/aoe4-build-order-ui.md` (the Population chart, marker control, zoom and Key results paragraphs) already states every behavior the new cases check. No doc becomes untrue.
- **Rule exceptions:** none.

## Self-check (spec-gate items)

- 1 ok. Lint `--spec` found every named path at the base.
- 2 ok. Each criterion names the break that makes it fail.
- 3 ok. No open questions.
- 4 ok. Invariants is none. Lint confirmed that once the ticket no longer cites a production path; I removed a `chart-markers.ts` path reference that had pulled in the "AoE4 Build Order Simulator" invariant.
- 5 ok. The contract names come from SGS-216 and the M13 design.
- 6 ok.
- 7 ok (n/a trigger).
- 8 ok. Agrees with D9 and D16 to D18.
- 9 ok. On merge is none.
- 10 ok. Risk low.
- 11 ok. No doc becomes untrue.
- 12 n/a.
- 13 fixed. The label-fit precondition now uses the page's `estimateLabelWidth`, the width the side is judged with, not the drawn box.
- 14 ok.
- 15 ok. Assumptions name recharts' label element and redraw timing.
- 17 n/a.

## Lint

`ticket-lint.py --graph ... --spec /home/choin/git/WOTR_Combat_Simulator origin/main <ticket>`: clean, with no errors or warnings. Two earlier errors were fixed:
- a backticked `design/M13.md` path;
- an Invariants miss caused by naming `chart-markers.ts`.

## Other

- No scratch checkout was made.
- No mutation was run: the spec cases do not exist yet, and the implementer mutation-checks them per common.md.
