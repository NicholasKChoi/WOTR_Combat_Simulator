# M2-research-5: AoE4 English starting state, supply, reassign/walk, hunt carry, text-only eco effects

Depth medium. Read 2026-10-30. Wiki = ageofempires.fandom.com via MediaWiki API (wikitext; patch not stated on most pages, newest changelog entries seen: update 24916, patch 16.2.10604). Confidence: H = wiki + second source, M = wiki only, L = inferred/unverified.

## 1. Starting state and supply (SGS-014 Open question 1)

| value | recommended | source | conf |
|---|---|---|---|
| starting villagers | 6 | Fandom "Early Economy (AoE4)" English line "Starts with six Villagers and a Scout" (scenario, not ranked); AoE forum "Start with more villager than 6?" https://forums.ageofempires.com/t/start-with-more-villager-than-6/226457 (6 is the ladder start); diamondlobby fast-feudal https://diamondlobby.com/age-of-empires-4/fast-feudal-build-order-aoe4/ | H |
| assignment at 0:00 | sheep 6, all others 0 | Fandom "Sheep" ("Villagers should begin gathering from these Sheep immediately"); diamondlobby English longbow rush https://diamondlobby.com/age-of-empires-4/english-longbow-rush-aoe4/ (six on sheep) | H |
| starting scout | 1 (English); starting sheep owned: 5 | Fandom "Scout (AoE4)" ("Every player starts with one Scout" except Mongols/Malians); Fandom "Sheep" and "Resource": five owned sheep since update 11.0.782 | H |
| starting resources (English) | food 200, wood 200, gold 100, stone 0 | Fandom "English" Starting resources `200/200/100`, changelog "As of the Season One Update, English starting wood was increased from 150 to 200". Generic page "Resource (AoE4)" says 200/150/100 for "most civs, some slightly more or less". Stone is not listed anywhere, so 0 is inferred | M (stone L) |
| starting pop cap | 10 (the Town Center's 10) | Fandom "Town Center (AoE4)" and "Capital Town Center": "provides ten population", infobox Pop=10; gamewatcher https://www.gamewatcher.com/age-of-empires-4-population-limit ("starting limit of 10, each house adds 10, 19 houses to reach 200") | M-H |
| supply `town-center` | 10 | same | M-H |
| supply `house` | 10 (English; Malians 5) | Fandom "House (AoE4)" ("increases unit population by 10") | H |
| max pop | 200 | CONTEXT.md decision; gamewatcher above is consistent (10 + 19x10 = 200) | H |
| landmarks that add supply | King's Palace +10 (infobox Pop=10, "Acts as a Town Center"); Council Hall, Abbey of Kings, White Tower: no Pop listed (snapshot `costs.popcap` is 0 for all, so supply must be hand-entered) | Fandom "King's Palace", "Council Hall" | M for KP; L that the others add 0 (absence of a Pop field) |

Notes. Consistent arithmetic: 6 villagers + 1 scout = 7/10 pop at start. Fandom TC page says a *secondary* Town Center also gives 10; a `supply` row for `capital-town-center` is not needed if `startingState.buildings` uses `town-center` as the ticket says, but the snapshot has both `town-center-1` and `capital-town-center-1`: the owner/designer should pick the baseId whose supply is looked up (flag for designer). King's Palace: add a `kings-palace: 10` supply row only if the engine ticket models Feudal-landmark age-ups; harmless to add now.

## 2. reassignSeconds and builderWalkSeconds (Open question 2)

No citable measurement exists. Searched forums/guides: no AoE4 source gives a walk or switch time in seconds. Found only: AoE4 replays record orders not arrivals, so walking is hard to measure (forum "Post-match analyzer", https://forums.ageofempires.com/t/post-match-analyzer-to-help-improve-looking-for-feedback/286058); an AoE2 calculator has a percent "idle and walking loss" input (not AoE4 data); GuildOrder "10-15 resources lost per 30 s idle villager" (unverified). Villager speed 1.12 tiles/s (Fandom "Villager (AoE4)" infobox, High confidence) lets the owner derive: seconds = tiles / 1.12 (x1/1.15 after Wheelbarrow).

Recommended defaults (owner preference, not facts; both labeled `unverified: true`, source "assumption derived from villager speed 1.12 tiles/s, no measurement"):
- `reassignSeconds`: 5 (about 5-6 tiles at 1.12 tiles/s: the walk from the old node to the new node's camp/drop-off; trip model already pays walk on each later trip). Alternatives: 0 if the owner wants reassign free in v1.
- `builderWalkSeconds`: 3 (about 3-4 tiles; builders are normally pulled from nearby nodes). Research 2's "0 for v1" is the other defensible choice. A single number cannot be right for all map layouts; keep both as named SimInputs the user can override.

## 3. Hunt/sheep carry, boar, wheelbarrow (Open question 3)

- Sheep capacity: wiki says default carry is 10 for all resources "except for hunted meat, of which they can carry 25" (Fandom "Villager (AoE4)"; changelog: Season One raised hunted meat 10 to 25). Wiki never says sheep are hunted meat. Evidence they are a separate category: the Villager table lists "Gather rate: Sheep" (HoL +20%) apart from "Gather rate: Hunted meat", and the Resource page groups Deer/Boar as "hunt"; Scout page says only Deer carcasses are carried by scouts. Recommend sheep capacity 10 (conf M-L; in-game check or a Hunt/Herdable-animal wiki line would settle it). Note: if sheep were hunted meat, `huntGatherRate` (Survival Techniques) would apply to sheep; the snapshot description for survival-techniques-1 says "hunted meat" and the table currently excludes it from sheep. Keep consistent: sheep 10, `foodGatherRate`.
- Boar: gather rate 0.9/s, 2,400 food, fastest land food (Fandom "Boar", H). Villagers carry 25 as hunted meat (M, via same Villager text). Walk/drop-off behavior: no source states a boar-specific one; the carcass stays where killed (Boar page says villagers kill it, carcass gathered in place; Islamic civs cannot gather it, irrelevant for English). Seed walk: no calculator value exists (calculator file has sheep, cattle, berry, deer, farm, gold, wood, stone, stockyard; no boar, per fetched BaseGatheringRates.ts). Recommended: reuse deer's 5.67 s, `source` text "no source; copied from deer, nearest analogue", `unverified: true` (conf L). Boars are usually lured/contested far from the TC, so real overhead is higher; acceptable for v1.
- Wheelbarrow on hunted meat: snapshot `wheelbarrow-1` has `carryCapacity change +5` for `villager` with no exemption; Fandom Wheelbarrow page says "increases the carry capacity of Villagers by 5" with no hunted-meat exception, while other techs (horticulture etc.) explicitly say "Does not apply to hunted meat". Recommend keep `carryCapacity` on hunt rows (so 25 + 5 = 30). Conf M (no in-game confirmation; web search for a confirmation returned nothing).

## 4. Text-only eco effects (Open question 4)

- shaft-mining: snapshot `shaft-mining-3` effects `[]`; Fandom "Shaft Mining": Castle Age, Mining Camp, 100 wood 250 gold, 60 s, "gold / stone gather rate +15%", requires Specialized Pick (H; no "after N seconds" or other condition exists, the ticket's "gold gather after ? seconds" is unfounded). Worth overlay rows: yes, two rows (`goldGatherRate`, `stoneGatherRate` multiply 1.15, passive, `grantedBy: 'shaft-mining'`). Gold/stone is a first-order eco effect for any Castle Age plan, and rows are trivially cheap. Caveat: classifyTech then marks it `effects-ignored` with `[]`, so the engine must either read the overlay row when the tech is researched or the classification must treat an overlay-covered tech as supported. Flag to designer.
- crosscut-saw: Fandom "Crosscut Saw": Imperial Age, 250 food 500 gold, 75 s, "wood gather rate +15%, +5 wood carry capacity" (H). Snapshot already models the +15% rate; the +5 is wood-only carry, impact is small (about +6.5% on a 10-cap wood trip pre-wheelbarrow, less at 15). Imperial-Age only, rarely reached in the build orders this tool targets. Recommend: not modeled in v1; note it; the schema needs a per-resource capacity property that is not otherwise needed. Same goes for the Dark/Feudal wood-carry cases: Draft Horses etc. are other civs.

## Recommendations summary

startingState: age 1, resources {food 200, wood 200, gold 100, stone 0}, villagers {sheep 6, others 0}, buildings [town-center] (plus implicit scout, 5 sheep, not modeled unless the engine needs a food pool: sheep carcasses are 200 food each x5, Fandom Sheep). supply: town-center 10, house 10 (+ optional kings-palace 10). reassignSeconds 5, builderWalkSeconds 3, all unverified. Sheep capacity 10; boar seed = deer 5.67 s; keep wheelbarrow on hunt rows; add shaft-mining rows; skip crosscut-saw capacity.

## Unknowns

- Stone start 0 (inferred), others' landmark pop (absence only), sheep-as-hunted-meat, wheelbarrow-on-hunt, boar seed: all need one in-game check or a patch-note line. A 30-second in-game test settles sheep/wheelbarrow (check carried amount in the unit panel).
- reassign/walk: need replay measurement; none found.
- Patch label: wiki pages state no current patch; ticket still must cite aoe4world patch separately.

## Sources
- https://ageofempires.fandom.com/wiki/{Town_Center_(Age_of_Empires_IV), Capital_Town_Center, House_(Age_of_Empires_IV), Villager_(Age_of_Empires_IV), Resource_(Age_of_Empires_IV), Sheep, Boar, Scout_(Age_of_Empires_IV), English, Wheelbarrow_(Age_of_Empires_IV), Shaft_Mining, Crosscut_Saw, King's_Palace, Council_Hall, Early_Economy_(Age_of_Empires_IV)} (via api.php parse, 2026-10-30)
- https://raw.githubusercontent.com/aoe4world/data/master/technologies/all.json (wheelbarrow-1, shaft-mining-3, crosscut-saw-4, survival-techniques-1)
- https://raw.githubusercontent.com/aoe4world/data/master/buildings/all.json (popcap 0 for all English buildings incl. kings-palace-2)
- https://raw.githubusercontent.com/SichYuriy/aoe4-production-calculator/master/src/data/BaseGatheringRates.ts
- https://forums.ageofempires.com/t/start-with-more-villager-than-6/226457 ; https://www.gamewatcher.com/age-of-empires-4-population-limit ; https://diamondlobby.com/age-of-empires-4/english-longbow-rush-aoe4/ ; https://diamondlobby.com/age-of-empires-4/fast-feudal-build-order-aoe4/
- Repo: projects/strategy-game-sim/tickets/SGS-014-aoe4-data-model-loader.md:241-256 (Open questions 1-4)
