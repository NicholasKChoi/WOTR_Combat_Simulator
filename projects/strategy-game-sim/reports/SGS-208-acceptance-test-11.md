# SGS-208 acceptance-test (11)

Branch `sgs-208-repeat-build-or-move-step`, input tip 68572a8, new tip `8d8267a965e224f659daee7ebc8303347db98e4a` (one commit, test file only). Verdict: PASS, no failures.

## Tests written
New `acceptance/aoe4-simulate-api-repeat-checks.spec.ts` (14 tests plus rows), through POST /api/aoe4-build-order/simulate. Left uncovered by the existing `aoe4-simulate-api-repeat.spec.ts`, which was not changed.
- Bad `repeat` is one issue on its step: rows `"3"`, `true`, `null` (syntax); `0`, `201`, `2.5`, `-1` (out-of-range).
- `repeat: 1` gives one copy (source 1, copy 1); `repeat: 200` accepted with 200 timings.
- `repeat` on produce, research, rally, pause: one `invalid` issue on that step naming the action; each first checked valid without `repeat`.
- Expanded cap: exactly 200 accepted (199+1 and 100+100); 201 gives exactly `{code:'out-of-range', message:'steps: 201 steps after repeats, more than 200'}` with no step and no line; the cap issue is suppressed by a field issue on another step.
- Stuck copy: a repeated move reports a `step-stuck` whose message is `step 2 (move, copy k of 5)`, `step` equal to the waiting timing's expanded index, and exact status/waitingOn per copy (completed, waiting on villagers, not-reached with earlier-step).
- Stuck single-copy step after a repeated step: no `repeat` and `repeat: 1` give the same plain message numbered by submitted position (`step 2 (move)`) with `step` 3.
- Note on a research step (bloomery) after a repeated step has expanded index 4.
- Same repeated order twice gives an equal response.

## Run
Harness provisioned (`acceptance:setup`, Chromium). Final run: 163 passed across the new spec, `aoe4-simulate-api-repeat`, `-contract`, `-issue-shape`, `-checks`, `aoe4-gathered-resources`, `aoe4-builds-api-contract`, `aoe4-named-builds-api-contract` (the touched component's specs and the version-pin specs). `--repeat-each=2/3` on the two repeat specs was stable. `npx tsc --noEmit` and `npm run lint:dup` pass (0 clones, after changing constants that duplicated the existing repeat spec).

## Mutation checks (production file, break, failing test; each reverted with `git checkout -- <file>`, tree clean after each)
- `schema.ts:43` bound(0,200): row `0` fails. bound(1,201): row `201`. bound(1,200,false): row `2.5`. bound(1,199): the repeat-200 test. Row `-1`: no break fails it alone (any min that admits -1 admits 0); it shares the min check with `0`, kept as a separate input.
- `schema.ts:411` union adding string / boolean / null: rows `"3"` / `true` / `null` each fail (with the number rows, since the union changes their issues too).
- `schema.ts:386` flag only research (produce, rally, pause rows fail); flag only produce (research row fails); message drops the action name (all four rows fail).
- `schema.ts:577` count uses `steps.length`: the 201 test fails. `>=` for `>`: the 200-accepted tests fail. Skip `failed('steps')`: the suppression test fails.
- `repeat.ts:12` split rows (repeat >= 100 counts one extra): the 100+100 assertion's test fails. `repeatCount` adds 1 for `repeat: 1`: the repeat-1 test and the plain-form stuck test fail. `copy < repeatCount` fails the repeat-200 test.
- `simulate.ts` stuck message: `source + 1` -> `step + 1` (both stuck tests fail); `copies > 1` -> `>= 1` (plain-form test); `n` from the expanded step count (stuck-copy test); `copies = 2` (both); copy number off by one (stuck-copy test); warning `step` set to source (both).
- `simulate.ts` final waitingOn: `earlier-step` -> `trigger` fails the stuck-copy status assertion.
- `simulate.ts` notes read the submitted order: the note test fails. A random offset on `copy` fails the same-input test.
- Deleted as unfailable: `expect(copy).toBeGreaterThan(1)` guard and the `issues[0].step` assertion in the suppression test (no break reaches them independently). The research-copy-after-repeat `steps[4]` check failed under the `source + 1` break.
- An earlier draft of the stuck-copy test had a wrong expectation (my own); the first mutation results for it were discarded and every stuck mutation above was rerun after the fix.

## Failures
None. No impl-defect or spec-gap.

## Not expressible
None; the criteria at the HTTP boundary are covered by this and the existing spec. The unit-level criteria (expandRepeats, equivalence, schema table) are the implementer's unit tests, reviewed in review 10.
