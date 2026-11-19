# SGS-208 implementer report (9)

- Ticket: SGS-208, Repeat a build or move step (Feature, high risk)
- Branch: `sgs-208-repeat-build-or-move-step`, base `origin/main` @ d80751b
- Tip: `68572a8` (one commit)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-208-repeat-build-or-move-step`
- Checkout call: `checkout.sh task` reused the checkout (warning only: uncommitted changes), rc 0. There was no `origin/<branch>` and no commits, so the own-commit check was skipped as the rules allow.

## Starting state

An earlier implementer left uncommitted work and no report. I reviewed it against the ticket and kept it: `repeat.ts`, `repeat.test.ts`, the schema field, rule and cap with their `schema.test.ts` rows, the `model.ts` fields, the `simulate.ts` expansion and `step-stuck` wording, `FIELD_LABELS.repeat`, OpenAPI 2.7.0, and the version, bounds and `StepTiming` test edits. What I added or changed:
- New `simulate-repeat.test.ts` and `acceptance/aoe4-simulate-api-repeat.spec.ts`.
- All the doc edits: format doc, model doc, module README, ARCHITECTURE.
- Test assertions that no mutation could fail were deleted or merged:
  - repeat.test: the `REPEATABLE_ACTIONS` literal test, the `expandedStepCount([])` assertion, the redundant `'repeat' in copy` assertion, and the deep-freeze (it made the mutation check fail on a TypeError rather than on the assertion).
  - schema.test cap test: the duplicate `onlyIssue` and 202 assertions.
- A jscpd clone between the two new test files was removed.

## Files touched
- `lib/aoe4-build-order/repeat.ts` (new): `REPEATABLE_ACTIONS`, `repeatCount`, `expandedStepCount`, `StepCopy`, `ExpandedOrder`, `expandRepeats`.
- `lib/aoe4-build-order/schema.ts`:
  - `SIM_INPUT_BOUNDS.repeat` is `bound(1, 200)`, placed after `count`.
  - `common.repeat` is checked with `count('repeat')`.
  - New tier-2 `crossFieldProblems` rule: `repeat on <action>; only build and move steps repeat`.
  - New tier-3 expanded cap in `withCrossChecks`, after the `failed('steps')` gate, with path `['steps']` and scope `cross-step`.
  - `OPTIONAL_STEP_FIELDS` has `repeat` on build and move.
- `lib/aoe4-build-order/model.ts`: `StepTiming.source` and `copy` come after `step`.
- `lib/aoe4-build-order/simulate.ts`:
  - `simulateBuildOrder(submitted, ...)` expands first, and every later use reads the expanded `order`.
  - `createEngine` takes `ExpandedOrder` and sets `source` and `copy` from `copies`.
  - `stepStuckWarning` numbers the step by `source + 1` and uses the copy form when the source has more than one copy.
- `components/apps/aoe4-build-order/step-table-model.ts`: `FIELD_LABELS.repeat = 'Repeat'`.
- `docs/api/openapi.json`:
  - version 2.7.0
  - `repeat` in all six `BuildStep` branches
  - `StepTiming.source` and `copy`, both required
  - the five simulate 200-example `StepTiming` entries gain `source = step` and `copy: 1`
  - descriptions updated: `step`, `BuildOrderNote.step`, `step-stuck.step` and message, `SimulationResult.steps` and `warnings`, `SimulateRequest.buildOrder`, `BuildOrder.steps`
- `docs/aoe4-build-order.md`: bounds table, cap sentence, Ordering-and-triggers copy rule, warnings sort sentence.
- `docs/aoe4-build-order-format.md`:
  - step table and the line beside it
  - the reaction/repeat optional-keys sentence
  - the `invalid` rules list
  - the three-tiers list and the issue order
  - the request sentence
  - the Outputs `steps`, `notes` and `warnings` bullets
- `lib/aoe4-build-order/README.md`: module-map row for `repeat.ts`, the event-loop paragraph, the Simulate data-flow line.
- `ARCHITECTURE.md`: "AoE4 repeated steps" row.
- Tests: `repeat.test.ts` (new), `simulate-repeat.test.ts` (new), `acceptance/aoe4-simulate-api-repeat.spec.ts` (new), `schema.test.ts`, plus the existing-test edits listed below.

## Tests run
- `npm test`: 93 files passed, 1 skipped; 2954 tests passed, 15 skipped.
- `repeat.test.ts` (9 cases). The expansion keeps `civ`, `name`, `source` and `start`, writes consecutive copies without the `repeat` key, keeps `trigger` and `reaction`, and does not mutate the input. `repeatCount` and `expandedStepCount` agree with the length of the expansion.
- `schema.test.ts` "checkBuildOrder repeat":
  - Accept rows: absent, 1, 200, move, reaction move.
  - Syntax rows: `"3"`, `true`, `null`. Out-of-range rows: 0, 201, 2.5, -1.
  - Invalid rows: produce, research, rally, pause.
  - A field issue suppresses the invalid rule.
  - Issue location by submitted index and line.
  - Expanded cap: 200 is accepted, 201 is capped (no step, no line, the given message), the issue sorts at the cap rank before step issues, it is reported beside a start issue, it is skipped on a field issue and under `skipWholeOrderRules`, and more than 200 written steps give only the existing issue.
  - The `OPTIONAL_STEP_FIELDS` table and bounds rows were updated.
- `simulate-repeat.test.ts` (16 cases):
  - Equivalence of the whole result, two orders: (1) produce villager, `house` x5, `move 1 sheep->wood` x2, research bloomery; (2) a bank-triggered house x3 plus a `depleted` reaction `move all` x2.
  - Each bank-trigger copy re-checks its trigger.
  - Reaction copies all arm and start at the run-out, and copy 2 completes at the run-out.
  - `source`/`copy`/`step` indexing; the note index equals `researchNotes` of the expanded order; A3 and no mutation of the submitted order.
  - Every shipped build (4) has one timing per written step with `source === step` and `copy === 1`.
  - Not-reached cases (a) villagers short and (b) a trigger that never holds, with a reaction after it so that reading the unexpanded order would be wrong.
  - Stuck copy: `step 2 (move, copy 2 of 3)` with `step: 3`. Plain form for a single-copy step after a repeated one, both with no repeat and with `repeat: 1` (message `step 2 (move)`, warning `step: 2`).
- Acceptance, run single-file after `acceptanceSetup`:
  - `npx playwright test acceptance/aoe4-simulate-api-repeat.spec.ts`: 2 passed.
  - Edited specs, one invocation listing the files: `npx playwright test acceptance/aoe4-simulate-api-repeat.spec.ts acceptance/aoe4-simulate-api-contract.spec.ts acceptance/aoe4-builds-api-contract.spec.ts acceptance/aoe4-gathered-resources.spec.ts acceptance/aoe4-named-builds-api-contract.spec.ts acceptance/aoe4-simulate-api-issue-shape.spec.ts`: 121 passed.

## Pre-existing tests edited
These were edited under the Scope "Existing tests, by rule" (the StepTiming keys, the SIM_INPUT_BOUNDS enumeration, the optional fields, the label count, and the version pin):
- `acceptance/aoe4-builds-api-contract.spec.ts`: "is version 2.6.0..." is renamed to 2.7.0 and pins 2.7.0.
- `acceptance/aoe4-gathered-resources.spec.ts`: "...at version 2.6.0" now pins 2.7.0.
- `acceptance/aoe4-named-builds-api-contract.spec.ts`: "is version 2.6.0..." now pins 2.7.0.
- `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: "...document version is 2.6.0" now pins 2.7.0.
- `acceptance/aoe4-simulate-api-contract.spec.ts`:
  - "bounds match SIM_INPUT_BOUNDS" `locations.repeat` lists all six `BuildStep` branches.
  - "exported types match the spec" `stepTiming` record gains `source` and `copy`.
- `acceptance/helpers.ts`: the `Timing` type gains `source` and `copy`.
- `components/apps/aoe4-build-order/step-annotations.test.ts`: the `timing()` builder gains `source: step, copy: 1`.
- `components/apps/aoe4-build-order/step-table-model.test.ts`: "has no label beyond those fields" goes from 19 to 20.
- `lib/aoe4-build-order/schema.test.ts`: `OPTIONAL_STEP_FIELDS` `full.build`/`full.move` gain `repeat: 2`; "keeps the request bounds" gains `'repeat 1 200 int'`.
- `lib/aoe4-build-order/simulate.test.ts`: "completes a rally step the instant it arms" and "pauses at once..." gain `source: 0, copy: 1` in the `toEqual` literal.
- `lib/aoe4-build-order/simulate-house-gate.test.ts` `digestTimeline`: `source` and `copy` are dropped before hashing (comment updated), so the existing digest pins stay unchanged. This is a deviation in form from "gains source and copy": adding the fields would have changed every pinned digest, which conflicts with "any other assertion keeps its expected value".
- No other expected value changed. `research.test.ts`, `research.acceptance.test.ts` and `build-move.acceptance.test.ts` needed no edit: they use `toMatchObject` or partial reads, and tsc and the suite pass.

## Doc claims (each checked against the code)
- format doc: "`repeat` (an integer 1..200; absent or 1 runs the step once) runs a `build` or `move` step that many times in a row". Source: `SIM_INPUT_BOUNDS.repeat`, `repeat.ts:repeatCount`, `crossFieldProblems`.
- format doc: "an optional `repeat`, valid only on `build` and `move`". Source: `REPEATABLE_ACTIONS` and the `crossFieldProblems` rule.
- format doc `invalid` list: "`repeat` on a `produce`, `research`, `rally` or `pause` step (only `build` and `move` repeat): `steps[N]: repeat on research; only build and move steps repeat`". Source: `schema.ts:crossFieldProblems`.
- format doc tiers: the cross-step rules "and the expanded step cap run only when every step's fields passed and the written order has at most 200 steps. The cap is one `out-of-range` issue on `steps` (no `step`, no `line`)... `steps: 201 steps after repeats, more than 200`". Source: `withCrossChecks`, where `failed('steps')` also covers the written-array issue, which has no scope.
- format doc issue order: "the step-count cap (written, or after repeats)". Source: `rankOf`, whose path `['steps']` takes the `steps` key rank.
- format doc request: "at most 200 steps, written and after repeats".
- format doc `steps` bullet: one entry per step after repeats, n consecutive entries, with `step`/`source`/`copy`. Source: `createEngine` `copies.map`.
- format doc `notes`: "a note's `step` indexes `steps` (after repeats)". Source: `researchNotes(order)` with `order` expanded.
- format doc `warnings`: "the 1-based number of the submitted step"; the copy form `step 12 (build, copy 2 of 9) ...`; "a step with one copy (no `repeat`, or `repeat: 1`) keeps the plain form"; "The warning's `step` is the index in `steps`". Source: `stepStuckWarning`.
- model doc bounds row: `repeat` (`build`, `move`), int, 1..200, default once. Paste/steps row: "200 steps, written and after repeats".
- model doc: "A build order with more than 200 written steps is one `out-of-range` issue ...". "When every step's fields pass, an order of at most 200 written steps that has more than 200 steps after repeats is also one `out-of-range` issue on `steps`."
- model doc, Ordering and triggers paragraph, checked against `expandRepeats` (copies keep `trigger` and `reaction`), the unchanged arming and offer rules, and `simulate-repeat.test.ts` equivalence:
  - "runs as N consecutive copies of the step in list order, before the next step"
  - "Each copy keeps the step's trigger and `reaction` and arms by the rules above, so a non-reaction copy re-checks its own trigger when it is reached, after the copy before it started"
  - "Copies of a `reaction` step all arm when their trigger holds ... and are offered in copy order, each seeing what the earlier copies left"
  - "The result is the same as the step written out N times, apart from each `steps` entry's `source` and `copy` and the `step-stuck` message"
- model doc warnings sort: "`step-stuck` by step index in the result's `steps` (after repeats)". Source: `sortWarnings` on `warning.step`, the expanded index.
- README:
  - "`repeat.ts`: `expandRepeats`, the one place copies of a repeated step are made, and `expandedStepCount`, the step count after repeats that `schema.ts` caps. Browser-safe: it imports only types." Source: `repeat.ts`, whose only import is `import type`.
  - "`simulateBuildOrder` first writes out each repeated step as consecutive copies ... and runs only that expanded order, so every step index in the result is an index into it."
  - "Simulate: `simulateBuildOrder` writes out the checked order's repeats, then runs it ..."
- ARCHITECTURE row: same claims as the README, plus "`simulateBuildOrder` expands the order first and runs only the copies".
- OpenAPI descriptions, each checked against the code above:
  - `repeat` in every branch
  - `StepTiming.step`, `source`, `copy`
  - `BuildOrderNote.step`; `step-stuck` `step` and message
  - `SimulationResult.steps` and `warnings`
  - `SimulateRequest.buildOrder`; `BuildOrder.steps` (the cap after repeats is checked only when every step's fields pass)
- model.ts field comments (from the earlier pass, kept): "Index into result.steps, the order with each repeat written out." "Index of the submitted step this one copies." "1-based copy number within the source; 1 for a step without repeat."

## Pinned outputs
None. The ticket pins no engine-returned values. The equivalence tests compare against written-out runs, and the completed-step counts (7 and 5) are data guards.

## Mutation checks
All were applied through a script that patches the line, runs the named test, and restores the file. `git status` was clean of mutations after each batch.

repeat.ts:
- `steps.push({ ...step })` (keep the `repeat` key): fails "runs repeat 1 once", both table rows, and both keep-trigger rows, each on its `toStrictEqual`.
- copy 0-based: fails the no-repeat copies, repeat 1, and both table rows on the `copies` equality.
- Dropping trigger/reaction from copies: fails the no-repeat deep-equal and both keep-trigger rows.
- Dropping `start`: fails no-repeat and "keeps civ, name, source and start" (the second assertion).
- Writing `order.name` (input mutation): fails "does not mutate" (`toStrictEqual(before)`).
- `?? 2`: fails the counts row for house (1) and "sums".
- `(repeat ?? 0) + 1`: fails the counts row for repeat 1 and row 7.
- Sum starting at 1: fails "sums" (first assertion).
- One fewer copy: fails "sums" (second assertion) and the counts row 7 (second assertion).

schema.ts:
- `bound(0,200)`: fails out-of-range rows 0, 201 and -1 (messages), the line-location first assertion, and "keeps the request bounds".
- `bound(1,201)`: fails rows 0, 201 and -1.
- `bound(1,200,false)`: fails the 2.5 row.
- `bound(2,200)`: fails "accepts repeat 1".
- Repeat required: fails "accepts repeat absent".
- Cap `>=`: fails "accepts repeat 200" and the cap test's first assertion.
- `REPEATABLE_ACTIONS = ['build']`: fails the move and reaction-move accept rows.
- Rule rejects a reaction with repeat: fails the reaction-move row only.
- `REPEATABLE_ACTIONS` gains `research`: fails the research invalid row and the sort test.
- `repeat: z.unknown()`: fails the three syntax rows and the four out-of-range rows.
- Invalid rule removed: fails all four invalid rows and the sort test.
- Written count instead of `expandedStepCount`: fails the cap test (third assertion), the sort test, and the start-issue test.
- Off-by-one for repeat > 1: fails the cap test's second assertion (100+100 accepted).
- Message changed: fails the cap test, the sort test, and the start-issue test.
- Path `['steps',199]`: fails the cap test (step and line appear), the sort test, and the start-issue test.
- Cap moved before the `failed('steps')` gate: fails "skips the expanded cap" (first assertion) and "reports only the written step count".
- Cap only when there are no issues at all: fails the sort test and the start-issue test.
- `skipWholeOrderRules` ignored: fails "skips the expanded cap" (second assertion).
- `OPTIONAL_STEP_FIELDS` build or move without `repeat`: fails the matching omission row.
- Cross-field refinement forced on with `when: () => true`: fails "leaves the invalid repeat rule out on a step with a field issue".
- Line map `steps[step+1]`: fails the line-location second assertion.
- One mutation was not a real break and is not counted: moving `failed('steps')` below the count is equivalent code (S8).

simulate.ts:
- No expansion: fails every simulate-repeat case.
- `copies >= 1`: fails both plain-form rows (no repeat, repeat 1).
- `step + 1` in the message: fails the stuck-copy test and both plain-form rows.
- n = written step count: fails the stuck-copy warning assertion.
- `copy ${timing.step}`: fails the stuck-copy test.
- Final `waitingOn` reads the unexpanded order: fails the trigger not-reached case.
- `researchNotes(submitted)`: fails the note test's first assertion and equivalence row 1.
- Note message blanked: fails the note test's second assertion.
- `source: step`: fails the source/copy third assertion, the stuck-copy test, and the plain-form rows.
- `step: source`: fails the source/copy second assertion.
- copy always 1: fails the reaction test (map), source/copy, and stuck-copy.
- copy 0 for single copies: fails the shipped-build rows (`toMatchObject`), source/copy, and the plain-form rows.
- Later copies without trigger/reaction: fails equivalence row 2, bank re-check (second assertion), and the reaction test.
- Third copy without trigger: fails bank re-check (third assertion).
- `?? 2`: fails the shipped-build rows (length).
- `submitted` mutated: fails A3 test (second assertion).
- Per-call counter added to the result: fails A3 test (first assertion).
- One fewer copy: fails equivalence row 1 and the not-reached case (a).
- Existing `simulate.test.ts` edits: copy-1 and source+1 fail "completes a rally step..." and "pauses at once...".

Acceptance:
- `aoe4-simulate-api-repeat.spec.ts`:
  - Test 1: copy always 1 fails the copies `toEqual`. Copy 0-based fails `expectValid` (copy minimum 1). Renaming the OpenAPI `StepTiming.source` property fails `expectValid` (additionalProperties).
  - Test 2: removing the invalid rule gives 200 instead of 400 and fails the status assertion.
- Contract "repeat is an integer in 1..200 everywhere it appears": research-branch `maximum: 201` fails it.

Every mutation was undone. The tree was clean before the commit.

## Stages
- codegen: not set.
- build (`link-node-modules.sh . && npx next build`): passed.
- lint (`npx tsc --noEmit && npm run lint:dup`): passed, 0 clones.
- unit: passed, as above.
- Acceptance: only my spec and the edited specs were run, per the rules; the full suite was not run.
- No stage was skipped.

## Invariant check
- A1 upheld: the bound 1..200 is a request cap in `SIM_INPUT_BOUNDS`; no game number was added.
- A2 upheld: copies pay through the unchanged handlers. Equivalence with written-out orders shows identical `floating`, and payment code is unchanged.
- A3 upheld: `expandRepeats` is pure, and the same input gives the same result (tested).
- S3 upheld: the expanded count is capped at `SIM_INPUT_BOUNDS.steps.max` before simulation.

## Unverified assumptions added
None.

## Out-of-scope findings
None.

## Status
`needs_review`
