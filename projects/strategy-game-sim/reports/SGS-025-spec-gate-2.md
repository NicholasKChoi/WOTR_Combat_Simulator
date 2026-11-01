# SGS-025 spec-gate 2

Verdict: READY. Confirmed risk: standard. No owner gaps, no author gaps.

Checked against origin/main 68e004a (docs/aoe4-build-order.md, 441 lines), design/M2.md (Rally and start, Line map,
Issue codes, bounds, grammar, Extension points), INVARIANTS.md, LESSONS.md (repo and project: nothing relevant),
CONTEXT.md (Open questions: None).

## Gate-1 gaps, resolved
1. AC1 contradiction: AC1 now greps only the removed claim. Verified on 68e004a: `required for villagers` hits l.259;
   `villager.{0,20} without .rally. is .invalid` hits l.325; `or a villager .produce. without .rally.` hits l.322. The required
   sentence "a villager `produce` without `rally` is valid ..." matches neither pattern (the "is valid" text cannot match
   ".invalid"). `owner` grep finds nothing on 68e004a, as the ticket says.
2. Line-map hedge: Scope item 11 now states the three cases (paste step issue: `step` + `line`; paste `start`: `line` only;
   JSON `start`: neither), matches design Line map bullet, and bars `BuildOrderLines`/signatures from the doc. New AC covers it.

## Checks
1. Grounded scope: every cited line range (19-20, 53, 116-122, 124-129, 154-164, 254, 257-263, 272-276, 280-291, 293-309,
   311-312, 322, 324-326) matches the text on 68e004a. Extension points table (l.426) and issues flowchart (l.329) exist.
2. Testable criteria: greps are concrete; the rest are reviewer-comparable against named design sections.
3. Open questions: none; rally decisions are in design Owner decisions.
4. Invariants: A2, A3, S3 named, no contradiction.
5. Contracts: `BuildStart`, `start?`, `rally` action, bounds row, paste line, six `invalid` rules, `unknown-id`/`out-of-range`
   all match design/M2.md. The six rules in item 11 equal design's list (design l.142-146).
6. Dependencies/size: none; docs only, ~100 lines.
7. Diagrams: none triggered. 8. Lessons: none. 9. Decisions: agree with design. 10. On merge: none needed.
11. Risk: docs only, no strongModelTriggers item, criticalPaths empty; standard (not low, since the doc is the public
    grammar/JSON spec). 12. Docs: the ticket is the doc fix; item 13 sweeps the rest.

## Notes (non-blocking)
- Design paste-grammar sentence ("`walk Ns` is always last on `produce`, `build`, `move` lines", design ~l.370 region)
  omits `rally`; the ticket correctly adds it. A designer could align design/M2.md; it does not block the doc edit.
- Doc l.93 ("Task-switch walk" in the calibration paragraph) and l.26 are covered by item 13's grep sweep; check they stay true.
- If the doc states messages, the starting-building rule's message names the building (design l.144).
