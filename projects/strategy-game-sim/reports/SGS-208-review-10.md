# SGS-208 review (10)

- Branch `sgs-208-repeat-build-or-move-step`, tip `68572a81ecbdaa82ca341604180243c88fa88848`, base `origin/main` @ d80751b (merge base). Full review, not delta mode.
- Scratch: `worktrees/review-sgs-208-repeat-build-or-move-step` (removed after this report).

## Verdict: APPROVE

No blocking findings.

## Blocking findings

None.

## Spec gaps

None.

## Stages run

- `link-node-modules.sh . && npx next build`: passed.
- `commands.lint` (`npx tsc --noEmit && npm run lint:dup`): passed, 0 clones.
- `npm test`: 93 files passed, 1 skipped; 2954 tests passed, 15 skipped.
- My own mutation: in `repeat.ts`, dropping `trigger` from every copy after the first failed 3 `simulate-repeat.test.ts` cases (bank equivalence row, bank re-check, reaction arming). Restored; tree clean.
- No acceptance or browser tests run (per rules). The acceptance criteria were judged from the spec text and the implementer's run and mutation record (2 passed in the new spec; 121 passed across the edited specs).

## Acceptance criteria

- Schema field: pass. `schema.test.ts` "checkBuildOrder repeat" covers absent, 1 and 200 accepted; `"3"`, `true`, `null` give `syntax`; 0, 201, 2.5, -1 give `out-of-range`, each on step 0 with the exact message. Mutating the bound or the integer flag fails rows (implementer record).
- Tier-2 rule: pass. There is one row each for produce, research, rally and pause, and each first checks that the step without `repeat` is valid. Build, move and a reaction move are accepted. A research step with an unknown tech plus `repeat` gives only `unknown-id` (`onlyIssue` asserts length 1).
- Expanded cap: pass. 199+1 and 100+100 are accepted; 199 + `repeat: 2` gives exactly `{ code: 'out-of-range', message: 'steps: 201 steps after repeats, more than 200' }` with a line map passed, so the issue has no step and no line. The cap is suppressed by a field issue and under `skipWholeOrderRules`, and 201 written steps give only the written-count issue. Rank: path `['steps']` takes ORDER_KEYS rank 4, after `civ` and `name` and before `start` (5) and steps (6+), the same as the written cap (`schema.ts:622-626`).
- Expanded-cap suppression (respec 1): pass. The sort test expects civ, then the cap, then the research `invalid`. The start-issue test expects the cap, then the start sum issue. Code: `failed('steps')` (`schema.ts:572,576`) ignores scoped issues; the new issue has scope `cross-step`.
- Issue location (respec 2): pass. `steps[1]` reports index 1 and, with a line map, `line 7`.
- `expandRepeats` cases (respec 1): pass (`repeat.test.ts`). It covers no repeat (`toStrictEqual` on the whole order), repeat 1, x3 in the middle, two repeated steps, a reaction step and a bank-triggered step keeping trigger and reaction, no `repeat` key (strict equality), no mutation (structuredClone compare), civ/name/source/start kept, and count agreement.
- Equivalence (respec 2): pass. Two orders compare the whole `SimulationResult` with the written-out order, setting aside only `source`, `copy` and the step-stuck message. Each has a completed-count data guard (7, 5). The bank re-check and reaction run-out cases are separate tests.
- `source` and `copy`: pass. The test checks length = `expandedStepCount`, `step === index`, and the `source.copy` sequence.
- Unrepeated orders (respec 1): pass. The test loops over `listBuilds()`, guards that no step has `repeat`, and checks the length and `source === step`, `copy === 1`. The existing tests changed only by adding `source` and `copy` (see the house-gate note).
- Not reached and waiting copies (respec 1): pass. Case (a) gives `[completed], [waiting, villagers], [not-reached, earlier-step]`. Case (b) gives trigger, earlier-step, earlier-step, then the reaction on `trigger`. Reading the unexpanded order at `simulate.ts:1091` would misclassify index 1 and index 3.
- Stuck copy (respec 3): pass. The copy form gives `step 2 (move, copy 2 of 3)` with `step: 3`; n=3 differs from the written count of 2. The plain form, with no repeat and with `repeat: 1`, gives `step 2 (move)` with `step: 2`, where `step + 1` would be 3. Code: `simulate.ts:991-1000`.
- Notes: pass. Bloomery's note has step 4 and equals `researchNotes` of the expanded order.
- A3 / no mutation: pass.
- Interim state: pass. The new spec posts only to `/simulate`; no save or named-build calls. Page specs are untouched.
- OpenAPI: pass. `repeat` is in all six `BuildStep` branches; `StepTiming.source`/`copy` are required; the version is 2.7.0 and all four version-pinning specs moved. The contract spec run is from the implementer's record.
- OpenAPI examples and bounds (respec 1): pass. The 5 example `StepTiming`s gain `source = step` and `copy: 1`. `locations.repeat` lists all six branches.
- OpenAPI descriptions (respec 1): pass. `StepTiming.step`, `BuildOrderNote.step`, step-stuck `step`, `SimulationResult.steps`, `SimulateRequest.buildOrder` and `BuildOrder.steps` are all updated. A grep finds no stale "index into buildOrder.steps" apart from the new `source` description, which is correct.
- Acceptance spec `aoe4-simulate-api-repeat.spec.ts`: pass by reading. It checks consecutive copies `[step, source, copy]`, validates against `SimulationResult`, and expects a 400 with exactly one `invalid` issue on step 1. The implementer's record shows it ran and was mutation-checked.
- Existing tests by rule (respec 1): pass. The list matches the diff. Each edit is covered by a Scope rule (StepTiming keys, bounds enumeration, optional fields, label count, version pins).
- Docs no longer claim one timing per submitted step or a written-only 200 cap: pass (grep plus reading). `ARCHITECTURE.md` has the `repeat.ts` row.
- Docs (respec 2): pass. The format-doc table has `repeat?` on the build and move rows only, a link to Ordering and triggers, the `invalid` rule, the tier list and issue order, and the notes and warnings bullets with the copy and plain forms. The model doc has the copy rule under Ordering and triggers, the warnings sort sentence, and a `repeat` bounds row (int, 1..200, once).
- tsc / npm test / lint:dup: pass (run here).
- No INVARIANTS regressions: pass (below).

## Invariants and checklist

- A1 holds. The only new number is the request cap `SIM_INPUT_BOUNDS.repeat = bound(1, 200)`, and the expanded cap reads `SIM_INPUT_BOUNDS.steps.max`.
- A2 holds. Copies go through the unchanged handlers and payment code. Equivalence with written-out orders also compares `floating` and `spent`.
- A3 holds. `expandRepeats` is pure and has no clock or randomness, and the same-input test passes.
- S3 holds. The route (`pages/api/aoe4-build-order/simulate.ts:23`) calls `checkBuildOrder` with whole-order rules, so the expanded count is capped at 200 before `simulateBuildOrder`. The worst case is 200x200 = 40000, which is only summed and never expanded. The issue list grows by at most one entry.
- spec-checklist: Contracts names match design C1, C2 and C4 exactly. Scope: no golang/, and parse-text, step-table field, annotations and page help are untouched. Naming is fine. A1 to A3 as above.
- Trace: `repeat` is checked by `count('repeat')` in `common`. It passes through the zod output to `expandRepeats`, which strips it per copy. `createEngine` takes `{ order, copies }` and sets `engine.order` to the expanded order. Every `engine.order.steps[...]` lookup (`simulate.ts:551,849,854,993`), `runRefs`, the final `waitingOn` loop and `researchNotes` read the expanded order. The only consumer of `simulateBuildOrder` is the simulate route.
- `OPTIONAL_STEP_FIELDS` gains `repeat`, and its UI consumers (`step-table.tsx:208`, `step-table-model.ts:189`) only filter fields that `actionFields` lists. `repeat` is not listed there, so no Repeat control renders. That matches the ticket ("FIELD_LABELS.repeat only").

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty; skipped.

## UI inspection

Not run. The diff changes no rendered UI. `FIELD_LABELS.repeat` is a label that no row renders yet, because `actionFields` has no `repeat`. No page markup or style changed. The REPO.md "load each touched page" step is not applicable for the same reason.

## Non-blocking notes

- `lib/aoe4-build-order/simulate-house-gate.test.ts:52`: `digestTimeline` drops `source` and `copy` before hashing, so the pinned digests are unchanged. This is the implementer's flagged deviation. I accept it. The ticket's rule names tests that build or deep-equal a `StepTiming` literal; this is a hash pin, and "any other assertion keeps its expected value" is what the exclusion preserves. Nothing the pins checked before is unchecked now. `source` and `copy` on unrepeated runs are asserted directly by the shipped-builds loop in `simulate-repeat.test.ts`. The comment follows the existing "wait details are left out" sentence.
- `lib/aoe4-build-order/repeat.ts:35`: copies are shallow, so all copies share one `trigger` object, and so does the submitted step. The engine does not mutate triggers: the A3 no-mutation test would catch a write through the shared object. Worth knowing if a later engine change ever writes to `step.trigger`.
- `docs/aoe4-build-order-format.md:28` (and the ARCHITECTURE row) link to `aoe4-build-order.md#model-rules`, because "Ordering and triggers" is a bold run-in paragraph with no anchor of its own. The link text names the paragraph, which is fine.
- `stepStuckWarning` counts a source's copies with a filter over `engine.steps` per warning. That is O(steps) per stuck step, with at most 200 steps; negligible.

## Coverage

Reviewed every file in the diff (24): `repeat.ts`, `repeat.test.ts`, `schema.ts`, `schema.test.ts`, `model.ts`, `simulate.ts`, `simulate.test.ts`, `simulate-house-gate.test.ts`, `simulate-repeat.test.ts`, `step-table-model.ts` and its test, `step-annotations.test.ts`, `acceptance/helpers.ts`, `aoe4-simulate-api-repeat.spec.ts`, the five edited acceptance specs, `openapi.json`, both design docs, `lib/aoe4-build-order/README.md` and `ARCHITECTURE.md`. Siblings compared:
- `acceptance/aoe4-simulate-api-checks.spec.ts` (order/START/VILLAGER constants, warm-up `beforeAll`);
- `lib/aoe4-build-order/test-helpers.ts` (no shared step builders exist, and local `house` and `move` builders match `simulate-triggers.test.ts` and `simulate-house-gate.test.ts`);
- `schema.ts` doc-comment section tags and split value/type imports (`simulate.ts:17-21`).

REPO.md review checklist "Every diff" and "AoE4 build order": no copied helper, constant or tolerance (the cap reuses `SIM_INPUT_BOUNDS.steps.max`); engine rule docs updated; no UI change. No LSP tool available; I found callers by grep. Not reviewed: acceptance runs themselves (rules forbid them here; I relied on the implementer's record).
