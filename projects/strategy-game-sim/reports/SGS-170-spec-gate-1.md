# SGS-170 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (fetched). Files read: build-text-editor.tsx, step-annotations.ts, step-annotation.tsx usages, workbench.module.css, acceptance/aoe4-step-annotations.spec.ts, aoe4-compact-view / aoe4-editor-width / aoe4-split-scroll specs, docs/aoe4-build-order*.md.

## Gaps

1. Docs (Scope "Docs", criterion "The design doc sentence...") - names the wrong file. `docs/aoe4-build-order.md` does not contain the paragraph. After the SGS-171 doc split, the sentence "hovering the annotation shows the time it waited and what blocked it, and for a `waiting` or `not-reached` step it reads `Still waiting. Blocked by: ...`" is in `docs/aoe4-build-order-ui.md` (line 19, the "After a result, the text view also shows an annotation..." paragraph). An implementer following the ticket literally greps the model doc, finds nothing, and either edits the wrong file or skips it. Fix: point Scope and the criterion at `docs/aoe4-build-order-ui.md`. Also tell them that the same paragraph's last-wins sentence on hover and caret ("leaving a hovered annotation clears the shading until the next caret move") must stay consistent with the popover (see gap 2).

2. Keyboard/pointer interplay (Scope "Keyboard") - the rule "shown when the pointer is on it OR the caret's step is its step (the `active` state)" does not match the `active` mechanics. Hover and caret share one `activeStep` slot, and `onPointerLeave` sets it to null. So with the caret on a step line, hovering another line and then leaving hides the caret line's popover until the next caret move. An implementer cannot tell whether to keep that (it follows `active` and the doc's "last of the two inputs wins") or to restore the caret line on leave. Fix: state the rule: "the popover follows the existing active-step state; after the pointer leaves a line, no popover shows until the next caret move, as with the chart shading", or require restoring it. Add one criterion row for it so a test pins whichever is chosen.

## Notes (non-blocking)

- `position: fixed` placement: `.editor` sets `container: build-editor / inline-size`. Depending on the browser's containment rules this may make `.editor` the containing block for a fixed descendant, so a fixed child of the `li` could be positioned and clipped relative to the editor, not the viewport. Prefer the portal option; the viewport-rect criterion would catch the other.
- A popover rendered as a child of the `li` changes `li.textContent`. `acceptance/aoe4-step-annotations.spec.ts` reads `el.textContent` and asserts no "Started"/"Finished" (fine), and `aoe4-editor-width.spec.ts` reads `row.scrollWidth > row.clientWidth` and `:scope > span` (a non-span or fixed popover keeps these unaffected). A portal avoids all of it. The Scope rule for tests ("any other test keeps its assertions") is already a rule, not a list.
- The only existing test that reads `title` is "the gutter title reads Still waiting..." (test name also says "title"); rename it with the update. No other acceptance or unit test reads `title` on the gutter.
- The mixed-case text: today's title says `Still waiting` while `STILL_WAITING` is `still waiting`. The ticket's text function must produce the capitalised form; the ticket already states the text, which is fine.

## Checks with no gap

Grounded scope (all named files and `AnnotationLine`, `waitedText`, `.annotations li` overflow and 17ch / 4.7ch widths exist); open questions none; Invariants `none` consistent with prior UI tickets (A1-A3 are not adjacent); no dependencies, no open ticket overlaps; Risk low is right (no criticalPaths or strongModelTriggers); no input validation; Unverified assumptions none is fine (no external service); On merge none; no diagrams needed; no search criteria over code.
