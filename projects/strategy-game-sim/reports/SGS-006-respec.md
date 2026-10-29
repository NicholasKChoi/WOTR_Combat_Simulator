# SGS-006 re-spec (2)

Ticket: tickets/SGS-006-fight-api-contract.md. Base: code repo origin/main d54af2e. Inputs: reports/SGS-006-spec-gate.md, CONTEXT.md Decisions (2026-10-28), SGS-005 Scope 1, SGS-003 Scope 1, SGS-002 helpers, ARCHITECTURE.md on main.

## Gate gaps closed
1. Random endpoint: examples and wire-unchanged now checked by status, schema validity and key sets; wire-unchanged = type-only diff in fight.ts/simulate.ts plus SGS-003/005 specs passing unedited.
2. operationId asserted from the spec file; `Allow: POST` asserted over HTTP on GET; spec must declare `headers.Allow` (const POST).
3. Baseline = SGS-002 default armies (3/1/1 strings) + `battles: 20`; one field varied, paired regs/elts held legal (max regs with elts 0, max elts with regs 0; min 0 with baseline pair). Below-min stated plainly. File timeout 60 s, per-request 10 s. `battles` 100000 never posted here; SGS-005's HTTP/time-budget criteria cover it.
4. No keyed maps (SGS-005 pinned arrays), so `additionalProperties: false` everywhere; nested schema names pinned (FightOutcomes, OutcomeTally, RoundStats, FightSurvivors, SurvivorCombination, HitsPerRound).
5. Ajv: `addSchema(spec, 'openapi.json')` then `getSchema('openapi.json#/components/schemas/X')`; helper throws on undefined. Verified locally in a scratch dir with ajv 8.20.0 (refs resolve; short array and extra key rejected).

## Other changes
- Types moved to `lib/combat-simulator/fight-api.ts` (ARCHITECTURE.md). simulate.ts result type replaced by FightResponse if it declares one (type-only).
- Request schema: `oneOf` integer (min/max) / digit-string (pattern + x-minimum/x-maximum); cross-field rules and validation order in description.
- 400 description documents Next's plain-text `Invalid JSON` (Next 12.1.6 sendError: `res.end(message)`, no Content-Type); new malformed-JSON case in the contract spec.
- Mismatch between merged code and the SGS-003/005 contract now bounces to needs_spec instead of being documented.
- Corrected stale note: tsconfig already has `resolveJsonModule: true`; the spec is still read via fs.

## Size / risk
~360 total, ~150 business logic (types + test). Risk high (public API contract). No diagram (single component, no control-loop change).

## Open questions
None for the owner.

## Manager notes
- CONTEXT.md Key surfaces update after merge (still listed as out of scope).
- REPO.md `commands.acceptance` must be set after SGS-002 merges.
- Overlap: SGS-005 owns the battles=100000 timing check; this ticket deliberately does not repeat it.
