# SGS-029 acceptance-test 1: PASS

Branch sgs-029-aoe4-validate-build-order. Reviewed tip c9c1e86. Test file: lib/aoe4-build-order/validate.acceptance.test.ts (70 tests, all pass). Full `npm test` and `npx tsc --noEmit` pass. Harness: Vitest ran; there is no HTTP boundary yet (route is SGS-033).

## Tests (by contract)
- Exports: exactly validateBuildOrder, resolveSimInputs, SIM_INPUT_BOUNDS at runtime.
- Valid order from the ticket (including bloomery, shaft-mining) returns ok:true with the same order.
- Each issue code (syntax, unknown-trigger-kind, unknown-id incl. civ/unit/forestry-1/rally.to, unknown-tech-effect, unsupported-tech naming buildTime, out-of-range, invalid) with step naming.
- Bounds: min/max/just outside for trigger seconds/count, instance, produce/move count, builders, rally/move walkSeconds; 60.5, 1.5, Infinity; start.villagers -1 and 201; 200 steps pass, 201 gives one out-of-range; table values.
- Nine invalid rules, each with failing case and passing neighbour (sum 5/6/7; walkSeconds without rally; rally on scout; rally step on house/town-center; start without rally naming capital-town-center and no-start; build town-center and kings-palace with start.rally, earlier rally, earlier villager produce, instance source, later source; produce villager from house/kings-palace; research wheelbarrow at house/mill/none; repeat research incl. line N, three repeats, at ignored, textiles neighbour).
- Resolve-first: no-such-building, no-such-tech at house, and no-such-tech twice give only unknown-id.
- Issue location: JSON start has no step/line; lines.start; lines.steps[i]; short lines.steps omits line; no options no line.
- Hostile input: null, string, array, {}, number, undefined, null step, own __proto__ start.villagers key, none throw.
- resolveSimInputs: defaults for undefined/null/{} from data; buildGameData with changed walkSeconds and trips.farm.walkSecondsCamp flows through; per node-per field trips merge; influenceCoverage per key; 14 field-level rejections with path-naming messages and no step/line; non-object; bound edges accepted; mutating the result leaves data and later calls unchanged.

## Mutation checks (each broke validate.ts, confirmed test failure, restored; `git diff --exit-code` clean)
- Start sum rule disabled: 3 failures. Repeat research disabled: 1. start.rally check removed from build rule: 2. Rally with instance counted as source: 2. Upper bound loosened by 1: 15. steps cap 201: 2. `in` instead of hasOwn for nodes: 1 (__proto__). Duration default changed: 3. Capability resolve gate removed: 2. influenceCoverage default merge removed: 5.
- Not mutation-checked: the fresh-copy test (one attempted break was a no-op and passed; no other break was run for it).

## Failures
None. No impl-defect or spec-gap found.

## Not expressed
HTTP route behavior, textChars enforcement (route, SGS-033), doc-paragraph criteria (not testable through the module boundary).

New branch tip: see commit below.
