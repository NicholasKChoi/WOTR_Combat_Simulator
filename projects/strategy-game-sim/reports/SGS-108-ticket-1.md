# SGS-108 ticket author report 1

File: `$PROJECT_DIR/tickets/SGS-108-step-run-cell.md` (new, lint clean).

## Summary

"Show each step's run timing in the step table, and dim charts and annotations together." Component aoe4-build-order, milestone M7 (M7.1, M7.2, M7.4, M7.7 part), risk standard, depends on SGS-107, on merge none, ~200 UI/CSS logic + ~200 spec. Branch for the header: sgs-108-step-run-cell, base sgs-107-step-annotation-model (not a ticket field).

Scope covers: new `step-annotation.tsx` and `.module.css` (`KIND_CLASS`, `StepKindBadge`, `StepKindLegend`, `StepRunCell`; kind classes moved out of `results.module.css`; `step-timeline.tsx` imports them so jscpd stays clean); `StepTable.annotations` only (no hover props, those are C); page memoized `stale` and `annotations`, `Results.dimmed = stale`; DQ7 conditional `aria-describedby` via a small pure function next to `autoRunStatusMessage`; DQ2 A (remove the panel-wide `overflow-x`, table wraps to fit the column, `step-table-scroll` box fallback only); doc paragraphs plus the two backlog wording fixes; spec moves (`git mv` timeline-compare to `aoe4-step-annotations.spec.ts`, compare cases to the existing `aoe4-build-order-pin-compare.spec.ts`).

Criteria: M7.1 and M7.2 acceptance and unit tables; the four M7.4 stale cases from the design; `aria-describedby` table; 1280 px fit-the-column evaluate; single-source kind CSS; docs greps; existing 390 px narrow check keeps passing.

Diagrams: none (single-component line; no diagram required).

## Open questions

none. DQ2 and DQ7 are folded in as owner answers.

## Notes for the manager

- SGS-107 has no ticket file and its code is not on origin/main (68dd089); I used the design's end-state names for everything A defines. If SGS-107 lands different names, B needs a re-spec.
- Checked now against origin/main: `kindAgeUp` is in `results.module.css` and `step-timeline.tsx` (the end-state grep holds once moved); the `.workbenchSplit > :first-child` rule and the "scrolls sideways inside the column" doc sentence exist (the criteria hold after the change). No mutation criteria.
- Spec decision: the compare cases move into the existing `aoe4-build-order-pin-compare.spec.ts` rather than a renamed file.
- Overlap: ticket C (next) deletes the timeline and rewrites specs that also touch `aoe4-narrow-layout.spec.ts`; B only edits it if the new first cell shifts locators.
- The design's textarea check cannot run on Table view (no textarea there), so the ticket splits it into a Table view check and a Text view check.
