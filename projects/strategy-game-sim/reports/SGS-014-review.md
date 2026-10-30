# SGS-014 review

- Branch `sgs-014-aoe4-data-model-loader`, tip `d0845e5`, base `0b985f3` (full review; one commit, 10 files).
- Verdict: **REQUEST CHANGES** (one blocking finding, one-line fix plus one test).

## Blocking findings

1. `lib/aoe4-build-order/data.ts:136-145` - contract / invariant (A3). The returned `GameData` object is not frozen.
   `deepFreeze` covers `source`, the entries, the `byBaseId` arrays, `base` and `civData`, but the object
   literal `buildGameData` returns stays writable, and `loadGameData` caches and shares that object.
   - Probe (temporary test, since removed): `Object.isFrozen(loadGameData('english'))` is `false`. After
     `loadGameData('english').base = {...}` succeeds, every later `loadGameData('english')` returns the replaced
     `base`. The same is true of `civData`, `byId`, `supply`, `upgradeTargets` and `civ`.
   - Why it matters: design M2 "Rules files and loader" says `loadGameData` "returns the same deep-frozen
     instance (A3)". The ticket's A3 rationale is that a write into shared data must throw so that it cannot leak
     into a later run's timings. The top-level field write is the simplest such write, and it leaks silently.
   - Direction: freeze the returned object shallowly, for example `return Object.freeze({ ... })`. Do not
     `deepFreeze` it, because the Maps must stay unfrozen per the ticket. In the `freezes the shared data` test
     (`data.test.ts:157`), add an assertion that a top-level write such as `(data as any).base = {}` throws
     `TypeError`. Because test files are ESM and run in strict mode, the write throws.

## Spec gaps

None.

## Acceptance criteria

| criterion | result | evidence |
|---|---|---|
| snapshot keys and counts | pass | keys `source,units,buildings,technologies,upgrades`; counts `[43,30,69,11]` |
| verbatim and complete per kind; no non-`en` entries | pass | Fetched the four `all.json` files from raw.githubusercontent at `e89f01e598998bf76bdddfbf2afce1659fee00cf`. The ticket's `jq -S` diff prints nothing for all four. A stricter `jq -c` byte comparison, which keeps key and array order, is also identical, so upstream order and field order are preserved. The non-`en` count is 0. |
| `source` six fields, patch citable | pass | GitHub API: commit `e89f01e` was committed and authored at `2026-10-28T23:06:27Z`, matching `committedAt`, and it is still the latest commit upstream. `patchSource` https://www.ageofempires.com/news/age-of-empires-iv-update-17-0/ returns 200. Its title is "Age of Empires IV – Update 17.0.12182" and its `datePublished` is 2026-10-22T10:00:17-07:00, before `committedAt`. The page mentions no hotfix, and the news index lists no later AoE IV update. `patch` `17.0.12182` is therefore the patch live on `committedAt` and is citable. |
| `rules/base.json` keys and values | pass | Keys exact. Rates, capacities, property mappings and drop-offs match the Scope table. I recomputed the trip seeds from the net rates: 2.86, 3.73, 5.67, 3.01, 2.88, 2.88, 6.02. Boar is 5.67 with the "copied from deer" source. `dropOffSeconds` is 0 everywhere. `builderScaling` is 3/2, `maxPopCap` 200, `walkSeconds` 5 with the owner-assumption source. |
| `rules/english.json` | pass | `startingState` age 1; resources 200/200/100/0; villagers 6 on sheep; units `{scout:1}`; buildings `[capital-town-center]`. Four supply rows, each 10. Seven effects rows, matching the ticket. All 11 `upgradeTargets` present. I checked the quoted snapshot texts (`farm-1`/`mill-1` influences, `kings-palace-2` and `shaft-mining-3` descriptions) against the snapshot; they match. |
| every hand value has `source` and `unverified`; only sheep/deer/boar capacity verified | pass | Walked both files: every `value` object has a non-empty `source` and a boolean `unverified`. The only `unverified: false` values are the three capacities, each with source "owner, in-game observation 2026-10-30". |
| `model.ts` 16 exports | pass | The grep prints exactly the 16 names. `TechSupport` has `effects-unmodeled` and `SimInputs` has `walkSeconds`. The file is type-only and has only an `import type`. |
| `data.ts` exports | pass | All design names are exported, plus `buildGameData` and `Snapshot` as the test seam the ticket allows. |
| `classifyTech` counts and lists | pass | The `effects.test.ts` grouping test checks 7/3/4/41/14 with exact lists. `fitted-leatherwork-2` gives `['meleeArmor']` and `armor-clad-3` gives `['rangedArmor','meleeArmor']`. A unit or building throws. |
| loader behaviour | **fail (partial)** | Pass: id and baseId lookup, same instance, nested writes throw, Maps typed `ReadonlyMap` and not frozen, unknown civ throws, duplicate id throws, `scoutx`/`house` throw naming the key. Fail: the instance itself is not frozen (finding 1). |
| A1 and S1 greps | pass | Both print nothing. |
| tests can fail for a real reason | pass | The implementer reports running the mutation checks. I spot-checked the test code for each named mutation and it targets the right assertion. |
| `tsc`, `npm test`, `next build`; no new route | pass | `npx tsc --noEmit` is clean. `npm test` passes: 6 files, 90 tests. `npx next build` succeeds, and its routes are unchanged (`/`, `/404`, `/api/fight`, `/apps/combat-simulator`, `/apps/starcraft-helper`). |
| no invariant regressions | fail until finding 1 is fixed | See invariants below. |

I ticked no criteria in the ticket, because the verdict is not APPROVE.

## Invariants touched

- **A1** holds. The only numbers are in the snapshot, whose `source` carries patch `17.0.12182`, or in a
  `HandValue`/`OverlayEffect` with a source. `lib/` has no rate or modifier literals.
- **A3** holds in behaviour: there is no randomness or clock in `lib/`, and `fetchedAt` is written only by the
  refresh script. The freeze guard is incomplete (finding 1).
- **S1** holds. There are no cross-app imports.
- **A2** and **S3** are not touched (no engine, no route).

## Linter

`npx tsc --noEmit`: clean, test files included. The repo has no ESLint config.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. There is no `rulesFile`.

## Conventions

- The `lib/` sources use 2-space indent with semicolons, matching `lib/combat-simulator/battle.ts:1-20`.
  The tests use 4-space indent with no semicolons, `describe`/`it` and `vitest` imports, matching
  `lib/combat-simulator/army.test.ts:1-10` and `battle.test.ts:1-12`.
- File placement (`data/<app>/`, `lib/<app>/`) follows the ARCHITECTURE.md "Where files go" table.
- The `.mjs` refresh script has no sibling to compare against. Its 4-space, no-semicolon style matches the test files.
- Shipped-artifact hygiene: the diff and the commit message contain no ticket ids, factory pointers or
  process history. The commit author is `choinickolas@gmail.com`.

## Non-blocking notes

- `data.test.ts:145-151` and `data.ts:128-130`: the ascending-age test cannot fail today. Every baseId in the
  snapshot is already in ascending age order upstream (checked with jq), so deleting the `sort` passes all
  tests. A seam test that passes `buildGameData` a reversed copy of the `man-at-arms` entries would cover
  it. The ticket lists this test, and it does what the ticket says.
- `data.ts:96`: `deepFreeze` skips the children of an object that is already frozen. That is harmless for
  JSON imports. It would leave mutable children only if a caller passed in a shallow-frozen object.
- `buildGameData` freezes the objects it is given; callers must pass clones, as the tests do. This is
  acceptable for a seam, but it is not documented.
- For the interpreter ticket: `professional-scouts-2`'s `huntCarryCapacity` effect selects `scout`. The
  ticket already notes this.

## Coverage

Reviewed every file in the diff: `data.ts`, `effects.ts`, `model.ts`, both test files, `README.md`,
`refresh-snapshot.mjs`, and both rules files value by value. The snapshot was checked mechanically against
upstream, including key order and array order. I also checked the snapshot's entry shapes against the
`SnapshotEntry`/`SnapshotEffect` types: every entry has the typed fields, and `select` keys are only `id` and
`class`.

REPO.md Review checklist:
- "Every diff": `next build` ran. The diff touches no page, so there was no page to load under `npm run dev`.
- No section's `Paths:` covers `lib/aoe4-build-order/**` or `data/aoe4-build-order/**`. There is no AoE4
  section yet; this is not a blocker.

`docs/aoe4-build-order.md` is out of scope for this ticket, so the design doc M2.md served as the contract.
