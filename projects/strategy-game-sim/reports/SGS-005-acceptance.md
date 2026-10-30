# SGS-005 acceptance
Verdict: PASS. Tip da88cc1 on sgs-005-n-battle-outcome-frequencies. `npm run acceptance`: 148 passed, 0 failed. `npx tsc --noEmit` clean.
Updated: fight-api.spec.ts, fight-api-validation.spec.ts, fight-api-caps.spec.ts (caps restated against survivors/hitsPerRound/outcomes).
New: acceptance/fight-api-battles.spec.ts (battles field accept/reject, precedence, shape, consistency, one-sided, no carry-over, time budget), acceptance/combat-simulator-battles.spec.ts (UI).
Not expressible: "no per-round/per-battle server log output" (playwright.config.ts does not pipe dev-server stdout; config is non-test). Leaders-never-lost check dropped (leaders absent from response); replaced by survivors <= starting units.
