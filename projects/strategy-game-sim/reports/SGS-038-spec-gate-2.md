# SGS-038 spec gate 2

Verdict: READY

Checked the re-specced ticket against design/M3.md (Contracts: Depletion recording; Behavior rules: node stock, arrivals, idle villagers, move all, build walk), SGS-037 and SGS-035, and main (simulate.ts runInstant/applyDueEvents/fullest reduce at 499, aliveVillagers at 134).

Gate 1 gaps, all closed:
1. Auto-house fallback: candidates are NODE_REFS minus unnamed DepositRefs (explicitly not runRefs(order)), first-wins ties; farm-fullest and sheep/farm-tie tests added and can fail.
2. Run-out detection: engine no longer sets depletedAt. It collects isDepleted-and-unrecorded refs at the start of runInstant, moves gatherers to idle, and calls recordRunOut at end of instant. Matches SGS-037's recordRunOut contract and design line 297/564/569. Covers drawDown, tolerance clamp and t=0 paths.
3. Same-instant arrival: stated as counted in both warnings, consistent with design lines 565 and 570-571 and SGS-037's recordIdleArrival; walkSeconds:0 test added.
Notes from gate 1 (gold:null via editGameData, issue path form) also folded in.

Other checks pass: contracts and names match design/SGS-037/SGS-035, invariants A1-A3/S3 listed and not contradicted, diagram present, On merge none, risk high correct, docs scope complete, open questions none, LESSONS empty.

Notes (non-blocking):
- Size is about 390 against a ~400 cap with a stated split candidate (validation and inputs first); the manager may take the split up front.
- Design line 564 still says run-outs each "set depletedAt = now"; the ticket's recordRunOut wording is the consistent reading, so no change needed, but a designer could tidy that line.
- The "5 lines on main, at most 2 after" grep criterion is brittle if the take-from helper uses a loop form; acceptable.
