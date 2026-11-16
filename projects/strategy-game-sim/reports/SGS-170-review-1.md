# SGS-170 review 1

Verdict: APPROVE. Branch sgs-170-step-annotation-hover-popover, tip 3e4c403 (reviewed in full, no delta). Base origin/main.

## Blocking findings
None.

## Acceptance criteria
1. Hover shows popover at once with the old text: pass. `annotationDetailText` (step-annotations.ts) is the old title template moved verbatim; the acceptance test hovers a completed no-wait step (`Waited 0:00. Blocked by: nothing`) and a not-reached step (`/^Still waiting\. Blocked by: not reached \(/`). Inspection also loaded `Waited 0:06. Blocked by: resources 0:06`.
2. Hidden before, visible on hover, hidden after leave: pass. The test asserts `toBeHidden`, hover, `toBeVisible`, text, leave, `toBeHidden`. The popover is absent from the DOM when inactive, so the hidden check alone passes trivially; the `toBeVisible` after hover is what makes the sequence fail on a broken hover, which the implementer's pointer-leave mutation confirms.
3. No popover on a line with no run: pass (`run !== null && active`; start-line test uses `toHaveCount(0)` after hover, with a `data-status` absence precondition).
4. Caret-only popover: pass. The test drives only the keyboard with the mouse parked at 0,0; shows, moves to line 2 (asserts `data-gutter-active` moved), hides on a no-run line and on blur.
5. Last-event-wins: pass. Caret on A, hover B (only B active, one popover), leave (none, A not restored), ArrowDown (popover returns). The ArrowDown step depends on the next line having a run; it passes today and the default text is fixed (note, not blocking).
6. Gutter aria-hidden and no tab stops: pass (test reads `aria-hidden` and counts `tabIndex >= 0` among `li` and descendants; code adds no tabIndex).
7. No `title`: pass (title attribute removed; the test asserts `getAttribute('title')` is null on every line).
8. Not clipped, inside viewport at 360/768/1280, including the bottom line: pass. The test reads the rect, viewport and `closest(annotations)` in one evaluate under `expect.poll`. My UI inspection agrees (below).
9. Hover shading unchanged: pass. `onPointerEnter` and `onPointerLeave` are untouched and no shading test was edited.
10. Unit test for the text function: pass. `it.each` rows cover completed with wait, completed no wait (`nothing`), waiting and not-reached (`Still waiting`).
11. Docs sentence: pass. Read against the code: hover or caret shows an immediate popover (`active` = `activeStep === runStep`, set by pointer enter and by `onCaret`); the portal draws it outside the column; `place()` clamps it to the viewport; `pointer-events: none` is in the CSS; the gutter lines stay unfocusable. The last-wins sentence is true: pointer leave and blur set `activeStep` to null, which clears the shading and the popover together. Facts kept from the old sentence (waited time, blocked-by, `Still waiting. Blocked by: ...` for waiting / not-reached) are still stated.
12. Invariants: none apply (INVARIANTS.md A1-A3 cover simulation code, which the diff does not touch; the diff is UI only).

Pre-existing test edit: only the "gutter title reads Still waiting" test changed. It read `title`, so the ticket's rule covers it. Its other assertions (no `Started` / `Finished` text) were kept in the new no-title test. The ticket types this a Chore although it changes visible behavior; the ticket itself says so, and the manager decided the type. Nothing to bounce.

## Lint
`npx tsc --noEmit` clean; `npm run lint:dup` 0 clones (run in the scratch with node_modules linked). Style sources are ARCHITECTURE.md and tsconfig.json; I found no departure.

## Review bot
`reviewBot.cli` is empty, so section 3 is skipped (no rules file either).

## UI inspection
Served the task checkout with `npx next dev`. Loaded `/apps/aoe4-build-order`, text view, at 360, 768 and 1280 px (viewport height 760). For the first, middle and last run lines I hovered the line and read the popover:
- All 9 popovers lie fully inside the viewport, are single-line (`scrollWidth == clientWidth`, no wrapping inside a word), have `visibility: visible`, and do not overlap the hovered line (placed below, or above when there is no room, as at the last line).
- Screenshots: `/tmp/claude-1000/insp170/{360,768,1280}-{first,last,mid}.png`; I read `360-last.png`, the narrowest and bottom-most case: readable, not clipped, above the line.
- Two states the ticket distinguishes (hover vs none) differ visibly.
- The dev server stopped and the port is free.

## Non-blocking notes
- `annotation-popover.tsx`: the popover is portalled to `document.body`, outside the `aria-hidden` gutter, and has no role or `aria-hidden`. Screen-reader users who browse the page may find loose text there while a line is active. It only exists transiently and the ticket says nothing on it, so I did not block; consider `aria-hidden="true"` on the popover if the owner wants it invisible to assistive tech.
- Position is recomputed on scroll (capture) and resize only; it is not recomputed when the line moves for another reason (for example the text reflowing while a line is active). The popover's `useLayoutEffect` does rerun on `text` change. Minor.
- The last-wins test's final ArrowDown assertion relies on the line after the first run line having a run; fine with the fixed default text.

## Coverage
Reviewed all seven changed files (`annotation-popover.tsx`, `build-text-editor.tsx`, `step-annotations.ts`, `step-annotations.test.ts`, `workbench.module.css`, `acceptance/aoe4-step-annotations.spec.ts`, `docs/aoe4-build-order-ui.md`) and the rest of `build-text-editor.tsx`. I ran no acceptance or unit tests, per the process rules; I judged coverage by reading them. The implementer's report records mutation checks and gate results; I did not re-run them. REPO.md "Every diff" asks for `next build`; the implementer reports one succeeded and the dev server compiled and loaded the page here.
