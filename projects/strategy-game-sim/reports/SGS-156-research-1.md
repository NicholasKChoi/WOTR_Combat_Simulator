# SGS-156 research 1: how ENG 1TC and ENG 1TC Council Hall get back under the 1200 s floating cap

Depth medium (repo only was enough; no web needed). Read-only.

## Question

With the house fix, `ENG 1TC` floats about 2512 wood and `ENG 1TC Council Hall` about 2220 at 1200 s, over the owner-confirmed cap of 2000 (`lib/aoe4-build-order/production-floors.ts`, `MAX_FLOATING_AT_1200`). Both hit pop 200 at about 1110 s and have no wood sink left. What changes: the shared bar for all four builds (a, c), or the two builds' content (b). The ticket is blocked on this (SGS-156 Scope 10).

## Facts

- The cap is one constant applied to all four floating resources of every build (`production-floors.ts`: `atMost` maps food, wood, gold and stone to `MAX_FLOATING_AT_1200`). The floors are per build. Raising the cap loosens every build and every resource. (worktree `lib/aoe4-build-order/production-floors.ts`)
- The docs say the cap exists so "a build that starves its production or leaves its economy unspent fails" (`data/aoe4-build-order/README.md` Prebuilt builds; `docs/aoe4-build-order.md` Prebuilt builds paragraph).
- The overshoot is small: ENG 1TC is 512 over (base was 1852, under), Council Hall 220 over (SGS-156 implementer-2 report).
- ENG 1TC is not a pure transcription of its source (https://aoe4guides.com/builds/reinDv5vkVX6KUny571E, not fetched). The README says that everything from the 420 s steps on (2 barracks, 3 archery ranges, 10 farms, second produce pair) was "added after the guide" (`data/aoe4-build-order/README.md`, `english-1tc` entry). Last build step is at 420 s. So adding a late step does not alter the guide portion; it extends the simulator-authored tail. Unverified: I did not open the guide itself.
- Precedent for tuning a build to spend past the pop cap: `english-spear-longbow-maa-crossbow` has a blacksmith at 950 s and rallies to gold at 1000 s "so the income past the 200 population cap goes into upgrades" (README). The knight build's README line says the same kind of tuning.
- ENG 1TC (data file, steps 0-41) researches only horticulture, double-broadax, steeled-arrow and iron-undermesh, and has no Castle step; I could not confirm from the engine which age the abbey landmark reaches (unverified; if Feudal, only Feudal-age wood costs below apply). Council Hall already goes to Castle (white tower) and researches a long list of techs by about 900 s.
- Wood costs in `data/aoe4-build-order/aoe4world/english.json` (age 2 = Feudal, 3 = Castle): Feudal: market 100, barracks/archery range/stable/blacksmith 150 each, outpost 100, professional-scouts 150 wood + 300 gold. Castle: balanced-projectiles 100/250g, wedge-rivets 100/250g, shaft-mining 100/250g, fertilization 100/250g, greased-axles 150/350g, drift-nets 150/350g, military-academy 100/250g, monastery 200, siege-workshop 250. Imperial: university 450, lightweight-beams 300/400g, siege-works 300/600g, adjustable-crossbars 1000 wood + 1200 gold.

## What a realistic wood sink looks like at about 1100 s (English 1TC)

A real player at pop 200 with 2500 banked wood does not sit on it. Realistic, in order of fidelity:
1. Go up an age and spend on it: Castle (and its landmark/buildings) then Castle-tier techs. Large change for ENG 1TC (a different build); needs gold the build may not have.
2. Move wood gatherers off wood once capped (to gold for upgrades, as the spear/longbow build already does at 1000 s). This stops the pile growing but the bank is already built, so it fixes the stock only if done early enough; it is a `rally`/`move` step, no new data.
3. Extra production or utility buildings and cheap wood techs: for ENG 1TC, more ranges/barracks/stables (150 each; useless at pop cap for output but the simulator counts the spend), a market (100), an outpost (100), professional-scouts (150). For Council Hall, 220 over is covered by about 3 more Castle techs from the list above (100-150 wood each), if gold allows.
Caveat: ENG 1TC needs about 512+ wood of sink (so roughly 4 to 5 buildings at 150, or a mix), more than Council Hall's 220. A wood-only sink of that size in Feudal is mostly buildings, which is a thin realism claim; combining a move of wood gatherers to gold with a few buildings is the likelier honest fix. I did not run the engine to confirm any specific step brings the bank under 2000; the implementer should measure.

## Options

- A) Raise `MAX_FLOATING_AT_1200` for all builds (for example to 2600): one-line change, no build edits. Loosens the bar for all four builds and all four resources, so a build that leaves 2500 of anything unspent passes. Conflicts with the SGS-081 owner-confirmed value (needs owner sign-off, which this is).
- B) Keep 2000; add late wood-spending steps to the two builds (for example more production buildings or cheap techs, or a move of wood gatherers to gold, after 900 s): keeps the bar for all builds. Edits two build files and their README entries; ENG 1TC's tail is already simulator-authored, so the guide portion is untouched. Cost: build content tuned to a metric, a few to dozens of lines per build, needs measurement to land under 2000 without breaking the other bars (no `waiting` step, no `farm-idle`).
- C) Apply the cap only until a build reaches pop 200, or set it per build (for example 2600 for these two): keeps 2000 for the other two builds. Needs a new rule in `productionChecks` and in the acceptance spec, and the docs. A per-build cap is simplest; a "until pop cap" rule means these builds are never checked for floating at 1200 s, which weakens the bar most.

## Recommendation

B, as the ticket agent says: the cap's purpose is to make a build spend its economy, the overshoot is modest, ENG 1TC's tail is already hand-added, and the other builds already carry such late sinks. If the owner prefers not to retune content, C with a per-build cap is the least harmful alternative to A.

## Unknowns

- Whether specific steps bring both builds under 2000 without breaking the other bars: needs an engine run on a scratch checkout (implementer).
- Which age ENG 1TC reaches (abbey of kings), which decides which techs it can research: check the engine data.
- The aoe4guides source contents: not fetched.

## Sources

- /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-156-implementer-2.md
- /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-156-ticket-5.md
- /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-156-aoe4-auto-houses-plan-ahead-for-wood.md (Scope 10, Re-spec 4)
- worktree `lib/aoe4-build-order/production-floors.ts`, `data/aoe4-build-order/builds/english-1tc.json`, `english-1tc-council-hall.json`, `data/aoe4-build-order/README.md` (Prebuilt builds), `data/aoe4-build-order/aoe4world/english.json`, `docs/aoe4-build-order.md` (Prebuilt builds)
- https://aoe4guides.com/builds/reinDv5vkVX6KUny571E (cited by the build; not fetched)

## Board item

## Q?: Fix the two builds that float too much wood by editing the builds, or by loosening the cap?
kind: decision
blocks: SGS-156
options: A) Raise the 2000 cap for every build: one line, but it loosens the check for all four builds | B) Keep 2000 and add late wood spending to the two builds: more build edits, check stays strict | C) Give only these two builds a higher cap (about 2600): check stays strict for the other two
recommendation: B: the 2000 cap exists to make builds spend their economy, and the overshoot is small
research: reports/SGS-156-research-1.md

You decide because the 2000 cap is a value you confirmed, and the house fix is parked until it is settled. The fix makes the Town Center keep making villagers, so the English 1TC builds float more wood at 1200 s and reach pop 200 at about 1110 s with nothing left to spend wood on.
- English 1TC: about 2512 wood floating at 1200 s (was 1852), 512 over the cap. Its steps after 7:00 were already added by us, not copied from the guide.
- English 1TC Council Hall: about 2220 wood floating, 220 over. It already researches many techs, so a few more fit.
- Option B means a few extra steps near 15:00 in each build, for example more production buildings, cheap wood upgrades, or moving wood gatherers to gold; the exact steps are measured by the implementer.

### Answer
