# SGS-158 acceptance-test report 1

Verdict: PASS. Commit ba9dee1eb2a7b10ac223993ee78f2a2ec4a21138 on sgs-158-dice-hit-5-or-6 (on top of a412a69). Harness ran (Playwright, Chromium, acceptanceSetup run). Lint (tsc + lint:dup) clean.

## Tests written (acceptance/fight-api-hit-rule.spec.ts, 100000 battles through POST /api/fight, tolerance 0.01)
1. lone die vs lone die hits about one time in three: hitsPerRound[0] ~2/3, [1] ~1/3 per side, tie ~0.2, mean rounds ~1.8 (6-only rule gives 0.83 / 0.09 / 3.3). Pins the 4/5 boundary for combat dice.
2. leader re-roll hits on a 5 as well as a 6: 1 reg + 1 leader vs 1 reg; attacker/defender/tie = 10/19, 4/19, 5/19 (6-only re-roll gives attacker 0.47).
3. combat simulator page: 1v1 Fight! with 20000 battles, the /api/fight response the page receives has tie ~0.2 (tolerance 0.03).

Criteria not expressible through the boundary: the re-roll dice count (min(misses, leaders, 5)) and rollDice uniformity; both stay with the implementer's unit tests. The doc wording criterion is not a runtime behavior.

## Results
- New spec: 3 passed.
- Existing combat specs run on the new tip: fight-api-battles, fight-api-caps, combat-simulator-battles plus the new spec: 60 passed, 0 failed. The implementer's claim that the loose ranges still hold is confirmed.

## Mutation checks (each undone; git diff --exit-code on lib clean)
- battle.ts `thisDice >= MIN_HIT_FACE` changed to `>`: tests 1 and 2 failed (hitsPerRound[0] expected < 0.677, got 0.833; attacker frequency expected < 0.536, got 0.603).
- battle.ts `MIN_HIT_FACE = 6`: tests 1 and 2 failed (0.833; 0.603); page test failed (tie expected > 0.17, got 0.088).
- battle.ts attack leader re-roll mapped 5 to 4 (resolveRound): test 2 failed (attacker expected > 0.516, got 0.473); test 1 and page test correctly unaffected.

## Failures
None.
