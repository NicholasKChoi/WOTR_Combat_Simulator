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
warning is a `warning`. A farm holds one villager (the engine enforces it), so each build times its
`build farm` steps so that every villager sent to `farm` finds a built farm, and at 1200 s, 1800 s and
3600 s the run has no `farm-idle` warning. Each build also meets production floors and a floating cap at
1200 s (villager and unit counts, a food rate, and a ceiling on each floating resource), set in
`lib/aoe4-build-order/production-floors.ts` and checked in `lib/aoe4-build-order/builds.test.ts`, so a build
that starves its production or leaves its economy unspent fails. A guide step that would break a bar is left
out and listed under its build with its reason. Entries describe what each build file does and why; measured results (run-out times,
when a step fires, warnings' times) are not listed because they change whenever the engine or the build
is tuned, and the page shows them for any run.

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

  Added after the guide (every one carries a `time` trigger of 420 s, the trigger of the guide's
  `steeled-arrow` research): two more barracks and two more archery ranges, ten `build farm` steps from
  wood, and a second `produce spearman` and `produce longbowman`. Each farm step turns a wood gatherer into
  a farmer (a farm is paid from wood, and a farm holds one villager), and the extra buildings let the farmed
  food and the wood go into spearmen and longbowmen instead of floating. A `produce` step orders only the
  buildings that exist when it starts, so the second pair of `produce` steps sits after the buildings and
  covers them. The gold reaction stays the first reaction step.

- `english-spear-longbow-maa-crossbow` "ENG Spear/Longbow into MAA/Crossbow", hand-authored for this
  simulator (no guide). Feudal through the Council Hall, spearmen and longbowmen from barracks and archery
  ranges, Castle through the King's Palace, then men-at-arms and crossbowmen. Villager production is
  continuous from the Town Center and, once built, the King's Palace. Nothing is omitted.

  Transcription choices: the `man-at-arms` step carries a `time` trigger of 681 s, the whole second after the
  King's Palace completes, because men-at-arms are a Feudal unit and would otherwise start before
  Castle; `crossbowman` is a Castle unit and waits on its age. Both steps sit before the rally at 700 s
  so that step order does not hold them back, and they replace the spearman and longbowman orders on the
  barracks and range they name. The trigger is hard-coded, so re-check it when an earlier step changes. The King's Palace
  is a villager producer, so a `rally` step sends its villagers to wood. The Town Center rallies to gold
  from 130 s to 200 s and from 560 s to 700 s, and to wood otherwise. The build has
  three gold reactions: `gold` and `gold#2` move all gatherers to the next deposit, and `gold#3` moves them
  to wood.

  Farms: every farmer gets a farm of its own from a `build farm` step that takes a wood gatherer and puts
  it on the new farm, so no rally sends a villager to `farm` and the Town Center and King's Palace keep
  sending new villagers to wood (and the Town Center, at the times above, to gold). The farms are paid
  from the wood those gatherers cut: four at the mill, three at 210 s, four at 320 s, four at 380 s (before Castle),
  then groups at 740, 870, 890 and 900 s that grow the food the Castle army needs.

  Production: two barracks (right after the Council Hall starts) and three archery ranges (after Feudal)
  run spearmen and longbowmen. At Castle the men-at-arms order replaces the spearman order on both barracks
  and the crossbowman order replaces the longbowman order on the first range only, so the other two ranges
  keep making longbowmen from the wood the economy gathers. At 700 s four more barracks and three more
  ranges are built from wood, and the `produce` steps at 790 s (a `produce` step orders only buildings that
  exist when it starts, so they come after the buildings finish) give them men-at-arms and crossbowmen by
  `instance`. The extra buildings and farms are there so the economy's food, wood and gold are spent on
  units instead of floating.

- `english-knight-longbow` "ENG Knight/Longbow (King's Palace)", `hand-authored for this simulator` (English).
  The opening is the ENG 1TC economy, with Feudal reached through `abbey-of-kings` (the same landmark as
  ENG 1TC, so the first five minutes are the already-tuned opening) and Castle through `build kings-palace`.
  The 5:30 rally to gold waits behind the 5:15 farm block, so it fires after 5:30 and new villagers go to gold then, so the King's Palace's
  600 gold is paid without moving gatherers; once the palace starts they go to farms, and from 12:00 to wood. The King's Palace is rallied to wood.
  Three stables and two archery ranges; the second `produce longbowman` step comes after the second range
  is built, because a `produce` step only orders the producers that exist when it starts. Three explicit
  houses are built before the King's Palace. Auto-houses stay
  off until the third of these (step 24) starts, so at default inputs, and at 1800 s and 3600 s, the run
  returns one `auto-houses-held` warning: production is held at the supply limit until the third house
  starts. Farms are added
  in blocks of four at 10:00, 14:00, 16:00 and 18:00 (`time` 600, 840, 960 and 1080), each built by
  wood gatherers who farm them; the 10:00 block sits after the third stable and the 10:34 pair in the
  list, so it waits for both of them to start. Smaller groups of wood-and-return farms come at `time`
  563 (four), 634 (two), 722 (one) and 942 (four). The groups are placed ahead of the
  villagers sent to farm by the Town Center rally to farm and by the sheep reaction, so each of them
  finds a built farm. The four blacksmith techs
  (`steeled-arrow`, `fitted-leatherwork`, `bloomery`, `iron-undermesh`) come after `build kings-palace` in
  the list, so they queue behind the landmark instead of taking its gold first; `veteran-longbowmen` and
  the Castle blacksmith techs (`balanced-projectiles`, `wedge-rivets`, `decarbonization`, `insulated-helm`)
  follow `produce knight`. Gold: 5 deposits (`gold` to `gold#5`) run out by 3600 s; each has a
  `whenever <ref> runs out move all <ref> to <next>` reaction at the end of the list, and `gold#5` moves to
  `wood`. The five gold reactions are followed by one for the starting sheep: `whenever sheep runs out move all sheep to farm` moves the sheep gatherers to the farms, so no
  villager is idle through 1800 s. Omitted: none.

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
