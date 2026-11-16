# SGS-170: Show step annotation details in a custom hover popover

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 80 (`build-text-editor.tsx` `AnnotationLine` popover, a text helper in `step-annotations.ts`, `workbench.module.css` popover styles)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md "AoE4 build order: custom hover popover for step annotations" (owner request in chat, 2026-11-15)

## Context

The text editor's gutter annotation for a step carries its details (time waited and what blocked it) in a native `title` attribute (`components/apps/aoe4-build-order/build-text-editor.tsx`, `AnnotationLine`). Browsers show a `title` only after a delay, so hovering looks like it does nothing. The details should appear at once. This is a visible behavior change, though the manager typed the ticket Chore: the text content stays the same, only how and when it is shown changes.

## Scope

- `build-text-editor.tsx` `AnnotationLine`: remove the `title` attribute. Render a popover element for an annotation line that has a run, shown on pointer enter with no delay and hidden on pointer leave. It carries the same text the `title` carries today (waited time or `Still waiting`, then blocked-by, with `nothing` when empty). Keep the existing `onPointerEnter`/`onPointerLeave` active-step (chart shading) behavior unchanged.
- Move the text construction out of the JSX into a small pure function next to `waitedText` in `step-annotations.ts`, so a unit test can pin it.
- `workbench.module.css`: `.annotations li` has `overflow: hidden` and the annotation column is only 17ch (4.7ch compact) wide, so a child popover would be clipped. The popover must render outside that clip (render it through a portal to `document.body`, positioned from the line's rect: `.editor` sets `container-type: inline-size`, which can make it the containing block of a `position: fixed` descendant, and a popover that is a child of the `li` would change `li.textContent` and the `:scope > span` and scrollWidth reads other tests make) and stay fully on screen at 360, 768 and 1280 px wide. It does not intercept pointer events, so showing it never triggers a `pointerleave` on the line.
- Keyboard (owner answer, Q106): the popover also shows for the step line the textarea caret is on. `BuildTextEditor`'s `onCaret` already sets the active step from the caret line, so the popover for a line with a run is shown when the pointer is on it or when the caret's step is its step (the `active` state `AnnotationLine` already receives). No new focus targets: the gutter `<ol>` stays `aria-hidden` and its lines stay unfocusable. Moving the caret off a step line, or blurring the textarea (which clears the active step), hides the popover. Hover and caret share the single `activeStep` value and the last event wins, as the doc's last-wins sentence says: the popover follows `activeStep`, so after the pointer leaves a line (which sets `activeStep` to null) no popover shows, even if the caret line was showing one, until the next caret move; entering a line while the caret is on another shows only the hovered line's popover. Do not restore the caret line on pointer leave. The popover must also hold up with the same text editor driven by the caret alone, with no pointer over the gutter.
- Docs: `docs/aoe4-build-order-ui.md` (not `docs/aoe4-build-order.md`, which does not hold it), the paragraph that begins "After a result, the text view also shows an annotation for each step line", says "hovering the annotation shows the time it waited and what blocked it". Update that statement for the immediate popover, and for the caret-driven popover. The same paragraph's last-wins sentence on hover and caret shading ("leaving a hovered annotation clears the shading until the next caret move") must stay consistent with the popover. Grep the docs for any other mention of the gutter title (none found at the base).
- Tests: `acceptance/aoe4-step-annotations.spec.ts` ("the gutter title reads Still waiting ...") reads `getAttribute('title')`. A test that reads the annotation text from `title` is updated to read the popover after hovering the line; any other test keeps its assertions. Follow `acceptance/aoe4-build-order-step-band.spec.ts` for hover sequences (scroll the target into view instantly first; one evaluate per read under `expect.poll`). Add a unit test for the text function in `step-annotations.test.ts`.

**Out of scope:** changing the text itself or naming the specific blocker (a separate backlog item); the step table's own columns; chart tooltips; the compact-view layout.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Hovering a gutter annotation of a step that has a run shows a popover immediately (no browser title delay), with the same text the `title` had: the waited time, or `Still waiting` for a `waiting` or `not-reached` step, then the blocked-by (`nothing` when empty). An acceptance test hovers a completed no-wait step and a not-reached step and reads the popover text for each.
- [ ] The popover is not shown before the hover and is hidden after the pointer leaves. A test checks the hidden state first, hovers, then checks visible, then leaves and checks hidden, asserting rendered visibility (not only an attribute).
- [ ] A line with no run (blank, comment, `start`, unparseable) shows no popover.
- [ ] (respec 1) With the pointer away from the gutter, putting the textarea caret on a step line that has a run shows that line's popover with the same text, moving the caret to another step line shows only that line's popover, and moving it to a line with no run or blurring the textarea hides it. A test drives the caret with the keyboard or a selection change, not a pointer hover, and fails if the popover only responds to the pointer.
- [ ] (respec 2) Hover and caret follow one active step, last event wins: with the caret on step line A showing its popover, hovering step line B shows only B's popover, and leaving B then shows no popover until the next caret move (it does not return to A). A test covers this sequence and fails if A's popover reappears on leave or both show at once.
- [ ] (respec 1) The gutter lines gain no tab stops and remain `aria-hidden`; a test fails if a gutter line is focusable or the gutter loses `aria-hidden`.
- [ ] The annotation lines no longer carry a `title` attribute; a test fails if one is present.
- [ ] The popover is not clipped by the annotation column and lies fully inside the viewport at 360, 768 and 1280 px wide, including for a line near the bottom of the editor; a test reads the popover and viewport rects in one evaluate under `expect.poll`.
- [ ] Hover still shades the step's span on the charts, and leaving clears it as before; pre-existing tests for that behavior keep their assertions.
- [ ] The text function has a unit test covering completed with a wait, completed with no wait (`nothing`), and waiting / not-reached (`Still waiting`).
- [ ] (respec 2) The sentence about hovering an annotation in `docs/aoe4-build-order-ui.md` matches the popover behavior.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: the keyboard path was left to an owner question (Q106).
- Changed: owner chose caret-driven popover with no new focus targets; folded into Scope and two criteria, question removed.
- Existing branch work: none recorded; the pointer scope and criteria stand.

## Re-spec 2 - 2026-11-15

- Underspecified: the docs target named a file without the paragraph, and the caret/hover interplay was left ambiguous against the shared `activeStep` slot.
- Changed: docs now point at `docs/aoe4-build-order-ui.md`; last-event-wins rule and a criterion pin it; popover is specified as a portal.
- Existing branch work: none recorded; the pointer and caret scope otherwise stands.
