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
- `workbench.module.css`: `.annotations li` has `overflow: hidden` and the annotation column is only 17ch (4.7ch compact) wide, so a child popover would be clipped. The popover must render outside that clip (for example a portal or `position: fixed` placement computed from the line's rect) and stay fully on screen at 360, 768 and 1280 px wide. It does not intercept pointer events, so showing it never triggers a `pointerleave` on the line.
- Keyboard: see Open questions. The gutter `<ol>` is `aria-hidden` and its lines are not focusable, and the textarea's caret already drives the active step through `onCaret`.
- Docs: `docs/aoe4-build-order.md`, the paragraph that begins "After a result, the text view also shows an annotation for each step line", says "hovering the annotation shows the time it waited and what blocked it". Update that statement for the immediate popover. Grep the docs for any other mention of the gutter title.
- Tests: `acceptance/aoe4-step-annotations.spec.ts` ("the gutter title reads Still waiting ...") reads `getAttribute('title')`. A test that reads the annotation text from `title` is updated to read the popover after hovering the line; any other test keeps its assertions. Follow `acceptance/aoe4-build-order-step-band.spec.ts` for hover sequences (scroll the target into view instantly first; one evaluate per read under `expect.poll`). Add a unit test for the text function in `step-annotations.test.ts`.

**Out of scope:** changing the text itself or naming the specific blocker (a separate backlog item); the step table's own columns; chart tooltips; the compact-view layout.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Hovering a gutter annotation of a step that has a run shows a popover immediately (no browser title delay), with the same text the `title` had: the waited time, or `Still waiting` for a `waiting` or `not-reached` step, then the blocked-by (`nothing` when empty). An acceptance test hovers a completed no-wait step and a not-reached step and reads the popover text for each.
- [ ] The popover is not shown before the hover and is hidden after the pointer leaves. A test checks the hidden state first, hovers, then checks visible, then leaves and checks hidden, asserting rendered visibility (not only an attribute).
- [ ] A line with no run (blank, comment, `start`, unparseable) shows no popover.
- [ ] The annotation lines no longer carry a `title` attribute; a test fails if one is present.
- [ ] The popover is not clipped by the annotation column and lies fully inside the viewport at 360, 768 and 1280 px wide, including for a line near the bottom of the editor; a test reads the popover and viewport rects in one evaluate under `expect.poll`.
- [ ] Hover still shades the step's span on the charts, and leaving clears it as before; pre-existing tests for that behavior keep their assertions.
- [ ] The text function has a unit test covering completed with a wait, completed with no wait (`nothing`), and waiting / not-reached (`Still waiting`).
- [ ] The design doc sentence about hovering an annotation matches the popover behavior.
- [ ] No INVARIANTS.md regressions

## Open questions

- owner: The backlog asks for the popover "on keyboard focus" too, but the gutter is `aria-hidden` and its lines cannot take focus; keyboard users move through the textarea, whose caret already highlights the step on the charts. Which should it be: (a) show the popover for the caret's step line whenever the textarea caret is on a step line, (b) make the gutter lines focusable (tab stops, no longer `aria-hidden`), or (c) pointer only for now? The keyboard path and its criterion wait on the owner's choice.
