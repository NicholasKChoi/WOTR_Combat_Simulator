# Tech-lead gate: batch SGS-208-SGS-208

## Decision

PASS. One stacked draft opened. No blockers, no untested hotspots.

## Opened PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218, base `main`, **new**, head pushed `7df2c519623c2aae052bd255566ed2f6bf4c6ea7` (branch `sgs-208-repeat-build-or-move-step`). Draft, title `feat: Repeat a build or move step: schema, expansion, simulator copies, OpenAPI 2.7.0`, body set (`body #218 rewritten`).

### Merge risk (verbatim)

**medium** - changes `simulateBuildOrder` (a critical path) and the public simulate API (new request key, two new required `StepTiming` fields), additively for every existing consumer; a revert undoes it.

### Review focus (verbatim)

- [`lib/aoe4-build-order/simulate.ts:1045-1114`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R1045-R1114) - any later read of the submitted order instead of the expanded one (final `waitingOn` loop, research notes) would mis-index timings and notes for repeated steps - check every use after the first statement reads `order`, not `submitted` - pinned by [`lib/aoe4-build-order/simulate-repeat.test.ts`: gives the whole result of %s written out, apart from source and copy](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218/files#diff-4f3c4b50f83cde95d0427c9a6906f45441a45f6442342ce3fe2983c0b10d7406R40-R55)
- [`lib/aoe4-build-order/schema.ts:577-581`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218/files#diff-d6dc7551ac06a7b81b7fba568c068b4b268bcf8ca3e62296c5031c1e4791558eR577-R581) - if the expanded cap counted written steps, one request could run 200 x 200 steps and break the per-request bound - check the count uses `expandedStepCount` and is skipped only on a field issue under `steps` - pinned by [`lib/aoe4-build-order/schema.test.ts`: accepts 200 written steps that expand to 200 and caps an expansion of 201](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218/files#diff-943b7bdc5a7814639e79935570b73853ca65c66adf9b6d89d263b626d4778bedR528-R536)
- [`lib/aoe4-build-order/simulate.ts:991-1004`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R991-R1004) - the stuck message could number a step by its expanded index or give a single-copy step the copy form - check `source + 1` numbering and the copy count per source - pinned by [`lib/aoe4-build-order/simulate-repeat.test.ts`: warns for a stuck copy with its expanded index and the source step, copy k of n](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/218/files#diff-4f3c4b50f83cde95d0427c9a6906f45441a45f6442342ce3fe2983c0b10d7406R129-R156)

Each entry's pinning test was read: the equivalence test deep-compares the whole SimulationResult against the written-out order (fails on any mis-indexed timing, note or waitingOn); the cap test asserts the exact 201 issue and acceptance at 200; the stuck test asserts the full warning object including message and expanded `step`.

## What was reviewed

- Range: `ddc68f3` (origin/main, merge base) .. `7df2c51`, two commits (`b4acfa7` feature, `7df2c51` acceptance spec).
- 21 files, +697/-46 total. Business logic +68/-7 (`repeat.ts`, `schema.ts`, `simulate.ts`, `model.ts`, `step-table-model.ts`), plus `docs/api/openapi.json` +66/-8; rest are unit tests, acceptance specs and prose docs.
- Stack check: single member on `main`; diff holds only SGS-208.
- Issue line: ticket Source names no `GitHub issue #<n>`, so none written.
- Checked against INVARIANTS A1, A2, A3, S3 and the criticalPaths symbols: the engine runs unchanged on the expanded order (no payment or wake change); expansion is pure and deterministic; the only simulate route (`pages/api/aoe4-build-order/simulate.ts`) validates through `checkBuildOrder` with whole-order rules, so the expanded 200-step cap applies before simulation. `skipWholeOrderRules` is used only by `text-to-build.ts`, which does not simulate. Saved builds (`saved-builds.ts` `roundTripIssues`) reject a `repeat` body with the existing round-trip 400, as the ticket's interim state says; stored records never held `repeat` (zod stripped unknown keys before).
- PROJECT.md Open questions: none.

## Non-blocking notes

- Request contract: a client that sent `repeat` on a `produce`/`research`/`rally`/`pause` step was previously ignored (200) and now gets 400; on `build`/`move` it now multiplies the step. The only in-repo consumer (the page) never sends `repeat`, so no existing consumer breaks; this is the designed behavior.
- `stepStuckWarning` counts copies with a filter over all timings per stuck step (O(n^2) on at most 200 steps); negligible.

## Cleanup

Scratch `tech-lead-SGS-208-SGS-208` removed after this report (see return summary for any deferred cleanup).
