# SGS-014 spec gate

Verdict: NEEDS_SPEC (one factual error in a named test, two small underspecified points). No owner gaps.

Checked against: ticket (after re-spec 2), design/M2.md, CONTEXT.md, INVARIANTS.md, LESSONS (both empty), SGS-012 branch
623a5ff (worktree), code repo main 6013fcc, and the upstream aoe4world/data files at `e89f01e` (fetched and re-derived).

## Gaps

1. Tests, `classifyTech` bullet - `fitted-leatherwork-2` is said to be `effects-ignored` "naming `meleeArmor` and
   `rangedArmor` as present in its effects". At `e89f01e` its `effects` holds only `meleeArmor` (one effect, class-selected).
   An implementer writing the test as specified gets a failure, and would guess which side is wrong. Fix: expect
   `['meleeArmor']` for `fitted-leatherwork-2`, or use `armor-clad-3` (producedBy `barracks`, effects order `rangedArmor`,
   `meleeArmor`) for the two-property case and say the expected array order is `['rangedArmor','meleeArmor']`. The Blacksmith
   wording in the acceptance criterion ("a Blacksmith tech is effects-ignored naming its properties") is fine with
   `fitted-leatherwork-2` and `['meleeArmor']`.
2. Tests, hand-value walk - "the walk finds at least the count of values this ticket writes" gives no number, so the
   guard can be set arbitrarily low. Fix: state the count. Counting leaves with a `value` key: base 44 (8 nodes x 5 =
   40, `builderScaling` 2, `maxPopCap` 1, `walkSeconds` 1) plus english 27 (`startingState` 5, `supply` 4, `effects` 7,
   `upgradeTargets` 11) = 71. Say "at least 71" (the seven overlay rows count because `OverlayEffect` has `value`,
   `source`, `unverified`).
3. Scope 5 / acceptance (loader) - "deep-frozen" does not say what happens to the `Map`s in `GameData`. `Object.freeze`
   does not stop `Map.set/delete/clear`, so "the engine must not be able to mutate shared data" (A3) is not met by freezing
   alone, and the only test is a nested-field write throwing `TypeError`. Fix: either require the three `Map`s to reject
   `set/delete/clear` (for example read-only wrappers that throw `TypeError`) and add one test (`byId.set(...)` throws), or
   state that `Map` mutation is not guarded and only plain objects and arrays are frozen.

## Checks that passed

- Grounded scope: no `data/` or `lib/aoe4-build-order/` on main (matches Context). Every baseId named exists in the English
  snapshot: `capital-town-center`, `town-center`, `house`, `kings-palace`, `mill`, `lumber-camp`, `mining-camp`, `shaft-mining`,
  `wheelbarrow`, `villager`; each `dropOffs` target has class `resource_drop_off`; `scout-1` (`baseId` scout, age 1, popcap 1) is
  the only scout; no `baseId` is shared across types or repeats within an age.
- Snapshot numbers: 43/30/69/11 = 153 entries, ids unique, 309 KB indented; commit date `2026-10-28T23:06:27Z` confirmed by gh.
  The 23 effect properties, the 13 ignored, `buildTime`/`unknown`, and the classification counts 7/3/4/41/14 with the exact
  lists all reproduce. `wheelbarrow-1`, `forestry-1`, `enclosures-4` (influence-typed), `military-academy-3` (`buildTime`),
  `admiralty-2`, `shaft-mining-3` (empty effects) and `professional-scouts-2` (`huntCarryCapacity` supported plus
  `rangedAttack` ignored -> `['rangedAttack']`) behave as written.
- Upgrade targets: all 11 upgrades exist; each target unit has an entry whose `age` equals the upgrade `age`.
- Source quotes (kings-palace-2, farm-1/mill-1 influences, horticulture-2/fertilization-3/precision-cross-breeding-4,
  shaft-mining-3, crosscut-saw-4) match the snapshot text. Trip seeds recompute to the stated seconds.
- Contracts: types, loader fields, `startingState.units`, `TechSupport`, `BuildOrderNote.code`, `SimInputs.walkSeconds` match
  design/M2.md Contracts and CONTEXT.md Decisions. Open questions: none in the ticket or CONTEXT.md; answered items are not
  left as undecided. Dependencies stated (SGS-012). Size ~320 business logic. Diagram: none needed. Lessons: none.
- Risk `high` is correct (A1 adjacency, cross-module contract, >150 lines). On merge `none` is acceptable: the refresh
  script, if written, is not a factory command, and no CONTEXT Decisions rule is copied into a repo doc here.
- Stack (SGS-012 at 623a5ff): nothing in the ticket assumes the old stack. `resolveJsonModule` is on, `moduleResolution` is
  `bundler`, `tsconfig` includes `**/*.ts`, `vitest.config.mts` keeps `lib/**/*.test.ts`, Node floor 22.12. The ticket never
  names `vitest.config.ts`.

## Notes (non-blocking)

- design/M2.md Summary still says Recharts 2.15.4 and TS 4.7.4 (SGS-012 On merge says the designer updates it). It is
  design text, not ticket text, and this ticket does not touch charts.
- `classifyTech` for entries that are neither `technology` nor `upgrade` (unit/building) is undefined; say validate never
  passes them, or return `rejected/unsupported-tech`.
- A static JSON import cast to `SnapshotEntry[]` may need `as unknown as` because JSON infers `type: string`; leave to the implementer.
- `professional-scouts-2` selects `scout`, not `villager`; the later interpreter ticket must honor `select.id`.
- `patch` lookup may block the implementer (ticket says stop and report if none is citable); acceptable, but the manager
  should expect it may come back as a blocker.
