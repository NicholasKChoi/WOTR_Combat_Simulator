# SGS-208 spec gate (report 4)

Ticket: `tickets/SGS-208-repeat-a-build-or-move-step.md` (risk high, no dependencies, after Re-spec 1). Read at `origin/main` d80751b (fetched). `ticket-lint.py` ran clean (no errors, no warnings). No scratch checkout was needed; code was read with `git show`.

## Verdict: NEEDS_SPEC

All five gaps from report 2 are closed (checked below). Two smaller gaps remain. Both are cheap to close, and both make the implementer choose where behavior is documented or what a message says.

## Gaps

1. **Docs - the meaning of `repeat` has no home in any repo doc.** Scope's Docs bullets name the format doc's step-table row, the `invalid` rule list, the tier list and issue order, the request, `steps`, `notes` and `warnings` sentences, the bounds table, the README and ARCHITECTURE. None says where the rule itself is written: a repeated step runs as N consecutive copies, each re-checks its trigger when it arms (D2), reaction copies all arm at the run-out instant, and the result equals the step written out N times.
   - `lib/aoe4-build-order/README.md` says it "states no rules" and that the design docs are the only authority on behavior. The design doc `design/M12.md` is a factory file, not a repo doc, so after this ticket the behavior would exist only in code and tests.
   - `docs/aoe4-build-order.md` "Ordering and triggers" (around line 156) describes how a step arms and starts and says only "Steps run in list order". The design's criteria map lists `docs/aoe4-build-order.md` for this ticket.
   - Why an implementer guesses: both docs are plausible homes and neither is named, and the Docs criteria check only the table row, the `invalid` list, the tier list, the `notes` and `warnings` bullets and the bounds row.
   - Proposed fix: add to Scope that `docs/aoe4-build-order.md` "Ordering and triggers" gains the copy rule (copies in list order, each re-arms with its own trigger, reaction copies, equivalence with written out) and that the format doc's step-table text says what `repeat` does and points to that section. Add to the Docs criterion that the model doc states a repeated build or move runs as that many consecutive copies each with its own trigger check.

2. **Acceptance criteria / Scope - which `step-stuck` message a source with exactly one copy gets.** Scope says "a copy of a repeated source" gets `copy <copy> of <n>` and "an unrepeated source's message is unchanged". `repeat: 1` is valid and expands to one copy with no `repeat` key, so after expansion it cannot be told from an absent `repeat` except through the original order. Both readings fit the text.
   - Proposed fix: state the rule as "a source with one copy (no `repeat`, or `repeat: 1`) keeps the unchanged message; a source with n >= 2 copies uses the copy form, `n` being the number of copies of that source". Add a `repeat: 1` stuck case to the Stuck copy criterion.

## Re-spec 1 gaps from report 2, now closed

- `SIM_INPUT_BOUNDS` enumerators: the Scope existing-tests bullet now covers `schema.test.ts` (the 17-row list at about line 959) and the contract spec's `locations` record (typed `Record<keyof typeof SIM_INPUT_BOUNDS, ...>`, so a missing key is a type error). `repeat` is allowed in every `BuildStep` branch, which matches the design. Both exist at base as described.
- OpenAPI: the `buildOrder` (2 steps) and `goldRunOut` (3 steps) response examples are the only `StepTiming` examples (5 `waitDetails` occurrences in total). The `step` descriptions are named: `StepTiming.step` (line 4649), `BuildOrderNote.step` (4820), `step-stuck` `step` (5320), `SimulationResult.steps` (4500) and the `warnings` ordering (4546). Both 200-step descriptions are named (3609, 3648).
- Cap suppression is now stated as the existing `failed('steps')` condition. I checked it: `failed` counts only issues under `steps` with `scope === undefined`. Tier-2 `cross-field` issues carry `scope: 'cross-field'` and `start` issues sit under `start`, so neither suppresses the cap, as the ticket says. The cap path `['steps']` ranks 4 in `rankOf`, so it sorts before `start` (5) and every step issue (6 and up). `issue()` prefixes the label, so the message `steps: <n> steps after repeats, more than 200` composes with text `<n> steps after repeats, more than 200`, like today's `steps: 201 steps, more than 200`.
- The shipped-build criterion is now a property (length, `source === step`, `copy === 1`) with no baseline needed. The no-repeat `expandRepeats` case says the returned `order` deep-equals the input.
- Docs now name the step-table rows, the `invalid` list, the `notes` bullet and the bounds row (`docs/aoe4-build-order.md` line 61 table).
- The "not reached and waiting copies" criterion is split into two cases with separate orders.

## Other checks (all pass)

- **Grounded scope.** `schema.ts` (`common` at line 405, `crossFieldProblems`, `withCrossChecks`, `rankOf`, `OPTIONAL_STEP_FIELDS`), `simulate.ts` (`createEngine` line 881 with `runRefs`, `stepStuckWarning` 989, the final `waitingOn` loop with `isReaction(order.steps[...])` at 1085, `researchNotes(order, data)` at 1108, `engine.order.steps` uses at 549, 573, 588, 847, 852, 991), `model.ts` `StepTiming`, `step-table-model.ts` `FIELD_LABELS` and the four `2.6.0` specs all exist as described. `repeat.ts` is new and said so. `civRules(order.civ)` as a default parameter still works because expansion keeps `civ`.
- **Existing tests.** `step-table-model.test.ts` "has no label beyond those fields" pins 19 and "labels every field a row can render" needs the label; both are covered by the rule. `hasOptionalField` test uses `OPTIONAL_STEP_FIELDS[action][0]`, unaffected while `repeat` is appended last. `step-table.tsx` filters `actionFields` by `OPTIONAL_STEP_FIELDS`, so a `repeat` entry with no table field renders nothing. The `stepTiming: Record<keyof StepTiming, true>` in the contract spec (line 520) is covered by the key-list rule. No test sends a `repeat` key today.
- **Interim state.** `checkBuildOrder` callers: `simulate.ts` and `saved-builds.ts` run the full check (the cap applies); `text-to-build.ts` runs `skipWholeOrderRules` first, then the full check. `saved-builds.ts` round trip rejects a build carrying `repeat` while `formatAction` does not print it.
- **Contracts** match design C1, C2, C4. **Risk** `high` is right (`simulateBuildOrder` is a `criticalPaths` symbol and its behavior changes). **Diagram** present. **Size** about 150 LOC. **Open questions** none; OD1 and OD2 are decided. **On merge** `none` is right. **Unverified assumptions** `none` is right (no external service). **Input validation**: one new field, under the zod threshold.
- **Hotspots (high risk).** Expand-first and every later use (the `waitingOn` loop, notes index, stuck lookup), the expanded count against the written count, suppression, issue location on the submitted index, no input mutation, and reaction and trigger re-check per copy each have a named test that fails when the logic breaks. Using the unexpanded order in `runRefs` gives the same node set, so no test can distinguish it; that is not a gap.
- **No throwaway work.** SGS-209 makes the identical `info.version` edit, SGS-210 and SGS-211 depend on this ticket and own annotations, paste and table.

## Notes (non-blocking)

- The Equivalence criterion writes the orders as `build house from wood x3` and `move 1 sheep to wood x2`. The `xN` paste grammar lands in SGS-211, so the tests must build these as JSON with `repeat: 3` and `repeat: 2`. Say so to avoid a reader looking for paste input.
- "Issue location ... (and its paste line)": no paste form of `repeat` exists yet, so a test can only supply a `lines` map to `checkBuildOrder`. Say "when a line map is passed".
- The Invariants field names A3 and S3. A1 (no game numbers in code) and A2 (resources never negative, each copy pays separately) share the `lib/aoe4-build-order/**` paths and are not contradicted; naming them costs nothing.
- `docs/aoe4-build-order.md` lines 474 and 486 say `step-stuck` "by step"; the ticket's wording for the format doc covers "by step index", and the model doc sentence should say expanded index too.
- design/M12.md still reads "draft for owner approval of Defaults D1 to D17"; the ticket relies on D1, D2, D4, D5, D6, D15. Not a ticket gap.
