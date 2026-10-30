# SGS-014 implementer report

- Ticket: SGS-014 (add English aoe4world snapshot, rules files, model types, loader, tech classifier)
- Branch: `sgs-014-aoe4-data-model-loader`, base `0b985f3` (origin/main at fetch time)
- Tip SHA: `d0845e5976b1b539ca9ce1e00a7cd230c3c7406a` (author choinickolas@gmail.com)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-014-aoe4-data-model-loader`
- Not pushed; no PR.
- Note: origin/main has since moved to `43a0331` ("Update ARCHITECTURE.md stack versions"); it touches only ARCHITECTURE.md, not anything this branch touches. `git diff --stat 0b985f3 HEAD` shows only the 10 files below.

## Snapshot pin and patch
- aoe4world/data `e89f01e598998bf76bdddfbf2afce1659fee00cf` (committed 2026-10-28T23:06:27Z; still the latest commit when fetched).
- `patch`: `17.0.12182`. `patchSource`: https://www.ageofempires.com/news/age-of-empires-iv-update-17-0/ ("Age of Empires IV – Update 17.0.12182", published 2026-10-22, so it was live on committedAt). The aoe4world commit e9d6498 (2026-10-24) is titled "DLC Raiders of the North, patch 17.0.x", which agrees.
- Counts: [43,30,69,11]. For all four kinds, the jq diff against raw.githubusercontent at that commit prints nothing. The non-`en` count is 0. The file is 308,965 bytes with a 2-space indent.

## Files touched
- `data/aoe4-build-order/aoe4world/english.json`: English snapshot with the `source` block, entries kept verbatim.
- `data/aoe4-build-order/refresh-snapshot.mjs`: fetch, filter and write script. `node refresh-snapshot.mjs <sha> <patch> <url>`. The app does not import it.
- `data/aoe4-build-order/README.md`: refresh steps, HandValue labeling, Known data gaps (crosscut-saw +5, shaft-mining overlay, sheep not units).
- `data/aoe4-build-order/rules/base.json`: 8 gather nodes (values from the Scope table, trip seeds, boar copied from deer), builderScaling 3/2, maxPopCap 200, walkSeconds 5.
- `data/aoe4-build-order/rules/english.json`: startingState (including units `{scout:1}`, buildings `[capital-town-center]`), 4 supply rows, 7 overlay rows, 11 upgradeTargets.
- `lib/aoe4-build-order/model.ts`: the 16 design types. It is type-only and imports only `import type { SnapshotEffect }`.
- `lib/aoe4-build-order/data.ts`: the design types, `loadGameData`, and a test seam `buildGameData(civ, snapshot, base, civData)` plus a `Snapshot` interface. Both of those are extra exports the ticket allows as the seam.
- `lib/aoe4-build-order/effects.ts`: `SUPPORTED_EFFECT_PROPERTIES`, `IGNORED_EFFECT_PROPERTIES`, `classifyTech`.
- `lib/aoe4-build-order/data.test.ts`, `lib/aoe4-build-order/effects.test.ts`: unit tests.

## Tests
`npm test`: 6 files, 90 passed, 0 failed. 33 of these tests are new: 19 in data, 14 in effects.
- Snapshot: the six source fields are non-empty, commit is 40 hex characters, patchSource starts with http, every entry is `en`, and ids are unique.
- Hand values: a recursive walk of the loaded `base` and `civData` must find at least 44 and at least 27 values (71 in total). Each needs a non-empty string `source` and a boolean `unverified`. `unverified` is false exactly for the sheep, deer and boar capacity, and those carry the owner source string.
- References: drop-offs are `resource_drop_off` buildings. Supply keys, starting buildings, `nearBuilding` and `producer` resolve to buildings. `grantedBy` resolves. Every starting building has a supply row. Starting units equal `{scout:1}` and resolve to a unit. Overlay properties are supported. The upgradeTargets keys equal the snapshot's upgrade baseIds, and each target unit has an entry at the upgrade's age.
- Drift guard: every property used by English tech effects is in supported, ignored, `unknown` or `buildTime`. The supported and ignored sets do not overlap.
- classifyTech: every case named in the ticket, plus the full 69-tech grouping: 7 unknown-tech-effect, 3 unsupported-tech, 4 unmodeled, 41 ignored, 14 supported, each list exact.
- Loader: man-at-arms ages ascend, the same instance comes back each time, nested writes throw TypeError (startingState.age.value, a byBaseId push, an entry's costs, a base rate), prototype ids find nothing, and an unknown civ throws. Through the seam: a duplicate id, `{scoutx:1}` and `{house:1}` each throw an error naming the id. A `@ts-expect-error` on `byId.set` sits in a function that is never called.
- Mutation checks, all run, each fails the named tests:
  - Removing `moveSpeed` fails 3 tests: wheelbarrow, the drift guard and the grouping.
  - Deleting a `source` from base or from english fails the source walk.
  - Setting sheep `unverified: true` fails the verified test.
  - Deleting a supply row fails the count of 71.
  - Deleting an upgradeTargets row fails the count and the reference test.
  - Deleting the shaft-mining rows fails the count, the shaft-mining test and the grouping.
  - Removing the freeze fails the TypeError test.
  - Removing the type check from classifyTech fails the unit/building test.
  - Removing the starting-units check fails both seam tests.
  - Retyping `byId` as `Map` makes tsc report TS2578, an unused `@ts-expect-error`.

## Gates
- codegen: not set in REPO.md.
- build: `npm ci` then `npx next build` passed with Node 22.17.0 (EBADENGINE warning only). The routes are unchanged: /, /404, /api/fight, /apps/combat-simulator, /apps/starcraft-helper.
- lint: `npx tsc --noEmit` is clean.
- Acceptance greps: the A1 constant grep and the S1 import grep print nothing. The model.ts export grep prints the 16 names.
- The lockfile, package.json and untouched files are unchanged.

## Invariants
- A1 upheld. Every number is in the patch-labeled snapshot or in a HandValue/OverlayEffect with a source, and lib code holds no gather or modifier constant.
- A3 upheld. Loaded data is deep-frozen and the Maps are typed `ReadonlyMap`. There is no randomness or clock in lib code; `fetchedAt` comes only from the refresh script.
- S1 upheld. There are no cross-app imports.
- A2 and S3 are not touched, because this ticket has no engine or route.

## Out-of-scope findings
- None blocking.
- For the interpreter ticket, as the ticket already notes: `professional-scouts-2` has a supported `huntCarryCapacity` effect selected on `scout`, so the interpreter must honor `select.id`.

## Status
needs_review
