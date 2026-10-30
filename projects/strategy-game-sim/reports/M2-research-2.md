# M2 research 2: who builds auto-houses, and when

## Question
Who builds auto-built houses (builder count, source resource) and when is one started (at cap, or k pop before cap)? Changes: auto-house rule in the simulator, its named inputs, the build-order data/schema, and exit criteria for supply.

## Facts
- English house: 50 wood, 15 s, age 1, produced by villager. https://data.aoe4world.com/buildings/english/house-1.json (fetched; costs.time 15, wood 50). `popcap` is 0 there and the description only says "Increases your maximum Population": the snapshot does NOT carry the supply value. Town center json likewise has popcap 0 (town-center-1.json). Supply numbers must be hand-entered as named inputs, labeled unverified.
- Supply value: secondary sources say start cap 10, +10 per house, 200 max, ~19 houses to cap (gameskinny / gamewatcher / fandom House page via search snippets, e.g. https://ageofempires.fandom.com/wiki/House_(Age_of_Empires_IV); fandom fetch returned 402, so unverified directly). Sources conflict on whether a town center adds +10 (not verified) and one outlier cites age-based caps (discounted). My recollection of the game (start cap above 10) is not sourced; treat start cap as UNVERIFIED.
- No English-specific house mechanic found. English uniqueness is farms/house influence in older wiki wording? Not found: aoe4world house-1.json has `influences: []`, and the data id `house-1` is just the English variant (attribName building_house_control_eng). Mongols reportedly have no houses (single unverified source), irrelevant for English.
- Pro-style English builds (single-source, timestamp-based, no pop numbers): first house by the 8th villager sent to gold at 0:45 (together with mining camp), second by a wood villager at 3:15, third ~5:20 with a lumber camp (https://gamerblurb.com/articles/age-of-empires-iv-english-build-order-guide). Longbow rush: first trained villager builds a house (https://progameguides.com/age-of-empires/age-of-empires-iv-english-longbow-rush-build-order/). Forum build puts house and lumber camp on first wood villagers (https://forums.ageofempires.com/t/current-favorite-builds/198886). General rule: build before cap so production never stalls (https://pixeltwelve.com/articles/age-of-empires-4-beginner-guide-landmarks-counters). Builders are one villager, from wood or whichever resource is nearest; no source uses sheep builders. I found no authoritative "house at X pop" number (not verified; aoe4guides.com/aoe4world build pages were not retrieved).
- Repo constraints: houses auto-built when supply requires one; construction pulls assigned villagers off their resource for the build time; build time = base x 3/(N+2); every variable quantity a named input (CONTEXT.md:54-56, :68-70; simulation decision "every quantity that could vary ... explicit named input").

## Options
1. Fixed minimal - 1 villager from wood, house starts exactly at cap - trivial, but production stalls up to 15 s per house (the TC idles), so "optimal villagers" is violated; rules out a no-stall build. Conflicts with the continuous-production default (CONTEXT.md:54).
2. Configurable lead, single wood builder (recommended) - inputs `houseBuilders` (default 1), `houseBuilderSource` (default `wood`), `houseLeadPop` (default derived, see below), plus supply values as data inputs. Auto-house starts when `pop + queued + houseLeadPop >= cap` and no house is already under construction - small extra code, no stalls by default, owner can sweep.
3. Time-based lead - start the house early enough that it finishes before the next villager queue slot, computed from build time, builder walk time and production rate - most accurate, self-tuning for multiple producers, but more logic and an implicit coupling to the formula; harder to explain.
4. Explicit house steps override auto - build-order steps may contain `house` steps; auto only fills gaps - matches how real orders pin first houses (0:45 on gold), adds a step type. Composable with 2 (auto never fires while a pinned house would cover supply).

## Recommendation
Option 2, with option 4's override as a cheap addition (explicit house step suppresses auto for that supply need). Named inputs and defaults:
- `houseBuilders` = 1 (so build time 15 s x 3/3 = 15 s; 2 builders = 11.25 s).
- `houseBuilderSource` = wood (the resource the builder leaves; falls back to the nearest-assigned resource if no wood villager exists, e.g. opening).
- `houseLeadPop` = chosen so the house finishes before the cap is reached: the cap is reached after pop grows by lead; one TC at ~20 s/villager adds ~1 pop per 20 s, plus walk time, so a lead of 2 pop (about 40 s) comfortably covers 15 s build + walk. Default 2; this is derived arithmetic, not sourced, and should be tunable. Scale with number of producers (lead = producers x 2 is an option).
- `houseSupply` = 10 per house, `startingPopCap` = TC supply: data inputs, labeled unverified (patch unknown); `maxPopCap` = 200.
- `houseBuilderWalkSeconds` named input (default 0 for v1 consistent with the walk-time requirement).
Reason: matches every pro pattern (one villager, wood or the villager already near), keeps the simulator deterministic, and exposes each variable.

## Unknowns
- Starting cap and whether TC/landmarks give supply: verify in game or via aoe4world UI / a patch note; the data snapshot lacks it. Owner can settle by in-game check.
- Pro "house at N pop" figures: aoe4guides.com and aoe4world build pages were not fetched; a quick look at 2-3 current English builds would confirm default lead.
- Whether English has any house interaction: none found; treat as none.

## Sources
- https://data.aoe4world.com/buildings/english/house-1.json
- https://data.aoe4world.com/buildings/english/town-center-1.json
- https://gamerblurb.com/articles/age-of-empires-iv-english-build-order-guide
- https://progameguides.com/age-of-empires/age-of-empires-iv-english-longbow-rush-build-order/
- https://forums.ageofempires.com/t/current-favorite-builds/198886
- https://pixeltwelve.com/articles/age-of-empires-4-beginner-guide-landmarks-counters
- https://ageofempires.fandom.com/wiki/House_(Age_of_Empires_IV) (search snippet only)
- CONTEXT.md:54-56, 68-70 in the project dir
