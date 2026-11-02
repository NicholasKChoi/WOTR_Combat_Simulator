# SGS-063 tech-lead 1

## Decision
No blockers. Opened as a draft PR.

## PR
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/70 - base `main`, head `sgs-063-aoe4-auto-house-warnings` at 75f95d2da8deebb19399090c4ac020cf5ada7214 (pushed; no new commits). Single PR, no stack footer. Body set via `gh api -X PATCH`, ends with the required attribution.

### Merge risk
**medium** - edits critical-path event-loop symbols (`runInstant`, `simulateBuildOrder`, `payOrder`, `offerStep`) and widens the public `SimWarning` response union, but adds only record-keeping that no wake or payment reads, is additive to the response, and a revert fully undoes it.

### Review focus
- [`lib/aoe4-build-order/simulate.ts:650-661`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/70/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R650-R661) - if the supply flag is cleared at the wrong point, a produce step refused in the first pass but started in the second (after an earlier house completes at that instant) still counts as held, and the warning overstates `seconds`. The API cannot reach this case; only the unit test in `simulate-house-warnings.test.ts` pins it - check that the clear sits between `applyDueEvents` and the second `offerSteps`.
- [`lib/aoe4-build-order/simulate.ts:868-875`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/70/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R868-R875) - the held judgement runs after `nextWake` on state from the instant's last `runInstant`. If it read state mid-instant, or if it mutated anything, warnings would drift or timings would change - check that it only reads and that the gate is evaluated after the instant's steps ran.

## Why medium, not high
- A revert undoes it: no migration, no data rewrite, no external side effect.
- Critical-path symbols changed (`runInstant`, `simulateBuildOrder`, `payOrder`, `offerStep`), but only to set or read the new `supplyBlocked`, `heldAt` and `heldSeconds` fields. `nextWake`, `affordable`, `spend` and `orderNeed` are untouched, and no decision reads the new fields. Splitting the `payOrder` early-return keeps the same return conditions. Timing is pinned in unit tests (a digest of non-warning fields), and review 2 compared 66 runs with every non-warning output byte-identical.
- The public surface widens: two new `oneOf` variants, and the shipped knight+longbow build now returns one more warning. The only consumer, `components/apps/aoe4-build-order/messages.ts`, reads `code`, `severity` and `message` generically, and in-repo TS narrowing on `node` (`depletion.ts` `tieRank`, `builds.test.ts`) was updated and type-checks. An external client that switches exhaustively on `code` would see unknown codes. That is additive, not a break of an existing field.
- No new concurrency and no security surface.

## Reviewed
- Range: a30fbfd (origin/main, merge base)..75f95d2, 3 commits, all authored by choinickolas@gmail.com. Ticket ids or PR numbers appear in no commit message.
- Files (11, +457/-30): simulate.ts +62/-10, depletion.ts +5/-1, model.ts +3/-1, openapi.json +81/-1, docs/aoe4-build-order.md +32/-11, data README +4/-1, simulate-house-warnings.test.ts +172, house-warnings acceptance spec +79, contract spec +10/-2, depletion.test.ts +8/-2, builds.test.ts +1/-1.
- Reviewable hand-written logic: +70/-12.
- Invariants: A1 (`maxPopCap` read from data), A2 (no resource access), A3 (no clock or randomness; record only), S3 (no new input). None violated. CONTEXT.md has no open questions. The ticket's two rule choices (gate evaluated after the instant's steps; `payOrder` flags only its supply clause) are implemented as specified.
- Existing tests edited (listed in the PR body): builds.test.ts gold filter now uses `'node' in w`; depletion.test.ts `sortWarnings` rows and shuffle; contract spec code list and `simWarningVariants` extended to five.

## Non-blocking notes
- `lastHouseStep` uses `Array.prototype.findLastIndex` (ES2023) with tsconfig `target: es2017`. That is safe here because `simulate.ts` runs only in the API route (Node 24 on Vercel); the page fetches the route. If the engine ever runs in the browser, older browsers would lack it.
- The README and docs describe the knight+longbow step as "step 24" (1-based, as in the message), while the warning's `step` field is 23 (0-based). This is consistent with the docs' convention.
- `heldAt` is set at the first held instant even when that interval has zero length. The warning is gated on `heldSeconds > 0`, so this is not observable unless a zero-length interval precedes a positive one, which the loop's same-instant `continue` should prevent.
