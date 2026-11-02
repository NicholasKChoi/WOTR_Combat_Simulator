# SGS-064 tech-lead 1

## Decision
No blockers. Opened draft PR https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/72. Its base is `main` and its head is `sgs-064-aoe4-house-lead-time` at 011755fc2b7804535ba6216b1b9337d13c917d6e. The branch was not on origin before this run. I pushed it unchanged, with no new commits. It is a single PR, so it has no stack footer.

## Merge risk and review focus (copied from the PR body)

## Merge risk
**high** - changes the values an existing consumer reads: the simulate API (and the page) return different timings, gold run-outs and warnings for the shipped Spear/Longbow build. The response shape is unchanged, and a revert fully undoes it (pure computation, no stored data).

## Review focus
- [`lib/aoe4-build-order/houses.ts:22-23`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/72/files#diff-47538e8438ee180a1c60c3d9544f464bfcadb553ff38c244e9ff9860d58af8b7R22-R23) - the headroom filter decides when every auto-house starts. If it is too strict, houses get over-built and wood goes to them early. If it is too loose, the old stall returns. The comparison is a float `<=` against `state.time + lead`, and a building started in the same instant as planning with fractional walk or build times can land 1 ulp past the boundary. No shipped build hits that today. Check that the boundary case and an item beyond the lead behave as the docs say.
- [`lib/aoe4-build-order/simulate.ts:382-390`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/72/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R382-R390) - a completing building removes its record by exact `completesAt` equality. If `findIndex` ever returned -1, `splice(-1, 1)` would silently drop the last in-flight building's record and under-count pending supply. This holds today because the same `done` value is both stored and passed to the completion. Check that nothing recomputes it.
- [`lib/aoe4-build-order/houses.ts:28-29`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/72/files#diff-47538e8438ee180a1c60c3d9544f464bfcadb553ff38c244e9ff9860d58af8b7R28-R29) - the room cap must keep summing all pending supply, including buildings beyond the lead. If it only counted arriving supply, planning would push supply past 200 and build wasted houses near the cap.

## What I reviewed
- Range: origin/main 3ff99c6 to 011755f, five commits (68e0ac1, fe3de3e, 4675699, 99e181c, 011755f), all authored by choinickolas@gmail.com. The manager said four; there are five.
- Files: 9 files, +215/-40. Hand-written production code is +14/-12: houses.ts +6/-4 and simulate.ts +8/-8. The rest is tests (houses.test.ts, simulate-construction.test.ts, simulate-house-warnings.test.ts, two acceptance specs) plus the docs and README.
- Checked against the AoE4 invariants:
  - A1: the cap is still read from data.
  - A2: planning reads supply and population only, and affordability is unchanged.
  - A3: completesAt is the scheduled `done` value, with no clock and no randomness.
- No other consumer of `HouseDemand` or `constructing` exists. `pendingSupply` and the old doc phrases have zero hits. The README has no stale 1218/1944/2670/681-start numbers.
- No irreversibility, concurrency, security, or API-shape change. The CONTEXT open questions are "None".

## Non-blocking notes
- The step-23 re-pin in acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts (constant comment at line 9) says "arms at the landmark and starts after it, once resources allow". It does not name the lead-time rule, as the ticket asks each re-pin comment to. The 1200 s depletion re-pin (line 45) and the digest re-pin do name it. Review 2 accepted this.
- simulate.ts:390: `splice(findIndex(...), 1)` has no guard for -1, so a mismatch would silently remove the last record. This is safe today because the same `done` value is both stored and passed to the completion. The PR lists it as a review focus.
- houses.ts:22 can be off by 1 ulp at the boundary with fractional times (raised by review 1). No shipped build hits it.
- The data/aoe4-build-order/README.md Knight/Longbow sentence (auto-houses count the palace's supply at once) is now inaccurate. It is left for the follow-up ticket, as the ticket says, and the PR body says so.
