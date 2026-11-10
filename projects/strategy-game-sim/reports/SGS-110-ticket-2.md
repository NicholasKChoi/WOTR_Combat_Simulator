# SGS-110 ticket re-spec 1

File: tickets/SGS-110-text-gutter-annotations.md. Lint passes (rc 0). No diagrams (single component, no core loop).

Changes:
- Styling: gutter li calls SGS-108's `annotationToneClass(run: StepRun | undefined, stale: boolean)`; StepRunCell is not edited, except an optional `StepTimes` extraction if `lint:dup` flags the shared times markup (no behavior change). Column rules go in `workbench.module.css`.
- Legend: shown when `annotations !== null && lines.steps.length > 0`, including a syntax-error partial parse; default `step-kind-legend` id (no `testId` passed). Docs item rewords SGS-108/109 sentences that put the legend only above the table.
- Box model: li 1.5em, nowrap, overflow hidden, fixed column width, textarea `min-width: 0`; 1280 px no sideways scroll (SGS-108 layout check must pass); 390 px stated as a CSS rule, no new test.
- Spec: own not-reached and waiting paste constants, API status asserted first, no helpers.ts edit.
- Notes applied: local `lines` renamed `rowCount`; `chart-step-band` with `data-from`/`data-to` named; caret criterion starts focused; the gutter uses `data-gutter-active` (never `data-active`); new lint:dup/no-`data-active` criterion; alignment criterion also checks height and empty-li lines.
- Seven criteria tagged (respec 1); Re-spec 1 section appended. Open questions: none.

Caveat: the `StepTimes` extraction is conditional, since the manager's decision was that SGS-110 does not edit StepRunCell; if SGS-108 exports a shared times piece, SGS-110 should use it instead.
