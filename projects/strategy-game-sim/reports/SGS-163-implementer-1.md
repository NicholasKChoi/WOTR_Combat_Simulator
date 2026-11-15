# SGS-163 implementer report 1

- Ticket SGS-163, branch sgs-163-pin-first-arrival, tip e510f1fd05980dece2dc918ea5b6d58ba5fff07a, checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-163-pin-first-arrival
- Files: acceptance/aoe4-simulate-api-depletion-engine.spec.ts only (test "produced villagers rallied to it add to a single idle-arrival warning").

## Change
Replaced `at > 0` with preconditions and the bracket. t1 = `times[first index where villager count >= 1]`.
- count at t1 is exactly 1
- first index with count >= 2 is later than the first index with count >= 1
- `steps[0].startedAt <= t1 - sampleSeconds`
- `t1 - sampleSeconds + walkSeconds < at <= t1 + walkSeconds` (walkSeconds from the `produce` object, sampleSeconds and times from the response)

I added one precondition the ticket did not list: count at t1 is exactly 1, which the bracket's "later arrivals fall outside" argument depends on.

## Tests
- Spec file: 19/19 pass against unchanged product code (acceptance run, since this is an acceptance spec edit).
- Invariant encoded: A3 (idle-arrival `at` is the first arrival, deterministic).

## Mutation checks
- `lib/aoe4-build-order/depletion.ts:112` `at: record?.at ?? at` changed to `at` (latest wins): failed on `expect(arrivals[0].at).toBeLessThanOrEqual(t1 + walkSeconds)`, Expected <= 25, Received 65. Reverted with git checkout.
- Precondition second-spawn assertion flipped to `toBeLessThanOrEqual(first)`: failed with message "the second villager spawns in a later sample interval than the first" (<= 4, got 8). Test-side flip only; I did not construct a request that genuinely spawns two villagers in one interval. Undone.
- Precondition startedAt assertion flipped to `toBeGreaterThan`: failed with "the produce step is running before the first villager spawns" (> 15, got 0). Test-side flip only. Undone.

## Doc claims
Added a comment in the test: "The response has no per-villager spawn time: the first spawn lies in the sample interval ending at the first sample that counts a villager, and its walk to the berry adds walkSeconds." It is backed by `simulate.ts` unitSeries and spawnUnit, per the ticket Context.

## Builds and lint
- `npx tsc --noEmit` and `npm run lint:dup`: clean.
- Full `build` and `commands.unit` not run: test-only change in an acceptance spec, with no product code touched.
- `git diff --name-only` lists only the spec file.

## Other
- Pre-existing tests edited: none besides the target test body. Pinned outputs: none. Not a Bug ticket.
- Unverified assumptions added: none. Out-of-scope findings: none.
- Status: needs_review
