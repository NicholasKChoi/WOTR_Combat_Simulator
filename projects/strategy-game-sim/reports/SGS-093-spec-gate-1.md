# SGS-093 spec gate 1

Verdict: READY. Risk `standard` confirmed.

Checked against origin/main b9481e3 (SGS-081 merged).

1. Grounded scope: holds on main.
   - Spear build rally indices 14 (260 s) and 31 (380 s) match the ticket.
   - MAN_AT_ARMS_STEP = 35 is in acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts.
   - The 130 s gold rally exists (index 9).
   - The `ENG Spear/Longbow into MAA/Crossbow` describe is in builds.test.ts.
   - Doc: "idle time" is on line 35. The input-merge sentence (line 73) already names trips, influenceCoverage and nodeAmounts. "Once armed ... wait reasons table" is on line 157. The prebuilt paragraph has `ENG 1TC` alone on a line (970). README line 102 is 170 chars.
   - Knight build: explicit houses are at steps 1, 7, 21, 22, 23 and `kings-palace` is at 27. The README's "three ... step 24" is stale, so the ticket's rewrite (rule only, no count, no step number) is right.
   - Contract spec: okExample at line 33, uses at 261 and 270, and `requestExamples.buildOrder` at 94, 305 and 318. The fight spec's okExample is a separate operation.
2. Testable criteria: observable, with mutation checks. The gold `depletedAt` pin is an engine value recorded by the implementer, which is fine. Stale-number risk is handled (no index pins, step located by action/id).
3. Open questions: none.
4. Invariants: A3 named. The rally removal is gated on a result-equality probe, so it does not change order of operations.
5. Contracts: no new names. It uses the existing SimulationResult and NodeDepletion schemas.
6. Dependencies: SGS-081 is merged, so the dependency is met. Business-logic LOC is 0.
7. Diagrams: not required.
8. Lessons: nothing relevant (LESSONS.md is about boundingBox reads and the ticket has none).
9. Decisions: CONTEXT.md Decisions is empty.
10. On merge: only BACKLOG line deletions. Correct.
11. Risk: no strongModelTriggers item or criticalPaths symbol applies (docs, data, tests, OpenAPI JSON only). Standard is right (public OpenAPI doc plus A3 data).
12. Docs: README rally text, the knight sentence and the doc paragraph are all in Scope.
13. Input validation: n/a.

Notes (non-blocking):
- The Depends-on line still says SGS-081 is an open PR. It is merged, so describe the files as they are on main.
- The line-length criterion is stated for whole sections. README lines 49, 83, 94, 108, 109 and 127 are also over 110 chars, beyond the entries named in Scope. The implementer should reflow every over-long prose line in the section. Doc lines 958 and 1006+ are outside the prebuilt paragraph and are not touched.
- "idle" audit: doc line 1009 ("holding villagers idle", future step kinds) and line 1014 are not nodes-with-nothing-to-gather uses. The implementer should decide in the report whether they stay.
- Rally probing: probe each of the seven spear TC/King's Palace rallies individually. If two are removable, re-run the comparison with both removed together.
