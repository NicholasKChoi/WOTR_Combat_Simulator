# SGS-213 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-213-step-popover-beside-text-and-skips-no-wait.md

Summary: "Open the step popover beside the build text and skip it for no-wait steps". Bug, aoe4-build-order, standalone, medium priority, Risk standard (Invariants A1-A3 match by path), about 70 LOC, no dependencies, On merge none.
- Placement: `place()` in `annotation-popover.tsx` becomes a pure rect function. The popover opens level with the active line, past the textarea's right edge, with the viewport clamp as fallback.
- No-wait: a pure predicate in `step-annotations.ts` (false only for completed with waitSeconds 0). `AnnotationLine` in `build-text-editor.tsx` renders no popover when it is false.
- Tests: the acceptance spec's no-wait hover test is rewritten, other index-picked popover tests are moved to steps that show a popover, a placement check is added, and unit tests cover the placement function and the predicate.
- Docs: `docs/aoe4-build-order-ui.md`.

Diagrams: none (single component).
Open questions: none. Decision made in the ticket: the rule applies to the combined run of a repeated step, so a repeated step with zero total wait also loses its popover and per-copy lines. Say so if the owner wants copy lines kept.
Overlap with existing tickets: none found.
Lint: ticket-lint passes (after naming the AoE4 invariants section). I ran no mutation or test commands; the ticket has no search or command criteria.
