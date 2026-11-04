# SGS-093: Tidy AoE4 docs wording, prebuilt build data and tests, and the OpenAPI 200 examples

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage, 2026-11-03: doc hygiene)
- **Priority**: low
- **Risk**: standard
  <!-- No engine, route or schema change, so no strongModelTriggers item and no criticalPaths symbol applies.
       Standard, not low: it edits a shipped prebuilt build file (A3) and the public OpenAPI document, and it
       touches files SGS-081 also edits. -->
- **Invariants**: A3 (a prebuilt build stays deterministic; removing a rally step must leave the result unchanged);
  A1 not touched
- **LOC estimate**: 0 business-logic lines. One build JSON step removed; one test case added in `builds.test.ts`;
  contract spec loop widened; OpenAPI JSON gains a second request/200 example pair; wording and line wraps in
  `docs/aoe4-build-order.md` and `data/aoe4-build-order/README.md`
- **Depends on**: SGS-081 (open PR, branch `sgs-081-aoe4-retune-prebuilt-farms`; it rewrites the build files, the
  README Prebuilt-builds section, the doc paragraph on prebuilt builds, and `builds.test.ts`). Describe all of those as
  SGS-081 leaves them; branch from `main` once SGS-081 is integrated.
- **On merge**: none. When this ticket integrates the manager deletes BACKLOG.md lines for the covered bullets
  (the bullets starting `docs/aoe4-build-order.md (~lines 64-66 and 548)`, `docs/aoe4-build-order.md:147`,
  `docs/api/openapi.json has one 200 example`, `data/aoe4-build-order/README.md Prebuilt builds (knight entry)`,
  `Spear build (...)`, `data/aoe4-build-order/README.md:102`)
- **Source**: BACKLOG.md bullets at lines 36, 38, 40, 70, 77, 78 (SGS-038, SGS-042, SGS-054, SGS-079, SGS-081 reviews)

## Context

Six small leftovers from earlier reviews, all in the AoE4 docs, the prebuilt build data and their tests. None changes
engine behavior. The bullets were written against older code, so each item below states what the code looks like at
the SGS-081 end state and what to do from there.

## Scope

Paths are relative to the repo root. Name code by symbol; line numbers are for orientation only.

**1. `docs/aoe4-build-order.md` wording (bullets 36 and 38).**
- Per-key input merge (bullet 36): the sentence in the input-limits section ("Every omitted `inputs` field takes its
  default at any depth ...") already names `nodeAmounts` on `main`. Verify it still lists every per-key merged field
  of `SimInputOverrides` (`trips` per node then field; `influenceCoverage` and `nodeAmounts` per key) and edit only
  if one is missing.
- "idle" (bullet 36): the doc must use "idle" for one thing only, a villager standing at a node with nothing to
  gather (a run-out node, or `farm` with every built farm taken; see the Idle villagers paragraph). A villager in
  transit is "walking". Audit every use of "idle" in the doc against that. Known case: the intro sentence "Every
  quantity that could vary between games (walk time, idle time, distance to each resource) is a named simulator
  input" names an "idle time" that no input has (`rules/base.json` and `SimInputs` have none); replace it with a
  quantity that is a named input (for example drop-off time, `dropOffSeconds`). The uses "gathering or idle" and
  "walking or idle" (`spawnedPopulation`) already keep the two meanings apart; leave them.
- "Ordering and triggers" (bullet 38): the sentence "Once armed, it waits while any check in the wait reasons table
  (Outputs) fails, then starts" already replaced the old partial list on `main`. Verify it, and that the table it
  names exists under that name; edit only if not.

**2. OpenAPI 200 examples (bullet 40).** `docs/api/openapi.json`, `POST /api/aoe4-build-order/simulate`, response
`200`: today one `example` (empty `warnings` and `markers`, every `depletedAt` null), paired by
`acceptance/aoe4-simulate-api-contract.spec.ts` (`okExample`) with the request example `buildOrder`.
- Convert the 200 media type to a named `examples` map (same shape as the 400 `examples`), keeping the current body
  under the key `buildOrder`, and add a second request example under `requestBody...examples` with a second 200
  example under the same key. The new request is a short build (a duration that keeps the sampled arrays short, as the
  existing one does) that makes its result show a non-empty `warnings` (a `node-depleted` or `idle-arrival` entry), a
  non-empty `markers` entry and a numbered deposit ref (for example `gold#2`, with a small
  `inputs.nodeAmounts` entry so the deposit runs out inside the duration) with a non-null `depletedAt`. The implementer
  picks the build and the key name and records the response body the engine returns; nothing is computed by hand.
- Update the contract spec: `okExample` becomes the examples map; "every example validates against its schema"
  validates every 200 example as `SimulationResult`; the test `the ${name} request example returns the documented 200
  body` loops over every request example name (today `['buildOrder']`) and compares to the 200 example of the same
  name; add a check that the request-example keys equal the 200-example keys, as the 400 examples already have
  (`every 400 example has a request that reproduces it`).
- Any other place that reads the 200 `example` of this operation (grep `responses['200']` under `acceptance/`) moves
  with it; the fight operation is untouched.

**3. Prebuilt build data and tests (bullets 77 and 78).**
- Redundant rally (bullet 77): a `rally` step that repeats the producer's current rally node is dead weight only
  when removing it leaves the result unchanged; a time-triggered one can also hold later steps back until its time. At
  SGS-081's tip, in `english-spear-longbow-maa-crossbow.json`, the author probed both
  candidates at 1200 s and 3600 s: removing the Town Center rally to wood at 380 s (the second one after the 200 s rally
  to wood, 0-based index 31 at that tip) leaves every series, warning, depletion and step time unchanged, while removing
  the one at 260 s (index 14, the step the backlog names) changes the result (it gates the steps after it), so
  it stays. Remove the redundant rally(s) on this basis: for every Town Center or King's Palace `rally` step in the
  file, remove it if and only if simulating without it, at 1200 s and 3600 s, yields the same result apart from the
  `steps` array (compare after dropping the removed step's entry; step timings of the other steps must also be
  equal). Record the comparison in the report. Update everything that locates a step of this build by index (examples:
  `MAN_AT_ARMS_STEP` in `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`; any pinned step index in
  `lib/aoe4-build-order/builds.test.ts`, `simulate-house-warnings.test.ts`, `acceptance/aoe4-simulate-api-prebuilt-*.spec.ts`,
  `acceptance/aoe4-build-order.spec.ts`); prefer locating the step by action and id over a new index. A pinned digest or
  step count of the spear build that the removal moves is re-pinned to the engine's value, and the implementer lists
  every test edited. If the README entry's description of the rally times (the Town Center paragraph under the
  spear/longbow entry) stops being true, fix it; it describes rallies by node and time, never by step number.
- Gold run-out pin (bullet 77): add a case to the `describe('ENG Spear/Longbow into MAA/Crossbow')` block in
  `lib/aoe4-build-order/builds.test.ts` that simulates to 1800 s and pins the first gold deposit's `depletedAt` with
  `toBe` to the exact value the engine returns once the build is as left by this ticket (the implementer records it in
  the report), and that the second gold deposit has not run out. The number lives only in the test, never in a doc.
  (The backlog's 1322.95 is from an earlier version of the build; do not copy it.)
- Line wraps (bullets 77, 78): in `docs/aoe4-build-order.md`, the paragraph that begins "Prebuilt builds live in
  `data/aoe4-build-order/builds/`" (SGS-081 added a run-on line there and put `ENG 1TC` alone on a line), and in
  `data/aoe4-build-order/README.md`, the Prebuilt builds section (the spear entry's "The trigger is hard-coded ..."
  and `Farms:`/`Production:` paragraphs, the knight entry's long lines, and the line that is the 174-character one in
  the backlog): reflow so the prose wraps like its neighbours. Wording is unchanged by the reflow except where items 1
  and 4 say otherwise.

**4. README knight entry (bullet 70).** `data/aoe4-build-order/README.md`, the `english-knight-longbow` entry says
"Three explicit houses are built before the King's Palace ... until the third of these (step 24) starts". The build has
explicit `build house` steps early and a block just before `build kings-palace`, and the engine rule (doc "Houses and
supply") is that auto-houses stay off until the **last** `build house` step has started. Reword the sentence to say that
rule, without a step number and without a count of houses, and without a count of warnings (say the run can carry an
`auto-houses-held` warning while production waits at the supply limit before that step starts, matching the doc).
Every claim must hold against the build file and be re-checked after item 3.

**Out of scope:** `design/M4.md` (BACKLOG line 49, factory state); the `boundingBox()` bullet (line 79); the other
BACKLOG bullets; any engine, schema, route or data-number change; changing the farm, production or floor tuning SGS-081
sets (the only build edit is the redundant rally in item 3); measured values in any doc (docs state behavior; test pins
live in tests).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The intro sentence in `docs/aoe4-build-order.md` no longer lists "idle time" among the named inputs, and every
  remaining use of "idle" in the doc refers to a villager at a node with nothing to gather (walking villagers are
  "walking"). Check: `git grep -n -i "idle" docs/aoe4-build-order.md` read line by line, listed in the report.
- [ ] The per-key input-merge sentence names every per-key merged field of `SimInputOverrides`, and the "Ordering and
  triggers" paragraph points at the wait reasons table without a partial list of reasons; the report says whether either
  needed an edit.
- [ ] `docs/api/openapi.json` has at least two named 200 examples for the simulate operation, request examples with
  the same keys, and one of the 200 examples has a non-empty `warnings`, a non-empty `markers` and a `depletions` entry
  for a numbered deposit with a non-null `depletedAt`. `npm run acceptance -- acceptance/aoe4-simulate-api-contract.spec.ts`
  passes: every 200 example validates as `SimulationResult` and equals the real response to the request example of
  the same name.
- [ ] Mutation: change one value inside the new 200 example (a `warnings[0].at`, or the marker `at`); the contract spec's
  "returns the documented 200 body" case for that key fails. Delete the new request example's key; the key-equality
  case fails.
- [ ] Every Town Center and King's Palace `rally` step left in `english-spear-longbow-maa-crossbow.json` is one whose
  removal changes the result at 1200 s or 3600 s; the removed rally(s) left every series, warning, depletion and the
  other steps' times unchanged (comparison recorded in the report). The build still re-parses from its paste text to
  the same `start` and `steps`, and the build-quality cases in `builds.test.ts` pass unchanged.
- [ ] No test or spec locates a step of the spear build by an index that the removal made stale; `npm test` and the
  acceptance specs that read the spear build pass. The implementer lists every test edited and why.
- [ ] A new case in `builds.test.ts` pins the spear build's first gold `depletedAt` at 1800 s with `toBe` and asserts
  the second gold deposit is not yet run out. Mutation (throwaway worktree): change the 130 s Town Center rally to
  gold in the build file to a different time; that case fails. No doc states the value.
- [ ] In `docs/aoe4-build-order.md` (the prebuilt-builds paragraph) and `data/aoe4-build-order/README.md` (Prebuilt
  builds section) no prose line is longer than 110 characters unless it holds one unbreakable token (a URL or code
  span), and `ENG 1TC` is not alone on a line mid-sentence. Check:
  `awk 'length>110{print FILENAME": "FNR": "length}' data/aoe4-build-order/README.md docs/aoe4-build-order.md`
  restricted to those sections prints nothing else.
- [ ] The knight README entry names no `step N` index and no count of explicit houses; it says auto-houses stay off
  until the last explicit `build house` step starts, and in `english-knight-longbow.json` that step precedes the
  `build kings-palace` step. Check: `git grep -n "step 2" data/aoe4-build-order/README.md` finds nothing in that entry.
- [ ] No measured value (time, count, rate) is added to any doc or README.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
