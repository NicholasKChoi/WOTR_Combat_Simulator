# AoE4 build order game data

Every game number the AoE4 build order simulator uses comes from `aoe4world/` and `rules/`. Code holds
none.

| file | contents |
|---|---|
| `aoe4world/english.json` | English entries from [aoe4world/data](https://github.com/aoe4world/data), verbatim, plus `source` |
| `rules/base.json` | civ-agnostic hand-entered values: gather nodes, builder scaling, max population, task-switch walk |
| `rules/english.json` | English hand-entered values: starting state, supply, overlay effects, upgrade targets |
| `refresh-snapshot.mjs` | rewrites `aoe4world/english.json`; not imported by the app |
| `builds/<slug>.json` | user-authored prebuilt `BuildOrder`s (paste-representable, each with a `source`); not game data and not patch-labeled |

## Refreshing the snapshot

1. Pick a commit of `aoe4world/data` (usually the latest on `main`) and note its full 40-character sha.
2. Find the game patch that was live when that commit was made. The upstream files carry no patch, so use
   the official patch notes (https://www.ageofempires.com/news/) and keep the URL that names the patch.
3. Run `node data/aoe4-build-order/refresh-snapshot.mjs <sha> <patch> <patch-notes-url>`. It fetches
   `units`, `buildings`, `technologies` and `upgrades` `all.json` at that commit, keeps the entries whose
   `civs` contains `en` (all fields, upstream order), and writes them with a `source` block:
   `repo`, `commit`, `committedAt` (from the GitHub API), `fetchedAt` (now), `patch`, `patchSource`.
4. Check each kind is complete and verbatim:

   ```sh
   curl -s https://raw.githubusercontent.com/aoe4world/data/<sha>/<kind>/all.json \
     | jq -S '[.data[]|select(.civs|index("en"))]' | diff - <(jq -S .<kind> data/aoe4-build-order/aoe4world/english.json)
   ```

5. Run `npm test`. The drift guard fails if an English technology uses an effect property that is
   neither supported nor ignored; classify it in `lib/aoe4-build-order/effects.ts` before committing.
   The reference tests fail if a rules file names an id the new snapshot no longer has.

## Prebuilt builds

Each file in `builds/` is one `BuildOrder` the page offers in its prebuilt list, and one import line in
`lib/aoe4-build-order/builds.ts`. Every number is a non-negative integer, so the build re-parses from its
paste text unchanged. Ids are aoe4world `baseId`s. A guide step the paste grammar cannot express is left
out, never approximated, and is listed under its build below. Every build meets a bar in the simulation,
at default inputs with depletion on: at 1200 s and at 3600 s no step is waiting, every non-reaction step
has started, and a reaction that is not reached is only waiting for its trigger; at both horizons every gold
deposit that has run out has a `move all` reaction from it that starts at the run-out instant, and no gold
warning is a `warning`. A guide step that would break the bar is left out and listed under its build
with its reason.

- `english-1tc` "ENG 1TC", https://aoe4guides.com/builds/reinDv5vkVX6KUny571E (English, Season 13).
  Villager production is continuous from the start, following the guide's villager counts. Omitted:
  - 0:40 "termina [house] después a [mining camp][gold]" (a second villager finishes the house): no action
    adds a builder to a building already under construction. The rest of the step, going to gold at a
    mining camp, is the `build mining-camp from gold` step.
  - No step was removed for not completing.

  Transcription choices: the 0:20 villager rallies to gold (`start -> gold`) because it builds the house
  and then goes to gold; "x4 a [sheep]" at 1:00 is a rally to sheep, which holds until the 2:20 rally to
  wood; the abbey builders return to sheep and, at 4:00, build the mill and the three farms from there;
  the 5:00 builders and the 6:00 blacksmith builder come from wood; the 5:15 military production is
  continuous because the guide gives no count.

- `english-spear-longbow-maa-crossbow` "ENG Spear/Longbow into MAA/Crossbow", hand-authored for this
  simulator (no guide). Feudal through the Council Hall, spearmen and longbowmen from the barracks and
  archery range, Castle through the King's Palace, then men-at-arms and crossbowmen. Villager production is
  continuous from the start. Nothing is omitted.

  Transcription choices: the `man-at-arms` step carries a `time` trigger of 681 s, the whole second after the
  King's Palace completes (680.3 s), because men-at-arms are a Feudal unit and would otherwise start before
  Castle; `crossbowman` is a Castle unit and waits on its age. Both steps sit before the 12:40 rally so that
  step order does not hold them back; they start at 681 s and replace the spearman and longbowman orders,
  which stop there. The trigger is hard-coded, so re-check it when an earlier step changes. The King's Palace
  is a villager producer, so a `rally` step sends its villagers to farms. The Town Center rallies to gold
  from 130 s to 200 s and from 560 s to 760 s, so no producer is rallied to gold at a run-out. Gold runs out at 1218 s (`gold`), 1944 s
  (`gold#2`) and 2670 s (`gold#3`) at default inputs, so the build has three reactions: `gold` and `gold#2`
  move all gatherers to the next deposit, and `gold#3` moves them to farms. `gold#4` is never reached by
  3600 s.

- `english-knight-longbow` "ENG Knight/Longbow (King's Palace)", `hand-authored for this simulator` (English).
  The opening is the ENG 1TC economy, with Feudal reached through `abbey-of-kings` (the same landmark as
  ENG 1TC, so the first five minutes are the already-tuned opening) and Castle through `build kings-palace`.
  From 5:47 new villagers go to gold (the 5:30 rally waits behind the 5:15 farms), so the King's Palace's
  600 gold is paid without moving gatherers; once the palace starts they go to farms, and from 12:00 to wood. The King's Palace is rallied to wood.
  Three stables and two archery ranges; the second `produce longbowman` step comes after the second range
  is built, because a `produce` step only orders the producers that exist when it starts. Three houses
  are built before the King's Palace: auto-houses count the palace's supply as soon as it is under
  construction, so without them population stalls at the cap until the palace completes. Farms are added
  in blocks of four at 10:00, 14:00, 16:00 and 18:00; the 14:00, 16:00 and 18:00 blocks start at their
  times and the 10:00 block starts about 1.5 s after 10:00 (10:02 as the page shows it). The four blacksmith techs
  (`steeled-arrow`, `fitted-leatherwork`, `bloomery`, `iron-undermesh`) come after `build kings-palace` in
  the list, so they queue behind the landmark instead of taking its gold first; `veteran-longbowmen` and
  the Castle blacksmith techs (`balanced-projectiles`, `wedge-rivets`, `decarbonization`, `insulated-helm`)
  follow `produce knight`. Gold: 5 deposits (`gold` to `gold#5`) run out by 3600 s, at 15:32 (`gold`),
  24:37 (`gold#2`), 33:43 (`gold#3`), 42:48 (`gold#4`) and 51:54 (`gold#5`); each has a
  `whenever <ref> runs out move all <ref> to <next>` reaction at the end of the list, and `gold#5` moves to
  `wood`. Omitted: none.

## Hand-entered values

Each hand-entered leaf is a `HandValue`: `{ "value": ..., "source": "...", "unverified": true }`.
`source` names where the number came from (page, section, date read, patch if stated) or says plainly
that there is none. `unverified` is `false` only for a value someone checked in the current game, with
`source` naming who and when. Overlay effects in `rules/english.json` use the aoe4world `effects` schema
plus `grantedBy`, an optional `condition`, `source` and `unverified`.

## Known data gaps

- `crosscut-saw-4`: its description adds +5 wood carry capacity, but its `effects` hold only
  `woodGatherRate` x1.15. It is classified from `effects`, so the +5 is not simulated; that would need a
  per-resource carry capacity property.
- `shaft-mining-3`: its `effects` are empty upstream. Its +15% gold and stone gather rate comes from the
  two overlay rows in `rules/english.json`.
- The five starting sheep are not units. They are the `sheep` gather node, with a finite starting total
  from `rules/base.json` (owner-supplied, unverified) that runs out like any finite node; herding is
  still not modeled.
