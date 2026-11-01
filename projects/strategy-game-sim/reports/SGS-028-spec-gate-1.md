# SGS-028 spec-gate report 1

Ticket: tickets/SGS-028-aoe4-parse-build-order-text.md (includes Re-spec 2026-10-31). Base origin/main 68e004a.
Read: ticket, design/M2.md (Contracts, Line map, Paste format, Rally and start), SGS-025, SGS-026, SGS-029, SGS-033, SGS-034 (consumers), docs/aoe4-build-order.md on main, CONTEXT.md, INVARIANTS.md, LESSONS.md (both empty).

## Verdict: READY

Confirmed risk: **high**. Matches the template: cross-component contract (the paste grammar plus `ParseTextResult` and `BuildOrderLines`, which validate, the route and the page consume), and the ~200-260 lines of business logic is over the 150-line trigger. It is not a `criticalPaths` case (the list is empty). The risk is not understated.

## Checks

1. Grounded scope: pass. `parse-text.ts` is new, and the ticket says so. It does not exist on origin/main 68e004a (checked with git ls-tree). The `model.ts` types it uses (`BuildStart`, `BuildOrderLines`, the `rally` step) are SGS-026 deliverables, and the ticket says they are not on main yet.
2. Testable criteria: pass. Each criterion names an input and an observable result. See notes 1 and 2.
3. Open questions: none on the ticket or in CONTEXT.md. Both respec-1 questions are closed with the design wording.
4. Invariants: pass. S3 is addressed (single linear pass, 20,000-char performance test). A1 to A3 are not touched: the parser imports no data, and it is deterministic. The ticket does not name INVARIANTS entries explicitly. Only S3 is mentioned, in prose. Non-blocking (note 3).
5. Contracts: pass. `ParseTextResult`, the exports, `BuildOrderLines`, `BuildStart`, the `rally` step, the `name` literal, the `civ` value and the `GatherNodeId` order all match design/M2.md. Dependent tickets match too: SGS-029 uses `options.lines`, and SGS-033 calls `parseBuildOrderText(text)` then `validateBuildOrder(r.order, data, { lines: r.lines })`. SGS-034 round-trips with equal `start` and `steps`. SGS-026 correctly leaves `ParseTextResult` to this ticket.
6. Dependencies and size: pass. SGS-025 and SGS-026 are stated and agree with TASK-GRAPH. About 200-260 lines is under 400.
7. Diagrams: pass. Single-component pure function. The cross-component flow diagram is in SGS-033.
8. Lessons: none to apply.
9. Decisions: pass. The body matches the design's Paste format and Line map.
10. On merge: "none" is correct. The ticket adds no command, harness or design doc, and writes no CONTEXT.md rule into a repo doc.
11. Risk: high is correct (above).
12. Docs: pass. The ticket changes no doc. The doc is made stale only on points SGS-025 already owns (grammar, `rally` line, `start` line). Grepping docs and README on main for `formatBuildOrderText` and `Pasted build order` finds nothing, so nothing becomes untrue. See note 4.

## Gaps

None blocking (no owner gaps, no author gaps).

## Notes (non-blocking)

1. The acceptance criteria do not assert the sentence "the message names the line and the offending token". Add a check that a syntax issue's `message` contains the line number and the bad token (for example `Villager`), or drop the claim from Scope.
2. The 20,000-char "well under 100 ms" assertion can be flaky on a loaded Vercel or WSL box. Use a generous bound (for example 1000 ms), or test the linear-time property by comparing 10,000 and 20,000-char runtimes. The 100 ms figure is not needed to catch catastrophic backtracking.
3. Name the adjacent invariants in the ticket: S3 (bounded work on user text) and A3 (deterministic output).
4. Tokenizing is unspecified: tabs, runs of spaces, leading and trailing whitespace on step lines, and a lone `\r`. The natural choice is to split on `/[ \t]+/` after trimming, which is safe. One sentence in the ticket would remove the guess. The doc and design are silent on the formatter's totality, the `Pasted build order` name and `lines`. Design has them, and the ticket records them. Consider asking SGS-025 to carry one sentence on each, or accept that design/M2.md is authoritative.
5. Number edge cases are unspecified:
   - Leading zeros (`x03`).
   - A 400-digit number becomes `Infinity` through `Number(...)`. validate then rejects it as non-finite `out-of-range`, so this is safe.
   - The formatter should test `count`, `instance` and `seconds` with `!== undefined`, not truthiness. `count: 0` and `instance: 0` must print `x0` and `#0` (not become "continuous").
   - `start.villagers` keys outside `GatherNodeId`, and `villagers: {}` (prints no villager part and re-parses to no `villagers` key), are not paste-representable. Their behavior is unspecified but harmless.
6. For the round-trip deep-equal, the parser must omit absent optional keys, not set them to `undefined`. Use `toStrictEqual`, or state it.
7. Add an exports check (`git grep -nE "^export " -- lib/aoe4-build-order/parse-text.ts` lists `parseBuildOrderText`, `ParseTextResult`, `formatBuildOrderText`) to match the design Modules row.

No out-of-scope findings.
