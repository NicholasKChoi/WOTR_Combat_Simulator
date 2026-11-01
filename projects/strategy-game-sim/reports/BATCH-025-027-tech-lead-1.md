# BATCH-025-027 tech-lead 1

Decision: **NO BLOCKERS. Stacked draft PRs opened and linked into a native gh stack (stack #33).**

## PRs, bottom to top

1. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/30 (SGS-025), base `main`
   - Merge risk: **low**. A docs-only change that a revert fully undoes. It touches no code, API, schema or config.
   - Review focus: No hotspots. Documentation only, and no code reads it.
2. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/31 (SGS-026), base `sgs-025-aoe4-doc-rally-start`
   - Merge risk: **medium**. It extends the build-order input schema types additively (one new union variant, one optional field, two new types), so existing values stay valid and a revert undoes it.
   - Review focus: No hotspots. The change is type declarations with no runtime code, `tsc` checks every use, and no code switches over `BuildStep.action` yet, so the new variant breaks no exhaustive match.
3. https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/32 (SGS-027), base `sgs-026-aoe4-model-rally-start-types`
   - Merge risk: **low**. New pure functions with no caller yet. A revert fully undoes them, they touch no API, schema or config, and unit and acceptance tests pin each rule, including a cross-check against a public calculator within 0.05 per minute.
   - Review focus: No hotspots. Nothing calls these functions yet, they are pure over frozen data, and tests pin the trip formula, effect order, coverage weighting, age and producer conditions, and builder scaling.

Branches pushed bottom up with no new commits: c763bec, 1fc08bd, e0bf455. `gh stack link 30 31 32` succeeded
(https://github.com/NicholasKChoi/WOTR_Combat_Simulator/stack/33). The PR bodies were set with `gh api -X PATCH`. Before this run, none of the three branches had a PR.

## What I reviewed

- Range: origin/main 68e004a .. e0bf455, linear (each branch is an ancestor of the next). Every commit is authored by
  choinickolas@gmail.com, and no commit message has a ticket id or PR number.
- Stack check: each branch's diff against its base holds only its own task. SGS-025 changes only `docs/aoe4-build-order.md`
  (+71/-18). SGS-026 changes `model.ts` (+16/-1), plus `data.acceptance.test.ts` and `model.acceptance.test.ts`.
  SGS-027 adds `effects.ts`, `gather.ts` and `construction.ts` (+122/-2), plus 3 doc lines that the ticket's
  Docs step requires, plus tests (525 lines).
- I read every hand-written line of non-test code in full. I checked the data: in the snapshot, `moveSpeed` effects are
  multiply only, so `modifiedValue(1, 'moveSpeed', ...)` cannot add a unit-mismatched change. Upgrades carry no
  effects, so the `type === 'technology'` filter in `activeEffects` drops nothing. No technology baseId has more than one entry.
- Invariants: A1 holds (all numbers come from data and inputs, and the only literals are 0 and 1). A2 is not touched. A3 holds (pure, no clock or RNG).
  S1 holds (imports only from the app's own modules). S3 is not touched. Before this, CONTEXT.md had no open questions,
  and the ticket's contract choices (`EffectState` carries `data` and `coverage`, and `effectiveGatherRate` takes a `GatherNodeId`)
  are recorded in the ticket for the designer.
- Irreversibility, concurrency, security: none. There are no migrations, routes, secrets or permission changes.
- Contract: the `BuildStep` union gains a variant and `BuildOrder` gains an optional field. Nothing outside the tests consumes
  them today. The doc now requires `start.rally` for English orders. No prebuilt build orders exist yet, so nothing becomes invalid.

## Non-blocking notes

- `effects.ts` `activeEffects` flatMaps every `technology` entry under a researched baseId. If a later snapshot refresh adds
  several technology entries that share a baseId (for example per-age variants), their effects would be applied more than once.
  Today every technology baseId is unique. The loader could assert this, or the engine ticket could pick one entry.
- `conditionWeight` matches `condition.age` exactly, so overlay rows must list one row per age, as the farm bonus does. A future
  "from age N on" row written as a single row would silently stop applying after age N.
- My first PR 32 body stated the builder formula wrong (4/(n+3)). I corrected it to the data's 3/(n+2) before reporting.
