# SGS-013 review 1

- Branch `sgs-013-aoe4-design-doc`, tip b9c9dc4 (not pushed; reviewed in the implementer worktree, detached at b9c9dc4, read-only), base 0b985f3. `origin/main` is 43a0331; its only change since base is ARCHITECTURE.md Stack lines, so there is no overlap with this diff.
- Diff: one new file, `docs/aoe4-build-order.md` (424 lines).
- Verdict: **REQUEST CHANGES** (3 blocking findings, all small text fixes)

## Blocking findings

1. `docs/aoe4-build-order.md:94-95` - contract (criterion "Decisions coverage") - The doc drops the calibration rule from the CONTEXT.md "AoE4 gather rates" Decision: "Defaults are tuned so effective rates land near SichYuriy/aoe4-production-calculator's (net) values". The doc says only that the calculator is "a labeled cross-check in a test only. They are never a source of data." - Why it matters: On merge deletes that Decision line, which would leave this doc as the only statement of the gather-rate rules. SGS-014 Scope (ticket lines 83-86) derives the trip seeds in `rules/base.json` from the calculator's net rates and gives "calculator ... derived" as their `source`. If this doc says "never a source" and omits the tuning rule, the data ticket will look like it contradicts the design doc. The rule is also not restated anywhere else in the doc. - Direction: add one sentence saying the trip defaults (walk and drop-off seconds) in `rules/base.json` are tuned so that effective rates land near the calculator's net values. Keep "never a source" scoped to the raw per-resource rates.

2. `docs/aoe4-build-order.md:77-79` and `172-178` - contract (criterion "Decisions coverage") - Two CONTEXT.md Decisions that On merge deletes say specific hand-entered values are labeled unverified:
   - "AoE4 auto-houses": "Supply values (start, per house, max 200) are hand-entered and labeled unverified".
   - "AoE4 v1 coverage and structure": "Hand-entered values (starting resources/units, supply, landmark effects, farm bonus, walk and drop-off defaults) are labeled unverified".

   The doc labels only the farm bonus and the 5 s walk as unverified. For everything else it says "the rules files are the record". - Why it matters: criterion 12 requires every rule in each deleted line to appear in the doc. Without these sentences the rules exist only in SGS-014's ticket text. - Direction: add one sentence: supply, the starting state, overlay effect rows, and the trip walk and drop-off defaults are labeled unverified. This does not say *all* hand values are unverified, so it stays consistent with the carry-capacity sentence and with criterion 10.

3. `docs/aoe4-build-order.md:308-311` - contract (invented rule) - The issue-code glosses go beyond design/M2.md:
   - `syntax` is "paste text that does not match the grammar".
   - `invalid` is "a well-formed step that breaks a rule above".

   Taken together, they leave no code for a JSON step of the wrong shape: a missing `producer`, a string `count`, or an unknown `action`. The design names no code for that case. Its `validate.ts` owns "shape", and the only non-paste catch-all code is `invalid`. The words "well-formed" exclude that case, and that narrowing appears nowhere in design/M2.md. - Why it matters: the validate ticket will be reviewed against this doc. Whichever code it picks for a JSON shape error will either break the `invalid` gloss or leave an issue with no listed code. - Direction: remove "well-formed" (for example, "`invalid` (a step that breaks a rule of the input model)"), or drop the `syntax`/`invalid` glosses and use the design's own examples. Do not choose a code for JSON shape errors in the doc. If the doc should name one, that is a designer decision for design/M2.md (see Spec gaps).

## Spec gaps (not blocking this ticket)

- design/M2.md does not say which `BuildOrderIssue.code` applies to (a) a JSON step of the wrong shape or with an unknown `action`, and (b) a villager `produce` without `rally`. For (b), the design says rally is required but names no code; under the doc's current gloss it would be `invalid`. The designer should decide before the validate/parser ticket and add the answer to design/M2.md Contracts. The doc can then restate it.
- design/M2.md does not say whether `times` includes t=0 and the horizon itself. The doc's "every `sampleSeconds` up to the horizon" (line 349) is a fair restatement, but it leaves the endpoints open for the engine ticket.

## Implementer-flagged inferences, judged

| statement | doc line | verdict |
|---|---|---|
| A step without a trigger arms as soon as earlier steps have started | 122-123 | Derived: design `Trigger` "omitted = no condition", plus the arming rule. Fine. |
| `times` samples every `sampleSeconds` up to the horizon | 349 | Derived from `sampleSeconds` = 5 and the horizon. Fine. Endpoints open (spec gap above). |
| Any issue stops the request; nothing is simulated | 39, 312 | Derived from the 200-or-400 contract (`SimulateError` carries issues, not a result). Fine. |
| Issue-code glosses | 308-311 | `unknown-id` and `out-of-range` are fine. `syntax`/`invalid` together are an invented narrowing (finding 3). |
| Refreshing the snapshot replaces it and records the new commit and patch | 106-107 | Derived from the patch policy ("current game only", commit/patch recorded). Fine. |
| No code for a villager `produce` without rally | 255 | Correct not to invent one. Note that the current `invalid` gloss implicitly covers it (spec gap above). |

## Acceptance criteria

1. Exists, sections 1-10 as `##`, 300-450 lines: PASS (10 `##` headings in Scope order; 424 lines).
2. Hygiene grep: PASS (no output, exit 1). No "Recharts" anywhere.
3. Mermaid count >= 2: PASS (2).
4. Diagram labeled conceptual, mapping table, Outputs lists four statuses: PASS (lines 357, 367-386).
5. Contract names match design exactly; no name the design lacks: PASS. Note: line 212 uses `forestry` (a valid baseId) where line 229 and the design use `forestry-1` (the id). Both exist in the snapshot. See notes.
6. `startingState` fields, 7/10, never in `unitsProduced`, hook overrides the whole object, sheep are a node: PASS (112-118, 352-353).
7. Engine rules, `classifyTech` order, grammar table and details agree with design line by line: PASS. I diffed every engine-rule bullet, the classifyTech steps (including "reached or not, in step order" and `effects-unmodeled`), the paste table (identical) and every grammar detail. Wording differs only in rephrasing.
8. Paste examples parse and use English-snapshot ids: PASS. Verified against aoe4world/data at e89f01e: `villager`, `town-center`, `house`, `mill`, `wheelbarrow` (producedBy `mill`), `council-hall` (`age1_landmark2`), `archery-range`, `longbowman`, `veteran-longbowmen` (upgrade, age 3; longbowman has an age-3 entry), `scout`, `kings-palace`, `forestry` (id `forestry-1`, property `unknown`), `shaft-mining` (empty effects), `military-academy` and `lightweight-beams` (`buildTime`) all exist with the stated properties. Each example line matches the grammar (suffix order, `walk Ns` last, `#k`, `xN`).
9. Bounds table row for row; out-of-range for JSON and paste alike: PASS (lines 41-56 match design rows 189-199; the two rationales are reworded).
10. Numbers match sources; labels: PASS. Every listed number traces to CONTEXT or design. The doc labels gather rates, builder scaling, farm bonus and 5 s walk unverified, never says all hand values are unverified, and never calls carry capacities unverified.
11. No unsourced hand values: PASS. There are no deer/boar rates, trip seconds, supply start/per-house values, starting resources or villager placement. `maxPopCap` 200 and 6 villagers + 1 scout come from CONTEXT/design.
12. Decisions coverage line by line: **FAIL** (findings 1, 2). Per line:
    - AoE4 model scope: covered (17-24, 172-178).
    - AoE4 simulation: covered (26-28, 32-33, 418 incl. seed).
    - AoE4 game data: covered (62-67).
    - AoE4 gather rates: **missing the tuning rule** (finding 1). Rates, capacities, trip model and per-node walk/drop-off inputs are covered.
    - AoE4 builder scaling: covered (88-89, 165-170).
    - AoE4 auto-houses: covered **except supply labeled unverified** (finding 2).
    - AoE4 triggers: covered (120-125, 261-262, 417).
    - AoE4 outputs: covered (363-364).
    - AoE4 patch policy: covered (106-107).
    - AoE4 v1 coverage and structure: list covered item for item, engine/overlay/CivRules/ids covered, **except the per-category unverified labels** (finding 2).

    Deletion is safe for 7 of 10 lines now. "AoE4 gather rates", "AoE4 auto-houses" and "AoE4 v1 coverage and structure" become safe once findings 1 and 2 are fixed. Keeping "AoE4 interface" is correct.
13. A1, A2, A3, S3 one sentence each with an observable consequence: PASS (32-39).
14. v1 coverage and out list match CONTEXT item for item: PASS (198-218). The added "(deer and boar)" and "production speed" are clarifications, not new items.
15. Only `docs/aoe4-build-order.md` changes: PASS.
16. No INVARIANTS regressions: PASS (doc-only; A1-A3 and S3 restated faithfully).

Criteria were not ticked because the verdict is not APPROVE.

## Invariants touched

- A1, A2, A3, S3: stated, not changed. All hold. S1/S2, W*, H*: not touched.

## Lint

`npx tsc --noEmit` at b9c9dc4: exit 0. No ESLint config exists. The diff is Markdown only.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md. No bot was run.

## Conventions

The doc follows `docs/combat-simulator.md:1-17` (title, one-paragraph lead, "Reviews judge ... against this doc", one `##` per topic, flat rule statements). File placement matches ARCHITECTURE.md "Where files go" (`docs/<app>.md`) and "Adding an app" step 1. Shipped text has no hygiene leaks.

## Non-blocking notes

- Line 212 uses `forestry`, while line 229 and CONTEXT/design use `forestry-1`. Both are valid (baseId vs id), but pick one for consistency. The baseId fits the coverage list's "Ids are baseIds" rule; `forestry-1` matches the source.
- Line 77, "Every hand-entered value is a `HandValue`": overlay rows are `OverlayEffect`s with their own `source`/`unverified` fields, not `HandValue`s. Line 186 already says so. "a `HandValue` or an `OverlayEffect` row" would be exact. The design's "every hand-entered leaf" has the same imprecision.
- Lines 278 and 286 use `town-center` as the villager producer. SGS-014 makes the English starting building `capital-town-center`, so `produce villager from town-center` names no existing building at t=0. The examples are marked "each line stands alone" and pass the criterion. Switching to `capital-town-center` (a real English baseId, producedBy for villager) would show a realistic opening without stating any starting value.
- Line 351, "`tier`, the entry's age" can read as two fields. "`tier` (the entry's age)" is clearer.
- Line 172, "the supply each building provides": reading `supply` as keyed by building baseId matches SGS-014 and `GameData.supply`. The design types it only as `Record<string, ...>`. Acceptable.

## Coverage

- Reviewed: all 424 lines of `docs/aoe4-build-order.md`, against design/M2.md (all 294 lines), CONTEXT.md Decisions, INVARIANTS.md, spec-checklist.md, ARCHITECTURE.md, `docs/combat-simulator.md`, the SGS-013 ticket, the implementer report, and SGS-014's labeling and trip-seed scope.
- Snapshot ids verified against raw aoe4world/data at commit e89f01e.
- REPO.md "Every diff": no page or code was touched, so `next build`/`npm run dev` page loads do not apply. The implementer reports `next build` passing; I did not rerun it. No path-scoped checklist section applies to `docs/`.
- No REVIEW.md exists at the repo root.
