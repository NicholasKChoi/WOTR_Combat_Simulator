# SGS-014 acceptance-1

Verdict: PASS (no failures). Tip tested: cac82e8. Test commit: ac3e200 on local branch sgs-014-acc-tmp (parent cac82e8).
The task branch is checked out in the factory worktree, so I could not move it; fast-forward it: `git merge --ff-only sgs-014-acc-tmp`.

Harness: the Playwright harness has no surface for this ticket (no route imports the new modules), so the tests are Vitest at the module boundary
(loadGameData, classifyTech, the JSON data files), in lib/aoe4-build-order/data.acceptance.test.ts (new, tests only).
Ran: npm ci; npx vitest run lib/aoe4-build-order -> 3 files, 56 tests pass (includes the implementer's 2 files); npx tsc --noEmit clean.
Also ran the ticket's verbatim check for all four kinds against raw.githubusercontent.com at e89f01e: units, buildings, technologies, upgrades identical.

Tests (all pass, 20 in the new file):
- snapshot: exact top-level keys and counts [43,30,69,11]; source six fields, 40-hex commit, http patchSource; only `en` entries; 2-space formatting.
- base.json: exact keys, walkSeconds 5, maxPopCap 200, builderScaling 3/2; per-node resource/rate/capacity/properties/dropOffs/trip seeds (boar 5.67, dropOff 0).
- english.json: exact keys, startingState (age, resources, villagers, units {scout:1}, buildings), supply keys/values, 7 overlay rows (farm 1.2/1.25/1.3/1.3 ages 1-4, King's Palace, Shaft Mining), 11 upgradeTargets.
- hand values: source/unverified on every value object, >= 71 found, unverified false for exactly sheep/deer/boar capacity.
- references: dropOffs are resource_drop_off buildings, supply/grantedBy/condition ids resolve, upgrade target age match, starting buildings have supply.
- classifyTech: exact 7/3/4/41/14 counts and name lists; fitted-leatherwork-2, armor-clad-3, professional-scouts-2 properties; military-academy buildTime; shaft-mining-3 unmodeled without overlay; upgrade supported/rejected(upgradeTargets); unit/building throw naming id.
- loader: id/baseId indexes, ascending age, same instance, 153 entries; constructor/__proto__ etc. find nothing in all four Maps; deep freeze (top-level, nested, array push, entry, source) with Map unfrozen; @ts-expect-error ReadonlyMap guard (checked by tsc); unknown civ throws; duplicate id, scoutx, house throw naming the key.
- repo constraints: A1 and S1 greps empty; model.ts exports exactly the 16 type names, no runtime exports, has effects-unmodeled and walkSeconds.

Failures: none. impl-defect: none. spec-gap: none.
Not expressible: `npx next build` / no-new-route criterion (build gate, not run by me); mutation checks listed in the last criterion (implementer's job; I did not mutate production code).
