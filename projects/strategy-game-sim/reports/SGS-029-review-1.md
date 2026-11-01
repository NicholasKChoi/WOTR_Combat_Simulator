# SGS-029 review 1

- Branch: `sgs-029-aoe4-validate-build-order` @ c9c1e86, base 16f757f (full review, first review)
- Worktree: detached at c9c1e86 under `$FACTORY_DIR/worktrees/review-sgs-029` (removed after review)
- **Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None. The diff matches design/M2.md Contracts: the Line map result shapes, Issue codes, Rally and start, Producer capability, Repeat research, the bounds table, and the Route request `inputs` merge rule.

## Acceptance criteria (all ticked in the ticket)

1. Exports: pass. `git grep -nE "^export "` lists exactly four (validate.ts:17, 47, 318, 389). The result unions are inline and unnamed, and they match design M2.md lines 97-99. Imports are only `./data`, `./effects` and `./model`, with no `parse-text`.
2. Valid order: pass (validate.test.ts:44-53, `toEqual({ ok: true, order: input })`).
3. Every issue code with a message naming the step and id: pass. syntax at :69-101, unknown-trigger-kind at :110, unknown-id at :116-142 (unit, producer, building, tech `forestry-1`, a unit used as a tech, `at`, node, `rally.to`, `__proto__`, civ, start key, start.rally), unsupported-tech and unknown-tech-effect at :144-153, out-of-range at :160-201, invalid at :209-319.
4. `bloomery` and `shaft-mining` accepted: pass (:55-57).
5. Bounds at min, max and just outside: pass for every step, start and inputs row. Covered: rally walkSeconds 60 and 60.5, non-integer count, Infinity and NaN, start.villagers -1, 201 and 1.5, 200 steps accepted and 201 giving one issue. `textChars` is only checked for its value (20000). The route enforces it, per the ticket's Out of scope.
6. Nine `invalid` rules, each with a failing case and a passing neighbour: pass (:212-311). The build rule covers both `town-center` and `kings-palace`, plus the instance-scoped and later-source cases.
7. Resolve-first: pass (:296-299, :313-318). I also checked that a rejected tech (`forestry` twice) gives two tech issues and no `invalid`.
8. Issue location: pass (:325-348).
9. No throw on hostile input: pass (:371-378). I also probed `{action:'toString'}`, `tech:'constructor'` and `trips.constructor`. Each is rejected correctly, because lookups go through `Object.hasOwn` and `Map`.
10. `resolveSimInputs`: pass (:381-511). Defaults come from data (`buildGameData` with a mutated `base.json`). The trips merge goes per node and then per field, influenceCoverage merges per key, every field has its syntax, out-of-range and unknown-id cases, and results are fresh copies.
11. Doc: pass. The paragraph at docs/aoe4-build-order.md:60-64 is present. The Issues list says "six" rally/start rules plus "Three more", which makes nine (:372-394), and states that the simulator assumes them. Every sentence that mentions `validateBuildOrder`, `resolveSimInputs` or `SIM_INPUT_BOUNDS` (:39, :369, :404) agrees with the code and with design M2.md.
12. `npx tsc --noEmit`: clean. `npm test`: 11 files, 229 tests pass. I ran both myself after `npm ci` on Node v24.22.2.
13. Invariants: pass (see below).

## Invariants touched

- S3 holds. Every numeric field of a step, `start`, a trigger and `inputs` goes through `outOfRange` against `SIM_INPUT_BOUNDS`, which also catches non-finite and non-integer values. More than 200 steps skips the per-step work (validate.ts:184-190). The caps are frozen literals.
- A1 holds. There are no game numbers in validate.ts. The trip and walk defaults are read from `data.base` on each call (:352-360, :415). The starting count and buildings come from `data.civData` (:205, :228). Villager producers come from `producedBy` (:168). The remaining literals are request caps and input defaults (1200, true, 1, 'wood', {mill:1}), and the ticket names those as private constants.
- A3 holds. There is no clock or randomness (grep for `Math.random`, `Date` and `performance` finds nothing). Output depends only on the input and the data, and `GameData` is never mutated.
- A2, S1, S2, W1 and W2 are not touched. The diff imports only from its own app.

## Gate-1 notes

- A tech is classified only after its type check, and the first rejection wins. Pass: `isKnownId(tech)` runs first, `entriesOf(..., 'tech')` filters to technology and upgrade entries before `classifyTech`, and the code returns on the first `rejected` (validate.ts:270-281).
- The 200 caps are hard-coded in SIM_INPUT_BOUNDS. Pass (:17-33), with a one-line rejected-alternative comment at :15-16, which is within the comment bar.
- Issues come out in field declaration order. Pass. Top-level fields come first (civ, name, source, start shape, steps), then the start rules, then the steps. Within a step the trigger comes first, then the fields in `STEP_FIELDS` order (which matches the `BuildStep` declaration in model.ts:13-21), then the cross-field rules. resolveSimInputs follows the `SimInputs` declaration order. Tested at :350-369 and :499-502.
- The starting-building issue has its own test. Pass (:241-248), including a passing neighbour with a starting state that has no producer.
- LOC: validate.ts is 422 lines against the ~330 estimate. That is justified. The code is dense rather than padded: there are no single-call helpers with longer docs than bodies, and the overrun comes from the three respecs (nine invalid rules instead of six, and the depth-wise merge). Splitting it further would hurt readability.

## Linter

`npx tsc --noEmit` reports no issues. No ESLint is configured (REPO.md).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Conventions against nearby code

- validate.ts compared with effects.ts:1-80 and data.ts:105-160. It matches their 2-space indent with semicolons, `import type`, module-level `const` sets and maps, and private helpers above the exports. It throws nothing, which the contract requires, whereas `data.ts` throws on corrupt data files, which is a different situation.
- validate.test.ts compared with effects.test.ts:1-40. It matches the 4-space indent with no semicolons, `loadGameData('english')` at module level, `describe`/`it.each` tables and the `{ ...data, civData: {...} }` override style (effects.test.ts:12-13 against validate.test.ts:246).
- Messages follow `<where>: <text>`, which is consistent across the file. There is no logging in lib code, as in its siblings.
- Shared helpers: none are reimplemented. `classifyTech` is reused, and lookups go through `byBaseId`.

## Correctness review

I traced each rule's guard direction:
- walkSeconds without rally (:292);
- the build rule `!hasStartRally && !rallySources.has` (:300);
- rally sources added only with no `instance` (:294, :297), and only after the build check for earlier steps, because steps are processed in order;
- repeat research keeps the first index (:312-314);
- capability gated on `resolved` (:289, :309);
- the steps cap `>` max, so 200 is accepted (:184);
- the start-villagers sum, checked only when the villagers have no other issue (:229);
- `start.villagers: {}` sums to 0, which is invalid, consistent with design "replaces the civ split whole".

There are no resources, locks or async code.

REPO.md Review checklist, Every diff: no page is touched, so there is nothing to load in the dev server. `npx next build` succeeds (I ran it). None of the Combat simulator, Starcraft or Shared code sections apply. The AoE4 component has no Review checklist section in REPO.md yet (noted under Coverage).

## Non-blocking notes

1. validate.ts:189: `steps.forEach` skips holes, so a sparse array returns `ok: true` with holes. My probe `validateBuildOrder(order(new Array(3)), data)` gave `{"ok":true,...,"steps":[null,null,null]}`. Neither JSON.parse nor the paste parser can produce holes, so no real input path reaches this. It only breaks the "whatever input" spirit for direct TS callers. Direction, if anyone touches it: `for (let i = 0; i < steps.length; i++)`.
2. validate.ts:218 and :361/:377: `start.villagers`, `trips` and `influenceCoverage` keys are unbounded in number, and each produces one issue. The 1 MB body limit bounds the work, so S3 is not at risk. It could, however, return a very large issues array for a hostile body. If wanted, the route (SGS-033) can cap how many issues it returns.
3. A present but mistyped or unknown `start.rally` counts as a rally for the starting-building and build rules (:199-203). This is a deliberate choice that avoids cascading issues, and the order already fails on its first issue. It is fine.
4. For SGS-033, from the implementer: with `strict: false`, `!result.ok` does not narrow the union. Use `result.ok === false`.

## Coverage

- Reviewed in full: lib/aoe4-build-order/validate.ts, lib/aoe4-build-order/validate.test.ts, the docs/aoe4-build-order.md diff, plus the sections it edits (:30-64, :350-396).
- Read for context: model.ts, effects.ts, data.ts (GameData), effects.test.ts, ARCHITECTURE.md, tsconfig.json, and design M2.md (Modules, Line map, Issue codes, Rally and start, Producer capability, Repeat research, Route and bounds table, Route request and issues).
- Ran: `npm ci`, `npx tsc --noEmit`, `npm test` (229 pass), `npx next build`, an ad hoc probe test (deleted afterwards), and `git merge-tree` against origin/main 72d74a0 (clean).
- REPO.md has no Review checklist section for the AoE4 paths. That is not a blocker, but it is worth adding when the page lands.
- Not reviewed: SGS-028 (parser), which is a separate branch. This diff does not import it.
