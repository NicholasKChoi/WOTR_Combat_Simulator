# SGS-216 review 8

- Ticket: SGS-216 Add a Population chart with a population cap mark (Feature, risk standard, milestone M13)
- Branch: `sgs-216-population-chart-cap-mark`, tip `514c5f110ea4f76e06f1e8b535bf77333f71ce1e`, base `origin/main`. Not stacked.
- Mode: full review after Rework 1 (bounced by review, `SGS-216-review-6.md`, at tip `91c8dca`). Commits since then: `816c7e8` (`dy: -4` on the time-mark label; UI doc label-side clause) and `514c5f1` (the two end-of-list `chart-layout.test.ts` rows name `'chart-population'` directly).
- Implementer record: `SGS-216-implementer-5.md` and `SGS-216-implementer-7.md`. No acceptance-test report exists, so every test in the diff counts as the implementer's.
- **Verdict: APPROVE**

## Blocking findings

None.

## Rework 1 Required fixes

| Fix | Landed | Evidence |
|---|---|---|
| `dy: -4` on the time-mark `label`, beside `offset: 0`, no `offset` change; label box bottom above the x-axis line at 1200, 1280, 1800 px | yes | `line-chart.tsx:289` `offset: 0`, `:292` `dy: -4`. Inspection (below): label bottom is 2 px above the axis line at 1200 px (2988.8 vs 2990.8), 1280 px (2988.8 vs 2990.8) and 1800 px (2956.4 vs 2958.4). The gap is also 2 px in the zoomed, pinned, all-hidden, hover and 1800 s states. Crops `default-1200-label.png` and `default-1800-label.png` show the text clear of the grey axis line. |
| UI doc clause replaced verbatim | yes | `docs/aoe4-build-order-ui.md:131` reads "the label to the right of the line unless its estimated width (8 px per character, wider than the drawn text) would pass the plot's right edge, and then to its left". Nothing else in that sentence changed (`git diff 91c8dca..HEAD`). True against the code: `LABEL_CHAR_PX = 8` (`chart-markers.ts:4`), `line-chart.tsx:288` passes `estimateLabelWidth`. The estimate is 160 px; the drawn text is 113 px (988.7 to 1101.8). |
| Break for "is null when the cap was not reached" | yes | implementer-7: `=== null` to `=== undefined` at `result-series.ts:137` failed on `toBeNull()`. |
| Prepend break fails both `['down', population]` rows; every changed `chart-layout.test.ts` row named with its break | yes | `514c5f1` changed the two rows to the literal `'chart-population'`. With a variable, the prepend break moves `population` to the floating id, so the rows could not fail. implementer-7 records the prepend break failing both rows. It also names a failing break for each item the Required fix listed: D and R for the normalize cases, S for the six swap rows and the second-move test, and C plus P for the six `moveChartTo` rows. I traced S, C and P against `chart-layout.ts` and each fails on the changed `toEqual`. For example, under S the second-move test still gets `first.toIndex` 1, so it fails on the changed `second` assertion and not on an earlier one. |
| Acceptance specs mutation-checked under breaks (a), (b), (c) | yes | implementer-7 Fix 5 records per-file failures. (a) fails the alignment count, `expectLayout` lists, the last-chart ArrowDown row, the y-label entry and the five-chart titled tests. (b) fails the slot-4 row and "below the last chart". (c) fails the four `of ${CHART_IDS.length}` status assertions. No changed item was left without a break. |

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `populationSeries` gives one series with key `population`, name `Population` and the `spawnedPopulation` values; test values differ from the other series | pass | `result-series.ts:134`. Test values are `[6, 31, 77]`. Breaks `run.times` and key `pop` are recorded. |
| `populationCapMark` gives null when not reached and `{ at, label }` when reached, including `at` 0 | pass | `=== null` check. The `!at` break fails the 0 row and the `=== undefined` break fails the null row. |
| `timeMarkLabel` gives the same m:ss as `markerLabel` | pass | four comparison rows plus `18:15`; the raw-seconds break is recorded |
| `timeMarkLabelPosition`: `at` 0, exact end, passes end, origin, non-strict boundary | pass | `chart-markers.ts:49-51`; 8 rows; the strict-boundary and origin-ignored breaks are recorded |
| In-window decision for unzoomed, before, both edges, inside and after | pass | `timeMarkDrawn` (`line-chart.tsx:72-73`) uses the existing `inWindow`; 6 rows and a null test, with breaks per row |
| `TIME_MARK_COLOR` is `#a52a2a`, at least 3:1, not a marker or palette colour | pass | four assertions, each with a break |
| `RESULT_CHART_IDS` ends with population; default lists it last and expanded; four-id layout gets it appended with collapsed kept; stored position and state kept | pass | `chart-layout.ts:3`; tests and breaks as above |
| Help names the Population chart and the cap line; seven sections | pass | `page-help.tsx:104-107`; `page-help.test.ts`. In the running dialog, `help-modal` has 7 sections and the Charts text includes the new paragraph. |
| Running page: one mark at the API cap, label `Population cap 18:15`, none at 600 s, none on other charts; hide-all, pin and hover leave it; not drawn when zoomed past it | pass | Inspection: API `populationCapReachedAt` 1094.9413171060362 equals `data-at` at 1200, 1280 and 1800 px. Text is `Population cap 18:15`. The 600 s run has 0 marks. The other four charts have 0 marks in every state. Hover, all 3 kinds hidden and pinned all leave the mark at x 1141.8 (1280 px). A 119-480 s zoom has 0 marks; a 720-1165 s zoom draws it. |
| Charts other than Population are unchanged (no mark, `data-label-rows` unchanged) | pass | Each of the other charts has 0 `chart-time-mark` and `data-label-rows` 1, and 0 with every kind hidden, as before. The mark is not in `placeMarkers`. |
| Edited acceptance specs keep their assertions; listed specs pass, with a run list | pass | implementer-5 ran 25 files, all passing. implementer-7 re-ran the 5 edited specs at the tip (31, 29, 13, 4 and 13 passed). Mutation record per Fix 5. |
| Docs: no "four charts", "out of four" or "other two charts"; Population chart, mark, zoom and Markers behaviour; format doc; ARCHITECTURE row | pass | See the UI doc, format doc Outputs and graph, and the ARCHITECTURE.md row in the diff. Each sentence was checked against the code. |
| No INVARIANTS.md regressions | pass | see below |

## Invariants touched

- A1 (game numbers from data): holds. No simulation code changed. The colour, 2 px width, font size and `dy` are page styling.
- A2 (resources never negative): holds. No simulation change.
- A3 (determinism): holds. No simulation change.
- S1 (apps independent): holds. Imports stay inside `components/apps/aoe4-build-order/`.
- The spec-checklist sections Contracts, Scope, Naming and AoE4 A1 to A3 were all applied and all hold. Names match design M13 C2 and C4 exactly. No out-of-scope file changed (`lib/`, `openapi.json`, `compare.ts`, `chart-zoom.ts`, `use-chart-zoom.ts`). No open question was answered with an invented constant.

## Lint, build, unit (review scratch at the tip)

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx next build`: succeeded.
- `npx vitest run components/apps/aoe4-build-order`: 36 files, 1087 passed.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. There is no `rulesFile`.

## UI inspection

- I served the task checkout with `npx next dev -p 3877` through serve.sh. The server and the Playwright script ran in one wrapper, because the sandbox gives each command its own network. The server was stopped afterwards; `serve.sh status 3877` reports the port free.
- Loaded:
  - the default build (1200 s) at 1200, 1280 and 1800 px;
  - a 1800 s run at 1200 and 1280 px (label to the right of the line);
  - at 1280 px: hover on the first Markers entry, all 3 entries hidden, a pinned run, zoom 119-480 s, zoom 720-1165 s, and a 600 s run;
  - the help dialog at 1200 px.
- Checks:
  - Horizontal overflow: 0 everywhere.
  - Clipped overflow: only the pre-existing scroll columns (`build-column`, `results-column`) and the editor textarea. None of these is new UI.
  - Mid-word wraps in the Population chart's HTML text: none. The help paragraph was checked as text, and a normal `<p>` was not screenshotted below the fold.
  - Label overlaps with ticks, marker labels or legends: 0.
  - Label inside the grid: yes in every state.
  - Gap from the label to the axis line: 2 px in every state.
  - Label anchor: `end` (left of the line) at 1200 s, and `start` (right) at 1800 s, which matches the estimate rule.
  - The line has stroke `#a52a2a`, width 2, no dash and no tabindex.
- Screenshots read: `default-1200.png`, `default-1200-label.png`, `default-1800-label.png`, `run1800-1280.png`, `zoom-around-cap-1280.png`, `help-1200.png`. They were in the review scratch, which has been removed.

## Non-blocking notes

- `chart-layout.test.ts:90` and `:125`: the end-of-list rows use the literal `'chart-population'` while every other row uses the destructured names. This is deliberate, so the prepend break can fail them, but nothing tells a reader why. A future edit back to `population` would silently lose the check.
- `line-chart.tsx:292` `dy: -4` is a bare number, while the marker labels derive `dy` from `LABEL_LINE_HEIGHT`. A named constant would match the siblings. The gate dictated the value.
- Carried from review 6, still open:
  - `timeMarkLabelPosition` repeats the `placeMarkers` fit test and has no pinned-left fallback for a narrow window.
  - `aoe4-legend-pressed-state.spec.ts:25` filters on a literal id.
  - "leaves it drawn where it was" is true of its time; a longer pinned horizon rescales its pixel position.

## Coverage

- I reviewed all 20 changed files: the code, unit tests, 6 acceptance specs, 2 docs, the help text and ARCHITECTURE.md. I also read `chart-layout.ts` in full, the time-mark and marker render blocks of `line-chart.tsx`, the design M13 C2, C4 and behaviour tables, LESSONS, INVARIANTS, spec-checklist, CONTEXT, PROJECT, and the REPO review checklist (Every diff, AoE4 build order).
- The LSP tool was not available. `SeriesChart` has one caller, `results.tsx`, which I read.
- Not run, by role: acceptance specs and mutation breaks. I judged them from the implementer records.
