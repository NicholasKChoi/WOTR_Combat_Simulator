# SGS-210 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-210-annotations-group-repeated-step-copies.md

Summary: "Annotations group a repeated step's copies: combined run, copy list, one shaded span". Feature, M12, component aoe4-build-order, Risk standard, about 180 lines of business logic (`step-annotations.ts` about 110, rendering about 70). Depends on SGS-208. Covers M12.1 and M12.3 for the annotation surface. It adds `groupBySource`, `combineRuns`, `sourceSpan` and `copiesDetailText`, plus `StepAnnotation.copies`. Both alignment paths (the `alignSteps` path and the `live.text === shown.text` identity path) index sources, not `result.steps`. It also adds the `step-copies` line and the closed `<details data-testid="step-copy-list">` with `step-copy` items in `StepRunCell`, the copy lines in the gutter popover (the popover CSS must keep line breaks), and `sourceSpan` in `results.tsx`. It fixes the UI doc annotation, run-cell and hover paragraphs. Criteria are tables for combine, span, group, alignment (both paths), copy text, static-markup rendering, popover, regression specs and docs. Planner rows 5, 6 and 7 are written in as settled.

Diagrams: none (one-line "no diagram required"; single component, no control loop).

Open questions: none.

Dependency: SGS-208 is a `draft` row with no branch and no checkout yet (TASK-GRAPH row 97). I read its ticket Scope for the end state (`StepTiming.source` and `copy`, `result.steps[i].step === i`) and read everything else at origin/main d80751b. No scratch checkout was made and no command criteria exist, so there was nothing to run. Depends on is `SGS-208`, so this ticket waits for it to be `integrated`.

Choices to check:
- Planner row 6 says the blocked-by text is "the merged waits of the earlier copies, then that copy's text". The design's `waits` field merges all copies. I wrote "the merged waits (the combined `waits`), then the selected copy's trailing text". It differs only if a copy after the selected one has waits (possible only for reaction copies).
- Copy-list items must not reuse the combined cell's testids (`step-started`, `step-finished`, `step-waited`, `step-blocked-by`, `step-run`), so existing and later specs that locate the row's own values still match one element. The design does not say this; I added it as a criterion.
- Unverified assumption listed: native `<details>` closed by default and toggled by Enter or Space. No spec in this ticket can drive it, because the page cannot enter a repeat until the paste-and-table ticket (outline C) lands. That ticket's `aoe4-repeat-step.spec.ts` should exercise it.
- Invariants lists A3 because the lint requires an entry for these paths. It is a read-only, deterministic derivation.

Overlap: SGS-208 already says its tests that build a `StepTiming` gain `source` and `copy`, including `step-annotations.test.ts`. This ticket's `StepAnnotation.copies` edits touch the same test files, so a rebase is straightforward. SGS-209 (rename API) touches nothing here.

Lint: `ticket-lint.py` with `--graph` and `--spec` exits 0, with no errors or warnings.
