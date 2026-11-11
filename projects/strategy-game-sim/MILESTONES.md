# Strategy Game Simulator: Milestones

## M1: Foundations, plus a working WOTR Monte Carlo simulator

**Outcome:** The WOTR simulator has a design doc reviewers judge against, enforces the game's caps,
reports outcome frequencies over N battles, and is covered by an acceptance harness. The StarCraft
helper is frozen and out of this milestone.

### Exit criteria

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M1.1 | `docs/combat-simulator.md` states the WOTR combat rules the simulator implements, input bounds, and outcome reporting | code | SGS-001 | done |
| M1.2 | `docs/starcraft-helper.md` (dropped: StarCraft helper frozen) | code | | dropped |
| M1.3 | An acceptance harness drives `/api/fight` over HTTP and the WOTR page and landing page with clicks, runnable by one command | code | SGS-002 | done |
| M1.4 | REPO.md `acceptanceHarness` and `commands.acceptance` point at the harness | ops | human (after SGS-002) | done |
| M1.5 | `/api/fight` accepts only POST, caps an army at 10 units, rejects 0-unit armies, and never returns NaN (S3) | code | SGS-003 | done |
| M1.6 | `/api/fight` runs N independent battles (default 1000, max 100,000) and returns outcome frequencies, round counts, and surviving units; the page shows them (W2) | code | SGS-005 | done |
| M1.7 | The API surface is documented and reviewable: request and response shapes written down and listed in CONTEXT.md Key surfaces | code | SGS-006 + human (CONTEXT Key surfaces) | done |
| M1.8 | StarCraft helper H1/H2 fixes (dropped: StarCraft helper frozen) | code | | dropped |
| M1.9 | Combat applies the published caps: at most 5 combat dice and the leadership-reroll cap, as written in `docs/combat-simulator.md` (W1) | code | SGS-004 | done |
| M1.10 | A unit test runner runs with one npm script (`npm test`), and REPO.md `commands.unit` points at it | code | SGS-007 + human (REPO.md) | done |

### Delivery sequence

1. WOTR design doc (M1.1), acceptance harness (M1.3) and unit test runner (M1.10), in parallel. Then point REPO.md at the harness (M1.4).
2. `/api/fight` input hardening (M1.5).
3. Combat caps (M1.9).
4. Monte Carlo over N battles (M1.6).
5. Follow-up: document the API surface (M1.7).

### Safety and contracts

- The site is deployed on Vercel from `main`. Every PR gets a preview deploy; check it before merging.
- `/api/fight` response shape changes in M1.6. The only consumer is `components/apps/combat-simulator/results.js`.

## M2: AoE4 Build Order Simulator (English)

**Outcome:** A new app simulates an English build order and reports macro timings.

### Exit criteria

Confirmed by the owner 2026-10-30.

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M2.1 | `docs/aoe4-build-order.md` defines the model, data sources, per-civ `CivRules` hooks, and outputs | code | SGS-013, SGS-025 | done |
| M2.2 | `data/aoe4-build-order/` holds an English-filtered aoe4world snapshot with its source commit and patch, plus a per-civ overlay whose hand-entered values each carry a source and an "unverified" label (A1) | code | SGS-014 | done |
| M2.3 | `lib/aoe4-build-order/` simulates a build order covering the v1 list in CONTEXT.md, including veterancy upgrades (they occupy the building's queue; units produced afterwards are the upgraded tier); unit tests cover A2 (no negative resources, waits in timings), A3 (determinism), builder scaling 3/(N+2), the gather trip model, a calculator cross-check of effective rates, and an upgrade delaying production and changing the produced tier | code | SGS-027, SGS-030, SGS-031, SGS-032 | done |
| M2.4 | The build-order input is a JSON model with tagged triggers (time = "not before", villager count) plus a line-based paste format that parses into it; unknown trigger kinds and unsupported techs are rejected with clear errors | code | SGS-026, SGS-028, SGS-029 | done |
| M2.5 | At least one prebuilt English build order in `data/aoe4-build-order/builds/` loads in the app | code | SGS-034 | done |
| M2.6 | `pages/apps/aoe4-build-order` graphs units produced (by unit and tier), gather rates, and floating resources over time, and is linked from `pages/index.js` | code | SGS-015, SGS-034 | done |
| M2.7 | If the design adds an API route, it is in `docs/api/openapi.json` and passes the contract check | code | SGS-033 | done |
| M2.8 | Playwright acceptance tests: paste a build order, run it, and see all three graphs | code | SGS-034 | done |
| M2.9 | CONTEXT.md Key surfaces and Design docs row, and INVARIANTS.md AoE4 Paths, updated from proposed to actual | code | manager On-merge | done |
| M2.10 | Precursor: the repo's npm dependencies (next, react, react-dom, typescript, @types/*, bootstrap, vitest, @playwright/test, ajv, classnames) are upgraded to current stable majors, with build, typecheck, unit and acceptance suites green and the WOTR and StarCraft pages unchanged in behavior | code | SGS-012 | done |

## M3: AoE4 build order workbench (finite resources, easier editing)

**Outcome:** Starting resources run out as in the game, and the owner can edit, tune and compare build
orders on the page, for example a spearman/archer opening that transitions to men-at-arms and crossbows.

### Exit criteria

Confirmed by the owner 2026-11-01 (editor shape, tinkering tools, depletion behavior and backlog scope chosen in chat).

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M3.1 | Starting gather nodes are finite: sheep, berries, deer, boar, gold and stone have per-start amounts (each hand-entered value carries a source and an "unverified" label, and is overridable in the inputs); farms and wood stay infinite; the result reports when each node ran out | code | SGS-037, SGS-038, SGS-039 | done |
| M3.2 | When a node runs out, its gatherers go idle (they gather nothing until a step moves them) and the result carries a warning naming the node, the time and the idle villager count | code | SGS-038, SGS-045 | done |
| M3.3 | New trigger kinds in both the JSON model and the paste format: a node runs out (`when berry runs out`) and a resource bank reaches an amount (`when wood >= 400`); unknown or malformed forms are rejected with clear errors | code | SGS-039, SGS-040 | done |
| M3.4 | The page has a step table editor: add, delete and reorder steps, with dropdowns limited to the civ's valid actions, buildings, units, techs and gather nodes; it stays in sync with the paste text both ways | code | SGS-040, SGS-046 | done |
| M3.5 | Per-step timeline: each step shows when it started and completed, or what it is waiting on (resources, villagers, population, prerequisite); steps that never start are flagged | code | SGS-042, SGS-047 | done |
| M3.6 | Compare to a pinned run: the owner can pin a run and the charts overlay it, with the difference in key numbers (military resources spent at 10/15/20 min, age-up times, time to 200 population) | code | SGS-043, SGS-048 | done |
| M3.7 | A prebuilt English build that opens spearman + archer and transitions to men-at-arms + crossbow ships in `data/aoe4-build-order/builds/`, loads in the app, and has no step left waiting or not reached; a second prebuilt English build opens into a Castle knight + longbow army (Castle via King's Palace, Feudal blacksmith upgrades after the landmark is paid) and meets the same bar | code | SGS-039, SGS-050, SGS-051 | done |
| M3.8 | Backlog bugs and doc fixes: a build whose `then` is the node it built (e.g. a farm) pays no second walk leg; chart Y-axis label overlap; note messages use ids; the issues list is capped; paste-parser NBSP and pre-`start` line counting; sparse `steps` arrays rejected; multi-tier tech handling in effects/research; and the listed doc wording fixes in docs/aoe4-build-order.md and design/M2.md | code | SGS-036, SGS-038, SGS-041, SGS-052, SGS-053 | done |
| M3.9 | `docs/aoe4-build-order.md` and `docs/api/openapi.json` cover the new inputs, triggers, warnings, step timeline and chart markers, and pass the contract check; the docs state plainly that unit combat stats are not modeled (blacksmith and other combat upgrades cost resources and queue time, and mark the charts, but change no unit stats); Playwright tests edit a step in the table, run it, see a depletion warning and the step timeline, and pin and compare a run | code | SGS-054, SGS-055 | done |
| M3.10 | Every chart marks when each research completed and each age was reached, as a labeled vertical marker at that time (e.g. `veteran-longbowmen` 14:30, `Castle` 13:24). Markers are colored by kind, with a legend: age-up; economy (the tech has the `economic_upgrade` class); unit tier (a unit upgrade such as `veteran-longbowmen`); blacksmith (researched at the blacksmith); other. Colors are distinct from the series colors and readable in light and dark themes. Combat effects are not shown | code | SGS-044, SGS-049 | done |
| M3.11 | A build can name more than one gold deposit (numbered, e.g. a second gold mine), each with its own starting amount (4000 by default); villagers can be sent to a specific deposit, and the shipped builds move their gold villagers to a new deposit when one runs out instead of idling | code | SGS-037, SGS-038, SGS-039, SGS-040, SGS-050, SGS-051 | done |
| M3.12 | Every result message has a severity (info, warning or error); warnings show in their own list, and info messages are collapsed by default behind a toggle | code | SGS-037, SGS-041, SGS-042, SGS-045 | done |
| M3.13 | The AoE4 engine's cost, payment and tolerance logic lives in one shared module used by simulate, research and houses, shared test helpers replace the copied ones, and a jscpd duplication check runs as part of lint and passes on main | code | SGS-035 | done |

## M4: AoE4 build order workbench polish (results first, schema validation, veterancy)

**Outcome:** The page puts results first and is easy to use on any screen; builds are validated by one
shared schema; veterancy upgrades convert units already on the field; auto-houses no longer stall a build.

### Exit criteria

Confirmed by the owner 2026-11-02 (from the Castle build walkthrough and the UI/UX review in chat; the
small code-cleanup backlog bullets stay in the backlog).

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M4.1 | One shared zod schema defines the build; the front end converts the pasted text into a schema-checked build before POSTing and the API validates requests with the same schema; the hand-rolled validator is removed and its tests shrink to the text-to-build conversion; the rules and aoe4world data files are checked by a schema instead of per-field assertions | code | SGS-056, 057, 075, 058, 059, 060, 061 | done |
| M4.2 | Completing a unit-tier upgrade (e.g. Veteran Longbowmen) converts the lower-tier units already on the field to the upper tier; the design states how `unitsProduced` and the Units chart show it; docs, OpenAPI, acceptance specs and the build READMEs match | code | SGS-062 | done |
| M4.3 | When the only reaction `build house` step can never fire (so auto-houses stay off), the simulate response carries a warning that no house will ever be built; the gate semantics stay | code | SGS-063 | done |
| M4.4 | Auto-house planning counts supply from a building under construction only if it finishes within the house lead time, so the knight + longbow build no longer sits at 40 population with the King's Palace under construction | code | SGS-064 | done |
| M4.5 | A late explicit `build house` step no longer lets a build stall at the population cap silently: either auto-houses cover the gap or the result warns (the design chooses) | code | SGS-063 | done |
| M4.6 | The knight + longbow build leaves no villager idle through 1800 s (sheep gatherers move when sheep run out); its README and tests check the full 1800 s | code | SGS-065 | done |
| M4.7 | Results first: results are reachable right after a run (tabs or side-by-side, scroll to results on Run, Run stays on screen); text and table are one view with a toggle, not both at once; the text box auto-sizes and shows line numbers | code | SGS-066 | done |
| M4.8 | Errors and notes: a paste or validation error shows inline under the text box, highlights its line, and suggests a near match ("did you mean knight?"); info notes such as gold run-outs show in a collapsed list instead of being dropped | code | SGS-067 | done |
| M4.9 | Step table polish: readable labels (no raw `walkSeconds`/ids), optional fields tucked away, compact reorder and delete controls, the `start ->` line as an editable row | code | SGS-068 | done |
| M4.10 | Timeline and compare polish: one "Blocked by" column replaces "Waited on"/"Stuck on" with long waits highlighted; unfinished steps say "ongoing"; compare deltas show direction, colour and units; rows empty in both runs are hidden | code | SGS-069 | done |
| M4.11 | Chart legends and markers: series and marker legends are labelled and visually separate; pinned series are dashed and grouped with their resource or unit; marker labels do not overlap; the `chart-marker-legend*` test ids stay | code | SGS-070 | done |
| M4.12 | Pin and compare: results show as stale when the build or duration changes after a run; the pin names its build and duration; Pin is disabled when the current run is already pinned; the pin survives a page reload; the pinned run's age-up markers show dashed; a key number past the shorter run's duration says why it is blank | code | SGS-069, 070, 071, 072 | done |
| M4.13 | Mobile: at 390 px wide the page has no horizontal scroll; steps render as cards and wide tables scroll inside their own box | code | SGS-073 | done |
| M4.14 | `docs/aoe4-build-order.md` and `docs/api/openapi.json` cover the changes and pass the contract check; Playwright covers the new layout, the inline error, the info list, pin persistence and the 390 px width | code | SGS-074 | done |

## M5: AoE4 workbench follow-ups (delivered as backlog tickets)

**Outcome:** Shipped. The owner chose the scope in the 2026-11-02 plan, and it was delivered as backlog
tickets on 2026-11-02 and 2026-11-03 instead of through `milestone M5`, so no exit criteria were ever
confirmed. Closed by the owner on 2026-11-05 as delivered.

| scope | covered by | status |
|-------|------------|--------|
| Timeline beside the charts, gathered resources chart, timeline in time order coloured by step type | SGS-076, SGS-077, SGS-078 | done |
| Docs and prebuilt build entries state behavior and choices, not measured values | SGS-079, SGS-093 | done |
| Post-M4 UX fixes | SGS-083, SGS-085, SGS-086, SGS-087, SGS-088 | done |
| Flaky acceptance specs and test hygiene | SGS-082, SGS-092 | done |
| One villager per farm, with the prebuilt builds re-timed | SGS-080, SGS-081 | done |
| Engine code cleanups and guards | SGS-089, SGS-091 (SGS-090 discarded) | done |
| Also shipped: per-villager gather rates, deer pack 2450 food | SGS-084, SGS-094 | done |

## M6: AoE4 workbench re-runs on edit, and builds are saved and opened by link

**Outcome:** The page re-runs the simulation as the build is edited, with results beside the editor, and a build
can be saved on the server and opened by link, so an agent can hand the owner a link to the charts instead of
screenshots.

### Exit criteria

Confirmed by the owner 2026-11-05. Owner decisions: the Run button is removed; while the text is invalid the charts
keep the last good run, dimmed.

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M6.1 | Re-run on edit: each edit to the text, the step table or the duration restarts a debounce of about 500 ms; when it fires the page POSTs to simulate only if the text converts cleanly and the duration is valid, skips a request equal to the last one, aborts an in-flight request when a newer one starts, and ignores a response that lands after a newer one | code | SGS-100, SGS-102 | done |
| M6.2 | Layout: at desktop widths the editor is on the left and the charts on the right; under a breakpoint the page keeps the stacked tabs and still fits 390 px | code | SGS-104 | done |
| M6.3 | What re-running obsoletes is gone: the Run button is removed, nothing scrolls the page while typing, the stale indicator is reworked, and while the text is invalid the charts keep the last good run, dimmed, with its issues shown inline | code | SGS-102 | done |
| M6.4 | `POST /api/aoe4-build-order/builds` validates a build with the shared zod schema and stores it immutably under a short id; `GET .../builds/<id>` returns it; builds have a size cap and saves a rate limit; both routes are in `docs/api/openapi.json` and pass the contract check | code | SGS-099, SGS-101, SGS-103 | done |
| M6.5 | The page has a Save button that gives a copyable link; opening `?b=<id>` loads that build and runs it; an unknown id shows a clear error | code | SGS-105 | done |
| M6.6 | Storage sits behind one interface with a local stand-in as the default; the Blob adapter is used only when `BUILDS_STORE_ID` is set; keys are prefixed by `VERCEL_ENV`; a package.json override pins the nested zod so `npm audit` no longer reports the zod advisory | code | SGS-099, SGS-101 | done |
| M6.7 | `npm run smoke:preview -- <url>` saves a build to a deployment, reads it back, opens its link and deletes it | code | SGS-106 | done |
| M6.8 | The owner runs M6.7 on the M6 PR's preview deployment before merge | evidence | owner smoke run on SGS-106 preview | done (owner, 2026-11-09: save, read back, open PASS on #115 preview; delete 204 but re-read hit cache; owner waived) |
| M6.9 | `docs/aoe4-build-order.md` covers re-run on edit, save and open by link, and how an agent saves a build and prints its link; Playwright covers re-run on edit, the split layout, and save then open by link against the local stand-in; specs that clicked Run are rewritten | code | SGS-102, SGS-104, SGS-105, SGS-106 | done |

## M7: The build order is the step timeline

**Outcome:** After a run, the build order itself shows what happened to each step (kind colour, when it
started and finished, how long it waited and on what), so the separate step timeline in Results goes away
and the charts get the horizontal room back.

### Exit criteria

Set by the owner 2026-11-09 in chat. Owner decisions: the separate step timeline is dropped (it crowds the
screen horizontally); the Text tab is the most compact view of a build, so the Text tab gets the highlighting
(board Q20, 2026-11-10); design approved including charts dimming during the debounce (Q21); narrow screens are not a requirement for
this milestone (M4.13 and M6.2's 390 px clause are waived for the new UI).

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M7.1 | After a run, each step-table row shows its timeline kind colour (age-up, research, military, villager, building, economy, other) and its started and finished times; a step that was never reached or is still waiting is marked as such | code | SGS-107, SGS-108 | done |
| M7.2 | Each row carries what the timeline showed: waited time, the Blocked by reasons, and the flagged and long-wait (60 s or more) highlights | code | SGS-107, SGS-108 | done |
| M7.3 | Hovering or focusing a row shades that step's span on every chart, as the timeline rows did | code | SGS-109 | done |
| M7.4 | While the results are stale (an edit since the last run, or invalid text) the row annotations dim with the charts and never show times from a different build | code | SGS-107, SGS-108 | done |
| M7.5 | The separate step timeline is removed from Results, and the charts use the freed width | code | SGS-109 | done |
| M7.6 | Compact view: the Text tab's line gutter shows each step line's kind colour and started and finished times, with waited and Blocked by on hover, dimmed when stale, and hovering or putting the caret on a line shades that step on the charts | code | SGS-110 | done |
| M7.7 | `docs/aoe4-build-order.md` describes the annotated build order instead of the step timeline; Playwright covers the colours and times, the hover shading, the stale dimming, the compact view, and the timeline's absence; specs that drove the timeline are rewritten; no 390 px check is added for the new UI | code | SGS-108, SGS-109, SGS-110 | done |
| M7.8 | Explicit `build house` steps no longer freeze production: auto-houses are not held off for the whole build by the last explicit house step (owner added from the backlog, Q22); the rule is documented and the build 259 case has a test | code | SGS-111 | done |

## M8: AoE4 workbench: iterate on builds, tidy results, and pay down debt

**Outcome:** A user can take any build as a starting point, edit it, and keep their versions without losing
work. The results column is easier to read and arrange. The correctness bugs and weak tests reported during
M6 and M7 are fixed.

### Exit criteria

Proposed 2026-11-10 from the owner's scope pick (Q35 C: UI asks + correctness bugs + test/cleanup debt, plus the
start-from-a-build workflow and collapsible charts). Confirmed by the owner 2026-11-11 (Q36: approved as drafted).

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M8.1 | Start from a build and iterate: the select no longer frames builds as "prebuilt" (shipped builds are read-only templates beside the user's own builds); once the text diverges from the selected build the page shows it (e.g. `<name> (edited)`); choosing another build or reloading never silently discards edits (confirm, or keep a draft); a user can start a named copy from any build, save versions of it, and reopen them from a "my builds" list; the save model follows the owner's decision on immutable links vs editable named builds | code | SGS-119..125 | |
| M8.2 | Each results chart can be collapsed (title only) and moved up or down, by mouse and keyboard; collapsed state and order persist per browser and fall back cleanly when storage is unavailable; row-hover shading and pinned runs still work on expanded charts | code | SGS-114 | |
| M8.3 | Split layout: the build order column and the results column scroll separately inside a viewport-height area below the run bar, so hovering any step row shades charts that are on screen; the page's heading sizes are consistent | code | SGS-115 | |
| M8.4 | With a run pinned, the chart legend explains pinned once (solid = current, dashed = pinned) and lists each series once with its colour; the per-series hide toggle still hides both lines | code | SGS-113 | |
| M8.5 | Step-table readability: the run cell labels its started, finished and waited times; a still-waiting step does not show `Waited 0:00`; kind badges do not wrap mid-word and table selects do not truncate names like "Capital Town Center" at 1280 px; the kind-colour border shows (or the doc stops claiming it) under 768 px; after a programmatic fill the text editor scrolls back to the start of the line | code | SGS-116 | |
| M8.6 | Correctness bugs: the `?b=` load keeps other query keys and stops writing a ref during render; builds routes fail closed when `VERCEL` is set but `VERCEL_ENV` is not; an id-generation failure maps to 500; a refused save does not write the rate-limit counter; Playwright's web server blanks `BUILDS_STORE_ID` and `VERCEL_ENV`; `sendReply` type-checks response bodies; the knight-longbow README text matches the build | code | SGS-112, SGS-117, SGS-123, SGS-124 | |
| M8.7 | Test debt: each backlog test that cannot fail (auto-run equal-input history, build-store blob-import check, saved-build loader abort, step-annotations identity branch, step-annotation CSS-module tones via a vitest `css` setting, the acceptance specs for duration-error, open-rows, aria-describedby and same-build dimming, the house-gate always-true assertion) is made to fail when its code is broken; acceptance specs use `CHART_IDS` and share one hold-simulate helper; the SGS-103 route test gaps are closed | code | SGS-112, SGS-117, SGS-118 | |
| M8.8 | Cleanup debt: issue capping and the rate-limit counter step each live in one helper; `settledFields` and `recordingTarget` are reused, not repeated; the blob-store comment, ARCHITECTURE wording, docs list grammar and spec import order from the backlog are fixed; design/M6.md's smoke notes match the shipped smoke script | code | SGS-112, SGS-117, SGS-118 | |
| M8.9 | `docs/aoe4-build-order.md` describes the build workflow, chart controls and scrolling layout; Playwright covers edit-diverged marking, not losing edits, start-a-copy and reopen from my builds, collapse and reorder with persistence, and separate column scrolling | code | SGS-114, SGS-115, SGS-124, SGS-125 | |

Left in the backlog: the AoE4 data freshness CI job, the provisional gather rates, the English economy and
Blacksmith gaps, the acceptance coverage removed by SGS-098, the 360x760 small-screen flake, and the SGS-106
smoke-script hardening notes.
