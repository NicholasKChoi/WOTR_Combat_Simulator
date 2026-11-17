# SGS-190 review 2 (delta, text-only rework)

Branch `sgs-190-busy-building-wait`, delta `613c38d..a39e091`. Verdict: **APPROVE**.

Required fixes from review 1:
1. `docs/aoe4-build-order.md:227` - landed verbatim ("With an idle capital town center and two idle town centers, ..."). The other facts survive: textiles goes to the capital, `at town-center` goes to town center 1, and with town center 1 busy it goes to town center 2. Pass.
2. `simulate-construction.test.ts:235` - retitled verbatim to 'keeps the unit paid before the age-up, then starts the next-age unit when that unit completes'. Pass.
3. `simulate.test.ts:420` - retitled verbatim to 'waits for the villager in production, charges nothing before it starts, then trains the scout and resumes villagers at its spawn'. Pass.

The delta is three changed lines in three files (one doc sentence, two test titles). No code or assertion change. No new findings.

Blocking findings: none. Invariants: unchanged from review 1 (A1, A2, A3 hold). Review 1 non-blocking notes and the design-doc corrections for the manager still stand. I did not re-run lint or tests, because the diff changes text only.
