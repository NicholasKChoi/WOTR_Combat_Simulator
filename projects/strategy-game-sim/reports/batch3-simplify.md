# batch3 simplify: SGS-006
- Diff reviewed: 11038fe..ee34dac (fight-api.ts, simulate.ts, fight.ts, two acceptance specs, openapi.json).
- Changed: acceptance/fight-api-contract.spec.ts warm-up now uses postFight (review note 3). 1 line.
- Left alone: `req.body as FightRequest` (ticket asked for it), other review notes (no behavior or coverage change warranted), openapi.json, wire shape.
- Checks: npx tsc --noEmit clean; npm test 57/57 pass. Acceptance specs not run (need dev server; type-checked by tsc).
