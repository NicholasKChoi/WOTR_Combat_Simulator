# BATCH-031 tech-lead 1

## Decision
NO BLOCKERS. Opened one draft PR (single-task batch, no stack; `gh stack link` not applicable).

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/40 - base `main`, head `sgs-031-aoe4-build-move-ages` @ c88fb01 (pushed by this gate, no new commits). Author choinickolas@gmail.com on all commits.

## Reviewed
- Range origin/main ce342db..c88fb01 (5 commits: 37703f7, 13ec441, 301b322, cc00670, c88fb01).
- 9 files, +1320/-50 total. Reviewable logic: simulate.ts +169/-13, houses.ts +34 (+203/-13). Also docs/aoe4-build-order.md (+45/-12), new tests (build-move.acceptance 391, simulate-construction 566, houses 99), and existing test edits (simulate.test.ts +11/-20, simulate.acceptance.test.ts 3/3, research.test.ts 2/2).
- Existing test edits checked against ticket Scope section 5: the Seam test removal and handler restore, eight `autoHouses: false` pins (supplyProvider uses the allowed one-line `expect(` substitution with 3 unchanged), and the two-line research.test.ts pin. No assertion, expected number, or helper changed.
- Invariants A1, A2, A3, S3: hold (spend after affordable, clamped; fixed node order; data-driven numbers; house count capped by maxPopCap, builders validated 1-200). No concurrency, security, schema or migration. CONTEXT open questions: none. No consumer of simulateBuildOrder on main besides tests.

## Merge risk
**medium** - it changes what every engine run computes by default (auto-houses on, ages reported), and those are documented simulator inputs and outputs the planned simulate route will expose. The result shape stays compatible, nothing on main consumes it yet, and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:504-522`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/40/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R504-R522) - Auto-houses ignore a waiting step's reserve. In a wood-tight opener, each house can take the wood a waiting `build` or `research` step is saving for, so that step (for example a landmark) starts later than the player expects. Check that this matches the intended rule, and that `houseGateOpen` keeps auto-houses off for the whole run when the last `build house` step never starts.
- [`lib/aoe4-build-order/houses.ts:22-33`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/40/files#diff-47538e8438ee180a1c60c3d9544f464bfcadb553ff38c244e9ff9860d58af8b7R22-R33) - `shortfall <= 0` compares exactly and does not use the engine's resource tolerance. This is deliberate: the tolerance is not exported, and the change is backlogged. Float noise (for example `3.0000000000000004`) can start a house one instant early. A zero lead (house build time 0 and `walkSeconds` 0, which only edited data can produce) never plans a house, so production stalls at supply. Check that neither case matters for the shipped data.
- [`lib/aoe4-build-order/simulate.ts:325-343`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/40/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R325-R343) - Completion order: instance and supply, then `onBuildingComplete`, then the age advance (only when `entry.age === state.age`), then `onAgeAdvance`, then the builders' return walk. A wrong order would let a hook see a stale age, or let a second landmark of a passed age advance again.

## Non-blocking notes
- Commit cc00670's message contains a ticket id ("Add SGS-031 build/move acceptance tests"). This is a hygiene miss. It was not rewritten because this gate adds no commits. A squash merge with a clean title removes it from main.
- PR #39 (simulate route, unrelated draft against main) calls the engine. Whichever of #39 and #40 merges second may see route tests that assume a supply-10 stop under default inputs. Re-run that PR's suite after the first merges.
- docs "Builders walk `inputs.walkSeconds` each way": the code divides by the villager moveSpeed multiplier, as the doc does for other walks elsewhere. This is a minor imprecision.
- houses.ts `shortfall <= 0` instead of the engine tolerance is deliberate and backlogged. It is stated in the PR body.
