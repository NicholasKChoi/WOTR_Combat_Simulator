# SGS-163 review 1

Verdict: APPROVE. Branch sgs-163-pin-first-arrival, tip e510f1fd05980dece2dc918ea5b6d58ba5fff07a, base origin/main.

## Blocking findings
None.

## Acceptance criteria
- Passes against unchanged product code: pass. The implementer records 19/19 passing. I ran no acceptance tests (not allowed).
- Bracket `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`: pass. The spec lines are `toBeGreaterThan(firstSampleSeconds - result.sampleSeconds + produce.walkSeconds)` and `toBeLessThanOrEqual(firstSampleSeconds + produce.walkSeconds)`. `t1` is `result.times[first index with count >= 1]`, `walkSeconds` comes from the `produce` request object, `sampleSeconds` from the response. No time literal.
- Fails when the latest arrival's `at` is kept: pass (recorded). The implementer changed `depletion.ts:112` to `at`; the upper bound failed (25 expected, 65 received). It was reverted, and the diff touches only the spec.
- Preconditions: pass. `second > first` (a later sample interval) and `steps[0].startedAt <= t1 - sampleSeconds` are asserted before the bracket. `steps[0]` is the only step, so it is the produce step. A missing sample gives index -1, and `counts[-1]` is undefined, so it fails loudly instead of passing. Both precondition mutations were test-side flips only, and the implementer says so. Each assertion is a plain comparison on response values the production code determines, so a spawn change that breaks it would fail it. This is acceptable.
- Pre-existing assertions (single warning, severity, `idleVillagers` bounds) are unchanged in meaning. The `villagers` const now reads from the hoisted `counts`. Other tests are unchanged.
- `git diff --name-only` lists only the spec file: pass.
- Invariants: A3 holds. The test is deterministic given the same request, and no product code changed.

## Extra precondition
The implementer added `counts[first] === 1`, which the ticket did not list. The bracket argument needs it, because the second spawn is after `t1` only when exactly one villager has spawned by then. It is justified and in scope.

## Lint
`npx tsc --noEmit` and `npm run lint:dup` are clean (jscpd found 0 clones). The review bot is not configured (`reviewBot.cli` is empty).

## Conventions
The test matches the nearby tests in the same file: the `simulate`, `order`, `warningsOf` and `last` helpers, and `expect(value, message)` messages. The new comment states a hidden constraint (no per-villager spawn time in the response) and is backed by `simulate.ts` `unitSeries` and `spawnUnit`. No ticket ids or factory pointers appear in the shipped text.

## Non-blocking notes
None. UI inspection was not applicable (test-only diff).

## Coverage
Reviewed the full diff, the target test in context, `depletion.ts:addIdleArrival`, the implementer report, and the lint result. I did not run acceptance or unit tests.
