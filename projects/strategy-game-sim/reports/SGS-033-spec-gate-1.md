# SGS-033 spec gate 1

**Verdict: READY.** Confirmed risk tier: high. The ticket's Risk matches the template. The triggers are a new public API request/response and OpenAPI contract, and a cap that enforces S3. `criticalPaths` is empty.

Base checked: origin/main 68e004a. Dependencies SGS-028, SGS-029 and SGS-030 are unmerged drafts, so their exports were checked against those tickets.

## Check results
1. **Grounded scope.** Passes.
   - On main, `api.ts`, `parse-text.ts`, `validate.ts`, `simulate.ts` and `pages/api/aoe4-build-order/` do not exist. The ticket says they are new.
   - `fight-api.ts`, `pages/api/fight.ts`, `docs/api/openapi.json`, `acceptance/fight-api-spec-surface.spec.ts`, `fight-api-contract.spec.ts` and `helpers.ts` exist.
   - `docs/aoe4-build-order.md` has the "partial `SimInputs`" sentence at l.347 on main (one grep hit).
   - `model.ts` on main has `TripInputs`, `SimInputs`, `SimulationResult` and `BuildOrderIssue`.
2. **Testable criteria.** Passes. Every criterion names an HTTP status, issue code or jq/grep count. See the notes for two soft spots.
3. **Open questions.** Pass. CONTEXT.md has none, and the ticket's own were closed in respec 1.
4. **Invariants.** Pass. S3, A3 and S1 are named, and no criterion contradicts them.
5. **Contracts.** Pass. These match design/M2.md "Route request and issues" and "Line map":
   - the five `api.ts` types;
   - `parseBuildOrderText` returning `ok`/`order`/`lines`/`issues`;
   - `validateBuildOrder(input, data, { lines })`;
   - `resolveSimInputs(partial, data)`;
   - `SIM_INPUT_BOUNDS.textChars`, 20000 (SGS-029 l.35);
   - `simulateBuildOrder(order, data, inputs, rules = ...)`.
6. **Dependencies and size.** Pass. Dependencies are stated, and business logic is about 100 lines.
7. **Diagrams.** Pass. A flowchart is present for the cross-component sequencing.
8. **Lessons.** Pass. Both LESSONS.md files are empty.
9. **Decisions.** Pass. The body agrees with the CONTEXT.md decisions on malformed JSON keeping Next's 400 and on the OpenAPI spec as the contract. `SimulateError` with `issues` extends the "`{ error }` 400/405, accepted for now" decision. That is design-approved, and the new-route shape is pinned in the design.
10. **On merge.** Pass. The ticket names the CONTEXT.md Key surfaces entry.
11. **Risk.** Pass. See the confirmed tier above.
12. **Docs.** Pass.
    - Scope 7 covers the Route section of `docs/aoe4-build-order.md`, and the grep counts are stated.
    - `ARCHITECTURE.md` is correctly marked as needing no change.
    - The `/api/fight`-only assertions in the spec-surface test are covered by Scope 4.
    - The openapi `info.description` is generic ("HTTP API of the strategy game simulator site.") and stays true.

## Gaps
None blocking (no owner gaps, no author gaps).

## Notes (non-blocking, author may fold in)
- **Trigger unknown kind.** Scope 5 says an unknown `Trigger.kind` is "schema-valid only if the spec says so". The implementer must pick a side: kind enum with `oneOf` variants (schema rejects it, matching the server's `unknown-trigger-kind` 400), or an open `kind` string. Suggest fixing it: `Trigger` is a `oneOf` on `kind` const, so a body with an unknown kind is schema-invalid and the server returns 400 `unknown-trigger-kind`. Assert both.
- **Mutation check wording.** Acceptance criterion "pass `lines` on the JSON path" has no natural mutation, because the JSON path has no `lines` value. Suggest rewriting it as "pass the parser's `lines` (or a fabricated one) as the `validateBuildOrder` option on the JSON path, so a JSON issue gains `line`".
- **Spec-surface loosening.** Scope 4 is clear on names (nine `Fight*` plus `ArmyCount`). Suggest stating that the fight-only tests filter `schemas` by that name set rather than by a `Fight` prefix, since `ArmyCount` does not share the prefix.
- **413 test.** The criterion needs a body just over 1 MB, for example a `text` of about 1.1 MB. Mention that it is sent raw (`request.post` with `data`) and that Next replies before the handler runs.
- **Doc overlap.** SGS-029 also edits the bounds-table paragraph of `docs/aoe4-build-order.md` about omitted `inputs` fields. Scope 7 here only touches the Route section, so there is no conflict. The implementer should re-read after SGS-025 and SGS-029 merge, because line numbers (l.343-357) will have shifted.
- **Engine completeness.** Build, move and research steps return 200 with `waiting` timing until SGS-031 and SGS-032 merge. The ticket says so under Out of scope. No criterion uses those actions except the `invalid`/issue cases, which are validator-side.
