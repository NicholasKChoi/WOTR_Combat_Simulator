# SGS-088 review 1

Verdict: REQUEST CHANGES
Branch: sgs-088-aoe4-workbench-ui-state-kept, tip 270618a, base fad1e41 (branch not on origin; reviewed the local ref at 270618a in a detached worktree).

## Blocking findings

1. `components/apps/aoe4-build-order/build-input.tsx:87` (with `docs/aoe4-build-order.md:839`) - checklist(AoE4 build order: a highlight state must change something visible) / contract - While the Results tab is shown, the active view button is not visibly marked. Bootstrap's `.btn:disabled` rule comes after `.btn.active` and replaces the active fill with the transparent disabled background. Measured at 1280 px after a Run from Table view: `editor-view-table` (class `active`, `aria-pressed=true`) has `background-color: rgba(0, 0, 0, 0)` and `color: rgb(108, 117, 125)`, which is identical to the inactive `editor-view-text`. On the Build tab the same button is `rgb(108, 117, 125)` with white text. Screenshots at 360x760 and 1280 show two equally faded buttons. Why it matters: Scope 2 says "The active view stays marked ... while disabled", and the doc sentence the diff adds says "(the active view stays marked)". A user on Results cannot tell which view is current, and only the attribute stays. The acceptance test checks only `aria-pressed`, so it passes anyway. Direction: keep the active fill on the disabled active button, for example by setting `--bs-btn-disabled-bg`, `--bs-btn-disabled-border-color` and `--bs-btn-disabled-color` to the secondary active values on that button through a module class or style (CSS variables, not Bootstrap utilities, per the no-mixing rule). Then extend "the Text and Table buttons are disabled while Results is shown" (`acceptance/aoe4-step-table.spec.ts:670`) so it asserts that the pressed button's computed `background-color` differs from the unpressed one while disabled (common.md, Tests: a visual state asserts what the user sees).

## Spec gaps

None.

## Acceptance criteria

- (a)-(c) unit helper tests: PASS. `step-table-model.test.ts` "open flags" covers `[true,false,false]` move down to `[false,true,false]`, delete row 1 of `[true,false,true]` to `[true,true]`, merge `[false,true]` with `[count, plain]` to `[true,true]`, merge `[true,true,true]` with 2 steps to length 2, and merge `[true]` with 3 steps to `[true, true(rally), false]`.
- Move/delete carry open state: PASS. "moving a row carries its open state..." uses 3 rows, row 0 `x3` open, row 2 opened by hand. Moving down leaves `count=3` open at index 1 and index 0 closed, and deleting the first row keeps the hand-opened step open. On main this fails, because the flag stays at index 0.
- Text edit that sets `rally` opens a closed row: PASS.
- Open row survives Text/Table, and Run, Build, Text/Table: PASS.
- Buttons disabled on Results, a forced click changes nothing, enabled on Build: PASS as the criterion is worded. The "view unchanged" check is attribute-only; see finding 1.
- Pin-compare 500 drops the key, next load makes no POST, abort keeps the key, 400 drops, Pin made during a delayed 500 keeps the user pin: PASS.
- `acceptance/aoe4-build-order.spec.ts` untouched, and the doc grep finds nothing: PASS.
- tsc, `npm test`, lint:dup, acceptance: PASS. tsc is clean. lint:dup found 0 clones. Vitest: 47 files, 1463 passed, 10 skipped. `npx next build` ok. Playwright full suite: 731 passed, 1 failed. The failure was `aoe4-build-order-timeline-compare.spec.ts:72`, a timeout at `runSimulation` in `runWith`. That spec has no code path the diff changes (it never toggles the view), and it passed 3 of 3 with `--repeat-each 3`, so it is a load flake.
- No invariant regressions: PASS.

Criteria are left unticked because the verdict is not APPROVE.

## Invariants touched

- S1: holds. The page imports `mergeExternalEdit` from `components/apps/aoe4-build-order/step-table-model`, the same app.
- A1-A3: not touched. No `lib/`, data or route files are in the diff.

## Scope 5 check (pre-existing tests edited)

- `aoe4-build-order-pin-compare.spec.ts` `[400,false],[500,true]` table, now `[400],[500]`, both expecting a drop: this is the row Scope 5 names. In scope.
- `aoe4-step-table.spec.ts` "number fields: optional clears..." (line 176): `expectText` round-trips through Text and Table via `textValue`. The old click on `step-more` relied on the remount closing the row, which Scope 1/2 removes. The new expectation (row still open) is the changed behavior. In scope.
- `aoe4-step-table.spec.ts` "after a table edit Run posts exactly the textarea text..." (lines 242-247): `textValue` clicks the view toggle, which is now disabled on Results (Scope 2). The test now switches to Build first, and its assertion is unchanged. In scope: the changed behavior forces this edit, and it does not change any expectation.
- `acceptance/aoe4-build-order.spec.ts`: untouched.

## Contract and correctness notes (no finding)

- Flag rules match Scope 1. Move uses `moveFlag`, delete uses `deleteFlag`, and add appends `hasOptionalField(added)`. An action change closes only that row (`step-table.tsx:309`). Field and trigger edits pass the materialized `open` (computed before the edit), so a missing entry is never re-read against the edited step. The table's own writes go through `setText`, not `editText`, so they are not treated as external edits. `editText` merges only when `parseBuildOrderText` succeeds, and both external setters (the textarea and the prebuilt select through `onTextChange`) are wrapped.
- Restore: any non-ok response clears the pin behind the `cancelled || pinTouched` guard (`aoe4-build-order.tsx:130-134`), and a rejected `fetch` falls into `.catch(() => {})` and keeps the key.
- Out of scope respected: no `pin-storage.ts`, stored shape, engine, route or data changes, and no `golang/`.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty.

## Non-blocking notes

- `step-table-model.ts:195-202`: `moveFlag` copies the range check and swap of `moveStep` (`step-table-model.ts:59-66`) with `inRange` inlined. Making `moveStep`/`inRange` generic over `readonly T[]` and reusing them would remove the copy. Same file, components rather than `lib/`, so the REPO copy rule does not strictly apply.
- `acceptance/aoe4-build-order-pin-compare.spec.ts:551`: after `release()` the test waits a fixed 300 ms and never waits for the 500 to reach the page. If the response were slower, the test would pass with the guard removed. Awaiting `page.waitForResponse(r => r.url().endsWith(SIMULATE_PATH) && r.status() === 500)` started before `release()` would make it deterministic. A fixed 300 ms wait has precedent at `aoe4-step-table.spec.ts:222`.
- `docs/aoe4-build-order.md:839`: "Switching tabs changes nothing else" now sits directly before a sentence saying the tab disables the buttons. Optional rewording: "Switching tabs changes nothing else except whether the Text and Table buttons are enabled, and both panels stay mounted."
- `docs/aoe4-build-order.md:942-943`: "only a failed request (the network) keeps it". An ok response whose body fails to parse also lands in `.catch` and keeps the key. This is an edge case, and the doc is close enough.
- Doc "an added row starts closed": true for the current default step (produce villager sets no optional field). The code also handles a future default that sets one.
- `step-table.tsx:343`: `open[index] ?? false`. `open` is now always full length, so the fallback is dead but harmless.

## Coverage

Reviewed every file in the diff: `build-input.tsx`, `step-table-model.ts`, `step-table-model.test.ts`, `step-table.tsx`, `pages/apps/aoe4-build-order.tsx`, `docs/aoe4-build-order.md`, `acceptance/aoe4-step-table.spec.ts`, `acceptance/aoe4-build-order-pin-compare.spec.ts`. Siblings compared: `moveStep`/`deleteStep`/`inRange` (step-table-model.ts:40-66), the existing `aria-expanded` assertions (aoe4-step-table.spec.ts:342-372), `acceptance/helpers.ts` showView/showTab/runSimulation, and the test table style in step-table-model.test.ts.

REPO checklist: did "Every diff" (next build; the page loaded under the Playwright dev server). Did the "AoE4 build order" section: no copied lib helper; doc checked against code; screenshots at 360x760, 768 and 1280 of the table with a hand-opened row, the Results tab with disabled buttons (opacity 0.65, visibly disabled; the active fill is lost, see finding 1) and the Build tab with enabled buttons. No layout or chart change, so the 390/700 overflow check was not needed. No Bootstrap and module CSS mixing in the diff, and classNames use `cn`. The M4 design doc row "pin restore | on load" is a manager follow-up per the ticket and was not checked here.
