# SGS-210 ticket 3 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-210-annotations-group-repeated-step-copies.md

## Summary

SGS-210 "Annotations group a repeated step's copies: combined run, copy list, one shaded span" (aoe4-build-order, M12,
Feature, risk standard, LOC ~195, depends on SGS-208). Re-specced against reports/SGS-210-spec-gate-2.md. SGS-208's
re-specced ticket still names `StepTiming.source` and `copy` (after `step`) and `earlier-step`, matching what this
ticket reads. Criteria cover `combineRuns`, planner rows 5, 6, 7, `sourceSpan`, `groupBySource`, alignment by source,
`buildAnnotations`, `copiesDetailText`, the new `gutterDetailText`, the popover line component, the `StepRunCell` copy
markup, existing acceptance specs unchanged, the UI doc, and the gates.

## Findings folded in

1. Gutter line breaks (gap 1): chose the structural route. Added `gutterDetailText(annotation)` in
   `step-annotations.ts` (ticket-local helper, not a design contract; only `build-text-editor.tsx` uses it, so no
   designer question). `annotation-popover.tsx` renders its text through a new exported line component, one block
   element per `\n`-separated line, inside the existing portal. Two new criteria (respec 1): the gutter text for
   repeated / unrepeated / no-run annotations, and a static render of the line component (one block element per line,
   fails on a single text node). Verified at origin/main that `AnnotationPopover` renders `{text}` as one node through
   `createPortal`, so `renderToStaticMarkup` cannot render it directly; the line component sidesteps that. The
   browser-level "block elements show as separate lines" moved to Unverified assumptions.
2. Results highlight (gap 2): dropped the wiring criterion rather than add `highlightFor`. The `sourceSpan` table
   covers the rule; SGS-211's page spec already asserts that hovering a repeated row, and its gutter line, shades one
   span from the first copy's start to the last started copy's end ("A test fails if the span covers only one copy").
   Scope now says so explicitly in the `results.tsx` bullet.
3. Note (design C5 vs planner row 6): Scope's `combineRuns` bullet now says the combined `not-reached` `blockedBy`
   (merged waits, then `not reached (...)`) deliberately follows planner row 6 over a literal reading of C5.

## Diagrams

None (single component, outside the core control loop).

## Open questions

none

## Overlap

None new. SGS-211 owns the page spec that drives the copy list toggling and the shading in a browser; this ticket
relies on it for those and says so.

## Lint

ticket-lint (--graph, --spec, origin/main): exit 0, no errors, no warnings. Risk is standard, so the spec-gate
checklist pass is left to spec-gate.

No scratch checkout was made.
