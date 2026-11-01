# SGS-030 review 1 (full)

Branch `sgs-030-aoe4-engine-core` @ f657815, base origin/main dbe695f. Diff: `docs/aoe4-build-order.md` (+29), `lib/aoe4-build-order/civ-rules.ts` (new, 33), `lib/aoe4-build-order/simulate.ts` (new, 557), `lib/aoe4-build-order/simulate.test.ts` (new, 716, 56 tests).

## Verdict

APPROVE

## Gates

- `npm ci` ok. `npx tsc --noEmit` exit 0. `npm test`: 19 files, 542 tests pass. `npx next build` exit 0.
- Linter: `commands.lint` is empty; there is no ESLint config. Nothing to run.
- Review bot: `reviewBot.cli` is empty and not required. No bot ran.
- REPO.md `### Every diff` (load touched pages in the dev server) does not apply because the diff touches no page or route. No REPO.md section has `Paths:` covering `lib/aoe4-build-order/**`.

## Blocking findings

None.

## Spec gaps

None blocking. A possible docs follow-up is listed under non-blocking notes (what a producer does after a counted `produce` completes).

## Acceptance criteria

All pass. Every one is ticked in the ticket.

- A2: barracks test GameData (food 0, gold 100), MAA x1. Every floating sample is >= 0, `startedAt > armedAt`, `waitSeconds > 0`, and `startedAt` = 90/(6r) within tolerance (simulate.test.ts A2 block). The affordability check with tolerance (simulate.ts:118-120) runs before every spend, and the post-spend clamp is at simulate.ts:221-238. An extra probe with 50 mixed steps over 3600 s and two TCs also found no negative sample.
- Priority: the villager order pays nothing before the step starts, and the first villager is paid at `startedAt + 50/(6r)` (the series is first counted at +20). In the food 200 / gold 0 run the villager keeps paying at 0 and 20. The reserve is in produce (simulate.ts:246-267) and offerSteps (simulate.ts:288-309).
- A3: deep-equal reruns pass, including mid-game rally and a `start.villagers` split. Inputs and frozen GameData are not mutated. The grep for clock and random calls finds nothing.
- Default start: villager counts are 0/1/2/3/3 at 15/20/40/60/120. Food rate is 6r*60 at 20 and 7r*60 at 25. `floating.food[0]` is 150. The scout is in no `unitsProduced` series.
- Triggers: `@0:30` gives `armedAt` 30. `at 8 vils` arms on the spawn that brings the count to 8 (triggerHolds uses `>=` on gatherers+walking, simulate.ts:151-161). The not-reached and waiting statuses are both tested.
- Same instant: a rally at 20 routes the t=20 villager to wood, with income from 25. `at 7 vils` rally routes villager 8. Existing villagers keep their node. runInstant offers steps, then events, then offers steps again, then production (simulate.ts:375-380).
- Rally scope: the instance, wide, and held cases are all tested. addBuildingInstance resolves held, then default, then `start.rally` (simulate.ts:131-149). The produce rally sets the standing rally. A rally step is completed at its arm time. Walk = (walkSeconds ?? inputs.walkSeconds)/moveSpeed (simulate.ts:204-219) is checked with a moveSpeed GameData.
- Switch: the villager in production still spawns at 20. Food at 10 = 150 + income - 65. The scout runs 20..43 and the step completes at 43. No villager is paid after 10.
- Pause: completes at 10. The villager in production spawns at 20 and none after. `#2` with one instance is a no-op and `completed`. A later TC instance gets the default order (simulate.ts:269-278).
- Completion: counted x2 completes at the 2nd spawn. Continuous production is in-progress at the horizon and completed at a later pause's `startedAt`, and its paid villager still spawns.
- Produce waits: `#2` with one instance waits and blocks later steps. A spearman whose lowest age (2) is above the current age waits without a reserve (unitEntry, simulate.ts:241-244), and the villager order keeps running.
- Seam: build, move and research all wait and block. A registered `stepHandlers.build` starts with no loop change.
- Sampling: `SAMPLE_SECONDS` 5. Duration 62 gives last samples 60 and 62. Array lengths match. t=0 shows the instant at 0 already applied.
- Hooks: each of the six hooks changes the output. `NO_CIV_RULES` is frozen. `civRules('english')` gives the default result.
- Exports: `git grep "^export "` lists exactly the 12 + 4 names in the seam block. tsc passes.
- Perf: the 3600 s run with 20 steps is well under the 1 s bound.
- A1: the only literals are 0, 1, 60 (SECONDS_PER_MINUTE), 5 (SAMPLE_SECONDS) and one tolerance `RESOURCE_TOLERANCE = 1e-9`. The comparator's -1 is a negated 1. The data-sensitivity tests (villager time, sheep rate) pass.
- Docs: they state the FIFO paid-item queue, cost and population paid together, switch/pause with no refund (docs/aoe4-build-order.md:169), the priority rule, and the completion rule. They agree with the design's Production table and Priority rule.
- `npm test` and tsc pass. No invariant regressions.

## Invariants touched

- A1 (no invented constants): holds, see above.
- A2 (no negative resources; waits reported): holds. The spend is gated by the affordability check with tolerance, the clamp is at 0, and waits are reported via armedAt/startedAt/waitSeconds/`waiting`.
- A3 (determinism, no mutation): holds. There is no clock or random call. The event queue is a sorted array with stable insertion for ties. Iteration uses Map insertion order. The id tiebreak is a plain `<`. Inputs and GameData are untouched, and tests cover this.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` empty, not required).

## Implementer interpretations (judged)

1. A wide rally write clears `heldRallies` for that baseId (last writer wins). This agrees with design M2.md "Rally and start" and the docs rally section. A held rally written later still beats the default. Acceptable.
2. The `dropOffRule` view replaces only the field gather.ts reads (simulate.ts:383-396). This matches the ticket. Acceptable.
3. No wake for supply-blocked or age-blocked steps. Supply, age and instances change only at events or step instants, and those re-offer steps. The ticket's wake list names only affordability. Acceptable. Later house and age events will provide the wake.

## Compatibility with the next engine ticket

- A build phase can be appended to runInstant.
- `nextWake` (simulate.ts:420-432) can take extra wakes.
- `walking` already counts builders as alive.
- The reserve mechanism works for a build handler.
- `ages` is built as a literal in the result (simulate.ts:554), so the next ticket needs an engine-private ages field. Private fields are allowed.
- The seam test's `withHandler` deletes the handler in `finally`. The next ticket must restore the real handler there, as its own ticket already says.

## Non-blocking notes

- simulate.ts:212-215: if a `villagerProducer` hook returns false for a building that produces villagers, `at.rally` is undefined and a TypeError follows. The ticket says validation guarantees this case cannot happen and asks for no runtime check, so this is a note only.
- simulate.ts:301: the condition `'reserve' in outcome || outcome.started !== true` is partly redundant. It is harmless.
- After a counted `produce` completes, the instance is left with `order` null and the default villager order does not resume. This follows the ticket, but the docs do not say it explicitly. A spec or docs follow-up could state it.
- The event queue uses O(n) shift/splice on a sorted array. This is fine at these sizes.
- The supply-wait assertion (`floating.food[50] > 65`) is weak. The Priority criterion is covered more strongly by the `at 7 vils` armedAt arithmetic.
- The docs line numbers cited in the ticket are stale; the implementer already noted this.

## Out-of-scope findings

- The docs Outputs section never states the order of `unitsProduced` (first spawn, then unitId). This was raised by the implementer and is not in this ticket's scope.

## Coverage

Reviewed in full: all four changed files, against gather.ts, validate.ts, gather.test.ts and validate.test.ts as siblings. Style matches: sources use 2-space indent and semicolons like gather.ts, and tests use 4-space indent with no semicolons like the sibling tests. Also checked: INVARIANTS.md A1-A3, spec-checklist, CONTEXT.md key surfaces and out of scope, design M2.md, and the next engine ticket for seam compatibility.

Not covered:
- No REPO.md review-checklist section covers `lib/aoe4-build-order/**`.
- The dev-server page check was not applicable because no page changed.
- No linter or review bot is configured.
