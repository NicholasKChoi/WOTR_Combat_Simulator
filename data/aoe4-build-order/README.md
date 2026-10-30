# AoE4 build order game data

Every game number the AoE4 build order simulator uses comes from the files here. Code holds none.

| file | contents |
|---|---|
| `aoe4world/english.json` | English entries from [aoe4world/data](https://github.com/aoe4world/data), verbatim, plus `source` |
| `rules/base.json` | civ-agnostic hand-entered values: gather nodes, builder scaling, max population, task-switch walk |
| `rules/english.json` | English hand-entered values: starting state, supply, overlay effects, upgrade targets |
| `refresh-snapshot.mjs` | rewrites `aoe4world/english.json`; not imported by the app |

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
- The five starting sheep are not units. They are the `sheep` gather node with unlimited food, so sheep
  food is never depleted and herding is not modeled.
