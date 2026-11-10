# SGS-109 ticket re-spec 1

File: tickets/SGS-109-row-hover-drop-timeline.md (lint clean).

Folded in all seven gate notes plus the SGS-108 `StepKindLegend` `testId` change:
1. Scope removes `formRef` from build-input.tsx with the `runBar`/`pageSection` refs; the removal criterion also forbids them.
2. m3-flow: `toContainText('x5')` becomes `step-field-count` `toHaveValue('5')`; the two "timeline" tests are retitled.
3. Reaction migration: `step-field-reaction:checked` count equals `REACTION_COUNT`.
4. Unit test file named `step-annotation.test.ts`.
5. CSS example: only `timeCell` is orphaned; `scrollBox` and `scrolledTable` stay (compare-panel.tsx).
6. New criterion "the start row clears the band" (hover and focus).
7. Results-split table: the `TABS_VIEWPORT` row calls `showTab(page, 'results')` first.
8. Deletions: drop the `StepKindLegend` `testId` prop when step-timeline.tsx goes, if nothing else passes it. The removal grep now leads with `step-timeline-legend`.

Changed criteria are tagged `(respec 1)`, and a Re-spec 1 section is appended. The ticket describes the SGS-108 `testId` and `kindBorder` import as SGS-108's end state. The SGS-108 ticket file still reads the old way until its parallel re-spec lands. I ran no code; the grep criterion only added `step-timeline-legend`, which the existing `step-timeline` substring already matched.

Open questions: none. Overlap: none new.
