# SGS-210 spec gate 4

**Verdict: NEEDS_SPEC**

ticket-lint (graph, spec, origin/main): no errors, no warnings. Both gaps from spec-gate-2 are closed: `gutterDetailText` and the popover line component are unit-testable, and the `Results` wiring criterion is gone. Items 1, 3 to 12 and 14 to 16 pass. Code at origin/main matches every quoted name (`alignedRuns`, `blockedByText`, `stepSpan`, `annotationDetailText`, `AnnotationPopover`, `StepRunCell`, `results.tsx` line 42, `build-text-editor.tsx` `AnnotationLine`). SGS-208 (no branch yet) states `source` and `copy` after `step`, which matches what this ticket reads. Existing acceptance specs assert the popover with `toHaveText` on one line, so splitting a single line into one block keeps them passing. Risk `standard` is right, since no `criticalPaths` symbol is touched.

## Gaps

1. **Acceptance criteria (items 2 and 13), the planner row 7 criterion contradicts the merge rule.** The criterion says the wood wait "stays in copy 2's own run" and "a test fails if the combined run takes the wood wait". Scope also says `waits` are merged by `text` across all copies. In the simulator a waiting copy's `waitDetails` already holds the wood seconds it has accrued (`simulate.ts` around line 960 pushes the entry as time passes), so a realistic copy 2 contributes a wood entry to the merged `waits` and to the `<text> <m:ss>` part of `blockedBy`. Read literally, the criterion fails on the very rule above it. An implementer must guess whether the test pins "wood absent from merged waits" or only "wood not the selected still-waiting cause". Proposed fix: state the assertion as the combined run's `waitingOn` is `earlier-step`, its `waitingForText` is `null`, and `blockedBy` ends with `not reached (earlier-step)` and does not contain `still waiting`. Then state that copy 2's recorded wood seconds do appear in the merged waits, as Scope says, with the fixture giving copy 2 a non-empty `waitDetails`. Drop "the combined run takes the wood wait".

## Notes

- Design C5 says `blockedBy` is built "as `blockedByText` does today"; the ticket deliberately follows planner row 6 and says so. Fine.
- The criterion "no statement in `docs/aoe4-build-order-ui.md` says a step's annotation is one `result.steps` entry" is a doc-wording search, allowed. The statements to fix exist at UI doc lines 20, 98 to 105 and 211.
- `step-table.tsx` (line 322, `annotations?.steps[index]`) and the page use the live step index and `run.runStep`, so they stay unchanged, as the ticket expects.
