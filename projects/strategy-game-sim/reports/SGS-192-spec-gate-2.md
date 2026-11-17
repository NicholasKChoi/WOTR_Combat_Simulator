# SGS-192 spec gate 2

Ticket: `tickets/SGS-192-record-what-a-waiting-step-waits-for.md` (respec 1). Code read at origin/main after `git fetch origin`. SGS-190 has no branch yet; its end state (`instanceFree`, `held`, `hold`, checks 4 and 5) is taken from its ticket, and the ticket's use of it matches. No scratch checkout was made.

## Verdict: READY

All four gate-1 gaps are closed:
1. Name-list pins: Scope now has the rule with both examples, which exist at base: `data.acceptance.test.ts:311` and `fight-api-spec-surface.spec.ts:93`. `fight-api-spec-surface.spec.ts` is in the acceptance run, and the contract-spec placement (`StepWaitEntry` in `RESPONSE_SCHEMAS`, `StepWaitDetail` in `SHARED_SCHEMAS` with the variant check) is stated.
2. The busy sample is a property (seconds equal `waitBreakdown.prerequisite` and `waitSeconds`, asserted above 0 first); no invented number remains.
3. The `constructing` criterion no longer claims a typecheck; it requires the field on `EngineState` only, a test, and a diff read.
4. The package README is in Scope and in the criteria.

## Checks run
- Grounded scope: every named symbol and `started: false` site exists at base (simulate.ts 397/400/404/490/493/497/507/536, research.ts 48/52/56, `(state as Engine).constructing` casts at 450/455, `constructing` on `Engine` at 153). The existing tests named as examples exist (`simulate.test.ts` 395, 430, 1002; README line 154 new-step-action line).
- Contracts: every handler rule, builder, reader, text-form row and B-W rule matches `design/M11.md` (B-W1 to B-W9, B-W11, B-W12, C1, C2, C5, C6, C7a, C7b). `waitBreakdown` retyping keeps the same four keys, so `step-annotations.ts` compiles untouched.
- Criteria are properties; the only pinned values come from the design (forms table, samples). The "whole number at least 1" claim holds: `ceil` of a positive value.
- Dependency: SGS-190 is stated. Its check 4 and check 5 and `hold` field match what this ticket names. No overlap with SGS-191 beyond the shared-list note already in Scope. SGS-193 consumes this ticket's output and does not duplicate it.
- Risk `high`, `Unverified assumptions: none` (no external service; all engine-internal), `On merge: none`, Open questions none, diagram present, no input-validation trigger, size about 300 business-logic lines.

## Notes (non-blocking)
- SGS-190's re-gate is in flight. If it changes check numbering, `held`, `hold` or the busy-wait shape, re-check the `produce` busy row and the research no-free-instance row here.
- `researchHandler` first check: Scope says "every tier above the age: `ageWait(lowest age among the tech's entries)`". A tech with no technology or upgrade entry is schema-impossible; the implementer may return a null detail there (consistent with the other schema-impossible paths).
- SGS-191 edits the same lists, `Record<keyof ...>` literals and `openapi.json`; whichever lands second rebases. Already in Scope.
