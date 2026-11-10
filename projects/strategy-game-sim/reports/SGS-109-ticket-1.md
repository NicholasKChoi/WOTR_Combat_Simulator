# SGS-109 ticket report 1

File: `tickets/SGS-109-row-hover-drop-timeline.md` (lint passed, no errors).

Title: Row hover and focus shade the charts; remove the step timeline so the charts take the width. Component aoe4-build-order, M7.3, M7.5, M7.7 (part), risk standard, depends on SGS-108 (stacked on SGS-107 through it), ~120 logic lines plus ~250 deleted, On merge none.

Covers (outline C): page-level `active` state and derived `activeStep`; `StepTable.activeStep` / `onActiveStepChange` with row handlers (pointer enter/leave, bubbling `onFocus`, blur only when `relatedTarget` is outside the row, `table-active` and `data-active`); `Results.activeStep` (drops `text`, `landmarks`); deletion of `step-timeline.tsx`, `timelineRows`, `TimelineRow`, the `.resultsSplit/.timelineColumn/.chartsColumn` CSS and the `results-split` wrapper and test id (DQ6); spec rewrites for step-band, results-split, narrow-layout, knight-longbow-page, m3-flow; docs (timeline paragraph and 1800 px sentence replaced).

Diagram: one state diagram for the active step (the only state-machine change). No cross-component diagram.

Open questions: none.

Findings beyond the outline:
- The page effect that sets `--run-bar-height` (ResizeObserver) only served the sticky timeline column; the ticket removes it and any ref only it used.
- Added three acceptance cases beyond the nine existing step-band ones: no-flash inside a row (MutationObserver pins the blur `relatedTarget` check, which no end-state assertion can), an edit that unaligns the active row, and the unaligned-stale hover (outline case, with the aligned-row-while-stale counterpart).
- The old "Tab moves to the next row" test becomes: Tab from the last control of row i (`step-delete`) into row i+1's `step-trigger-kind`, since rows are no longer tab stops.
- Doc split: SGS-108 documents the run-cell rules in the step table paragraph; this ticket moves any remaining timeline-paragraph facts there and deletes the paragraph.

Caveats:
- Tickets SGS-107 and SGS-108 do not exist in `tickets/` yet and no branches exist, so their names are taken from `design/M7.md` and plan outlines A and B, written as end states. Code facts were read from origin/main 68dd089.
- No criterion with a runnable command was run against an end state (the code does not exist yet). The removal grep was run against origin/main and matches the pre-change code (53 matches across components, pages, docs, acceptance); the `docs` timeline grep matches 5 lines today.

Overlap: SGS-108 also edits the step table paragraph, `step-table.tsx`, and the page memo/wiring; this ticket edits the same files after it. SGS-108's move of the timeline-compare spec cases must have removed its `step-timeline-row` use before this ticket's removal grep holds.
