# SGS-040 spec gate 1

Verdict: READY

Checked against design/M3.md (paste table, formatBuildStep, node references, shipped-build reactions, prebuilt bar), CONTEXT.md, INVARIANTS.md (A1, A3), and tickets SGS-037/038/039/047.

1. Grounded scope: pass. On main, `GATHER_NODE_ORDER` is at parse-text.ts:12 and :290 (2 hits). `'a node name', ID` is at :79 (1 hit). parseTrigger, formatTrigger, formatStart and english-1tc.json (24 steps) exist. The stale `GatherNodeId order` text is at docs :419. Names (NODE_REFS, nodeRefIssue, count 'all', reaction, triggerHolds) match SGS-037/038/039 and design/M3.md.
2. Criteria: pass. Each has an observable outcome and mutation checks. The page and route criteria observe the simulate response (the existing spec already uses waitForResponse), so they are testable.
3. Open questions: none.
4. Invariants: A1 and A3 are named and not contradicted.
5. Contracts: the trigger forms, error classes and `formatBuildStep` rules match the design table, including the rule that a non-depleted `reaction: true` is dropped from the text.
6. Dependencies and size: stated, about 80 lines.
7. Diagrams: pass. A flow is present.
8. Lessons: none apply (both LESSONS.md files are empty).
9. Decisions: the ENG 1TC reaction moved here from SGS-039, which agrees with SGS-039's out-of-scope list and the design's "how they meet it".
10. On merge: none is correct (no new command, harness or doc).
11. Risk: high, correct (`lib/**` criticalPaths).
12. Docs: docs/aoe4-build-order.md is covered with grep-verifiable criteria.

## Notes (non-blocking)
- Wording conflict with SGS-039. SGS-040 Scope says "Restore the paste round-trip ... (SGS-039 removed it)". SGS-039 says the existing "round-trips through the paste format" test stays and SGS-040 extends it. An implementer will find the test present on main (builds.test.ts:39). Proposed fix: reword to "Extend the existing round-trip test to every build and add the `whenever gold runs out move all gold to gold#2` line assertion".
- The bank/`when` syntax issue for `when wood >= 400000` depends on SGS-039's `SIM_INPUT_BOUNDS.triggerAtLeast`. The dependency is stated, so no action is needed.
