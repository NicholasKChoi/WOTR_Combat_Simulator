# M3 designer pass 2

Design: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M3.md` (revised in place).

## What changed

- Owner decisions 1-8 folded in. The Owner decisions section now says "None open" and lists what was folded in.
- M3.1 data: amounts are fixed (sheep 3000, berry 1500, deer 1750, boar 2000, gold 4000, stone 1200), each one
  aggregate per kind with `unverified: true` and an owner-supplied `source`. Per-animal sizes (sheep 200, deer
  250) appear only in the `source` text, because the engine draws down the aggregate and has no per-animal field
  (no dead fields).
- M3.6 decision 7 changed: `SimulationResult.population` is renamed `spawnedPopulation` (spawned, living units
  only; queued units excluded), and `populationCapReachedAt` is the exact spawn instant it reaches 200.
- M3.7: the first build file is renamed `english-spear-longbow-maa-crossbow.json`. A second build,
  `english-knight-longbow.json` ("ENG Knight/Longbow (King's Palace)"), is added: the Feudal blacksmith research
  steps go after the `build kings-palace` step, so they arm once the landmark is paid. No new trigger is needed.
  The owner's scratch-run numbers are a reported reference and are not asserted. Both builds must have no step
  left waiting or not reached at 1200 s and 3600 s.
- M3.10 markers: new contract plus behavior rules (below).
- M3.9: the doc and OpenAPI must cover `ChartMarkerKind`/`ChartMarker` and the marker classification order, and
  state that unit combat stats are not modeled.

## Contracts changed or added

- `SimulationResult.population` renamed `spawnedPopulation` (meaning changed); `populationCapReachedAt` redefined.
- `SimulationResult.markers: ChartMarker[]` (new).
- `ChartMarkerKind` (`age-up | economy | unit-tier | blacksmith | other`), `CHART_MARKER_KINDS`, `ChartMarker
  { kind, label, at }`, `AGE_NAMES` (model.ts, new).
- `lib/aoe4-build-order/markers.ts` (new): `researchMarkerKind(entry)`, `researchMarker(entry, at)`,
  `ageMarker(age, at)`, `compareMarkers(a, b)`.
- `EngineState.markers`, `EngineState.spawnedPopulation` (simulate.ts).
- `chart-rows.ts`: `MARKER_COLORS` (age-up `#b8860b`, economy `#008080`, unit-tier `#c43bb0`, blacksmith
  `#5f7d8c`, other `#6b6bd6`), `MARKER_KIND_LABELS`, `markerLabel(marker)` (`<label> m:ss`).
- `SeriesChart.markers?: readonly ChartMarker[]`.
- Test ids `chart-marker` (`data-kind`, `data-label`, `data-at`), `chart-marker-legend`,
  `chart-marker-legend-item` (`data-kind`).
- `rules/base.json` `gatherNodes.<node>.amount` values and source strings.
- Build files `builds/english-spear-longbow-maa-crossbow.json` (renamed) and `builds/english-knight-longbow.json`
  (new), with names and order in `builds.ts`.

## Behavior rules added or changed

- population: `spawnedPopulation` series; cap time is the exact spawn instant (replaces the old population row).
- markers: age reached (the start age has no marker; labels Feudal, Castle, Imperial); research completed (at
  `completedAt`, classified from the entry `researchEntry` picked); ordering by `at`, then kind order, then
  label, with no merging; repeat (at most one marker per age and per tech); no target (no marker for in-progress
  or unreached work, and an empty list draws nothing and no legend); markers change no simulation state, and combat
  techs keep the M2 cost, queue and note behavior.
- Classification, first match wins: economy (`economic_upgrade` class), then unit-tier (`type === 'upgrade'` or
  `scar_unit_upgrade` class), then blacksmith (`producedBy` includes `blacksmith`), then other. No tech in today's
  snapshot matches more than one of the first three.
- chart markers: rendering (dashed `ReferenceLine` on all three charts, same markers on each); legend is separate
  from the series legend, with no marker toggle; the pinned run draws no markers; markers never fall outside the
  x domain.
- Colors: none is in `PALETTE`, and each has WCAG contrast of at least 3:1 against `#ffffff` and `#212529`. A unit
  test pins both. The site has no dark theme today, so `#212529`, Bootstrap's dark body background, stands in for
  dark mode.
- prebuilt builds: the 1200 s bar applies to both M3.7 builds; depletion warnings are allowed, but no step may be
  left waiting.

## Extension points (added)

- Marker toggles, pinned-run markers, more marker kinds.
- Combat stats (not modeled): a later combat model reads `researchedIds`, and markers need no change.

Existing extension points are unchanged.

## Owner decisions

None open.

## Note for the manager

Gold is one 4000 aggregate and there is no second deposit, so a gold-heavy build stops getting gold income once
it runs out. ENG 1TC rallies to gold for 3600 s, so it will get a gold `node-depleted` warning. The prebuilt bar
only forbids waiting or unreached steps, so warnings are fine. If the owner wants a second gold deposit, that is
the existing "numbered deposits" extension point, not M3 scope.
