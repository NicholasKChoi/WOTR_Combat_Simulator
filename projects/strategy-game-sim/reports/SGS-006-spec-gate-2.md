# SGS-006 spec gate 2

Verdict: READY (no blocking gaps; six non-blocking notes)

Checked: ticket (respec 2), prior gate `reports/SGS-006-spec-gate.md`, `reports/SGS-006-respec.md`, CONTEXT.md, INVARIANTS.md, SGS-002 helpers, SGS-003 Scope 1, SGS-005 Scope 1/3 and open questions, TASK-GRAPH, REPO.md, both LESSONS.md (empty). Code repo origin/main d54af2e: `pages/api/fight.ts`, `tsconfig.json`, `package.json`, ARCHITECTURE.md read via git show; Next 12.1.6 `sendError` and the `Invalid JSON` ApiError confirmed in `node_modules/next/dist/server/api-utils`.

## Prior gaps

1. Examples / wire-unchanged cannot be compared on a random endpoint: CLOSED. Case 2 and criteria use status, Ajv validity and key-set equality; wire-unchanged is a type-only diff plus SGS-003/005 specs passing unedited.
2. operationId not observable over HTTP: CLOSED. Case 1 asserts operationId and the `responses` key set from the file; case 4 asserts `Allow: POST` over HTTP; the spec must declare `headers.Allow`.
3. Boundary cases had no baseline, convoluted below-min rule, no timeouts: CLOSED. Baseline is SGS-002 defaults (strings 3/1/1, matches `acceptance/helpers.ts` in SGS-002 section 3) + `battles: 20`; one field varied with its pair held legal; min-1 stated plainly; 60 s file timeout, 10 s per request; `battles` 100000 never posted (SGS-005 criterion line 219 covers it).
4. Keyed maps vs `additionalProperties: false` / drift check: CLOSED. SGS-005 section 1 pins arrays and no keyed maps; the ticket's table matches it field for field (battles, outcomes.{attacker,defender,tie}.{count,frequency}, rounds.{mean,median,p10,p90}, survivors.{attacker,defender}[].{regulars,elites,count,frequency}, hitsPerRound.{attacker,defender}[6]). Ranges and the survivor `frequency` definition match.
5. Ajv `$ref` resolution: CLOSED. One root document via `addSchema(spec, 'openapi.json')`, `getSchema` by ref, throwing helper.
6. (prior note) types location: CLOSED. `lib/combat-simulator/fight-api.ts` matches ARCHITECTURE.md (line 22: `lib/<app>/`; line 26: `docs/api/openapi.json`).

## Checklist

1. Grounded scope: pass. `pages/api/fight.ts`, `results.js`, `pages/apps/combat-simulator.js`, `pages/api/models/army.ts`, `tsconfig.json` exist on main; `fight-api.ts`, `openapi.json`, the contract spec, `simulate.ts` (SGS-005) are new. `docs/combat-simulator.md` is absent on main but the link is conditional. The ticket bounces to needs_spec if the merged handler differs from the copied contract.
2. Testable criteria: pass. jq one-liners, Ajv validation, status/header/body checks, tsc failure; negative checks are enumerated.
3. Open questions: none on the main path. SGS-005 open item 7 (survivor frequency denominator) is owner-confirm, non-blocking; SGS-006 copies "share of that side's wins". The bounce rule covers an override (see note 1).
4. Invariants: S3, W1, W2 named; no contradiction (the ticket documents the caps; it posts no N above 1000).
5. Contracts: names (`battles`, `runFight`, schema names) are introduced here. CONTEXT.md Key surfaces is stale and its update is a stated manager action after merge.
6. Dependencies and size: SGS-002 and SGS-005 stated (SGS-001/003/004/007 transitive), matches TASK-GRAPH. About 150 business-logic lines, under 400.
7. Diagrams: no trigger fires.
8. Lessons: none recorded.
9. Risk: high is correct (public schema/API contract trigger). No criticalPaths.

## Notes (non-blocking)

1. SGS-005 item 7 (survivor denominator) is not yet confirmed by the owner. If the owner overrides it before SGS-005 merges, SGS-006's `SurvivorCombination.frequency` description must follow; the existing bounce rule handles it. The manager should hold SGS-006 start until SGS-005 has merged (already implied by Depends on).
2. `additionalProperties: false` on `FightRequest` says extra keys are invalid, while the description says the handler ignores them. Say in the description that the schema is deliberately strict (clients should send only the listed keys) and the server is lenient.
3. Case 2 "each SurvivorCombination present": a side with an empty array (probability about 1e-6 per run with symmetric armies and N = 20) has nothing to compare. Say to compare key sets of the first element of each non-empty array and skip empty ones.
4. Scope 3 "type the request body as `FightRequest`" vs the criterion "diff contains only imports and type annotations": state the form (for example `req.body as FightRequest` at existing read sites, no new statements) so the criterion is not tripped.
5. Case 6 reads min/max from the integer branch only; the string branch `x-minimum`/`x-maximum` can drift unchecked. Optionally assert in case 1 that they equal the integer branch values. Also identify the integer branch by `type === 'integer'`, not by `oneOf` index.
6. Implementation hints: `ajv` import is `import Ajv2020 from 'ajv/dist/2020'` with `esModuleInterop` on; use `import type` for the types in the spec (`isolatedModules` is on); the request example's value encoding (strings vs numbers) is unstated, either validates; `info.version` value is unstated (any semver string). REPO.md `commands.acceptance` must be set after SGS-002 merges so the negative checks can run.
