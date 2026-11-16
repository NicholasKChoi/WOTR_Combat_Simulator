# SGS-169 spec gate 2

**Verdict: READY**

Read at origin/main after `git fetch origin`. No scratch checkout was needed.

## Checks against re-spec 2

- Scope names the right doc files and statements. All were confirmed at origin/main.
  - `docs/aoe4-build-order.md`: the Severity section has the "`error`, `warning` or `info`" sentence, the `tech-effect-*` table row, and the closing "page lists ... `info` messages behind a toggle" sentence.
  - `docs/aoe4-build-order-format.md`, `notes` bullet: "Every note has `severity: 'info'`" (line 409).
  - `docs/aoe4-build-order-format.md`, `warnings` bullet: severities "one of `error`, `warning`, `info`" (line 418).
  - `docs/aoe4-build-order-ui.md`: the Messages paragraph (lines 144-148) and line 57. Line 57 stays true once research notes are `debug`, because the gold run-outs are still `info`.
- A grep of `docs/`, `README.md`, `lib/aoe4-build-order/README.md` and `data/aoe4-build-order/README.md` for severity, info and "not simulated" found no other statement made untrue. The `data/aoe4-build-order/README.md:183` hit is about the +5 not being simulated and is unaffected.
- `docs/api/openapi.json`: the `Severity` enum and description (line 4784), and the `BuildOrderNote` severity description "every note is info" (line 4759), are in Scope. The `SimulationResult.notes` description ("Non-fatal notes about technologies whose effects are not all simulated") stays true. The `severity: "info"` example at line 1798 is a `node-depleted` warning and stays true.
- `acceptance/aoe4-simulate-api-contract.spec.ts:160` pins `schemas.Severity.enum` to `SEVERITIES`, as the ticket says.
- Tests that pin the old behavior match the ticket's list.
  - `research.test.ts:645-654` asserts `info` for notes.
  - `acceptance/aoe4-simulate-api-research.spec.ts:37` asserts `toBe('info')`.
  - `acceptance/aoe4-build-order-inline-issues.spec.ts:196` builds its `infos` list from warnings plus notes filtered on `info`. Once research notes are `debug` this is still correct for the Knight/Longbow build, and the ticket's counts-only-what-the-page-shows rule covers it.
  - `m4-flow` and `knight-longbow-page` filter on `node-depleted` and on severity, so they are unaffected.
- Code names are correct. `researchNotes` has two `severity: 'info'` literals (research.ts lines 112 and 121) and `Severity`/`SEVERITIES` are in model.ts lines 68-70.
- Risk `standard` is right. `researchNotes` is not a critical path symbol, and simulation timings are untouched.
- Invariant A3 (notes stay a pure function of the order and data) is correctly named.
- Unverified assumptions `none` is right, since no external service is involved.
- `On merge: none` is right.

## Notes (non-blocking)

- `resultMessages` in `messages.ts` already drops any severity other than `warning` or `info`. The new UI-hiding criteria therefore hold today at the `resultMessages` level and mostly guard against regression. Only the criterion that renders a real research build, whose notes are `info` at the base, can fail before the change. The implementer should therefore cover the end-to-end case (a run with only research notes shows no toggle) as well as the unit case.
- Adding `debug` to `Severity` also widens the `severity` type of every `SimWarning` variant. That is harmless, but the implementer should not narrow it as part of this ticket.
