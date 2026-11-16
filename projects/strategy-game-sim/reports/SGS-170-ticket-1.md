# SGS-170 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-170-step-annotation-hover-popover.md (lint passes)

Summary: "Show step annotation details in a custom hover popover". Component aoe4-build-order, ~80 LOC, no dependencies, Risk low, On merge none. Replaces the native `title` on `AnnotationLine` (build-text-editor.tsx) with an immediate popover carrying the same text, extracts the text into a pure function in step-annotations.ts, and fixes the clipping problem (`.annotations li` has `overflow: hidden`, column only 17ch). Updates the docs/aoe4-build-order.md sentence about hovering an annotation and the acceptance test that reads `title` (aoe4-step-annotations.spec.ts). Criteria: immediate popover text, hidden before/after, no popover on run-less lines, no `title`, not clipped and on-screen at 360/768/1280, chart shading unchanged, unit test of the text function, doc.

Diagrams: none (single component).

Open question (owner): keyboard focus. The gutter `<ol>` is `aria-hidden` and its lines are not focusable; the textarea caret already drives the active step. Options: (a) popover for the caret's step line, (b) make gutter lines focusable, (c) pointer only. The keyboard criterion is not written until the owner chooses.

Flags for the manager:
- Type Chore conflicts with the Chore definition (no owner-visible behavior change): this changes how details appear. I kept Chore as instructed and said so in Context; consider Feature.
- No overlap found with open tickets. The "name the actual blocker" backlog item changes the text, not the mechanism; it is declared out of scope here.
- No scratch checkout was made; all reads were via `git show origin/main`.
