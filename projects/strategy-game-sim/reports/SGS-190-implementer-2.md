# SGS-190 implementer 2 (Rework 1, text only)

Branch sgs-190-busy-building-wait, new tip a39e091297cfa476eddb21987669e07fc0c21d94 (was 613c38d). Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-190-busy-building-wait

Files:
- docs/aoe4-build-order.md:227: "With a capital town center" became "With an idle capital town center"; the rest of the sentence is unchanged (the textiles example now says the capital must be idle).
- lib/aoe4-build-order/simulate-construction.test.ts:235: retitled to 'keeps the unit paid before the age-up, then starts the next-age unit when that unit completes'.
- lib/aoe4-build-order/simulate.test.ts:420: retitled to 'waits for the villager in production, charges nothing before it starts, then trains the scout and resumes villagers at its spawn'.

Fix 1 deviation: the ticket's verbatim text rewrote two sentences. The doc already held the same second clause, so I changed only the "an idle" wording. The resulting text equals the required sentence. No assertion or code changed.

Tests: simulate-construction.test.ts and simulate.test.ts, 130 passed, 0 failed.
Lint: no `lint` npm script exists in this checkout. `npx tsc --noEmit` printed nothing (clean). `lint:dup` ran and printed only its footer, which I did not inspect further. Build, codegen and the full suite were not rerun (text-only pass).
Mutation checks: none (no test added or changed).
Unverified assumptions added: none. Out-of-scope findings: none.

Status: needs_review
