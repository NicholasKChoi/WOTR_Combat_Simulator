# SGS-031 spec-gate 2 (with SGS-032 cross-check)

Ticket: tickets/SGS-031-aoe4-build-move-ages.md, base 68e004a. Risk stays high (unchanged from gate 1).

## Verdict: READY

Gate-1 gaps closed:
1. Seam test: new Scope section 5 edits SGS-030's Seam test in place (drop build/move cases, keep the research case, save and restore the real build handler) and the last criterion checks it.
2. Age-blocked scenario: rewritten as a three-step list on shared data. Re-derived: abbey completes at 5+190x3/6=100; payments of man-at-arms at k x 14.65, k=0..6 (87.9 last, seven payments, 7th spawn at 102.55); spearman-2 (age 2) starts at 100 in phase 3 after the age-up, waitSeconds 100, spawns 102.55+15=117.55; step 1 completedAt 100; ages [{1,0},{2,100}]. Run 2: kings-palace starts 100, completes 100+5+220x3/4=270, age 3 at 270. Council hall run: 5+190x3/3=195, no age move. All hold (supply 30, food/gold sufficient).
3. House cost: all four resources checked and paid, binding-resource wake-up added, new criterion (stone 0 vs 10: counts 3, wood 200; wood 150 and stone 0 at t=45 with stone 10) re-derived and holds.

Hand numbers re-derived:
- Demand 43.95: start pop 7, rate 2/20+1/14.65, lead 5+15=20 (+3.365). At 40 pop 16 (19.37 not >20); at 43.95 pop 7+6+4=17, 20.37>20, so the house starts 43.95. wood at 45: 6+4-1=9. Villager-only mutation: first instant with pop+2>20 is 60 (pop 20), wood at 45 = 10. Holds.
- Auto-house never block: house at 100 (pop 19, 21>20), done 120, builder back 125. wood at 105: spawns 20..100 (10) all arrived by 105, 6+10-1=15 vs 16; equal at 125. Total villagers at 200 = 20, 13 without. Holds.
- Fallback (house at 40, 60, 65; counts 6/3) holds.

## Cross-ticket agreement with SGS-032: consistent in both merge orders

(a) Seam test: SGS-031 keeps the research case (handler-less) and SGS-032 replaces it with delete-and-restore; both say that whoever is second leaves the other's edit alone (031 "keep as it is"; 032 "leaves build/move parts, which SGS-031 drops, keeping delete-and-restore"). Overrides restore, not delete: 031's Reservation test saves and puts back; 032 states it converts any deleting override. No contradiction.
(b) Demand lookup: SGS-031's currentUnitEntry (`byBaseId.get(unit)?.[0]`) and SGS-032 "second merger calls resolveUnitEntry" fit. 031-first: 032 edits the wrapper, so its grep `byBaseId.get(...unit)` finds nothing and `resolveUnitEntry(` count in simulate.ts is 3 (payment, produce, wrapper). 032-first: 031's wrapper calls resolveUnitEntry; count 3, grep clean. 031's own greps (two currentUnitEntry lines) hold at its merge.

## Notes (non-blocking)

- SGS-032 never names `currentUnitEntry`; it says "keeps the lookup's location and name stable". Naming it in 032 Scope 2 site 3 would remove a guess about whether to edit the wrapper body or inline the call; either keeps the counts right.
- 031 "Reservation ignored" says the previous `research` value is "put back"; in 031-first order none is registered, so the restore must delete. Say "restore, deleting when none was registered", as Scope section 5 does for build.
- The two-producer scenarios assume start population 7 (6 villagers + the default scout); the criterion lists only villagers. State the scout or "start population 7".
- Docs line refs (l.180-182) verified on 68e004a.
