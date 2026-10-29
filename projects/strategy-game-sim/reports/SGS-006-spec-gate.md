# SGS-006 spec gate

Verdict: NEEDS_SPEC (four small gaps, none needs the owner; all closable by editing the ticket)

Checked against code repo origin/main d54af2e, REPO.md, CONTEXT.md, INVARIANTS.md, spec-checklist.md, ARCHITECTURE.md, SGS-002/003/005. Project and repo LESSONS.md are empty.

## Gaps

1. Acceptance criteria (examples) - "The spec's request and 200 examples are real endpoint output (re-run the request and compare)" cannot be confirmed by comparison: the endpoint is random, so a re-run never returns the same body. The wire-unchanged criterion has the same problem ("same ... bodies as before"). An implementer would guess what "compare" means. Fix: "re-run the example request; the response validates against FightResponse, has the same key set as the example, and the example request returns 200"; for wire-unchanged, "same status codes and same body key sets as before (before = merged SGS-005 behavior)".

2. Scope item 5 (operationId assertion) - "Documented operationId and the 405 Allow header are asserted against a real GET": operationId is not observable over HTTP. Fix: assert from the spec file that `paths["/api/fight"].post.operationId === "runFight"` and that `responses` keys are 200/400/405; assert over HTTP that GET returns 405 with `Allow: POST` and that the spec's 405 response declares an `Allow` header.

3. Scope item 5 (boundary cases) - the per-field boundary rule is convoluted ("minimum - 1 rejected where minimum is above the lowest legal value or field rejected below it") and omits the baseline body. Setting one field to its min or max while the others are 0 trips other rules (0 regulars + 0 elites is 400; regs 10 plus elts 1 is 400). The implementer must invent baselines. Also battles at 100000 takes up to 10 s (CONTEXT time budget) and Playwright's default test timeout is 30 s on a dev server, which the ticket does not mention. Fix: state a valid baseline (for example regs 1, elts 0, ldrs 0 each side, battles 20), vary one field per case, and for regs/elts keep the other field at a value that stays legal (max regs with elts 0, max elts with regs 0). State the below-min case plainly (min is 0 for six fields and 1 for battles; min - 1 is 400). Set a per-test timeout for the battles=100000 case.

4. Scope item 1 FightResponse vs `additionalProperties: false` / `required` every property - the stated outcome stats include a surviving-unit distribution and hits per round. If either is a keyed map (for example count by unit number), "additionalProperties: false on each object" and the `Record<keyof T, true>` drift check do not fit it, and the implementer must decide between a typed map (`additionalProperties: {schema}`, `Record<string, number>`) and arrays. Fix: add a sentence that map-shaped objects use `additionalProperties` with a value schema and are excluded from the key-set drift check, and that the contract check still validates their value type from a real response.

Also resolve in the same edit: Ajv `$ref` resolution. Item 5 says "compiles `components.schemas.*` with Ajv", but schemas reference each other as `#/components/schemas/X`, which Ajv resolves only relative to a root document. State how (for example compile `{ $ref: "#/components/schemas/FightResponse", components: spec.components }`, or addSchema the whole spec and use getSchema by that path). Otherwise the implementer will hit unresolved-ref errors and improvise.

## Checklist results

1. Grounded scope: pass with caveat. `pages/api/fight.ts`, `results.js`, `pages/apps/combat-simulator.js`, `pages/api/models/army.ts`, `tsconfig.json` exist on main; `fight-api.ts`, `openapi.json`, `acceptance/` are marked new or come from SGS-002. The response field names exist only after SGS-005 and the design doc section 8; the ticket handles this with "read merged code first" and a bounce to `needs_spec` rule. main's `BattleStats` is replaced entirely by SGS-005, so this ticket cannot be dry-run today.
2. Testable criteria: gaps 1 and 2 above; the rest are observable (jq outputs, Ajv validation, tsc failure on rename).
3. Open questions: none on the main path; owner answers are recorded.
4. Invariants: names S3, W1, W2; no contradiction. S1 is not at risk (same app).
5. Contracts: `battles`, `runFight`, schema names are introduced only here. spec-checklist says names must match CONTEXT.md Key surfaces, which still lists six fields and `BattleStats`. The ticket defers the update to a manager action after merge, which is explicit and acceptable; keep it on the manager's list.
6. Dependencies and size: SGS-002 and SGS-005 stated (SGS-001/003/004 transitive); about 120 business-logic lines, under 400. TASK-GRAPH deps match.
7. Diagrams: no trigger fires (single component, no new control loop).
8. Lessons: none recorded.
9. Risk: high is correct (public schema/API contract trigger). No criticalPaths configured.

## Notes (non-blocking)

- ARCHITECTURE.md says logic shared with API routes belongs in `lib/<app>/`, and `fight-api.ts` placed under `components/apps/combat-simulator/` is imported by a route handler. The ticket's reason (avoid a route under `pages/api/`) is valid, but `lib/combat-simulator/fight-api.ts` would match the layout; owner or implementer may choose, say which.
- `tsconfig.json` includes `**/*.ts`, so `acceptance/*.ts` is type-checked by `npx tsc --noEmit`; this relies on SGS-002 types for `@playwright/test` and on `@types/node` (present) for `fs`.
- REPO.md `commands.acceptance` is empty; the manager sets it after SGS-002 merges (the negative checks in the criteria need it).
- The design-doc link (item 6) is conditional on SGS-001 having merged; SGS-005 already depends on it, so it will have.
