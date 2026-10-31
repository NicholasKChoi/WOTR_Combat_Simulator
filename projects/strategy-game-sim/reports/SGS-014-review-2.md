# SGS-014 review 2 (rework 1)

- Branch `sgs-014-aoe4-data-model-loader`, tip `cac82e8` (local; `git ls-remote origin` shows no such branch), merge-base
  `0b985f3`. This is a full review of both commits (`d0845e5` and the rework commit `cac82e8`; 10 files) against the ticket,
  including its Rework 1 section. I worked in a detached worktree at `worktrees/review-sgs-014-aoe4-data-model-loader` and
  removed it afterwards.
- Verdict: **APPROVE**.

## Blocking findings

None.

## Rework 1 required fixes

| fix | result | evidence |
|---|---|---|
| `buildGameData` returns `Object.freeze({ ... })`, shallow | pass | `data.ts:137-146`. The four Maps are created inside the literal and are not frozen; `base` and `civData` are still deep-frozen. |
| top-level write throws `TypeError`; removing the freeze fails the test | pass | `data.test.ts:168-172` assigns `base` and then checks that a later `loadGameData` still sees `walkSeconds` 5. Mutation: with `return ({` the test `freezes the shared data so a write throws` fails. |
| reverse-age `buildGameData` test; deleting the sort fails it | pass | `data.test.ts:194-202`. It first asserts that the reversed input really is out of order. Mutation: with the `tiers.sort` line deleted, `orders each baseId by ascending age whatever the input order` fails. |
| one comment saying `buildGameData` freezes its inputs | pass | `data.ts:113-115`. It says the inputs are frozen in place and that callers should pass copies. |

The original A3 finding is closed: the cached `GameData` is now frozen.

## Spec gaps

None.

## Acceptance criteria (all ticked in the ticket)

| criterion | result | evidence |
|---|---|---|
| snapshot keys and counts | pass | keys `source,units,buildings,technologies,upgrades`; counts `[43,30,69,11]` |
| verbatim and complete; no non-`en` entries | pass | I fetched the four upstream `all.json` files at `e89f01e598998bf76bdddfbf2afce1659fee00cf` again; the ticket's `jq -S` diff is empty for every kind. The non-`en` count is 0. The data files are unchanged since `d0845e5` (`git diff --stat d0845e5 cac82e8` lists only the two `lib` files). |
| `source` fields, patch citable | pass | patch `17.0.12182`, `patchSource` ageofempires.com update-17-0, `committedAt` 2026-10-28T23:06:27Z. The citation was verified in review 1 and the data has not changed since. |
| `rules/base.json` | pass | I dumped the values. Keys are exact. Rates, capacities, properties, drop-offs and trip seeds (2.86/3.73/5.67/5.67/3.01/6.02/2.88/2.88, drop-off 0) match Scope 3. `builderScaling` 3/2, `maxPopCap` 200, `walkSeconds` 5 with the owner-assumption source. |
| `rules/english.json` | pass | `startingState` age 1, resources 200/200/100/0, 6 villagers on sheep, units `{scout:1}`, buildings `[capital-town-center]`. Supply has 4 rows, each 10. The 7 effect rows match exactly. The 11 `upgradeTargets` rows match. |
| HandValue labels; only sheep/deer/boar capacity verified | pass | the hand-value walk tests pass, and the dump shows `unverified: false` only on those three capacities |
| `model.ts` 16 exports | pass | the grep prints exactly the 16 names; `effects-unmodeled` and `walkSeconds` are present; the file is type-only |
| `data.ts` exports | pass | it exports the design names, plus the test seam `buildGameData`/`Snapshot` |
| `classifyTech` counts and lists | pass | `effects.test.ts:90-108` checks 7/3/4/41/14 with the lists, and lines 47-50 check the fitted-leatherwork and armor-clad entries. A unit or building throws. |
| loader behaviour | pass | id and baseId lookup, same instance, deep and top-level freeze, `ReadonlyMap` checked with `@ts-expect-error`, Maps not frozen, unknown civ throws, duplicate id throws, `scoutx` and `house` throw naming the key |
| A1 and S1 greps | pass | both print nothing |
| tests fail for a real reason | pass | I ran every mutation the ticket names myself; each one fails at least one test: removing `moveSpeed` (wheelbarrow, drift guard, counts); emptying a `source`; deleting the `house` supply row (walk count); deleting an `upgradeTargets` row (reference test); deleting the Shaft Mining rows (shaft-mining test and counts); setting sheep `unverified: true`; removing the deep freeze; removing the top-level freeze; deleting the sort; removing `checkStartingUnits` (both tests); letting unit/building through `classifyTech`; retyping `byId` as `Map` (`tsc`: TS2578 unused `@ts-expect-error` at `data.test.ts:40`). |
| `tsc`, `npm test`, `next build`, no new route | pass | `npx tsc --noEmit` clean. `npm test`: 6 files, 91 tests passed. `npx next build` succeeds, with routes `/`, `/404`, `/api/fight`, `/apps/combat-simulator`, `/apps/starcraft-helper` (unchanged). |
| no invariant regressions | pass | see below |

## Invariants touched

- **A1** holds. Every game number is either in the patch-labeled snapshot or in a sourced `HandValue`/`OverlayEffect`, and `lib/` has no rate or modifier literals.
- **A3** holds. `lib/` has no randomness and no clock. The shared `GameData` is frozen at the top level and in every plain object and array below it. The Maps are guarded by their `ReadonlyMap` type, as the ticket decided.
- **S1** holds. There are no cross-app imports.
- **A2** and **S3** are not touched, because the diff adds no engine and no route.

## Linter

`npx tsc --noEmit` (`commands.lint`) is clean, test files included. There is no ESLint config.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Conventions

- `data.ts` and `effects.ts` use 2-space indent with semicolons, like `lib/combat-simulator/battle.ts:1-20`. The tests use 4-space indent with no semicolons and `describe`/`it`, like `lib/combat-simulator/army.test.ts:1-10`. The rework lines follow the same styles.
- The new comment at `data.ts:113-115` meets the comment bar, because callers otherwise could not see that the function freezes its inputs.
- Shipped-artifact hygiene: the code, data, README and commit messages contain no ticket ids, factory pointers or process history. Both commits are authored by `choinickolas@gmail.com`.

## Correctness

- `Object.freeze` returns a `Readonly<...>`, which is assignable to `GameData`. `effects.test.ts:13,70` spread `data` into fixtures, and spreading a frozen object gives a writable copy, so those tests are unaffected.
- `buildGameData` throws (duplicate id, bad starting unit) before it freezes anything or caches the result, so a failed load leaves nothing half-built in `loaded`.
- `Array.prototype.sort` is stable, so equal-age tiers keep upstream order.

## Non-blocking notes

- `data.ts:96`: `deepFreeze` does not descend into an object that is already frozen. This is harmless for the JSON imports and the cloned inputs. It would leave children mutable only if a caller passed in a shallow-frozen object. Carried over from review 1.
- Merge state: the branch's merge-base is `0b985f3`, while `origin/main` is `43a0331` (one commit that changes only `ARCHITECTURE.md`). `git merge-tree` reports a clean merge.
- The branch is not on `origin`, so the push and PR are still to do.

## Out-of-scope findings

None.

## Coverage

Reviewed every file in the diff: `data.ts`, `effects.ts`, `model.ts`, both test files, the README, `refresh-snapshot.mjs` (unchanged since review 1, skimmed), both rules files value by value, and the snapshot (checked mechanically against upstream).

REPO.md Review checklist:
- "Every diff": `next build` ran. No page is touched, so there was no page to load in `npm run dev`.
- No checklist section's `Paths:` covers `lib/aoe4-build-order/**` or `data/aoe4-build-order/**`. There is no AoE4 section yet; this is not a blocker.

`docs/aoe4-build-order.md` is out of scope for this ticket, so `design/M2.md` served as the contract.
