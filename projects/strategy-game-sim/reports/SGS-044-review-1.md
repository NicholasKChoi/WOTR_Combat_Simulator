# SGS-044 review 1

Branch `sgs-044-aoe4-chart-marker-data` at 47802d6c10a0f7de8a3e38439457320d77cd422e (local branch; not on origin yet). Base origin/main 77fa279 (merge-base). Full review, first pass. Reviewed in a detached worktree, `worktrees/review-sgs-044`, which has since been removed.

## Verdict: APPROVE

## Blocking findings

None.

## Spec gaps

None.

## Commands (Node 24.22.2, run by me)

- `npx tsc --noEmit`: exit 0.
- `npm run lint:dup`: 0 clones.
- `npm test`: 33 files, 768/768 pass.
- `npx next build`: exit 0.
- `npm run acceptance`: 380/380 pass. This includes the contract spec (ajv against live responses with `markers`) and the edges spec. The page tests that load `/apps/aoe4-build-order` also pass. The page did not change.
- Review bot: `reviewBot.cli` is empty, so none ran. There is no `rulesFile` and no REVIEW.md.

## Mutations (checked by me, each reverted afterwards)

| Mutation | Result |
|---|---|
| Swap the economy and unit-tier checks in `researchMarkerKind` | priority test fails |
| Drop `state.markers.push(ageMarker…)` | 2 tests fail |
| Drop `.sort(compareMarkers)` | the same-instant test fails |
| Drop `state.markers.push(researchMarker…)` | 2 tests fail |
| Invert `a.at - b.at` | the compareMarkers test fails |

## Points the manager asked me to judge

1. **markers on EngineState.** This is not a deviation. design/M3.md Modules (simulate.ts row) and ticket Scope item 3 both name `EngineState.markers`. `ages` stays on the private `Engine`, which is fine.
2. **`ageMarker(age: number)` with a cast inside markers.ts.** Acceptable. The design gives the signature only as `ageMarker(age, at)`. The `simulate.test.ts:699` literal ban is real: only 0, 1, 60 and 5 are allowed in simulate.ts. The cast is safe because `LANDMARK_CLASS = /^age[1-3]_landmark\d$/` (simulate.ts:23) plus `entry.age === state.age` caps the age reached at 4. Non-blocking note below.
3. **"Last age marker is Imperial" through test-edited data.** The ticket states it as a behavior inside an acceptance criterion; it does not require a committed test. I verified it with a scratch run, which I then deleted. Edited data: big starting resources, then build abbey-of-kings, kings-palace and wynguard-palace, plus wheelbarrow and textiles, with a 1800 s horizon.
   - `ages` reached at 100, 215 and 345 s.
   - Age markers `Feudal@100`, `Castle@215`, `Imperial@345`, each matching its `reachedAt`.
   - Research markers `other textiles@240` and `economy wheelbarrow@305`.
   - The list is sorted and every `at` is within the horizon.

   The criterion passes on that evidence. A committed test would be acceptance-test's call (note).
4. **Tech-to-kind mapping.** All twelve snapshot samples classify as the design table says, tested against loaded `english.json` entries. I also scanned every technology and upgrade entry in the snapshot:
   - No entry matches two of rows 1-3, as the design says.
   - Every baseId's entries share one kind, so `byBaseId[0]` in the test and the `researchEntry` pick in the engine cannot disagree.
   - Totals: economy 16, unit-tier 13, blacksmith 14, other 37.

   The check order is economy, then unit-tier, then blacksmith, then other, which is exactly the design's priority. The only game ids are the class and producer names the design names (`economic_upgrade`, `scar_unit_upgrade`, `upgrade`, `blacksmith`) and the fixed `AGE_NAMES`. A1 holds.
5. **Sort.** `compareMarkers` sorts by `at`, then `CHART_MARKER_KINDS` index (age-up first), then label. Equal markers return 0, and `Array.prototype.sort` is stable. The shipped english-1tc build gives `double-broadax` and `horticulture` both at 408.82 s. Both appear, label-ordered, so nothing is merged or dropped.
6. **The four pre-existing test edits** are exactly what Scope items 7 and 8 allow:
   - `result-series.test.ts`: `markers: []` only.
   - `data.acceptance.test.ts`:
     - count 27 to 29;
     - `ChartMarker` and `ChartMarkerKind` in the sorted type list;
     - `CHART_MARKER_KINDS` and `AGE_NAMES` appended in model.ts source order.
   - contract spec:
     - `ChartMarker` import;
     - `RESPONSE_SCHEMAS += ChartMarker` and `SHARED_SCHEMAS += ChartMarkerKind`;
     - `markers: true` in `simulationResult`;
     - the `chartMarker` literal and its `typeKeys` entry.
   - edges spec: `'markers'` only.

   No other assertion was edited, and no other entries were rewritten.
7. **Docs and OpenAPI.** No doc sentence the diff adds is contradicted by the code.
   - Doc bullet (docs/aoe4-build-order.md:547-554): kinds, classification order, label rule, sort order, no start-age marker, no marker for unfinished work, no effect on the simulation. All of it matches markers.ts and simulate.ts.
   - Research-section sentence (line 189) is accurate.
   - OpenAPI:
     - `ChartMarkerKind` enum is in `CHART_MARKER_KINDS` order;
     - `ChartMarker` has `additionalProperties: false`, all fields required, `at` minimum 0, and non-empty descriptions (jq all true);
     - `SimulationResult.required` includes `markers`, and its description is 111 chars;
     - the 200 example gains `markers: []`, which is consistent because its `ages` holds only the start age.

## Acceptance criteria (all 14 ticked in the ticket)

1. Twelve snapshot techs classify correctly: pass (`markers.test.ts` it.each on `ENGLISH` entries).
2. Priority pinned with hand-built entries, and the function never returns age-up: pass. The test also covers an upgrade with `economic_upgrade`, which makes the swap mutation fail. The return type excludes `'age-up'`.
3. `researchMarker`, `ageMarker(3, 804)` and `AGE_NAMES`: pass.
4. `compareMarkers` and the `CHART_MARKER_KINDS` order: pass.
5. Feudal marker at `reachedAt`, no start-age marker, first marker `Feudal`, last age marker `Imperial`: pass.
   - The committed test covers Feudal on edited data.
   - I checked the shipped english-1tc build at 600, 1200 and 3600 s. The first marker is `Feudal` at 262.57, equal to `ages[1].reachedAt`.
   - Imperial: scratch run described above.
6. Research marker at `completedAt`; in-progress research and an in-progress landmark give none; `[]` when nothing happened: pass.
   - Tested: in-progress research, in-progress landmark, empty list.
   - Not tested: waiting and not-reached research. Both hold by construction, since the push happens only in `researchItem.complete`.
7. Same-instant age-up plus research, age first, and two techs at once: pass (test; also the shipped-build tie).
8. `at <= durationSeconds`, sorted, each age and tech at most once: pass. My scratch runs show it, and validation rejects a repeated research.
9. No other change and only the allowed test edits: pass (see point 6 above; 768 unit tests green).
10. OpenAPI schemas, `required`, descriptions, `typeKeys` entry, live ajv check: pass.
11. Docs `markers` bullet: pass.
12. Greps: `ages.push` has one site (simulate.ts:314) with `markers.push(ageMarker` beside it (315); `researchMarker(` has one call site (research.ts:26); `researched.add` has one site (research.ts:25). Pass.
13. Mutations: pass (table above).
14. tsc and npm test: pass.

## Invariants touched

- **A1:** holds. No cost, time or rate literals. The labels come from `AGE_NAMES` or `entry.baseId`; the kinds come from snapshot classes, type and producedBy, as the design specifies.
- **A2:** untouched. Markers only append; no spend path changed.
- **A3:** holds. `at` is `state.time` at an event-loop completion; there is no wall clock and no randomness. The sort is deterministic and total, so equal markers are identical values.
- **S3:** holds. There is no new input. The list is bounded by the number of steps (capped) plus 3 ages.
- **S1:** holds. markers.ts imports only `./data` and `./model`.

## Bot reconciliation

No bot is configured (`reviewBot.cli` is empty).

## Non-blocking notes

- `markers.ts:23`: `AGE_NAMES[age as keyof typeof AGE_NAMES]` returns `undefined` for any age outside 2-4. That would surface only as an ajv or OpenAPI failure, never as a type error. It cannot happen today (LANDMARK_CLASS caps the age at 4). An alternative is to type the parameter `keyof typeof AGE_NAMES` and cast at the simulate.ts call site with `state.age as keyof typeof AGE_NAMES`, which uses no numeric literal. That would keep the type hole where the invariant is known. Optional.
- Test coverage that acceptance-test may want to add:
  - the Imperial case on edited data;
  - the shipped english-1tc build (the criterion says "shipped English build"; the committed test uses edited starting resources);
  - waiting and not-reached research steps giving no marker.

  I verified the behavior of all of these directly.
- docs/aoe4-build-order.md:189: the new sentence sits mid-paragraph, so the next "It waits..." now follows a sentence whose subject is "A completed research". It still reads correctly, but placing it after "...short of resources alone." would be cleaner.
- OpenAPI `ChartMarker.kind` description "Marker kind." restates the name. It meets the non-empty rule.

## Coverage

- **Files reviewed:** all 11 files in the diff:
  - model.ts, markers.ts, markers.test.ts, simulate.ts, research.ts;
  - openapi.json, docs/aoe4-build-order.md;
  - data.acceptance.test.ts, the contract spec, the edges spec, result-series.test.ts.
- **Siblings compared:**
  - depletion.ts:157 `sortWarnings`: same at-then-rank comparator shape.
  - model.ts field comments: same style as `depletions`.
  - research.ts and engine-common.ts: semicolons, 2-space indent.
  - Tests: 4-space indent, no semicolons, `test-helpers` usage, as in other `lib/aoe4-build-order/*.test.ts`.
- **REPO.md checklist:**
  - Every diff: `next build` passes; the page flow is covered by the 380 acceptance tests. I did not hand-load the page, which is unchanged.
  - AoE4: no copied helper or constant, and no doc sentence contradicted. Chart-overlap check not applicable (no chart rendering change).
- Nothing under `golang/` is touched. `components/**` has only the allowed one-line test edit.
