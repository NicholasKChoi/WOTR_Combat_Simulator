# Simplify pass, batch SGS-156-SGS-156

Verdict: trimmed. Tip moved 7bedffe -> c8685a7 on sgs-156-auto-houses-plan-ahead. Not pushed.

Ran the /simplify skill (Skill tool available) with 4 parallel agents (reuse, simplification, efficiency, altitude) over `git diff e50e074...HEAD`.

## Applied (behavior and assertions unchanged)
- Renamed the describe/it titles in `simulate-house-gate.test.ts` ("prebuilt builds at 1800 s", "%s timeline matches the pinned digest").
- Dropped the always-0 `index` column in the `simulate-house-hold.test.ts` step table.
- Moved `noneNegative` to `test-helpers.ts`; reused in `simulate-house-hold.test.ts` and in place of the inline loop in `simulate-construction.test.ts`.
- Acceptance spec: deleted unused `WARM_UP_TIMEOUT_MS` and its comment; `inWindow` now a flatMap of indices.
- `engine-common.ts`: hoisted the empty-hold check out of `heldNeed`'s inner loop; fixed the `canAffordHeld` comment, which claimed every handler goes through it (explicit house builds do not).

## Skipped
- Altitude/efficiency refactors in critical-path `simulate.ts` (`runHousePass` replans, `nextWake`/`reactionNeeds` shape, `isHouseBuild` duplication, `payOrder`): behavior-risk, outside a quality-only trim of a high-risk change.
- Wider `noneNegative` swap in research/simulate/acceptance tests (outside the diff); `simulateOk` inputs param; unit/acceptance scenario sharing; `houses.test.ts` wrapper/`lead` vs window naming; test re-simulation savings. Optional, low value.

## Checks
- `npm test`: 84 files passed, 2583 tests passed.
- `npx tsc --noEmit` clean; `npm run lint:dup` clean.
