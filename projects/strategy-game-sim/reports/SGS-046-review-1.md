# SGS-046 review 1

Branch `sgs-046-aoe4-step-table-editor`, tip 4652ca9 (base main 835aceb). Full-branch review.

**Verdict: REQUEST CHANGES**

## Blocking findings

1. `components/apps/aoe4-build-order/step-table.tsx:45` - correctness - The `rally` action's `to` select is built with `pick('to', options.nodes, true)`, so it gets a `(none)` option. Choosing it runs `withoutField(step, 'to')`, but `to` is required for `rally` (`model.ts:64`; `validate.ts` STEP_FIELDS `req('to', 'node')`; design `defaultStep` `rally <p> -> <nodes[0]>`). The formatter then prints `rally capital-town-center ->`, which does not parse. I reproduced this in the browser (next build + next start + Playwright): after one click the textarea holds `rally capital-town-center ->`, and the table is replaced by `step-table-unavailable` with the message "line 3: expected a node name, got end of line". So a single table click turns valid text into text the table cannot show. Fix: drop the optional flag (`pick('to', options.nodes)`). Only `produce.rally`, `build.then` and `research.at` are optional. Ticket note for the manager: the respec 2 phrase "Selecting the empty option in the `then` (build), `to` (rally) and `at` (research)" can be read as the `rally` action's `to`. That reading contradicts the same ticket's "node fields from `nodes` (`then` and `rally` carry an empty option)", as well as the model and the validator. The ticket should say `rally` (produce) there.
2. `components/apps/aoe4-build-order/step-table-model.test.ts:109` - test - The test is named "only swaps the producer on pause and rally", but its only assertion covers `pause`. The `rally` branch of `changeProducer` (`step-table-model.ts:76`) is never exercised by it. Fix: add a `rally` assertion (for example `{ action: 'rally', producer: 'capital-town-center', to: 'sheep' }` to `town-center`), or rename the test.

## Spec gaps

None that block. See the ticket wording note in finding 1.

## Acceptance criteria

| criterion | result | evidence |
|---|---|---|
| stepOptions constants, nodes, buildings 30, house | pass | step-options.test.ts:15-31; unit run green |
| villagerProducers, unitsByProducer['capital-town-center'], subset rules | pass | step-options.test.ts:26-41 |
| techs all validate; rejected tech absent (editGameData) | pass | step-options.test.ts:43-60 |
| ordering, determinism, JSON round trip | pass | step-options.test.ts:63-79 |
| defaultStep validates for each action, defaultTrigger within bounds | pass | model test :39-50 |
| changeAction / changeProducer | pass (code); test gap on rally, finding 2 | model test :82-112 |
| trigger kind change, reaction | pass | model test :114-139 |
| number rules table | pass | model test :141-180 (trigger fields go through the extra `setTriggerNumber`) |
| insert/delete/move/replace immutability and ranges | pass | model test :53-80 |
| selectChoices | pass | model test :182-195 |
| round trip through text, every form | pass | model test :197-223 |
| imports grep empty; no `byBaseId` in `.next/static` | pass | grep empty; next build at tip, `grep -rl byBaseId .next/static` empty |
| Playwright criteria (page load, sync both ways, every step form, unparsable, unknown, number fields, move buttons, prebuilt/run, no POST from buttons) | not reviewed as specs (acceptance-test owns them) | Manual Playwright probe against `next start`: 25 rows = 25 step lines; add appends `produce villager from capital-town-center` and drops the `# note` and blank lines, with `start` kept; clearing count drops `x3`, typing 7 gives `x7`; unknown options `spearman (unknown)` and `not-a-tech (unknown)` render without a text write; clearing and `abc` in seconds leave the text unchanged, and blur shows 90; deleting the last row leaves `""` and `step-add` is still present; no POST from table buttons |
| docs: "paste textarea" 0 matches; Page section names table, one text state, dropped comments, unavailable notice | pass | docs/aoe4-build-order.md:713-733 |
| tsc, lint:dup, npm test | pass | tsc clean; jscpd 0 clones; vitest 39 files / 1037 tests |
| determinism | pass | pure functions, no clock or random |
| mutation checks | not verified by me; implementer reports them run | |
| no invariant regressions | fails until finding 1 is fixed (not an invariant break, a correctness break) | |

Ticket boxes left unticked (verdict is not APPROVE).

## Invariants touched

- A1: holds. The only literals in `step-table-model.ts` are `VILLAGER_ID`/`HOUSE_ID` imports, `'wood'`, and the 0/1/100 UI defaults. All ids come from `stepOptions(GameData)`.
- A3: holds. `stepOptions` sorts by (lowest age, code-unit baseId), a total order, so Map insertion order does not leak into the output. The model functions are pure.
- S1: holds. Nothing is imported from another app.
- S3: not affected. No new server input. Bounds are still enforced by the route.

## Bot reconciliation

No `reviewBot.cli` and no rulesFile configured.

## Non-blocking notes

- `step-table-model.ts:113`: `/^\d+$/` accepts any length. A 22-or-more digit draft becomes `Number(...) >= 1e21`, the formatter prints `x1e+21`, and the text stops parsing, so the table disappears (reproduced in a unit probe). Bounds belong to validation, but this breaks the text loop. Consider rejecting drafts where `!Number.isSafeInteger(n)`.
- `lib/aoe4-build-order/step-options.ts:65-67, 84-86`: the tech filter calls `classifyTech` on every entry of a baseId. `validate.ts:120,364` only checks entries of tech types. `techSites` and the age sort also use every entry. The English snapshot has no baseId with mixed entry types (checked), so this is latent only.
- `step-table-model.ts:101,116`: `withoutField` and `setTriggerNumber` are exported in addition to the four named helpers. The ticket's number rule lists trigger `seconds`/`count`/`atLeast` under `setNumberField`, but the implementation splits them out. The behavior matches the ticket, so this is fine. Mentioned so SGS-055 knows the names.
- `step-options.ts:69`: `producers` is filtered to buildings, because the snapshot lists non-building producers such as `wynguard-army`. This is consistent with the design ("building baseIds named in any unit's producedBy").
- Conflict check against main b5c68d2 (timeline, which also edits `pages/apps/aoe4-build-order.tsx` and the docs Page section): `git merge-tree` is clean. No semantic interaction: the timeline uses `resultText` captured at Run, and the table writes `text`.

## Coverage

Reviewed the whole diff, all 7 files: step-options.ts and its test, step-table-model.ts and its test, step-table.tsx, the page, and the docs. Read against ticket, design M3 (Step options, Page props/test ids, step table behavior rows), INVARIANTS, spec-checklist, REPO.md review checklist (Every diff + AoE4 build order), validate.ts STEP_FIELDS/checkField, parse-text.ts parser and formatter. Ran tsc, lint:dup, npm test, next build, and the page under next start, with a Playwright probe of the main flows. The project and repo LESSONS.md are empty. Not run: `npm run acceptance` (the new specs are acceptance-test's) and a check of chart overlap at 1280px (no chart change).
