# SGS-048 review 1

Verdict: **APPROVE**
Reviewed: 27d0baa4eba24e417b8e5cf47032e487c9ccbb40 (local branch `sgs-048-aoe4-pin-compare`; not on origin yet, so the review worktree was detached at the SHA), base origin/main 77fa279 (merge-base f078c11 = ancestor; one commit on the branch). Full review.

## Blocking findings

None.

## Spec gaps

None. `compareRows` takes `KeyNumbers` rather than `SimulationResult`; the design and ticket give `compareRows(current, pinned)` without parameter types, so this is in bounds.

## Commands

- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones.
- `npm test`: 33 files, 772/772 pass.
- `npx next build`: ok (`/apps/aoe4-build-order` SSG).
- `npm run acceptance`: 379/379 pass.
- Mutations I ran myself: `p - c` delta made 2 compare tests fail. Intersection instead of union made 3 chart-rows tests fail. Both were reverted.

## Manual flow (throwaway Playwright spec in my review worktree, deleted; 1280x900)

Steps: run 1200 s, then pin, then run 300 s, then edit the text and run, then invalid paste (400), then valid run, then unpin.
- Before any run, `pin-run` and `unpin-run` were disabled. After a run, `pin-run` was enabled and there was no table.
- Pinning the shown run made every delta `0`, or a dash where both values were null (Castle, Imperial, pop-cap).
- Pinned 1200 s against current 300 s: military-600/900/1200 showed the pinned value, a dash for current and a dash for the delta. Feudal 4:23 against 4:23 gave 0.
- Charts: `pinned:<key>` paths have `stroke-dasharray="6 4"` and current paths have none. Pinned lines use the current series' color for matching keys. The units chart has `pinned:villager-1`, `pinned:spearman-2` and `pinned:longbowman-2`. Current lines stop at 5:00 and pinned lines run to 20:00 (screenshot checked).
- Clicking the legend item `Food (pinned)` hid `pinned:food` only (food stayed). Clicking it again restored it.
- The pin and overlay stayed after a text edit and re-run (11 pinned paths). A 400 removed the table and all paths, left `unpin-run` enabled and disabled `pin-run`. The next valid run brought back the table and the 11 pinned paths.
- Unpin removed the table and the pinned paths, and disabled `unpin-run`.
- At 1280 px, the X ticks (0:00 to 20:00) don't overlap and the Y labels clear the tick labels. One near-collision at the origin, between the Y `0` and X `0:00`, comes from the unchanged axis layout and is not new in this diff.
- Only one prebuilt build exists (`ENG 1TC`), so I could not test changing the prebuilt select separately. It only replaces the text, the same path as a text edit.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | keyNumbers military at key samples / null past duration | pass | compare.test.ts 700 s case; `SAMPLE_SECONDS=5` and integer duration so 600/900/1200 are always samples when within duration |
| 2 | ages from entry / null; pop-cap copied incl. null, 0 | pass | compare.test.ts `it.each([null, 0, 512.5])` |
| 3 | seven rows in order; delta four null cases | pass | compare.test.ts; mutation verified |
| 4 | union rows, absent keys | pass | chart-rows.test.ts (`'a' in rows[3]` false; `'pinned:a' in rows[1]` false); mutation verified |
| 5 | no-pinned path unchanged, existing tests unedited | pass | diff only touches the import line of chart-rows.test.ts; no-pinned branch is the old body |
| 6 | pinned key / legend name | pass | `pinnedKey` unit test; `(pinned)` name seen in legend in browser |
| 7-12 | Playwright scenarios | not ticked | no committed Playwright specs; behavior verified manually above, owned by the acceptance-test gate |
| 13 | mutation check | pass | re-run by me |
| 14 | docs grep | pass | docs/aoe4-build-order.md:615 |
| 15 | no data.ts import; formatMinSec from format-time | pass | compare.ts imports only `type` from model; compare-panel.tsx:1; build ok |
| 16 | no invariant regressions | pass | see below |

Split judgement: criteria 7-12 all start with "Playwright:" and name test ids and paths, so they belong to the acceptance-test gate. The unit-testable math (1-6, 13) is covered by the implementer's tests. That split fits the ticket.

## Invariants touched

Client-only diff under `components/apps/aoe4-build-order/**`, `pages/apps/aoe4-build-order.tsx` and the docs.
- A1: holds. No game numbers; 600/900/1200 are the spec's `KEY_TIMES`.
- A2: holds. Engine untouched.
- A3: holds. No randomness or clock reads.
- S1: holds. Imports stay inside this app and `lib/aoe4-build-order`.
- S2: holds. Page unchanged in layout and link.
- S3: holds. No new input.

## Spec checklist

- Names: match CONTEXT and design (`KEY_TIMES`, `KeyNumbers`, `keyNumbers`, `CompareRow`, `compareRows`, `PinnedSeries`, `pinnedKey`, test ids).
- Scope: no pinned markers, no persistence, a single pin, no route or OpenAPI change, YAxis untouched, no `golang/`.
- No invented constants.

## Conventions

- compare.ts and compare-panel.tsx follow the component style (4-space indent, no semicolons), like chart-rows.ts and result-series.ts.
- compare.test.ts builds its fixture the way result-series.test.ts:6 does (`function result(): SimulationResult`).
- line-chart pinned `<Line>` mirrors the current-series `<Line>` at line-chart.tsx:29-38.
- No ticket ids or factory pointers in code or docs. The commit author is choinickolas@gmail.com.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. No rules file.

## Non-blocking notes

1. docs/aoe4-build-order.md:618 says pinned lines are "in the same color as the current series with that key". A pinned-only units series has no such current series, and the code gives it `seriesColor(series.length + i)`. The doc leaves that case unstated rather than contradicting it. A clause like "or a color no current series uses" would close it.
2. line-chart.tsx:40-48: `series.length + i` counts matched pinned series too, so it skips palette slots. Seen in the browser: spearman got index 2 and longbowman index 3, with index 1 unused. Colors stay distinct, so this is only cosmetic.
3. compare-panel.tsx `formatDelta`: an age or pop-cap delta under 0.5 s that is not zero shows as `+0:00` or `-0:00`, because `formatMinSec` rounds. This matches the doc ("`0` when equal"), but readers may find it odd. Formatting is the implementer's call per the design.
4. docs/aoe4-build-order.md:611: the edited line runs to about 150 characters, while the paragraph around it wraps at about 110.
5. For the acceptance-test gate: no committed spec covers pin/unpin enablement, dashed overlay paths, legend toggle of `Food (pinned)`, pin surviving edits and a 400, the self-pin zero deltas, or the 1200-vs-300 dashes. Only one prebuilt build exists, so the "prebuilt select" variant in the criterion degenerates to a text replacement.

## Coverage

Reviewed all 9 changed files, plus siblings result-series.ts/.test.ts, line-chart.tsx, format-time.ts, model.ts (result fields), the sampling in simulate.ts, the docs Page section, and design/M3.md for pin, compare and overlay. REPO.md "Every diff" and "AoE4 build order" sections applied: build, dev flow and the 1280 px check are done, and no copied helper was found (`formatMinSec` is imported). I could not review the prebuilt-select change on its own, since there is only one prebuilt build.
