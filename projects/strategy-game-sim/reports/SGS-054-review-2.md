# SGS-054 review 2 (delta 0093867..9a2937c)

Verdict: **REQUEST CHANGES**

Branch sgs-054-aoe4-m3-docs-openapi-audit, tip 9a2937c58c544f841b53f1c2a5fc8be02f30ece0, base main d90d91a. Delta mode: one commit, `docs/aoe4-build-order.md` only (+9/-8).

## Blocking findings

1. `docs/aoe4-build-order.md:357` - contract - The rework lowercased "Resource depletion (Depletion), on by default" to "resource depletion (Depletion), ...". The ticket's stale-statement criterion greps case-sensitively for `resource depletion`, and the grep must print 0. At 0093867 it printed 0. At 9a2937c it prints 1:
   `grep -c -E "Resources are infinite|never runs out|resource depletion|At most one step is armed|is not .time. or .villagers.|Its controls are" docs/aoe4-build-order.md` -> 1 (line 357).
   - Why it matters: the line itself is not stale, because it lists depletion as in scope. The criterion is still mechanical and now fails, so acceptance-test would bounce it.
   - Direction: reword the list item without the literal lowercase phrase, for example "- depletion of finite nodes (Depletion), on by default: ...". Restoring the capital "Resource" would also pass the grep, but it breaks the list's lowercase style. Then re-run the grep and confirm it prints 0.

## Rework criteria

- [pass] (rework 1) `spawnedPopulation` (`:670`) now reads "the population (summed `popcap`) of the villagers and units that have spawned". This matches `simulate.ts:280` (`state.spawnedPopulation += entry.costs.popcap`), `design/M3.md:596` and the OpenAPI description.
- [pass] (rework 1) Node-ref message form (`:488-490`). Step fields, `start` and the `depleted` trigger use `<reason> in <path>` (`validate.ts:345` `checkNode`, `:197` trigger). `nodeAmounts` keys use `inputs.nodeAmounts.<ref>: <reason>` (`validate.ts:417-418` `inputIssue`, `:471-473`). Live POST on `next dev` port 3962 returned:
  `start: unknown node "iron" in start.rally`, `steps[0]: node "farm" never runs out in trigger.node`, `inputs.nodeAmounts.iron: unknown node "iron"`, `inputs.nodeAmounts.farm: node "farm" never runs out`, `inputs.nodeAmounts.gold#1: node "gold#1": deposit 1 is written gold`.
  Each matches the documented form and code. The `start: ` / `steps[0]: ` prefix is the label that review 1 accepted.
- [pass, but see finding 1] (rework 1) Wording notes:
  - "series over time" (`:11`) is correct, because `spent` and `spawnedPopulation` are `number[]` per sample (`model.ts:158,160`).
  - "with the chart markers (see Page; the warnings are lists beside them)" (`:712`) is accurate.
  - "severity level" (`:395`) is accurate.
  - "never applied" (`:443`) is correct: `effects.ts:55,64` reads the ignored properties only to classify and name them.
  - The extra lowercasing at `:357` causes finding 1.

Other original criteria were re-checked mechanically on the tip; none regressed except stale statements:
- Coverage tokens: all 15 are at least 1.
- Factory refs: 0.
- Combat statement: 2 hits.
- openapi stale grep: 0.
- Schema count: 36.

Tables: the delta touches no table row. No bare `|` was added in prose. The cell counts are unchanged.

Ticket boxes are left unticked because of the verdict.

## Invariants touched

None. This is a docs-only delta with no code change.

## Checks (Node 24.22.2)

- `npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones, exit 0.
- `npm test`: 40 files; 1076 passed, 8 skipped.
- `ACCEPTANCE_PORT=3961 npx playwright test acceptance/aoe4-simulate-api-contract.spec.ts acceptance/fight-api-spec-surface.spec.ts`: 99 passed.
- Live POST: see above. The server on 3962 was stopped and the port is not listening.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty (REPO.md). No bot was run.

## Non-blocking notes

- `:488`: "The reason quotes the value" is not true for a non-string value. That reason is `node must be a string` (`validate.ts:141`). This text predates the delta, which only made it a standalone sentence. Consider "The reason quotes a string value."
- `:490` and `:670` are now long unwrapped lines (about 200 and 140 characters). The doc already has many lines over 120, so this is cosmetic only.

## Coverage

- Reviewed: the full delta diff; `validate.ts` node-ref paths (`:140-157`, `:190-200`, `:269-300`, `:342-347`, `:417-475`); `simulate.ts:270-285, 871-872`; `model.ts:158-160`; `effects.ts` IGNORED usage; doc sections Node references, Severity, Technologies and Outputs.
- Not run: full `npm run acceptance` (delta is docs only).
- REPO.md checklist: no page or code touched, so `next build` was not run.
