# M2 research 1: gross vs net villager gather rates

**Question**: Should AoE4 base villager gather rates in the data file be gross (rate while working; walk and drop-off a separate named input) or net (effective rate including walking), and which source values?

**What changes**: data-file schema (rate plus carry capacity, or one rate), whether the walk-time input exists in the step logic, and whether the provisional calculator values are replaced.

## Facts

Gross base rates, resources/second, English (no English gather-rate difference; only KT, Abbasid, Ayyubid, Delhi, HoL sheep differ). Source: fandom "Resource (Age of Empires IV)" wikitext, section "Resource gather rates" (MediaWiki API). The section gives no patch for the table as a whole; patch notes exist only in its Changelog.

| Resource | gross /s | /min | calculator /min | calc / gross |
|---|---|---|---|---|
| Sheep | 0.75 | 45.0 | 37.05 | 0.823 |
| Cattle | 0.81 | 48.6 | 40.78 | 0.839 |
| Berry | 0.69 (0.66 before update 12.0.1974) | 41.4 | 32.93 (=0.549/s) | 0.795 |
| Deer | 0.825 | 49.5 | 41.7 | 0.842 |
| Boar | 0.9 | 54 | none | |
| Farm | 0.75 | 45.0 | 36.718 | 0.816 |
| Gold | 0.75 | 45.0 | 37 | 0.822 |
| Stone | 0.75 | 45.0 | 37 | 0.822 |
| Wood (non-KT) | 0.75 | 45.0 | 31 | 0.689 |

- Carry capacity 10 for all resources, 25 for hunted meat (25 since Season One Update; before that 10). Source: fandom "Villager (Age of Empires IV)", Resource gathering and Changelog. Cattle capacity is not stated separately; unverified whether cattle counts as hunted meat (25) or 10.
- Calculator file: SichYuriy/aoe4-production-calculator src/data/BaseGatheringRates.ts, values as given (also STOCKYARD 38.67). The repo README has no mention of gather, walk or rate (grep found nothing), so its method and patch are undocumented.
- Calculator values are all 69-84% of gross, so they are net of something. Implied per-trip overhead if net = C/(C/g + t): sheep ~2.9s, cattle ~2.4s (C=10), berry ~3.7s, deer ~5.7s (C=25), farm ~2.9s, gold/stone ~2.9s, wood ~6.0s. A fairly consistent 2.4-3.7s for most, wood larger. This is my inference from arithmetic; the calculator author's method is unverified. The berry value is also stale (0.549/s vs the 0.66 pre-12.0.1974 and 0.69 now).
- Villager walk speed and drop-off time were not found in the pages read: unverified.
- aoe4world/data has no base gather rates (per the manager's brief; not re-checked).

## Constraints
- CONTEXT.md Decisions (AoE4 simulation): walk time, idle time, distance to each resource must be explicit named inputs. A net rate hides walk time inside a constant, which conflicts with it unless walk is declared as baked in and fixed.
- CONTEXT.md Decisions (base gather rates): calculator values are provisional, labeled unverified, patch unknown, no license. Replacing them needs an owner decision to amend.
- INVARIANTS A1: game numbers only from patch-labeled data files. Wiki rates can be labeled with the patch of the last wiki changelog entry that touched each (berry 12.0.1974; hunt capacity Season One), but the table itself is undated, so label "wiki as read 2026-10-30, patch not stated".
- No license issue for wiki facts (game numbers), unlike the calculator repo.

## Options

1. **Gross + trip model** - data file holds gross rate (res/s) and carry capacity per resource from the wiki. Inputs per resource: one-way walk distance (or round-trip walk seconds) and drop-off seconds. Per-trip cycle = C/g + walk + dropoff; effective rate = C/cycle. Tradeoff: matches the named-inputs decision exactly and the spread-later requirement; needs walk speed and drop-off time defaults, which are unverified (could default walk to a value that reproduces the calculator's implied ~3s overhead). Gather-rate techs (Wheelbarrow etc. +%) multiply g naturally; carry-capacity techs raise C. Slightly more code (trip model) but still deterministic (A3). Conflicts: none; requires amending the provisional-rates decision.
2. **Gross + a single overhead factor** - gross rate times (1 - walk fraction) with the fraction a named input. Simpler; but the factor does not respond to distance or to capacity techs, and is less honest than a trip model. No conflicts; weaker for the later spread.
3. **Net (keep calculator values)** - current decision. Tradeoff: zero work, but walk time is not an input (conflicts with the named-input decision), values are 69-84% of gross by an unknown method, berry is stale, no patch label, no license, and tech multipliers on a net rate are only approximately right. Rules out a distance input.
4. **Both** - data holds gross + capacity as the source of truth; calculator net values kept in the file only as a labeled cross-check/default calibration (not read by the sim). Tradeoff: extra data to maintain; helps test that the default walk inputs land near the calculator's effective rates.

## Recommendation
Option 1, with option 4's calibration as a test: store wiki gross rates and carry capacities, make walk and drop-off seconds per resource explicit named inputs, and choose defaults so effective rates land near the calculator's (about 2.4-3.7s overhead per trip, wood about 6s). Deciding reason: it is the only option satisfying the named-input decision and A1, and the wiki gives patch-attributable numbers with no license problem. Requires the owner to amend the base-gather-rates decision.

## Unknowns
- Patch/date of the wiki gross table (undated): check in-game or a patch-notes source for 0.75 base rates; the wiki changelog confirms only the berry and fish changes.
- Villager walk speed and exact drop-off time: would settle default walk inputs (in-game measurement or aoe4world unit data if it has movement speed; not checked).
- Cattle carry capacity (10 vs 25).
- How the calculator author derived its values.
- Farm: whether the farm rate has diminishing returns per farm worker (wiki table lists 0.75 flat; not verified in game).

## Sources
- https://ageofempires.fandom.com/api.php?action=parse&page=Resource_(Age_of_Empires_IV)&prop=wikitext&format=json (sections "Resource gather rates", Changelog)
- https://ageofempires.fandom.com/api.php?action=parse&page=Villager_(Age_of_Empires_IV)&prop=wikitext&format=json (Resource gathering; Changelog: hunted-meat capacity 25, berry 0.66 to 0.69 at 12.0.1974)
- https://raw.githubusercontent.com/SichYuriy/aoe4-production-calculator/master/src/data/BaseGatheringRates.ts
- projects/strategy-game-sim/CONTEXT.md (Decisions: AoE4 simulation, base villager gather rates), INVARIANTS.md (A1, A3)
