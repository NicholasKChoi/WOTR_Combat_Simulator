# SGS-219 implementer report (n=9, Rework 2)

Status: **needs_review**

- Ticket SGS-219, branch `sgs-219-units-chart-population-cap-mark`, tip `65026066fb27e560c2c1cf6cd6a45c75715dbb54` (unchanged; no commit made). Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-219-units-chart-population-cap-mark`. Not pushed.
- Mutation re-runs only. No production, spec or doc change; no assertion was rewritten or deleted because every listed item has a failing break.
- `checkout.sh task` was not called (no commits made, checkout already at the tip).

## Mutation checks

Run in the `mutate-sgs-219` scratch (branch at tip 6502606; the task tree was clean so nothing was copied in). Provisioned with `link-node-modules.sh .` and `npm run acceptance:setup` via `run.sh <scratch>`. Each break was reset with `git checkout -- <file>` and `git diff --exit-code` before the next ("RESET OK" printed each time). Each run used the spec file alone: `npx playwright test acceptance/aoe4-population-cap-mark.spec.ts --workers=1 -g '<test title>'`.

`tree-record.sh` on the task checkout, before creating the scratch and after removing it: both `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f`, empty listing; match. Scratch removed.

### Hide/hover/pin test (`on <chart>, hiding every marker kind, hovering an entry and pinning a run ...`), run on both the Units and Population rows

All breaks are in `components/apps/aoe4-build-order/line-chart.tsx`. Both rows failed at the same line each time (2 failed).

| Break | Failed at (both rows) |
|---|---|
| `:278` `{drawnTimeMark && markerView.labelKind === null ? (` (hide mark while hovering a Markers entry) | `:117` count after hover (Expected 1, Received 0) |
| `:278` `{drawnTimeMark && markerView.hidden.size === 0 ? (` (hide mark when kinds are hidden) | `:121` count after hiding every kind |
| `:278` `{drawnTimeMark && !pinned ? (` (hide mark while a run is pinned) | `:124` count after pin |
| `:280` `x={drawnTimeMark.at + (markerView.labelKind !== null ? 60 : 0)}` (shift x while hovered) | `:118` polled `left` after hover (`expect.poll ... toBe(before)`, so the poll form fails on a persistent shift) |
| `:280` `x={drawnTimeMark.at + (pinned ? 60 : 0)}` (shift x while pinned) | `:126` polled `left` after pin |

Covered: Units `:117`, `:118`, `:121`, `:124`, `:126`; Population `:118`, `:126` (and Population `:117`, `:121`, `:124`). `:124` and `:126` run after `:123` (pinned-line count), which passed under these breaks.

### "Adds only its own label" test (`the Units produced mark adds only its own label ...`)

Failing items inside the `toPass` are identified by the assertion's matcher and value, because Playwright reports the `toPass` frame (`:183`) and not the inner line; each break leaves the other compared fields equal, so the differing value names the line.

| Break | Failed at |
|---|---|
| `results.tsx:73` delete the Units `timeMark: populationCapMark,` entry | `:174` `toHaveCount(1)` on the Units mark (stack frame `:174:38`) |
| `line-chart.tsx:287` `value: testId === 'chart-units-produced' ? '' : timeMarkLabel(drawnTimeMark)` (line drawn, label gone, Units only) | `:177` `markLabels`: Expected 1, Received 0 |
| `line-chart.tsx:154` `rows` `+ (timeMark ? 1 : 0)` | `:178` `rows`: Expected 1, Received 2 |
| `line-chart.tsx:127` `visible = drawn(...).slice(timeMark ? 1 : 0)` (drop first visible marker) | `:179` `markerLines` deep-equal diff (first `data-at` missing) |
| `line-chart.tsx:159` `chartRows = (...).slice(timeMark ? 1 : 0)` (drop first chart row) | `:180` `paths` deep-equal diff (`d` strings differ) |
| `line-chart.tsx:131` `currentDots = visibleUpgradeDots(...).slice(timeMark ? 1 : 0)` (drop first upgrade dot) | `:181` `dots`: Expected 1, Received 0 |
| `line-chart.tsx:153` `placedByMarker = new Map(placed.slice(timeMark ? 1 : 0)...)` (drop the first placed label; the label becomes a `<title>`, rows and lines unchanged) | `:182` `labels` deep-equal diff (`"Feudal 4:23"` missing) |

Choice stated by the test names: the Units mark must be the only addition to the chart. The rejected alternatives are the label/row/line/path/dot changes above.

Breaks were applied on top of the line numbers at the tip; `line-chart.tsx:153` is the `placedByMarker` line (review's `:150` was the same drop-first-placed-label break).

## Tests run

Only the targeted spec tests above (single-file runs, 2 tests for the first three breaks and the two x-shift breaks, 1 test for the others, each failing as listed). No full-suite run: no code changed. The last full record for this tip is implementer-7 (spec 14 passed, `npm test` 96 files passed).

## Not changed / not run

- Codegen: none set. Build, lint, unit suite: not rerun, as the tree is unchanged since implementer-7's clean run.
- Doc claims: none added or changed.
- Pinned outputs, Bug record, unverified assumptions: none.

## Invariant check

A1, A2, A3: no production change; hold.

## Out-of-scope findings

- Playwright `toPass` reports only the `toPass` frame, not the inner assertion line. The record above names the inner line from the matcher and value. Wrapping would not change this; noted so review does not look for a `:177`-`:182` frame.
- A stray `sleep 1` ran once in a no-op command; it changed nothing.
