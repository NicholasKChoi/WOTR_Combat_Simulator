# M4 designer pass 4: ticket questions

Design: `projects/strategy-game-sim/design/M4.md` (edited in place, not committed). Approved decisions Q1=A, Q2=C,
Q3=A and the approved behavior are unchanged. Code read from origin/main d5c2549.

## Questions and answers

| # | ticket | question | answer | design sections changed |
|---|--------|----------|--------|-------------------------|
| 1 | SGS-057 | Ticket too large (schema + every caller swap); split? | Split. **2a** (keeps SGS-057): zod `^4.6.7`, `schema.ts` (C2 exports plus `nodeRefIssue`, `NodeRefProblem`), `text-to-build.ts`, fresh `schema.test.ts`/`text-to-build.test.ts` (no block copied from validate tests, jscpd threshold 0), `StepOptions.names` + fixtures, `BuildOrderIssue.suggestion?` in model.ts + OpenAPI + contract-spec row (`info.version` stays 1.0.0). `validate.ts` stays and imports/re-exports `SIM_INPUT_BOUNDS`, `INPUT_DEFAULTS`, `nodeRefIssue`, `NodeRefProblem`, `resolveSimInputs` from schema.ts (own copies deleted, shared helpers only in schema.ts); `validateBuildOrder` unchanged; model.ts still declares build types, schemas annotated `z.ZodType<T>`; route and docs unchanged. **2b** (new ticket): re-point importers, delete validate.ts and its two test files (migrate uncovered cases, list dropped ones in PR), route uses `checkBuildOrder`/`checkSimInputs` with temporary `text` branch via `textToBuildOrder`, model.ts re-exports `z.infer` types (+ `data.acceptance.test.ts` type list), `builds.test.ts` uses `checkBuildOrder`, `buildOrderFrom` + its spec, issue-order expectation edits, docs validation text. Data-file schemas row renamed **2c**, after 2a, independent of 2b | Modules (validate.ts row, schema.ts row), C1, C2 code block, C3, C4a, Docs and OpenAPI table, M4.1 ticket order table, Left to tickets serialization list, C1 strictNullChecks note |
| 2 | SGS-070/071 | Chart exports and legend props | `placeMarkers(..., labelWidth?: (label: string) => number)` default `label.length * 8`, exported with `PlacedMarker`. `SeriesLegend {series: readonly ChartSeries[]; pinned?: PinnedSeries; hidden: ReadonlySet<string>; onToggle(key)}`. `MarkerLegend {markers: readonly ChartMarker[]; pinnedAgeUps?: boolean}` (pinnedAgeUps added by M4.12; returns null when no markers and pinnedAgeUps not true). Pinned item text `Age-up (pinned)`, last. Current markers solid from M4.11 (intended). Pinned markers not placed by `placeMarkers` | C12, Modules (chart row) |
| 3 | SGS-069 | ComparePanel `pinnedName`/`alreadyPinned` types and who adds them | `pinnedName: string \| null`, `alreadyPinned: boolean`. Changed: M4.10 does not declare them (no dead props); M4.12 adds both with their use (pinned label; Pin disabled when `current === null \|\| alreadyPinned`) | C11 |
| 4 | SGS-064 | Does pending-supply-in-lead need a new wake candidate? | No. Entering the lead window only adds headroom, so it can lower the house count but never start one; existing wakes cover every instant that can start a house. Knight + longbow keeps its three pre-palace houses; sheep reaction goes to `farm` (both were ticket choices, now fixed) | Behavior rules: auto-house planning (new wake row, expected row), Build data (sheep row, houses row); Left to tickets item removed |
| 5 | SGS-068 | Add start villager default; sum hint? | Adds first `catalog.nodes` entry not already in `start.villagers`, count 1, at the end; disabled when every node used. No sum hint in the table; the sum issue shows in `build-order-issues` once `checked` | Behavior rules: step table (two rows) |
| 6 | SGS-066 | Where issues show per view; unpin with no result; errorLines scope | IssueList (then simulation-error) under whichever editor view is open. Shown tab is derived: Build whenever Results is disabled, so unpin with no result shows Build with `tab-results` disabled. `errorLines` prop and gutter `data-error` move to M4.8 (SGS-067); M4.7 ships `BuildTextEditor {text, onChange}` | C8, Behavior rules: tabs no-target row |
| 7 | SGS-072 | Restore race with user pin; name cap; file location; who clears bad storage | User Pin/Unpin before the restore lands wins: restore response dropped, storage left as the user wrote it. No name cap (escaped React text; page-written names bounded). `pin-storage.ts` in `components/apps/aoe4-build-order/` (browser-only). `readStoredPin` removes an invalid value itself and returns null | C13, Behavior rules: pin restore race, bad storage |
| 8 | SGS-073 | 30rem min-width, 768 px breakpoint, how much CSS moves | Confirmed 30rem and 768 px. Only narrow-layout width/layout rules and new rules move to CSS modules; `overflow-x: hidden` on page containers not allowed | Behavior rules: narrow layout (three new rows) |
| 9 | SGS-067 | `checked` semantics; scroll position; table view | `checked` true at the first Run of any outcome, reset only on reload. Scroll `block: 'center'` with scroll-margin for the run bar. In table view (no gutter) or an issue with no line, scroll `build-order-issues`. View never switched | Behavior rules: Run first issue row, inline issues when-shown row |
| 10 | SGS-074 | Duplicate 390 px test with SGS-073 | SGS-073 owns all whole-page 390 px scrollWidth tests and the overflow mutation. SGS-074 drops its 390 px test, the 390 px pass in its flow, the min-width:600px mutation and the matching criterion | Behavior rules: narrow layout test-owner row |

## Owner decisions

None new. Every answer is within the approved design or a ticket-level choice now fixed for consistency.

## Contracts changed

C1 (annotation in 2a, inference in 2b), C2 (exports `nodeRefIssue`, `NodeRefProblem`), C3 (suggestion lands in 2a),
C4a (`buildOrderFrom` in 2b; tests split), C8 (`BuildTextEditor` props per milestone), C11 (ComparePanel prop
types, added in M4.12), C12 (`placeMarkers` labelWidth, `PlacedMarker`, `SeriesLegend`, `MarkerLegend`), C13
(`readStoredPin` clears invalid key), M4.1 ticket order (2a, 2b, 2c; tickets 3 and 4 after 2b).

## Behavior rules added or changed

Run first-issue scroll; inline issues `checked`; tabs no-target (derived tab); start-villagers-add default;
villager sum no hint; narrow layout wide tables, CSS placement, test owner; pin restore race (user action wins);
bad storage (readStoredPin clears); pin name no cap; auto-house no new wake; expected row (houses kept);
sheep reaction `farm`; explicit houses kept.

## Tickets the manager must re-spec

- SGS-057: narrow to 2a scope above.
- New ticket for 2b (after SGS-057), with a TASK-GRAPH row.
- SGS-058: source row is now 2c; depends on SGS-057 (2a) only.
- SGS-059, SGS-060 (M4.1 tickets 3, 4): depend on the new 2b ticket.
- SGS-061 (ticket 5): removes 2b's temporary `text` branch; depends on 3 and 4.
- SGS-064: note no new wake candidate; houses kept.
- SGS-065: sheep reaction `farm`, houses kept (no longer a choice).
- SGS-066: drop `errorLines` and gutter `data-error`; issues under whichever view; derived tab.
- SGS-067: add `errorLines` prop and `data-error`; `checked`, scroll and table-view rules.
- SGS-068: start-villagers-add default and no-hint rule.
- SGS-069: drop `pinnedName`/`alreadyPinned`.
- SGS-072: add `pinnedName`/`alreadyPinned` with their use; race and readStoredPin rules.
- SGS-070/071: confirm names in C12.
- SGS-073: CSS placement and test-owner rows.
- SGS-074: drop 390 px test, flow pass, min-width:600px mutation and criterion.
