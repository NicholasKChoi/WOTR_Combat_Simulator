# SGS-210 spec gate 2

**Verdict: NEEDS_SPEC**

ticket-lint (graph, spec, origin/main): no errors, no warnings. SGS-208 is not integrated (no branch); its ticket states `StepTiming.source` and `copy` after `step`, which matches what this ticket reads. Items 1, 3 to 12 and 14 to 16 pass. Code at origin/main matches every quoted name: `alignedRuns`, `blockedByText`, `stepSpan`, the `still waiting for`/`on` wording, `LONG_WAIT_SECONDS`, and the `results.tsx`, `build-text-editor.tsx` and `step-annotation.tsx` seams. The three doc statements to fix exist (UI doc lines near 20, 105-106, 211). `page-help.tsx` stays true.

## Gaps

1. **Acceptance criteria (item 2), gutter popover line breaks.** The criterion asks for "a computed-style or rendered-text check on the popover element". `AnnotationPopover` is a portal using `useLayoutEffect` and `document`, mounted only on hover, and `AnnotationLine` is not exported. Vitest has no CSS. The ticket bans a new acceptance spec, and the page cannot enter a repeat until the next ticket. So the criterion cannot be met as written, and the implementer must guess a weaker test. Proposed fix: add a pure `gutterDetailText(annotation)` (or have `copiesDetailText` return the lines) in `step-annotations.ts`, and unit test that the repeated and unrepeated text matches the criterion. Have `AnnotationPopover` render lines as separate block elements (split on `\n`, one element per line) so the line breaks are structural. Then a static-markup test of `AnnotationPopover` asserts one element per copy line. Alternatively move the computed-style check into SGS-211's acceptance spec and say so here.
2. **Acceptance criteria (item 2), Results highlight.** "The `Results` highlight prop is the `sourceSpan` value" does not match the code. `highlight` is a local constant in `Results`, passed to `SeriesChart` several levels down, and there is no `results` test file. Nothing observable can confirm the wiring in this ticket. Proposed fix: extract `highlightFor(result, activeStep)` (or have `sourceSpan` accept `activeStep` null) in `step-annotations.ts` and unit test that it returns the first-copy-start to last-started-copy-end span for a repeated result and `null` for a null `activeStep`. `results.tsx` calls it. Otherwise drop the wiring criterion and rely on the `sourceSpan` table plus `tsc`.

## Notes

- Design C5 says `blockedBy` is built "as `blockedByText` does today". For `not-reached` today that is only `not reached (...)`. The ticket instead follows planner row 6 (merged waits, then the copy text), which is settled in the planner report. Fine, but a reviewer reading only the design may bounce it.
- `step-table.tsx` and the page use `run.runStep` (copy 1's index) for `activeStep`, so they stay unchanged, as the ticket expects.
- Risk `standard` is right: no `criticalPaths` symbol is touched.
