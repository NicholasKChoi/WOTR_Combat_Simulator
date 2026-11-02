# SGS-046 review 2

Branch `sgs-046-aoe4-step-table-editor`, tip 923cbb6f12f2ccc93d8e7f02090edf1e57139c09 (base main 835aceb; current main b5c68d2). This is a full re-review of the 7 files. Review 1 bounced at 4652ca9. The branch is not on origin, so the review worktree was made detached at the local tip.

**Verdict: APPROVE**

## Blocking findings

None.

## Required fixes from rework 1

1. **Fixed: the `rally` action's `to` select no longer offers an empty option.** `step-table.tsx:46` now calls `pick('to', options.nodes)`. `allowEmpty` comes from `offersEmptyChoice(step.action, field.name)` (`step-table.tsx:188`), backed by `OPTIONAL_SELECTS = { produce: ['rally'], build: ['then'], research: ['at'] }` (`step-table-model.ts:96`).
   - That matches the optional node and site fields in `model.ts` and the validator.
   - The test `empty select choice` (`step-table-model.test.ts:196-219`) runs over every string select field of one filled step per action. It requires `offersEmptyChoice` to be true exactly when clearing the field still parses, so it fails if `rally.to` (or any required select) offers an empty choice.
   - Browser check against `next build` + `next start` on port 3917 with a Playwright probe: the `rally` row's `step-field-to` options are exactly the 15 `NODE_REFS` with no `""`. `produce.rally`, `build.then` and `research.at` each start with `""`.
2. **Fixed: the test "only swaps the producer on pause and rally"** now asserts the `rally` case too (`step-table-model.test.ts:112-114`).
3. **Fixed: number drafts that are not safe integers are rejected.** `parseUnsigned` (`step-table-model.ts:115-118`) applies `/^\d+$/` and then `Number.isSafeInteger`. Both `setNumberField` and `setTriggerNumber` use it. Tests at `:175-183` cover `2^53`, a 22-digit draft, and acceptance of `MAX_SAFE_INTEGER`.

## Browser check: picking options never makes the table disappear

I ran a Playwright probe against `next start` (this was not a spec).

- **Single picks.** I filled the textarea with a 10-step text that covers every action, every trigger kind, `x3`, `-> gold`, `then gold`, `at mill`, `move all` and `gold#2`. For every row, every select and every option, I reset the text, picked the option, and checked the result. That was 445 picks. Every pick left `step-table` present and `step-table-unavailable` absent.
- **Action and trigger combinations.** For each of the 30 action x trigger-kind pairs on row 0, I picked every option of every select in the row. In each number field I typed `''`, `0`, `7`, `all`, a 22-digit number and `9007199254740991`. I checked and unchecked the reaction checkbox where it was present. That was 1059 operations, with 0 cases where the table disappeared.
- **Other flows also behaved as specified:**
  - The default build shows 25 rows and no unavailable notice.
  - `fill` leaves the textarea exactly as typed.
  - `step-add` appends `produce villager from capital-town-center`.
  - Add, move-up and delete sent 0 POSTs.
  - Up is disabled on row 0.
  - `at 8 vils fly capital-town-center` shows "line 1: expected an action, got 'fly'" and the table is gone.
  - `spearman (unknown)` and `not-a-tech (unknown)` render selected and the text does not change.

The server was stopped (process group killed) and port 3917 is free.

## Spec gaps

None. The ticket wording issue from review 1 is still open. Respec 2 says "`to` (rally)" in the empty-option sentence, and it should read `rally` (produce). The code now follows the model, the validator and the ticket's own Selects paragraph. The manager may want to fix the ticket text.

## Acceptance criteria

| criterion | result | evidence |
|---|---|---|
| stepOptions constants, nodes, buildings 30, house | pass | step-options.test.ts:15-31 |
| villagerProducers, unitsByProducer, subset rules | pass | step-options.test.ts:26-41 |
| techs validate; rejected tech absent | pass | step-options.test.ts:43-60 |
| ordering, determinism, JSON round trip | pass | step-options.test.ts:63-79 |
| defaultStep / defaultTrigger validate | pass | model test :40-53 |
| changeAction / changeProducer | pass | model test :84-116 (rally now asserted) |
| trigger kind, reaction | pass | model test :118-141 |
| number rules | pass | model test :143-191, including the safe-integer cases |
| insert/delete/move/replace | pass | model test :55-82 |
| selectChoices | pass | model test :221-234 |
| round trip through text | pass | model test :236-262 |
| imports grep empty; no `byBaseId` in `.next/static` | pass | grep empty; `next build` at tip, `grep -rl byBaseId .next/static` empty |
| Playwright criteria (page load, both sync directions, every form, unparsable, unknown, number fields, move buttons, prebuilt/run) | left unticked: the specs are acceptance-test's | behavior confirmed by the manual probe above |
| table buttons never POST | pass | probe: 0 POSTs after add, move-up and delete |
| docs "paste textarea" 1 on main, 0 after; Page section content | pass | `git grep` gives 1 at 835aceb and 0 at tip; docs:717-733 |
| tsc, lint:dup, npm test, npm run acceptance | left unticked: acceptance not run here | tsc clean; jscpd 0 clones; vitest 39 files / 1053 tests pass (Node 24.22.2) |
| determinism | pass | pure functions, no clock or random |
| mutation checks | left unticked: not run by me | implementer-2 reports 3 rework mutations run; the original ones are in implementer-1 |
| no invariant regressions | pass | see below |

16 criteria are ticked in the ticket.

## Invariants touched

- **A1 holds.** `OPTIONAL_SELECTS` holds field names, not game ids or numbers. Every id comes from `stepOptions(GameData)`.
- **A3 holds.** `offersEmptyChoice` and `parseUnsigned` are pure. `stepOptions` sorts by a total order.
- **S1 holds.** There are no new imports, and nothing comes from another app.
- **S3 is not affected.** There is no new server input.

## Linter

`npx tsc --noEmit` is clean. `npm run lint:dup` finds 0 clones.

## Bot reconciliation

There is no `reviewBot.cli` and no `rulesFile` configured, so there is nothing to reconcile.

## Non-blocking notes

- `docs/aoe4-build-order.md:730` says "Bounds are checked on Run, not in the table". The table now also refuses numbers above `Number.MAX_SAFE_INTEGER`, which keeps the text printable rather than acting as a game bound. It is not contradicted in any practical sense, so this is a note only.
- These notes from review 1 still stand:
  - `step-options.ts:65-67` classifies every entry of a tech baseId, not only tech-type entries. This is latent only, because the English snapshot has no mixed-type baseIds.
  - `withoutField`, `setTriggerNumber` and now `offersEmptyChoice` are exported beyond the four named helpers.
- The `allowEmpty` wiring in `step-table.tsx` has no unit test, because vitest runs only `*.test.ts`. The acceptance specs should cover `rally.to` having no `(none)` option.
- `git merge-tree` of the tip against main b5c68d2 is clean.

## Coverage

- **Files reviewed:** the full diff 835aceb...923cbb6, all 7 files, plus the 4652ca9..923cbb6 delta line by line. I read `parse-text.ts` to confirm that every number field prints and parses as `\d+`, so `0` and any safe integer round-trip.
- **Checked against:** the ticket including Rework 1, design M3 step-table behavior rows, INVARIANTS, spec-checklist, and the REPO.md review checklist (Every diff and AoE4 build order).
- **Commands run:** tsc, lint:dup, npm test, next build, and the page under next start with the Playwright probe.
- **Empty files:** REVIEW.md does not exist. The repo and project LESSONS.md are empty.
- **Not run:** `npm run acceptance` (acceptance-test's) and the 1280px chart check (no chart change).
