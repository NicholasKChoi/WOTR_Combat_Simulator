# SGS-093 implementer report 1

Ticket SGS-093, branch sgs-093-aoe4-docs-prebuilt-cleanups, tip 6e7ebd3c0a2dde637e1834191ad57f14b5bcb3f2 (base origin/main b9481e3).
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-093-aoe4-docs-prebuilt-cleanups
Status: needs_review

## Files touched
- docs/aoe4-build-order.md: intro "idle time" -> "drop-off time"; prebuilt-builds paragraph reflowed (<=110, `ENG 1TC` no longer alone).
- data/aoe4-build-order/README.md: Prebuilt builds section reflowed; knight house sentence reworded.
- data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json: removed the 380 s Town Center rally to wood (old index 31); 72 -> 71 steps.
- docs/api/openapi.json: simulate 200 `example` -> `examples` {buildOrder, goldRunOut}; new request example `goldRunOut`.
- acceptance/aoe4-simulate-api-contract.spec.ts: okExamples map; all 200 examples validated; per-key "returns documented 200 body" loop over request example names; new request/200 key-equality test.
- acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts: MAN_AT_ARMS_STEP 35 -> 34 (step after removed index shifted).
- lib/aoe4-build-order/builds.test.ts: new gold run-out pin case.
- lib/aoe4-build-order/simulate-house-warnings.test.ts: re-pinned spear digest.

## Item 1 (doc wording)
- Per-key merge sentence (line ~73) already names trips (node then field), influenceCoverage and nodeAmounts per key = all per-key fields of SimInputOverrides. No edit.
- "Ordering and triggers" (line ~157) already says "waits while any check in the wait reasons table (Outputs) fails"; no partial list; the reasons table exists under Outputs (header `waitingOn | produced when`, line ~817). No edit.
- Only edit: intro "idle time" -> "drop-off time" (dropOffSeconds is an input, doc line 68).
- `git grep -n -i idle docs/aoe4-build-order.md` audited: lines 286, 294-318, 340-342, 399-433, 730, 762-778, 812, 820, 968, 1009, 1014 all mean a villager at a node with nothing to gather (or "gathering or idle"/"walking or idle" pairs); none means transit. Line 35 was the only wrong one.

## Item 3 rally comparison
Scratch vitest (deleted) removed each TC/KP rally step (indices 2, 9, 10, 14, 31, 33, 34, 37) and compared the full result minus `steps` plus steps (renumbered) at 1200 s and 3600 s, default inputs.
- idx 2 (20 s), 9 (130 s), 10 (200 s), 14 (260 s), 33 (KP), 34 (560 s), 37 (700 s): result changes at both horizons -> kept.
- idx 31 (380 s, wood): rest identical and steps identical at both 1200 s and 3600 s -> removed.
Spear build still parses/re-parses (builds.test.ts paste round-trip passes); README rally prose (sheep to 20 s, gold 130-200 and 560-700, wood otherwise) remains true; no edit needed there.

Tests edited (pre-existing):
- simulate-house-warnings.test.ts "leaves every field of ENG Spear/Longbow ... at 1800 s ...": digest 813cdb5546b36b2a -> affa5ac15c88b132 (engine value; the steps array is one entry shorter; the ticket allows re-pinning the spear digest).
- aoe4-simulate-api-spear-longbow-build.spec.ts MAN_AT_ARMS_STEP 35 -> 34 (kept as a constant, not relocated by action/id; the same step, one index earlier). The prebuilt-plans spec already locates the step by `unit === 'man-at-arms'`.
No other test needed a change.

## New test: gold pin
builds.test.ts, describe 'ENG Spear/Longbow ...': "runs its first gold deposit dry at a pinned time by 1800 s and keeps the second stocked". Pins gold `depletedAt` with toBe to 1200.64894561628 (engine value at 1800 s, build as committed) and gold#2 `depletedAt` null. Not in any doc.
Mutation: changed the 130 s rally "seconds" to 150 -> this case failed (also two other spear cases failed); restored.

## Item 2 OpenAPI
- New request example `goldRunOut`: start 2 wood + 4 gold rally gold; steps: build mill from wood, research survival-techniques, reaction move all gold -> gold#2 on depleted gold; inputs durationSeconds 180, nodeAmounts gold 100, gold#2 100.
- Its engine response (stored verbatim, 37 samples): warnings node-depleted (info, gold, 37.43 s), idle-arrival (warning, gold, 45 s), node-depleted (warning, gold#2, 74.85 s); markers [economy survival-techniques at 50]; depletions gold 37.43, gold#2 74.85.
- Contract spec: 67 passed. Mutations: changed goldRunOut marker `at` 50 -> 51: "goldRunOut request example returns the documented 200 body" failed. Deleted goldRunOut request example: "every request example has a 200 example under the same name" failed. Both restored.
- No other reader of the simulate 200 `example` under acceptance/ (grep); fight operation untouched.

## Item 4 knight README
New sentence: "Explicit `build house` steps come early and in a block just before the King's Palace. Auto-houses stay off until the last `build house` step has started, so the run can carry an `auto-houses-held` warning while production waits at the supply limit before that step starts." True against english-knight-longbow.json (build house at steps 1, 7, 21, 22, 23; build kings-palace at 27) and docs "Houses and supply" (line ~323-329). No step number or house count. `git grep -n "step 2" README` empty.

## Line wraps
After reflow, awk >110 inside README Prebuilt builds section and doc lines 963-975: none. Reflow also touched all paragraphs of the section that held a long line (1TC and spear and knight entries); wording unchanged except items 1 and 4.

## Doc claims added/changed
- docs/aoe4-build-order.md:35 "walk time, drop-off time, distance to each resource": `dropOffSeconds` in input table (line 68).
- README knight sentence quoted above.
No measured value added to any doc.

## Results
- tsc --noEmit clean; lint:dup 0 clones; `npm test` 45 files, 1351 passed, 10 skipped; `npx next build` ok.
- Acceptance run: contract, spear-longbow-build, prebuilt-plans, prebuilt-farms, gathered-resources, issue-shape: 108 passed. Did not run the whole acceptance suite or acceptance/aoe4-build-order.spec.ts (it references the spear build by name only).
- Codegen: none configured. Node/runtime mismatch: not checked beyond a working build.
- Invariant A3: removed step leaves every series/warning/depletion/other step timing unchanged (comparison above).

## Out-of-scope findings
- simulate-house-warnings.test.ts still carries a comment "Re-pinned for the house lead-time rule" above the spear row; harmless.
- Many long lines remain elsewhere in docs/aoe4-build-order.md and the README outside the Prebuilt sections (not in scope).
