# SGS-110 ticket author report 1

Ticket: `tickets/SGS-110-text-gutter-annotations.md` (branch sgs-110-text-gutter-annotations, base sgs-109-row-hover-drop-timeline). Lint clean.

- Title: Annotate the Text-tab gutter with each step's kind and run times (compact view). Component aoe4-build-order, M7.6 and M7.7 (part), risk standard, ~180 logic lines, Depends on SGS-108, SGS-109, On merge none.
- Scope: `annotationsByLine` in `step-annotations.ts`; `BuildTextEditor` props `annotations/lines/activeStep/onActiveStepChange`, the second `aria-hidden` `ol` (`build-order-annotations`, `build-order-line-annotation`), hover and caret (`select`, `keyup`, `click`, blur) handlers, last event wins, `StepKindLegend` above the editor, reused `step-started`/`step-finished` ids; page wiring (lines from `parsed.lines` or `parsed.partial.lines`); Text view doc paragraph; unit table and `acceptance/aoe4-compact-view.spec.ts`.
- Criteria cover: the unit mapping, colour and time parity with the table, flagged and stale looks, row alignment, absence before a result, legend uniqueness, syntax-error partial lines, hover, caret, last-event-wins, docs.
- Diagrams: none required (single component).
- Open questions: none (DQ3-DQ5 answers folded in).
- Overlap: none with existing tickets. SGS-107/108/109 files were not on disk, so their end state is taken from `design/M7.md` and outline A-C. No criterion names a runnable search or mutation command, so none was run.
